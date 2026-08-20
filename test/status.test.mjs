import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DATASETS,
  mmwrWed,
  latestDate,
  daysOld,
  classify,
  checkDataset,
  boardHTML,
  latestLabel,
} from "../status.mjs";

const NOW = new Date(Date.UTC(2026, 7, 20, 12, 0, 0)); // Thu 2026-08-20 noon

test("DATASETS: 9 entries, unique ids, every entry has name/what/field/cadence", () => {
  assert.equal(DATASETS.length, 9);
  const ids = DATASETS.map((d) => d.id);
  assert.equal(new Set(ids).size, 9);
  for (const d of DATASETS) {
    assert.ok(d.name && d.what && d.field && (d.cadence === "weekly" || d.cadence === "daily" || d.cadence === "annual"));
    assert.match(d.id, /^[a-z0-9]{4}-[a-z0-9]{4}$/);
  }
});

test("mmwrWed anchors", () => {
  assert.equal(mmwrWed(2026, 1).toISOString().slice(0, 10), "2026-01-07");
  assert.equal(mmwrWed(2026, 32).toISOString().slice(0, 10), "2026-08-12");
  assert.equal(mmwrWed(2025, 1).toISOString().slice(0, 10), "2025-01-08");
  // result is always a Wednesday (UTC)
  assert.equal(mmwrWed(2026, 32).getUTCDay(), 3);
});

test("latestDate: plain date field", () => {
  const d = DATASETS.find((x) => x.id === "rdmq-nq56");
  assert.equal(latestDate({ week_end: "2026-08-15T00:00:00.000" }, d).toISOString().slice(0, 10), "2026-08-15");
});

test("latestDate: year+week field", () => {
  const d = DATASETS.find((x) => x.id === "x9gk-5huc");
  assert.equal(latestDate({ year: "2026", week: "32" }, d).toISOString().slice(0, 10), "2026-08-12");
});

test("latestDate: annual field", () => {
  const d = DATASETS.find((x) => x.id === "x5j9-wybp");
  assert.equal(latestDate({ year: "2023" }, d).toISOString().slice(0, 10), "2023-01-01");
});

test("latestDate: garbage row -> null, no throw", () => {
  const d = DATASETS.find((x) => x.id === "rdmq-nq56");
  assert.equal(latestDate({ week_end: "not-a-date" }, d), null);
  assert.equal(latestDate(null, d), null);
});

test("daysOld math", () => {
  const a = new Date(Date.UTC(2026, 7, 10));
  assert.equal(daysOld(a, NOW), 10);
  assert.equal(daysOld(NOW, NOW), 0);
});

test("classify weekly thresholds", () => {
  const d = DATASETS.find((x) => x.id === "rdmq-nq56");
  const mk = (day) => new Date(Date.UTC(2026, 7, day));
  assert.equal(classify(d, mk(16), NOW), "fresh"); // 4d
  assert.equal(classify(d, mk(6), NOW), "fresh"); // 14d boundary
  assert.equal(classify(d, mk(5), NOW), "stale"); // 15d
  assert.equal(classify(d, mk(6), NOW) !== "stale", true);
  assert.equal(classify(d, new Date(Date.UTC(2026, 6, 6)), NOW), "stale"); // 45d
  assert.equal(classify(d, new Date(Date.UTC(2026, 6, 5)), NOW), "frozen"); // 46d
});

test("classify annual: previous year fresh, older frozen", () => {
  const d = DATASETS.find((x) => x.id === "x5j9-wybp");
  assert.equal(classify(d, new Date(Date.UTC(2025, 0, 1)), NOW), "fresh");
  assert.equal(classify(d, new Date(Date.UTC(2026, 0, 1)), NOW), "fresh");
  assert.equal(classify(d, new Date(Date.UTC(2024, 0, 1)), NOW), "frozen");
});

test("classify: null latest -> error", () => {
  assert.equal(classify(DATASETS[0], null, NOW), "error");
});

test("latestLabel formats", () => {
  const nndss = DATASETS.find((x) => x.id === "x9gk-5huc");
  assert.equal(latestLabel({ year: "2026", week: "32" }, nndss), "Week 32, 2026 (ends 2026-08-12)");
  const ly = DATASETS.find((x) => x.id === "x5j9-wybp");
  assert.equal(latestLabel({ year: "2023" }, ly), "2023");
  assert.equal(latestLabel(null, nndss), "no data returned");
});

test("checkDataset: HTTP 404 -> error status with httpStatus, no throw", async () => {
  const fake = async () => new Response("{}", { status: 404 });
  const r = await checkDataset(DATASETS[0], NOW, fake);
  assert.equal(r.status, "error");
  assert.equal(r.httpStatus, 404);
});

test("checkDataset: network failure -> error status with message, no throw", async () => {
  const fake = async () => {
    throw new Error("offline");
  };
  const r = await checkDataset(DATASETS[0], NOW, fake);
  assert.equal(r.status, "error");
  assert.match(r.error, /offline/);
});

test("checkDataset: empty rows -> error", async () => {
  const fake = async () => Response.json([]);
  const r = await checkDataset(DATASETS[0], NOW, fake);
  assert.equal(r.status, "error");
  assert.equal(r.label, "no data returned");
});

test("checkDataset: healthy weekly row -> fresh with days", async () => {
  const fake = async () => Response.json([{ week_end: "2026-08-15T00:00:00.000" }]);
  const r = await checkDataset(DATASETS[0], NOW, fake);
  assert.equal(r.status, "fresh");
  assert.equal(r.days, 5);
  assert.equal(r.label, "2026-08-15");
});

test("boardHTML: renders names, badges, error rows, and links", async () => {
  const fake = async (url) => {
    if (url.includes("rdmq-nq56")) return Response.json([{ week_end: "2026-08-15T00:00:00.000" }]);
    return new Response("{}", { status: 404 });
  };
  const results = await Promise.all(DATASETS.map((d) => checkDataset(d, NOW, fake)));
  const html = boardHTML(results, NOW);
  assert.match(html, /ED visit trends \(NSSP\)/);
  assert.match(html, /Fresh/);
  assert.match(html, /Unavailable/);
  assert.match(html, /2026-08-15/);
  assert.match(html, /https:\/\/data\.cdc\.gov\/dataset\/rdmq-nq56/);
  assert.match(html, /Last checked 12:00 UTC/);
});

test("boardHTML: escapes hostile dataset text", () => {
  const results = [
    {
      dataset: { id: "aaaa-bbbb", name: "<img src=x onerror=alert(1)>", what: "a & b", field: "week_end", cadence: "weekly" },
      status: "error",
      label: "no data returned",
      days: null,
    },
  ];
  const html = boardHTML(results, NOW);
  assert.ok(!html.includes("<img src=x"));
  assert.match(html, /&lt;img src=x/);
  assert.match(html, /a &amp; b/);
});

// Live check against real data.cdc.gov (no network: prints failures, exit 1).
import { DATASETS, checkDataset, boardHTML } from "./status.mjs";
const now = new Date();
const results = await Promise.all(DATASETS.map((d) => checkDataset(d, now)));
for (const r of results) {
  console.log(`${r.status.padEnd(8)} ${r.dataset.name} -> ${r.label}${r.days != null ? ` (${r.days}d)` : ""}`);
}
const bad = results.filter((r) => r.status === "error");
console.log(`\n${results.length - bad.length}/${results.length} feeds reached.`);
console.log("boardHTML length:", boardHTML(results, now).length);
process.exit(bad.length === results.length ? 1 : 0);

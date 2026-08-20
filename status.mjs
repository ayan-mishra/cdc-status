// cdc-status: freshness board for key CDC open-data feeds (data.cdc.gov, Socrata).
// Zero dependencies. Works in browser (module) and Node (tests, selftest).

export const DATASETS = [
  {
    id: "rdmq-nq56",
    name: "ED visit trends (NSSP)",
    what: "Weekly emergency-department visits, all causes and respiratory conditions.",
    field: "week_end",
    cadence: "weekly",
  },
  {
    id: "vjzj-u7u8",
    name: "ED respiratory visits, daily (NSSP)",
    what: "Daily respiratory-related ED visits by condition.",
    field: "date",
    cadence: "daily",
  },
  {
    id: "f3zz-zga5",
    name: "Acute respiratory illness by state (FluView)",
    what: "Weekly ARI/ILI activity level per state.",
    field: "week_end",
    cadence: "weekly",
  },
  {
    id: "ua7e-t2fy",
    name: "Hospital respiratory data (HRD)",
    what: "Weekly hospital respiratory metrics by jurisdiction.",
    field: "weekendingdate",
    cadence: "weekly",
  },
  {
    id: "mpgq-jmmr",
    name: "Hospital capacity (NHSN)",
    what: "Weekly inpatient/ICU bed occupancy and respiratory admissions.",
    field: "weekendingdate",
    cadence: "weekly",
  },
  {
    id: "atcp-73re",
    name: "Wastewater WVAL (NWSS)",
    what: "Weekly wastewater concentrations for pathogens in NWSS sites.",
    field: "week_end",
    cadence: "weekly",
  },
  {
    id: "x9gk-5huc",
    name: "Notifiable conditions (NNDSS)",
    what: "Weekly case counts for nationally notifiable diseases, by category.",
    field: "year,week",
    cadence: "weekly",
  },
  {
    id: "muzy-jte6",
    name: "Provisional deaths by state and cause",
    what: "Weekly provisional death counts by state and selected cause.",
    field: "week_ending_date",
    cadence: "weekly",
  },
  {
    id: "x5j9-wybp",
    name: "Lyme disease cases by county (annual)",
    what: "Annual Lyme disease case counts by state and county.",
    field: "year",
    cadence: "annual",
  },
];

// Wednesday (week-ending date) of CDC MMWR week `week` of `year`.
// MMWR week 1 is the week containing Jan 4; weeks end on Wednesday.
// Verified anchors: (2026,1)->2026-01-07, (2026,32)->2026-08-12, (2025,1)->2025-01-08.
export function mmwrWed(year, week) {
  const jan4 = Date.UTC(year, 0, 4);
  const jan4dow = new Date(jan4).getUTCDay(); // 0=Sun
  const offToWed = (3 - jan4dow + 7) % 7; // days from Jan 4 to that week's Wednesday
  const wedWeek1 = jan4 + offToWed * 86400000;
  return new Date(wedWeek1 + (week - 1) * 7 * 86400000);
}

// Convert a latest-row from a dataset to a UTC Date.
// row shape depends on the dataset's field: {week_end:"2026-08-15..."} or
// {year:"2026",week:"32"} or {year:"2023"}.
export function latestDate(row, dataset) {
  if (!row) return null;
  const f = dataset.field;
  if (f === "year,week") {
    return mmwrWed(Number(row.year), Number(row.week));
  }
  if (f === "year") {
    return new Date(Date.UTC(Number(row.year), 0, 1));
  }
  const t = Date.parse(row[f]);
  return Number.isFinite(t) ? new Date(t) : null;
}

export function daysOld(latest, now) {
  return Math.floor((now.getTime() - latest.getTime()) / 86400000);
}

// Weekly/daily: fresh <=14d, stale 15-45d, frozen >45d.
// Annual: fresh if current or previous calendar year, else frozen.
export function classify(dataset, latest, now) {
  if (!latest) return "error";
  if (dataset.cadence === "annual") {
    const y = latest.getUTCFullYear();
    const cur = now.getUTCFullYear();
    return y >= cur - 1 ? "fresh" : "frozen";
  }
  const d = daysOld(latest, now);
  if (d <= 14) return "fresh";
  if (d <= 45) return "stale";
  return "frozen";
}

export function latestLabel(row, dataset) {
  if (!row) return "no data returned";
  const f = dataset.field;
  if (f === "year,week") {
    const d = latestDate(row, dataset);
    return `Week ${row.week}, ${row.year} (ends ${fmtDate(d)})`;
  }
  if (f === "year") return String(row.year);
  return fmtDate(latestDate(row, dataset));
}

function fmtDate(d) {
  return d
    ? d.toISOString().slice(0, 10)
    : "?";
}

export async function checkDataset(dataset, now, fetchImpl = fetch) {
  const fields = dataset.field.split(",").map((x) => x.trim()).join(",");
  const order = dataset.field
    .split(",")
    .map((x) => `${x.trim()} desc`)
    .join(",");
  const url = `https://data.cdc.gov/resource/${dataset.id}.json?$select=${fields}&$order=${order}&$limit=1`;
  try {
    const res = await fetchImpl(url);
    if (!res.ok) {
      return { dataset, status: "error", row: null, httpStatus: res.status };
    }
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    const latest = row ? latestDate(row, dataset) : null;
    const status = latest ? classify(dataset, latest, now) : "error";
    return {
      dataset,
      status,
      row,
      latest,
      days: latest ? daysOld(latest, now) : null,
      label: latestLabel(row, dataset),
    };
  } catch (e) {
    return { dataset, status: "error", row: null, error: String(e) };
  }
}

const BADGE = {
  fresh: "Fresh",
  stale: "Stale",
  frozen: "Frozen",
  error: "Unavailable",
};

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function boardHTML(results, now) {
  const rows = results
    .map((r) => {
      const d = r.dataset;
      const age =
        r.status === "error" || r.days == null
          ? ""
          : r.days === 0
            ? " · today"
            : ` · ${r.days}d`;
      return `<tr class="b-${r.status}">
  <td><span class="name">${esc(d.name)}</span><span class="what">${esc(d.what)}</span></td>
  <td class="latest">${esc(r.label)}<span class="age">${esc(age)}</span></td>
  <td><span class="badge b-${r.status}">${BADGE[r.status]}</span></td>
  <td><a href="https://data.cdc.gov/dataset/${d.id}" target="_blank" rel="noopener">source&nbsp;↗</a></td>
</tr>`;
    })
    .join("\n");
  return `<table class="board">
<thead><tr><th>Feed</th><th>Latest observation</th><th>Status</th><th></th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
<p class="checked">Last checked ${now.toISOString().slice(11, 16)} UTC · ages measured against page load</p>`;
}

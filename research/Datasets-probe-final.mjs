// Final dataset selection probe: verify each candidate's latest observation (keyless).
const CANDIDATES = [
  ["rdmq-nq56", "ED visit trends (NSSP)", "week_end", "date"],
  ["mpgq-jmmr", "Hospital capacity (NHSN)", "weekendingdate", "date"],
  ["atcp-73re", "Wastewater WVAL", "week_end", "date"],
  ["x9gk-5huc", "NNDSS (a category table)", "year,week", "ywm"],
  ["4x3q-j8xh", "candidate?", "week_end", "date"],
];
for (const [id, name, field, kind] of CANDIDATES) {
  try {
    const sel = field.split(",").map(f=>f.trim()).join(",");
    const order = field.split(",").map(f=>`${f.trim()} desc`).join(",");
    const r = await fetch(`https://data.cdc.gov/resource/${id}.json?$select=${sel}&$order=${order}&$limit=1`);
    if (!r.ok) { console.log(`${id} (${name}): HTTP ${r.status}`); continue; }
    const rows = await r.json();
    console.log(`${id} (${name}): ${JSON.stringify(rows[0])}`);
  } catch (e) { console.log(`${id} (${name}): ERR ${e.message}`); }
}

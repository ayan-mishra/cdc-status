// Research/build probe: finalize dataset list for cdc-status (keyless CDC Socrata).
const cat = await (await fetch("https://api.us.socrata.com/api/catalog/v1?domains=data.cdc.gov&limit=100")).json();
const res = cat.results.map(r => r.resource);
res.sort((a, b) => (b.page_views || 0) - (a.page_views || 0));
console.log("=== top 15 by page_views ===");
for (const r of res.slice(0, 15)) {
  const dateish = (r.columns_field_name || "").filter(f => /week|date|year|end/i.test(f));
  console.log(`${r.page_views}\t${r.id}\t${(r.name || "").slice(0, 55)}\t[${dateish.slice(0, 6).join(", ")}]`);
}
// re-verify the 5 known datasets' latest values
const CHECK = [
  ["rdmq-nq56", "week_end", "NSSP ED trends"],
  ["mpgq-jmmr", "weekendingdate", "NHSN hospital capacity"],
  ["atcp-73re", "week_end", "NWSS WVAL"],
  ["x5j9-wybp", "year", "Lyme county (annual)"],
  ["x9gk-5huc", "year,week", "NNDSS category table"],
];
console.log("=== latest values (live) ===");
for (const [id, field, name] of CHECK) {
  const sel = field.split(",").map(f => f.trim()).join(",");
  const order = field.split(",").map(f => `${f.trim()} desc`).join(",");
  try {
    const rows = await (await fetch(`https://data.cdc.gov/resource/${id}.json?$select=${sel}&$order=${order}&$limit=1`)).json();
    console.log(`${name} (${id}): ${JSON.stringify(rows[0])}`);
  } catch (e) { console.log(`${name} (${id}): ERR ${e.message}`); }
}

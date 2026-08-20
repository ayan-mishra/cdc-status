// Find flu/WNV/NNDSS dataset ids + fields, then verify latest values (keyless).
const terms = ["influenza", "west nile", "notifiable", "respiratory"];
for (const q of terms) {
  const cat = await (await fetch(`https://api.us.socrata.com/api/catalog/v1?domains=data.cdc.gov&limit=8&q=${encodeURIComponent(q)}`)).json();
  console.log(`--- q="${q}" ---`);
  for (const r of cat.results.map(r => r.resource).slice(0, 5)) {
    const f = (r.columns_field_name || []).filter(x => /week|date|year|end/i.test(x));
    console.log(`${r.id}\t${(r.name || "").slice(0, 60)}\t[${f.slice(0, 5).join(", ")}]`);
  }
}

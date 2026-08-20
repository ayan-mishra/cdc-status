const CHECK = [
  ["vjzj-u7u8", "date", "NSSP ED Respiratory Daily"],
  ["f3zz-zga5", "week_end", "ARI by State (FluView)"],
  ["ua7e-t2fy", "weekendingdate", "Hospital Respiratory Data"],
  ["muzy-jte6", "week_ending_date", "Provisional deaths by state/cause"],
];
for (const [id, field, name] of CHECK) {
  try {
    const rows = await (await fetch(`https://data.cdc.gov/resource/${id}.json?$select=${field}&$order=${field} desc&$limit=1`)).json();
    console.log(`${name} (${id}): ${JSON.stringify(rows[0])}`);
  } catch (e) { console.log(`${name} (${id}): ERR ${e.message}`); }
}
// MMWR anchor check: WED(2026,32) should be Wed 2026-08-12
const d = new Date(Date.UTC(2026, 0, 4));
const off = (3 - d.getUTCDay() + 7) % 7; // days from Jan 4 to that week's Wednesday
const wed1 = Date.UTC(2026, 0, 4 + off);
console.log("WED(2026,1) =", new Date(wed1).toISOString().slice(0, 10), "(expect 2026-01-07)");
console.log("WED(2026,32) =", new Date(wed1 + 31 * 7 * 86400000).toISOString().slice(0, 10), "(expect 2026-08-12)");

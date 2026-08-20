# Research log (2026-08-20, ~25 min)

Keyless sources actually used (all verified reachable that day):

1. `curl -sI https://example.com` — internet check.
2. Hacker News firebaseio: `https://hacker-news.firebaseio.com/v0/topstories.json` (+ per-item) — current dev discussion; no adjacent opportunity found in top 25 that day.
3. Hacker News Algolia (keyless): `https://hn.algolia.com/api/v1/search`
   - `query=cdc data` → story 42897696 "CDC data are disappearing" (The Atlantic, 2025-01-31; 749 pts / 589 comments, 2025-02-01). Top comments: removal of CDC scientific data as "data US taxpayers paid for… removed on a whim"; FOIA discussed as recourse; "if you have a real startup doing real things in healthcare, this is an intentional spoke in your wheels." (18 months old — background, not a catalyst.)
   - `query=socrata` → low activity (largest: "Socrata Roulette", 5 pts, 2022).
   - `query=data.cdc.gov` → no stories (only zero-point comments).
4. Google News RSS: `https://news.google.com/rss/search?q=cdc.gov data api when:90d` — **no recent catalyst found** (routine CDC content pages only).
5. npm registry: `https://registry.npmjs.org/-/v1/search?text=socrata` (9 dl/mo), `?text=mmwr` (mmwr-week 24 dl/wk, epiweeks 15 dl/wk, @mu373/epiweek 5 dl/wk) — tiny tooling space.
6. GitHub (`gh search repos`): "cdc data status" → no results; "data freshness monitor" → only 0-star personal projects for other jurisdictions (AU: nick-ships/data-freshness-monitor; DE: data-sculptor/de-data-freshness-monitor; Medicare: aashnijoshi); "data.cdc.gov" → small analysis repos + 0-star MCP wrapper.
7. Socrata catalog: `https://api.us.socrata.com/api/catalog/v1?domains=data.cdc.gov` — keyless; exposes `data_updated_at` per dataset (sample dataset frozen 2023-09-27); `page_views` not sortable (object type); `q=` search used to find flu/ARI/WNV/HRD datasets.
8. Live keyless probes against `https://data.cdc.gov/resource/<id>.json` (see research/pick*.mjs): all 9 board datasets verified 2026-08-20 — 7 fresh (5–12 days), 2 frozen (muzy-jte6 at 2023-09-16, x5j9-wybp at year 2023). Response times ~150–2150 ms.
9. CORS: `data.cdc.gov` returns `Access-Control-Allow-Origin: *` → fully static site is possible.

## Gaps (couldn't find)

- No demand sizing (no keyless search volume data for "cdc data status"-type queries).
- No recent news catalyst (nothing in 90-day Google News window).
- No direct user-interview signal; the unmet need is inferred from the builder-side experience of discovering stale/frozen feeds (and the Feb 2025 HN thread on data removal).

## Dataset list provenance

The 9 board datasets were selected 2026-08-20 by: (a) keyless catalog search for the main
ongoing surveillance domains (ED/respiratory, hospital, wastewater, notifiable, deaths, Lyme),
and (b) live verification that each dataset's date field returns a parseable latest row.
Probes preserved in this directory.

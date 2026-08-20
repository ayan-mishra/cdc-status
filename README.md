# cdc-status

Unofficial freshness board for key public-health feeds on [data.cdc.gov](https://data.cdc.gov).
One page, one action: **see the latest observation in each feed and whether it's fresh, stale, or frozen.**

Not affiliated with the U.S. Centers for Disease Control and Prevention.

## What it does

For each of 9 curated CDC open-data datasets (Socrata), the page queries the
public API directly from the browser (no key, no account, no backend):

```
https://data.cdc.gov/resource/<id>.json?$select=<date-field>&$order=<date-field> desc&$limit=1
```

and shows the latest observation plus a status computed against page-load time:

- **Fresh** — latest observation ≤ 14 days old (annual feeds: current or previous year)
- **Stale** — 15–45 days
- **Frozen** — > 45 days (or older than the previous calendar year for annual feeds)
- **Unavailable** — the feed could not be reached from your network

A frozen feed may still be published elsewhere; this checks one known dataset per feed.

## Runs

```sh
node --test        # logic tests (no network)
node selftest.mjs  # live check against real data.cdc.gov
```

Deploy: any static host (the site is plain HTML/CSS/JS with zero build step).

## Deliberately not built

Alerts/notifications, archive of removed data, coverage of all data.cdc.gov
or other agencies' portals, a Socrata client library, dashboards of the
underlying data, user accounts, an API of its own.

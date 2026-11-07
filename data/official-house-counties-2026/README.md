# Official 2026 House county portions

Public unofficial general-election returns captured November 7, 2026.
These records supply local maps and tables, independently of the national NPR
snapshot. Different capture times can produce different district vote totals.

Coverage:

- Maryland: all eight districts, 33 county/city portions. Maryland State Board
  of Elections county tables, with individual source URLs in `md.json`.
- North Carolina: all 14 districts, 115 county portions. NCSBE detailed contest
  tables and district summary totals, with source URLs in `nc.json`.
- Pennsylvania: all 17 districts, 84 county portions. Department of State
  congressional county breakdowns (`pa.json`) and district totals (`pa-summary.json`).
- South Dakota: all 66 counties in the at-large district. Secretary of State
  county pages; source URLs and contest totals in `sd.json`.
- Ohio: Cuyahoga County portions of districts 7 and 11 only. Production November
  3 Enhanced Voting results published by the county board of elections, with
  the publisher's timestamp in `oh-cuyahoga.json`.

The HTML tables were captured from publicly accessible election authority pages;
the Ohio file retains the relevant public API records. Replace these captures
with newer returns from the same election and run:

```sh
python3 import-official-house-counties-2026.py
```

The importer checks election identity, county FIPS, duplicate county portions,
nonnegative vote counts, Maryland/South Dakota/Ohio contest totals, and complete
North Carolina/Pennsylvania district totals before replacing the bundle.
It changes only House records and import metadata. The NPR county updater
preserves these official overrides on future refreshes.

Reported precincts are not an estimate of votes counted, so `eevp` remains null.
Write-in aggregates remain aggregates when the authority does not name the
individual write-in candidates. Unavailable county portions remain gray;
countywide totals are never allocated to split districts.

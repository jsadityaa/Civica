# Ohio precinct boundary preview

## 2026 result view

Legend portraits are public-domain U.S. Senate photographs via Wikimedia Commons: [Sherrod Brown, Rebecca Hammel, 2021](https://commons.wikimedia.org/wiki/File:Sen._Sherrod_Brown_(D-OH),_Official_Portrait,_117th_Congress_(cropped).jpg) and [Jon Husted, 2025](https://commons.wikimedia.org/wiki/File:Sen._Jon_Husted_official_portrait,_119th_Congress_(cropped_2).jpg). Local copies are in `assets/candidates/`. Brown (Democrat) and Husted (Republican) are the top two candidates in the imported Senate returns.

Precinct hue interpolates continuously in RGB from Republican red to Democratic blue using Democratic votes divided by Democratic plus Republican votes, producing purple at a 50–50 two-party split. Lightness represents votes cast per square mile of mapped precinct area, not population density. Area uses spherical geometry with a mean Earth radius of 3,958.7613 miles; all fragments of a precinct are summed before dividing its total votes by area. Density uses a square-root scale capped at the 95th percentile of matched precincts, with the same scale for both parties. Missing or zero-vote precincts remain gray. This is a local visualization method, not a reproduction of a proprietary map model.

Gray road geometry and road names load on demand from the public U.S. Census Bureau TIGERweb Transportation_LargeScale service: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation_LargeScale/MapServer. Highway detail starts at 6× zoom, local streets at 12×, and collision-filtered street names at 24×. Temporary failures retry automatically twice while the map remains still. Only the visible Ohio area (with a small pan buffer) is queried. Requests are cancelled when navigating, cached within the page, and do not alter any election returns. An internet connection is required for this road layer. City names retain priority over street-name labels. No Census road geometry is represented as a voting boundary or used to allocate votes.

The 2026 colored map uses county election returns. Cuyahoga's results are imported by `update-ohio-precinct-results.py`, and additional counties are imported by `update-ohio-precinct-expansion.py`. The expansion snapshot records the returns and boundary sources for each county. Geographic fragments sharing a precinct ID share the same result and count toward one precinct total. Butler uses matched 2024 boundaries and approximate traces of the Board of Elections' revised maps for Monroe precincts 1, 2, 3, 7, 8, 9 and 11. The traces are aligned to Census TIGERweb street intersections and clipped to the combined 2024 exterior. [Butler County precinct maps](https://elections.bcohio.gov/dataandresources/maps/index.php)

- Results: https://app.enhancedvoting.com/results/public/cuyahoga-county-oh/GE2026
- Boundaries: https://www.arcgis.com/home/item.html?id=933db63595cc49f5a1c9eccebf84d536

## Historic SVG preview

City and place label coordinates in `ohio-city-labels.js` come from the U.S. Census Bureau's 2024 Ohio Places Gazetteer, with the six major-city positions reused from the site's existing `state-city-labels.js`. Zoom tiers are presentation priorities, not population estimates. Source: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_39.txt

The unfilled statewide backdrop in `ohio-unfilled-precincts.js` uses the georeferenced [Ohio 2024 dataset](https://github.com/21MetcalfJ/2024Precincts/tree/main/states/Ohio) behind the SVG, collected by OPoliticsGuru and published by 21MetcalfJ. Their repository permits reuse and requests credit. Only geometry and precinct names are retained; all historic vote columns are discarded. Zero-area source rings are omitted, geometry is simplified by 0.00002 degrees, and the current Cuyahoga footprint is removed to avoid displaying outdated boundaries under verified current returns. Unfilled outlines remain explicitly identified as 2024 geography in the map's accessible description and individual shape titles. No 2026 boundary verification is implied outside the current county data.

Carroll's 2026 returns use matched 2024 precinct boundaries from the same Ohio archive. Pickaway uses the county's November 2026 election map. Hocking uses its county GIS precinct shapefile. Fulton uses the county GIS voting precinct layer, with precinct splits combined by the names in the county's report.

Perry County's 33 precincts use the precinct numbers in its November 3 statement of votes cast and their matching 2024 boundaries. The tooltip includes the separately reported write-in votes. [Perry County statement of votes cast](https://www.boe.ohio.gov/perry/c/elecres/20261103precinct.pdf)

Wayne County's map uses 34 matched reference outlines and the board's [November 3 statement of votes cast](https://www.waynecountyoh.gov/wp-content/uploads/2026/11/Unofficial-SOVC-Incl-WI-Gen-26.pdf). Areas with known or possible changes to the 2024 outlines stay gray until matching boundaries are available. The board documents changes in [spring 2025](https://www.waynecountyoh.gov/jan-25-polling-place-changes/), [fall 2025](https://www.waynecountyoh.gov/oct-25-polling-place-changes/), and [spring 2026](https://www.waynecountyoh.gov/spring-2026-polling-place-and-precinct-changes/).

The geometry in `ohio-precinct-boundaries.js` and `ohio-precinct-boundaries.svg` is adapted from [OH President 2024.svg](https://commons.wikimedia.org/wiki/File:OH_President_2024.svg), by Orca and Putitonamap98, licensed under [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Changes: removed 2024 result colors, editor metadata, and invisible artwork; retained boundary geometry and island corrections. These adapted geographic assets are distributed under CC BY-SA 4.0. This notice applies to these assets, not the unrelated website code.

The source describes 2024 precinct-level presidential geography, sourced from https://github.com/21MetcalfJ/2024Precincts/tree/main. Its paths do not provide verified 2026 precinct identifiers. Boundary changes for the 2026 election have not been verified. The 11,053 SVG paths are boundary shapes, not a count of unique voting precincts. No 2024 votes or result colors are used as 2026 results.

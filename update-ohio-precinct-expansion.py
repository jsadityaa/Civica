"""Build Ohio's 2026 Senate precinct snapshot from county results.

Requires openpyxl, Shapely and mapbox-vector-tile. Pass Stark's November 2026
Statement of Votes Cast workbook and the TileJSON for Summit's precinct-only
tileset from the public election map. Keep the TileJSON outside the repository.
To update Hamilton and Franklin, pass Hamilton's Detail XML ZIP with
--hamilton-report and Franklin's api/election/live and api/precinct JSON files
with --franklin-data, in that order.
For southwest Ohio, pass the Butler, Warren and Clark precinct CSVs with
--southwest-reports, Warren's Active Precincts GeoJSON with --warren-geojson,
and the election map's Montgomery TileJSON with --montgomery-tilejson.
Use --county-reports for Carroll's precinct CSV and Fulton's Detail XML ZIP,
--pickaway-tilejson for the election map, and --hocking-shapefile for Hocking's
county GIS ZIP. The Hocking import also requires pyshp and pyproj.
"""
import argparse
import concurrent.futures
import csv
import gzip
import io
import json
import math
import re
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode, urlparse
from urllib.request import urlopen
from xml.etree import ElementTree
from zipfile import ZipFile
from zoneinfo import ZoneInfo

import mapbox_vector_tile
from openpyxl import load_workbook
from shapely import make_valid
from shapely.geometry import box, mapping, shape
from shapely.ops import transform, unary_union

ROOT = Path(__file__).resolve().parent
SUMMIT_SOURCE = "https://app.enhancedvoting.com/results/public/summit-county-oh/elections/Nov2026General"
SUMMIT_API = "https://app.enhancedvoting.com/results/public/api/elections/summit-county-oh/Nov2026General/data"
SUMMIT_TILESET = "enhancedvoting.Summit-OH-112026"
STARK_SOURCE = "https://rpc.starkcountyohio.gov/government/offices/board_of_elections/election_results/"
STARK_GIS = "https://scgisa.starkcountyohio.gov/arcgis/rest/services/BoardOfElections/PollingLocationsAndPrecincts/MapServer/1"
HAMILTON_SOURCE = "https://results.votehamiltoncountyohio.gov/OH/Hamilton/127473"
HAMILTON_GIS = "https://cagisonline.hamilton-co.org/arcgis/rest/services/Countywide_Layers/IdentifyLayers/MapServer/17"
FRANKLIN_SOURCE = "https://vote.franklincountyohio.gov/elections"
FRANKLIN_GIS = "https://gis.franklincountyohio.gov/hosting/rest/services/BOEL/BOEL_Information/FeatureServer/0"
WARREN_GIS = "https://maps.warrencountyohio.gov/server/rest/services/BOE/BOE/MapServer/1"
CLARK_GIS = "https://ago.clarkcountyohio.gov/ccoarcgis/rest/services/WMAS/VotingPrecincts/MapServer/0"
GREENE_GIS = "https://gis.greenecountyohio.gov/webgis2/rest/services/BOE/VotingPrecincts/MapServer/0"
FULTON_SOURCE = "https://results.enr.clarityelections.com/OH/Fulton/127571/"
FULTON_GIS = "https://gis.fultoncountyoh.com/arcgis/rest/services/ElectionPollingPlaces2/MapServer/1"
HOCKING_GIS = "https://hocking.oh.gov/PublicMaps/index.php?dir=GIS+SHAPEFILES%2FVOTING+PRECINCTS"
ENHANCED_RESULTS = "https://app.enhancedvoting.com/results/public/"
PARTY = {"DEM": "D", "REP": "R", "LIB": "L", "LIBERTARIAN": "L"}
SNAPSHOT_PREFIX = "window.OHIO_PRECINCT_EXPANSION_2026 = "


def fetch(url):
    with urlopen(url, timeout=25) as response:
        data = response.read()
    return gzip.decompress(data) if data.startswith(b"\x1f\x8b") else data


def english(labels):
    return next(label["text"] for label in labels if label.get("languageId") == "en")


def vote_count(value):
    if type(value) is not int or value < 0:
        raise ValueError(f"Invalid vote count: {value!r}")
    return value


def feature(key, name, geometry):
    if geometry.is_empty or geometry.geom_type not in ("Polygon", "MultiPolygon") or not geometry.is_valid:
        raise ValueError(f"Invalid precinct polygon for {name}")
    return {"type": "Feature", "properties": {"key": key, "name": name}, "geometry": mapping(geometry)}


def polygon_parts(geometry):
    if geometry.geom_type == "Polygon":
        return [geometry]
    return [polygon for part in getattr(geometry, "geoms", ()) for polygon in polygon_parts(part)]


def checked_county(name, source, geometry_source, as_of, rows, features, official):
    keys = {r["key"] for r in rows}
    boundary_keys = {f["properties"]["key"] for f in features}
    missing = {r["key"] for r in rows if not r.get("virtual")} - boundary_keys
    if not rows or len(keys) != len(rows) or missing or boundary_keys - keys:
        raise ValueError(f"{name} precinct mismatch: missing {sorted(missing)}; extra {sorted(boundary_keys - keys)}")
    for row in rows:
        row["mapped"] = row["key"] in boundary_keys
    return {"county": name, "source": source, "geometrySource": geometry_source,
            "features": features, "races": [{"office": "senate", "asOf": as_of,
                "official": official, "total": sum(r["total"] for r in rows), "rows": rows}]}


def enhanced_senate(county, api, contest_name):
    snapshot = json.loads(fetch(api))
    item, = (i for i in snapshot["ballotItems"] if english(i["name"]) == contest_name)
    data = json.loads(fetch(api + "/ballot-item/" + item["id"]))
    election = data["election"]
    if election["electionDate"] != "2026-11-03" or not election["isProduction"] or election["isPrimary"]:
        raise ValueError(f"Not {county}'s public 2026 general election")
    race = data["ballotItemWithBreakdown"]
    rows = []
    precincts = []
    for part in race["breakdownResults"]:
        p = part["precinct"]
        candidates = [{"name": english(c["name"]),
                       "party": PARTY.get(((c.get("party") or {}).get("abbreviation") or "").upper(), "Other"),
                       "votes": vote_count(c["voteCount"] if c["voteCount"] is not None else 0)}
                      for c in part["ballotOptions"]]
        if sum(c["votes"] for c in candidates) != part["voteTotal"]:
            raise ValueError(f"{county} precinct votes do not reconcile")
        precincts.append(p)
        rows.append({"key": p["id"], "name": english(p["name"]),
                     "virtual": p["isVirtual"], "total": part["voteTotal"], "candidates": candidates})
    if sum(r["total"] for r in rows) != race["voteTotal"]:
        raise ValueError(f"{county} county votes do not reconcile")
    return election, rows, precincts


def tiled_precincts(tilejson, tileset, region, precinct_key):
    if not any(layer["source"] == tileset for layer in tilejson["vector_layers"]):
        raise ValueError(f"Wrong precinct tileset for {tileset}")
    # Zoom 12 gives county-wide coverage at about 7 metres per tile-grid unit.
    # Work in the common tile grid until fragments have been clipped and merged.
    z = 12
    n = 2 ** z
    west, south, east, north = tilejson["bounds"]
    tile_x = lambda lon: int((lon + 180) / 360 * n)
    tile_y = lambda lat: int((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n)
    tiles = [(x, y) for x in range(tile_x(west), tile_x(east) + 1)
             for y in range(tile_y(north), tile_y(south) + 1)]
    left, bottom, right, top = region
    if len(tiles) > 60 or not (left < west < east < right and bottom < south < north < top):
        raise ValueError(f"Invalid extent for {tileset}")
    template = tilejson["tiles"][0].replace("http://", "https://", 1)
    if urlparse(template).scheme != "https" or not urlparse(template).hostname.endswith(".mapbox.com"):
        raise ValueError("Unexpected tileset host")

    def tile(coords):
        x, y = coords
        try:
            raw = fetch(template.replace("{z}", str(z)).replace("{x}", str(x)).replace("{y}", str(y)))
        except HTTPError as error:
            if error.code == 404:
                return []
            raise ValueError(f"Could not read precinct tile {z}/{x}/{y}: HTTP {error.code}") from None
        except Exception:
            # Do not emit a token-bearing tile URL in exceptions.
            raise ValueError(f"Could not read precinct tile {z}/{x}/{y}") from None
        layers = mapbox_vector_tile.decode(raw, default_options={"y_coord_down": True}) if raw else {}
        layer = layers.get("precincts")
        if not layer:
            return []
        extent = layer["extent"]
        if extent != 4096:
            raise ValueError("Unexpected tile grid")
        x0, y0 = x * extent, y * extent
        clip = box(x0, y0, x0 + extent, y0 + extent)
        return [(str(f["id"]), f["properties"],
                 transform(lambda px, py: (px + x0, py + y0), make_valid(shape(f["geometry"]))).intersection(clip))
                for f in layer["features"]]

    parts = defaultdict(list)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for tile_features in pool.map(tile, tiles):
            for feature_id, properties, geometry in tile_features:
                if not geometry.is_empty and geometry.area > 0:
                    key = precinct_key(feature_id, properties)
                    if key is not None:
                        parts[key].extend(polygon_parts(geometry))
    size = n * 4096

    def lon_lat(x, y):
        return x / size * 360 - 180, math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / size))))

    return {key: transform(lon_lat, unary_union(parts[key])) for key in sorted(parts)}


def summit(tilejson):
    election, rows, precincts = enhanced_senate("Summit", SUMMIT_API, "For U.S. Senator")
    feature_ids = {}
    for row, precinct in zip(rows, precincts):
        if not row["virtual"]:
            row["key"] = row["name"].split()[0]
        feature_ids[row["key"]] = (precinct["mapFeatureId"] or "").split(";")

    def precinct_key(feature_id, properties):
        code = properties["PRECINCT"]
        # One feed row groups two map IDs, while each polygon and vote row
        # still has its own precinct code.
        if code not in feature_ids or (feature_ids[code] != [""] and feature_id not in feature_ids[code]):
            raise ValueError(f"Summit boundary ID and precinct code disagree: {code}")
        return code

    geometry = tiled_precincts(tilejson, SUMMIT_TILESET, (-83, 40, -80, 42), precinct_key)
    labels = {r["key"]: r["name"] for r in rows}
    features = [feature(key, labels[key], polygon) for key, polygon in geometry.items()]
    return checked_county("Summit", SUMMIT_SOURCE, SUMMIT_SOURCE, election["asOf"],
                          rows, features, election["isOfficialResults"])


def stark(workbook_path):
    book = load_workbook(workbook_path, read_only=True, data_only=True)
    cover = list(book.worksheets[0].iter_rows(max_row=12, values_only=True))
    labels = {v for r in cover for v in r if isinstance(v, str)}
    dates = {v.date() for r in cover for v in r if hasattr(v, "date")}
    if not {"General Election", "Stark County", "Unofficial Results"} <= labels or date(2026, 11, 3) not in dates:
        raise ValueError("Not Stark's unofficial November 2026 general election workbook")
    contest, = [s for s in book if any(isinstance(v, str) and v.startswith("U.S. Senator ")
                                     for v in next(s.iter_rows(min_row=2, max_row=2, values_only=True)))]
    records = iter(contest.values)
    report_date = next(v for v in next(records) if hasattr(v, "date"))
    next(records)
    next(records)
    header = next(records)
    total_column = header.index("Total Votes")
    columns = []
    for i, label in enumerate(header[5:], 5):
        if not label or i == total_column:
            continue
        lines = label.strip().splitlines()
        affiliation = lines[-1].strip("() ") if len(lines) > 1 else ""
        columns.append((i, "Unresolved write-in" if lines[0] == "Unresolved" else lines[0],
                        PARTY.get(affiliation, "Other")))

    def counts(record):
        candidates = [{"name": name, "party": party, "votes": vote_count(record[i])}
                      for i, name, party in columns]
        total = vote_count(record[total_column])
        if sum(c["votes"] for c in candidates) != total:
            raise ValueError("Stark precinct votes do not reconcile")
        return candidates, total

    rows, county_total = [], None
    precinct = None
    for record in records:
        if not record:
            continue
        label = record[0]
        if label == "County - Total":
            county_total, total = counts(record)
        elif label and label == record[4] and record[1] == "" and label not in ("County", "Stark"):
            precinct = label
        elif label == "Total" and precinct:
            candidates, votes = counts(record)
            rows.append({"key": precinct, "name": precinct, "virtual": precinct == "Cumulative",
                         "total": votes, "candidates": candidates})
            precinct = None
    book.close()
    if county_total is None or total != sum(r["total"] for r in rows) or any(
            c["votes"] != sum(r["candidates"][i]["votes"] for r in rows) for i, c in enumerate(county_total)):
        raise ValueError("Stark county totals do not reconcile")

    q = urlencode({"f": "geojson", "where": "1=1", "outFields": "BOEPREID,NAME,CVT_NAME",
                   "outSR": 4326, "geometryPrecision": 5, "maxAllowableOffset": .00002, "resultRecordCount": 1000})
    geo = json.loads(fetch(STARK_GIS + "/query?" + q))
    if geo.get("exceededTransferLimit"):
        raise ValueError("Stark boundary response was truncated")
    names = {}
    parts = defaultdict(list)
    for f in geo["features"]:
        p = f["properties"]
        code = p["BOEPREID"]
        # The workbook uses shorter jurisdiction abbreviations than county GIS.
        if p["CVT_NAME"] == "Canton" and re.fullmatch(r"CAN\.C[1-9][A-Z]", code):
            code = "CC" + code.removeprefix("CAN.C")
        elif p["CVT_NAME"] == "North Canton" and re.fullmatch(r"N\.CAN[1-9][A-Z]", code):
            code = "NC" + code.removeprefix("N.CAN")
        elif p["NAME"] == "MEYERS LAKE VILLAGE A" and code == "MLAKA":
            code = "MLAKE"
        if code in names and names[code] != p["NAME"]:
            raise ValueError(f"Ambiguous Stark GIS name for {code}")
        names[code] = p["NAME"]
        parts[code].extend(polygon_parts(make_valid(shape(f["geometry"]))))
    features = [feature(code, name, unary_union(parts[code])) for code, name in names.items()]
    for row in rows:
        row["name"] = names.get(row["key"], row["name"])
    return checked_county("Stark", STARK_SOURCE, STARK_GIS,
                          report_date.replace(tzinfo=ZoneInfo("America/New_York")).isoformat(),
                          rows, features, False)


def precinct_boundaries(service, key_field, name_field, *, dissolve=False):
    query = urlencode({"where": "1=1", "outFields": ",".join(dict.fromkeys((key_field, name_field))),
                       "f": "geojson", "outSR": 4326, "geometryPrecision": 5,
                       "maxAllowableOffset": .000015})
    data = json.loads(fetch(f"{service}/query?{query}"))
    return read_boundaries(data, key_field, name_field, dissolve=dissolve)


def read_boundaries(data, key_field, name_field, *, dissolve=False):
    if data.get("exceededTransferLimit") or data.get("type") != "FeatureCollection":
        raise ValueError("Incomplete precinct boundary response")
    names = {}
    parts = defaultdict(list)
    for item in data["features"]:
        key, name = (item["properties"][field] for field in (key_field, name_field))
        if key is None or not name or (str(key) in names and (not dissolve or names[str(key)] != str(name))):
            raise ValueError(f"Duplicate or invalid GIS precinct: {key}")
        key = str(key)
        names[key] = str(name)
        parts[key].extend(polygon_parts(make_valid(shape(item["geometry"]))))
    return {key: feature(key, name, unary_union(parts[key])) for key, name in names.items()}


def clarity_senate(report_path, county, contest_name):
    with ZipFile(report_path) as archive:
        report = ElementTree.fromstring(archive.read("detail.xml"))
    if report.findtext("Region") != county or report.findtext("ElectionDate") != "11/3/2026":
        raise ValueError(f"Not {county}'s November 2026 general election report")
    contest, = (c for c in report.findall("Contest") if c.attrib["text"] == contest_name)
    precinct_names = {p.attrib["name"] for p in report.findall("./VoterTurnout/Precincts/Precinct")}
    if len(precinct_names) != int(contest.attrib["precinctsReported"]):
        raise ValueError(f"{county} precinct reporting count does not reconcile")
    candidates = defaultdict(list)
    for choice in contest.findall("Choice"):
        attrs = choice.attrib
        counts = dict.fromkeys(precinct_names, 0)
        for group in choice.findall("VoteType"):
            votes = {p.attrib["name"]: vote_count(int(p.attrib["votes"])) for p in group.findall("Precinct")}
            if (votes.keys() != precinct_names or len(votes) != len(group.findall("Precinct"))
                    or sum(votes.values()) != int(group.attrib["votes"])):
                raise ValueError(f"{county} vote type does not reconcile: {attrs['text']}")
            for name, count in votes.items():
                counts[name] += count
        if sum(counts.values()) != int(attrs["totalVotes"]):
            raise ValueError(f"{county} candidate total does not reconcile: {attrs['text']}")
        for name, count in counts.items():
            candidates[name].append({"name": attrs["text"], "party": PARTY.get(attrs.get("party"), "Other"),
                                     "votes": count})
    rows = []
    for name in sorted(precinct_names):
        choices = candidates[name]
        rows.append({"key": name, "name": name, "candidates": choices,
                     "total": sum(c["votes"] for c in choices)})
    timestamp = datetime.strptime(report.findtext("Timestamp").rsplit(" ", 1)[0], "%m/%d/%Y %I:%M:%S %p")
    return timestamp.replace(tzinfo=ZoneInfo("America/New_York")).isoformat(), rows


def hamilton(report_path):
    timestamp, rows = clarity_senate(report_path, "Hamilton", "For U.S. Senator (Unexpired term ending 1-3-2029)")
    features = precinct_boundaries(HAMILTON_GIS, "PRECINCT", "PRC_NAME")
    for row in rows:
        row["key"] = row["key"].split()[0]
        row["name"] = features[row["key"]]["properties"]["name"]
    return checked_county("Hamilton", HAMILTON_SOURCE, HAMILTON_GIS, timestamp, rows, list(features.values()), False)


def fulton(report_path):
    timestamp, rows = clarity_senate(report_path, "Fulton", "U. S. Senate (UTE 1-3-2029)")
    features = precinct_boundaries(FULTON_GIS, "NAME", "NAME", dissolve=True)
    return checked_county("Fulton", FULTON_SOURCE, FULTON_GIS, timestamp, rows, list(features.values()), False)


def franklin(results_path, precincts_path):
    election = json.loads(results_path.read_text())
    if ((election["year"], election["month"], election["day"]) != (2026, 11, 3)
            or election["isTest"] or election["isPrimary"]):
        raise ValueError("Not Franklin's November 2026 general election feed")
    precincts = json.loads(precincts_path.read_text())["precincts"]
    parents = {child: i for i, area in enumerate(precincts, 1) for child in area.get("children", [])}
    features = precinct_boundaries(FRANKLIN_GIS, "PRECINCTID", "NAME")

    def normalize(name):
        name = re.sub(r"\b0+(?=\d)", "", name.upper())
        return re.sub(r"[^A-Z0-9]", "", name)

    names = {normalize(f["properties"]["name"]): key for key, f in features.items()}
    contest, = (r for r in election["races"] if r.get("office") == "senate" and r["level"] == "f")
    areas = contest["areas"]
    turnout = {item["area"] for item in election["turnout"]}
    if len(names) != len(features) or len(set(areas)) != len(areas) or set(areas) != turnout:
        raise ValueError("Franklin precinct names or area IDs do not reconcile")
    choices = contest["choices"]
    if not choices or any(len(choice["votes"]) != len(areas) for choice in choices):
        raise ValueError("Franklin votes do not align with the precinct list")
    rows = []
    for index, area_id in enumerate(areas):
        # The public results feed uses one-based IDs. Wards are nested under
        # municipalities, while unwarded precincts are listed directly.
        area = precincts[area_id - 1]
        parent_id = parents[area_id]
        parent = precincts[parent_id - 1]
        district = parent["code"]
        if parent_id in parents:
            municipality = precincts[parents[parent_id] - 1]
            district = f"{municipality['code']} {district}"
        key = names[normalize(f"{district}-{area['code']}")]
        candidates = [{"name": re.sub(r"^(Dem|Rep|Lib|Opc) ", "", c["name"]),
                       "party": PARTY.get(c["party"], "Other"), "votes": vote_count(c["votes"][index])}
                      for c in choices]
        rows.append({"key": key, "name": features[key]["properties"]["name"], "candidates": candidates,
                     "total": sum(c["votes"] for c in candidates)})
    return checked_county("Franklin", FRANKLIN_SOURCE, FRANKLIN_GIS,
                          datetime.fromtimestamp(results_path.stat().st_mtime, timezone.utc).isoformat(),
                          rows, list(features.values()),
                          election["isOfficial"])


ENR_REPORTS = {
    "Carroll": ("carrollohenr/23/en/Index_23.html", "United States Senator (Unexpired term)", 23, 10288, "22:41:54"),
    "Butler": ("butlerohenr/24/en/Index_24.html", "UNITED STATES SENATOR UTE 1-3-2029", 292, 146733, "23:39:31"),
    "Warren": ("warrenohenr/18/en/R_Index_18.html", "U.S. Senator", 185, 113180, "21:40:47"),
    "Clark": ("clarkohenr/20/en/Index_20.html", "United States Senator (U.T.E. 1-3-2029)", 78, 48876, "22:14:07"),
}
ENR_PARTIES = {"Sherrod Brown": "D", "Jon Husted": "R", "William B. Redpath": "L"}


def enr_senate(county, report):
    page, contest, count, total, time = ENR_REPORTS[county]
    with report.open(encoding="utf-8-sig", newline="") as stream:
        if next(stream).strip().lower() != "unofficial election results" or next(stream).strip() != f"{county} County":
            raise ValueError(f"Not the {county} County ENR report")
        precincts = defaultdict(dict)
        for record in csv.DictReader(stream):
            if record["Contest Name"] == contest:
                name, candidate = record["Precinct"], record["Candidate Name"]
                if candidate in precincts[name]:
                    raise ValueError(f"Duplicate candidate in {county} precinct {name}")
                precincts[name][candidate] = vote_count(int(record["Votes"].replace(",", "")))
    if (len(precincts) != count or sum(sum(v.values()) for v in precincts.values()) != total
            or any(not ENR_PARTIES.keys() <= v.keys() for v in precincts.values())):
        raise ValueError(f"{county} returns do not reconcile with the November 3 summary")
    rows = [{"name": name, "total": sum(votes.values()),
             "candidates": [{"name": candidate, "party": ENR_PARTIES.get(candidate, "Other"), "votes": votes}
                            for candidate, votes in votes.items()]}
            for name, votes in precincts.items()]
    return f"https://liveresults.boe.ohio.gov/ENR/{page}", f"2026-11-03T{time}-05:00", rows


def warren(report, geojson_path):
    source, timestamp, rows = enr_senate("Warren", report)
    data = json.loads(geojson_path.read_text())
    if any((f["properties"]["County"], f["properties"]["year_"], f["properties"]["month_"]) != ("Warren", 2026, "NOV")
           for f in data["features"]):
        raise ValueError("Not Warren's November 2026 precinct layer")
    boundaries = read_boundaries(data, "PRECINCT", "prec_name")
    for row in rows:
        row["key"] = str(int(row["name"].rsplit(" ", 1)[1]))
    return checked_county("Warren", source, WARREN_GIS, timestamp, rows, list(boundaries.values()), False)


def clark(report):
    source, timestamp, rows = enr_senate("Clark", report)
    boundaries = precinct_boundaries(CLARK_GIS, "NAME", "NAME")
    aliases = {"BETH": "BETHEL", "GERM": "GERMAN", "GREE": "GREEN", "HARM": "HARMONY"}

    def normalize(name):
        return re.sub(r"[^A-Z0-9]", "", re.sub(r"\b0+(?=\d)", "", name.upper()))

    # Some county GIS IDs are shared across distinct named voting precincts.
    features = {}
    for name, boundary in boundaries.items():
        key = normalize(name)
        if key in features:
            raise ValueError(f"Ambiguous Clark precinct name: {name}")
        boundary["properties"]["key"] = key
        features[key] = boundary
    for row in rows:
        name = row["name"].split(" ", 1)[1]
        district, suffix = name.split(" ", 1)
        row["key"] = normalize(f"{aliases.get(district, district)} {suffix}")
    return checked_county("Clark", source, CLARK_GIS, timestamp, rows, list(features.values()), False)


def historic_county(geoid):
    historic_path = ROOT / "ohio-unfilled-precincts.js"
    historic = json.loads(historic_path.read_text().split(" = ", 1)[1].rstrip(";\n"))
    query = urlencode({"where": f"GEOID='{geoid}'", "outFields": "GEOID", "f": "geojson", "outSR": 4326})
    county_url = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query"
    county_feature, = json.loads(fetch(f"{county_url}?{query}"))["features"]
    county = make_valid(shape(county_feature["geometry"]))
    matches = []
    for item in historic["features"]:
        geometry = shape(item["geometry"])
        if county.contains(geometry.representative_point()):
            matches.append((item["properties"]["name"], geometry))
    return historic["source"], historic["boundaryYear"], matches


def carroll(report):
    source, timestamp, rows = enr_senate("Carroll", report)
    geometry_source, year, matches = historic_county("39019")
    features = []
    for name, geometry in matches:
        boundary = feature(name.upper(), name, unary_union(polygon_parts(make_valid(geometry))))
        boundary["properties"]["boundaryYear"] = year
        features.append(boundary)
    for row in rows:
        row["key"] = row["name"].rsplit(" ", 1)[0]
    return checked_county("Carroll", source, geometry_source, timestamp, rows, features, False)


def butler(report):
    source, timestamp, rows = enr_senate("Butler", report)
    revised = json.loads((ROOT / "data/ohio-monroe-precincts-2026.geojson").read_text())
    monroe = read_boundaries(revised, "key", "name")
    geometry_source, year, matches = historic_county("39017")
    features = list(monroe.values())
    for historic_name, geometry in matches:
        name = historic_name.upper()
        name = name.replace("FAIRFIELD TWP", "FFTWP").replace("WEST CHESTER TWP", "WC")
        name = name.replace("OXFORD TWP", "OXTWP").replace(" TWP", "")
        key = re.sub(r"[^A-Z0-9]", "", name)
        if key not in monroe:
            geometry = unary_union(polygon_parts(make_valid(geometry)))
            boundary = feature(key, historic_name, geometry)
            boundary["properties"]["boundaryYear"] = year
            features.append(boundary)
    for row in rows:
        row["key"] = row["name"]
    county = checked_county("Butler", source, geometry_source, timestamp, rows, features, False)
    county["revisedGeometrySource"] = revised["source"]
    return county


def greene():
    path = "elections/greene-county-oh/2026NovemberGeneral"
    election, rows, _ = enhanced_senate("Greene", f"{ENHANCED_RESULTS}api/{path}/data", "U.S. Senator (UTE 1-3-2029)")
    boundaries = precinct_boundaries(GREENE_GIS, "PRECINCT", "PRECINCT")
    for row in rows:
        row["key"] = str(int(row["name"].split()[0]))
        boundaries[row["key"]]["properties"]["name"] = row["name"]
    return checked_county("Greene", f"{ENHANCED_RESULTS}{path}", GREENE_GIS, election["asOf"],
                          rows, list(boundaries.values()), election["isOfficialResults"])


def enhanced_tiled_county(county, path, contest, tilejson, tileset, region):
    election, rows, precincts = enhanced_senate(county, f"{ENHANCED_RESULTS}api/{path}/data", contest)
    for row in rows:
        for candidate in row["candidates"]:
            candidate["name"] = re.sub(r"^(DEM|REP|LIB|OPC) ", "", candidate["name"], flags=re.IGNORECASE)
    expected = {}
    for precinct in precincts:
        for feature_id in precinct["mapFeatureId"].split(";"):
            if not feature_id or feature_id in expected:
                raise ValueError(f"Invalid or shared {county} map feature ID")
            expected[feature_id] = precinct["id"]
    seen = set()

    def precinct_key(feature_id, properties):
        if feature_id in expected:
            seen.add(feature_id)
            return expected[feature_id]
        return None

    geometry = tiled_precincts(tilejson, tileset, region, precinct_key)
    if seen != expected.keys():
        raise ValueError(f"Missing {len(expected.keys() - seen)} precinct fragments from {county}'s election map")
    labels = {row["key"]: row["name"] for row in rows}
    features = [feature(key, labels[key], polygon) for key, polygon in geometry.items()]
    source = f"{ENHANCED_RESULTS}{path}"
    return checked_county(county, source, source, election["asOf"], rows, features, election["isOfficialResults"])


def montgomery(tilejson):
    return enhanced_tiled_county("Montgomery", "elections/montgomery-county-oh/2026NovemberGeneralElection",
                               "U.S. Senator UTE 1-3-2029", tilejson, "enhancedvoting.MontgomeryOH25",
                               (-85, 39, -83, 40.5))


def pickaway(tilejson):
    return enhanced_tiled_county("Pickaway", "elections/pickaway-county-oh/GE2026_20261028170048",
                               "For U.S. Senator (UTE 1-3-29)", tilejson, "enhancedvoting.Pickaway-OH-1126",
                               (-84, 39, -82, 40))


def hocking(shapefile_path):
    import shapefile
    from pyproj import CRS, Transformer

    path = "elections/hocking-county-oh/2026NovemberGeneralElection"
    election, rows, _ = enhanced_senate("Hocking", f"{ENHANCED_RESULTS}api/{path}/data", "United States Senator")
    layer = "HOCKING COUNTY VOTING PRECINCTS"
    with ZipFile(shapefile_path) as archive:
        crs = CRS.from_wkt(archive.read(f"{layer}.prj").decode())
        project = Transformer.from_crs(crs, 4326, always_xy=True).transform
        features = []
        with shapefile.Reader(**{ext: io.BytesIO(archive.read(f"{layer}.{ext}")) for ext in ("shp", "shx", "dbf")}) as reader:
            for record in reader.iterShapeRecords():
                if (record.record["COUNTY"], record.record["STATE"]) != ("HOCKING", "OHIO"):
                    raise ValueError("Not the Hocking County voting precinct shapefile")
                name = record.record["PRECINCT"].strip()
                geom = transform(project, shape(record.shape.__geo_interface__))
                geom = unary_union(polygon_parts(make_valid(geom))).simplify(.000015, preserve_topology=True)
                features.append(feature(name, name, geom))
    for row in rows:
        row["key"] = row["name"].split(" ", 1)[1]
        if row["key"] == "SALTCREEK":
            row["key"] = "SALT CREEK"
    return checked_county("Hocking", f"{ENHANCED_RESULTS}{path}", HOCKING_GIS, election["asOf"],
                          rows, features, election["isOfficialResults"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stark_workbook", nargs="?")
    parser.add_argument("summit_tilejson", nargs="?", type=Path)
    parser.add_argument("--hamilton-report")
    parser.add_argument("--franklin-data", nargs=2, type=Path, metavar=("RESULTS", "PRECINCTS"))
    parser.add_argument("--southwest-reports", nargs=3, type=Path, metavar=("BUTLER", "WARREN", "CLARK"))
    parser.add_argument("--montgomery-tilejson", type=Path)
    parser.add_argument("--warren-geojson", type=Path)
    parser.add_argument("--county-reports", nargs=2, type=Path, metavar=("CARROLL", "FULTON"))
    parser.add_argument("--pickaway-tilejson", type=Path)
    parser.add_argument("--hocking-shapefile", type=Path)
    args = parser.parse_args()
    groups = [
        (args.stark_workbook, args.summit_tilejson),
        (args.hamilton_report, args.franklin_data),
        (args.southwest_reports, args.montgomery_tilejson, args.warren_geojson),
        (args.county_reports, args.pickaway_tilejson, args.hocking_shapefile),
    ]
    selected = [i for i, group in enumerate(groups) if any(group)]
    if len(selected) != 1 or not all(groups[selected[0]]):
        parser.error("pass the complete input files for one county group")
    if selected[0] == 3:
        carroll_report, fulton_report = args.county_reports
        counties = [carroll(carroll_report), pickaway(json.loads(args.pickaway_tilejson.read_text())),
                    hocking(args.hocking_shapefile), fulton(fulton_report)]
    elif selected[0] == 2:
        butler_report, warren_report, clark_report = args.southwest_reports
        counties = [butler(butler_report), warren(warren_report, args.warren_geojson), montgomery(json.loads(args.montgomery_tilejson.read_text())),
                    greene(), clark(clark_report)]
    elif selected[0] == 1:
        counties = [hamilton(args.hamilton_report), franklin(*args.franklin_data)]
    else:
        counties = [summit(json.loads(args.summit_tilejson.read_text())), stark(args.stark_workbook)]
    write_counties(counties)


def write_counties(counties):
    target = ROOT / "ohio-precinct-expansion-2026-data.js"
    snapshots = {}
    if target.exists():
        source = target.read_text().strip()
        if not source.startswith(SNAPSHOT_PREFIX) or not source.endswith(";"):
            raise ValueError("Invalid existing precinct snapshot")
        snapshots.update((c["county"], c) for c in json.loads(source[len(SNAPSHOT_PREFIX):-1]))
    snapshots.update((c["county"], c) for c in counties)
    temporary = target.with_suffix(".tmp")
    temporary.write_text(SNAPSHOT_PREFIX + json.dumps(list(snapshots.values()), separators=(",", ":")) + ";\n")
    temporary.replace(target)
    for county in counties:
        race, = county["races"]
        print(f"{county['county']}: {sum(r['mapped'] for r in race['rows'])} mapped precincts, {race['total']:,} votes")


if __name__ == "__main__":
    main()

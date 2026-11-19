"""Join Georgia's November 2026 Senate returns to 2026 precinct geography.

Pass the state Senate ballot-item JSON, a directory of county ballot-item JSON
files named by jurisdiction short name, the AJC's precinct GeoJSON, the Georgia
Census Gazetteer place file, and the Chatham and Fulton county precinct GeoJSON.
Requires Shapely. The AJC GeoJSON may be supplied compressed or decompressed.

The public county endpoint is /results/public/api/elections/{shortName}/
11032026GeneralAndSpecialElection/data/ballot-item/{parentBallotItemId}.
"""

import argparse
import csv
import gzip
import json
import re
from collections import defaultdict
from pathlib import Path
from shapely import make_valid, set_precision
from shapely.geometry import mapping, shape
from shapely.ops import unary_union


SOURCE = "https://results.sos.ga.gov/results/public/Georgia/11032026GeneralAndSpecialElection"
BOUNDARIES = "https://www.ajc.com/politics/2026/11/jon-ossoff-win-neighborhood-map/"
CHATHAM_BOUNDARIES = "https://pub.sagis.org/arcgis/rest/services/ChathamCounty/CCElections/MapServer/3"
FULTON_BOUNDARIES = "https://services1.arcgis.com/AQDHTHDrZzfsFsB5/ArcGIS/rest/services/Voting_Precincts/FeatureServer/0"
PLACES = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_13.txt"
PARTIES = {"DEM": "D", "REP": "R", "LIB": "L"}
MAJOR_CITIES = {"Albany", "Athens", "Atlanta", "Augusta", "Columbus", "Macon", "Rome", "Savannah", "Valdosta"}
PRECINCT_ALIASES = {
    "Bulloch": {"Bay": "6"},
    "Carroll": {"UWG": "714A4"},
    "Colquitt": {"Lee": "0015"},
    "Glynn": {"BAL": "304BAL", "BLY": "102BLY", "JI": "104JI"},
    "Hart": {"Bio": "8"},
    "Lee": {"CJC": "3"},
    "Lowndes": {"VSU": "013"},
    "Monroe": {"Cox": "5"},
    "Wayne": {"VFW": "4A"},
}


def english(labels):
    return next(label["text"] for label in labels if label["languageId"] == "en")


def key(value):
    normalized = re.sub(r"[^A-Z0-9]", "", value.upper())
    return str(int(normalized)) if normalized.isdecimal() else normalized


def polygon_parts(geometry):
    if geometry.geom_type == "Polygon":
        return [geometry]
    return [p for child in getattr(geometry, "geoms", ()) for p in polygon_parts(child)]


def read_geojson(path):
    raw = path.read_bytes()
    data = json.loads(gzip.decompress(raw) if raw.startswith(b"\x1f\x8b") else raw)
    if data["type"] != "FeatureCollection" or data.get("exceededTransferLimit"):
        raise ValueError(f"Incomplete precinct boundaries in {path}")
    return data["features"]


def chatham_key(name):
    match = re.fullmatch(r"(\d+)-(\d+)\s*C", name.strip().upper())
    return f"{int(match[1])}-{int(match[2])}C" if match else key(name)


def load_boundaries(path, chatham_path, fulton_path):
    counties = defaultdict(list)

    def append(county, name, code, feature, vote_pair=None):
        polygons = polygon_parts(make_valid(shape(feature["geometry"])))
        geometry = set_precision(unary_union(polygons), .000001)
        if geometry.is_empty and vote_pair == (None, None):
            return
        if not county or geometry.is_empty or not geometry.is_valid:
            raise ValueError(f"Invalid boundary for {county} {name}")
        counties[county].append((code, vote_pair, {"type": "Feature", "properties": {"name": name},
                                                  "geometry": mapping(geometry)}))

    for feature in read_geojson(path):
        props = feature["properties"]
        county, name = props["c"], props["n"]
        if county not in {"CHATHAM", "FULTON"}:
            # The AJC's earlier vote pair only disambiguates duplicate names.
            # Displayed vote counts always come from the Secretary of State.
            append(key(county), name, key(name), feature, (props["x"], props["y"]))
    for feature in read_geojson(chatham_path):
        name = feature["properties"]["PRECODE"] or ""
        append("CHATHAM", name.strip() or "Unassigned area", chatham_key(name), feature)
    for feature in read_geojson(fulton_path):
        name = feature["properties"]["VoterDist"]
        append("FULTON", name, key(name), feature)
    return counties


def precinct_keys(county, name):
    if county == "Chatham":
        return (chatham_key(name),)
    alias = PRECINCT_ALIASES.get(county, {}).get(name, name)
    if county == "Newton":
        alias = re.sub(r"^\d+-", "", alias)
    elif county in {"Crawford", "Schley", "Seminole", "Taylor", "Spalding"}:
        alias = re.sub(r"^(?:District |Precinct |P)(?=\d+$)", "", alias)
    elif county == "Ware":
        alias = re.sub(r"^\d+[A-Z]?\s*-\s*", "", alias)
    elif county == "Toombs":
        alias = re.sub(r"\s+V\.P\.D\.$", "", alias)
    keys = (key(name), key(alias))
    if county == "Spalding":
        return (*keys, key(f"Precinct {alias}"))
    return keys


def senate(data):
    election = data["election"]
    race = data["ballotItemWithBreakdown"]
    if (election["electionDate"] != "2026-11-03" or not election["isProduction"]
            or election["isPrimary"] or english(race["name"]) != "US Senate"):
        raise ValueError("Expected production November 2026 Senate results")
    return race


def precinct_rows(race):
    rows = []
    for part in race["breakdownResults"]:
        precinct = part["precinct"]
        candidates = []
        for candidate in part["ballotOptions"]:
            name = re.sub(r"(?:\s+\((?:I|Dem|Rep|Lib)\))+$", "", english(candidate["name"]))
            party = (candidate.get("party") or {}).get("abbreviation") or ""
            votes = candidate["voteCount"]
            if votes is not None and (type(votes) is not int or votes < 0):
                raise ValueError(f"Invalid vote count for {name}")
            candidates.append({"name": name, "party": PARTIES.get(party.upper(), "Other"), "votes": votes or 0})
        if sum(c["votes"] for c in candidates) != part["voteTotal"]:
            raise ValueError(f"Precinct vote counts do not reconcile for {precinct['id']}")
        rows.append({"key": precinct["id"], "name": english(precinct["name"]),
                     "total": part["voteTotal"], "virtual": precinct["isVirtual"], "candidates": candidates})
    return rows


def places(path):
    result = []
    with path.open(encoding="latin-1") as source:
        for record in csv.DictReader((line.rstrip() for line in source), delimiter="\t"):
            name = re.sub(r" (city|town|CDP|urban county|consolidated government)\b.*$", "", record["NAME"])
            area = float(record["ALAND_SQMI"])
            tier = 0 if name in MAJOR_CITIES else 1 if area >= 15 else 2 if area >= 5 else 3
            result.append({"id": record["GEOID"], "name": name,
                           "coordinates": [float(record["INTPTLONG"]), float(record["INTPTLAT"])],
                           "tier": tier, "minZoom": (1, 1.6, 3, 6)[tier]})
    return sorted(result, key=lambda place: (place["tier"], place["name"]))


def build(state_path, county_dir, boundary_path, places_path, chatham_path, fulton_path):
    state_data = json.loads(state_path.read_text())
    state_race = senate(state_data)
    jurisdictions = state_race["breakdownResults"]
    if len({j["locality"]["shortName"] for j in jurisdictions}) != 159 or len(jurisdictions) != 159:
        raise ValueError("Georgia Senate returns must cover all 159 counties")
    if sum(j["voteTotal"] for j in jurisdictions) != state_race["voteTotal"]:
        raise ValueError("County totals do not reconcile to the statewide total")
    boundaries = load_boundaries(boundary_path, chatham_path, fulton_path)
    counties, unfilled = [], []
    matched = reported = 0
    unallocated = {}
    unmatched = []
    for jurisdiction in jurisdictions:
        locality = jurisdiction["locality"]
        county = english(locality["name"]).removesuffix(" County")
        data = json.loads((county_dir / f"{locality['shortName']}.json").read_text())
        race = senate(data)
        if race["id"] != jurisdiction["parentBallotItemId"] or race["voteTotal"] != jurisdiction["voteTotal"]:
            raise ValueError(f"{county} report does not match the statewide feed")
        rows = precinct_rows(race)
        difference = race["voteTotal"] - sum(row["total"] for row in rows)
        if difference < 0:
            raise ValueError(f"Precinct totals exceed county totals in {county}")
        if difference:
            unallocated[county] = difference
        available = boundaries.pop(key(county))
        boundary_index = defaultdict(list)
        for i, (code, _, _) in enumerate(available):
            boundary_index[code].append(i)
        row_matches = {}
        for row in rows:
            if row.pop("virtual"):
                continue
            reported += 1
            matches = next((boundary_index[k] for k in precinct_keys(county, row["name"]) if boundary_index[k]), [])
            if len(matches) > 1:
                votes = {candidate["party"]: candidate["votes"] for candidate in row["candidates"]}
                matches = [i for i in matches if available[i][1] == (votes.get("D"), votes.get("R"))]
            if not matches and row["total"] == 0:
                report = (f"https://results.sos.ga.gov/results/public/{locality['shortName']}"
                          f"/elections/11032026GeneralAndSpecialElection/ballot-items/{race['id']}")
                unmatched.append({"county": county, "name": row["name"], "votes": 0, "source": report})
                continue
            if len(matches) != 1 or matches[0] in row_matches:
                raise ValueError(f"Missing or ambiguous boundary for {county} precinct {row['name']}")
            row_matches[matches[0]] = row
        county_features, county_rows = [], []
        for i, (_, _, feature) in enumerate(available):
            if i in row_matches:
                row = row_matches[i]
                feature["properties"]["key"] = row["key"]
                county_features.append(feature)
                county_rows.append(row)
            else:
                unfilled.append(feature)
        matched += len(county_rows)
        counties.append({"county": county, "features": county_features,
                         "races": [{"office": "senate", "rows": county_rows}]})
    if boundaries or matched + len(unmatched) != reported:
        raise ValueError("Unexpectedly incomplete Georgia precinct matches")
    return {"source": SOURCE, "geometrySource": BOUNDARIES,
            "countyGeometrySources": {"Chatham": CHATHAM_BOUNDARIES, "Fulton": FULTON_BOUNDARIES},
            "boundaryYear": 2026, "citySource": PLACES, "unmatchedPrecincts": unmatched,
            "asOf": state_data["election"]["asOf"], "official": state_data["election"]["isOfficialResults"],
            "matchedPrecincts": matched, "totalPrecincts": reported, "unallocatedCountyVotes": unallocated,
            "counties": counties, "unfilled": unfilled, "places": places(places_path)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("state_senate", "county_directory", "boundary_geojson", "gazetteer", "chatham_geojson", "fulton_geojson"):
        parser.add_argument(name, type=Path)
    args = parser.parse_args()
    result = build(args.state_senate, args.county_directory, args.boundary_geojson, args.gazetteer,
                   args.chatham_geojson, args.fulton_geojson)
    target = Path(__file__).with_name("georgia-precinct-results-2026-data.js")
    temporary = target.with_suffix(".tmp")
    temporary.write_text("window.GEORGIA_PRECINCT_RESULTS_2026 = " + json.dumps(result, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    print(f"{result['matchedPrecincts']:,} of {result['totalPrecincts']:,} precincts matched")


if __name__ == "__main__":
    main()

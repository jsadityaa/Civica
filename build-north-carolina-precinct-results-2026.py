#!/usr/bin/env python3
"""Build the North Carolina Senate precinct map from state election records.

The input directory contains results.zip from NCSBE's 2026 election results,
geo*.json pages from NC OneMap's Voting Precincts layer (WGS84), and
places.json from Census TIGERweb's incorporated places layer.
"""

import argparse
from collections import Counter, defaultdict
import csv
import io
import json
from pathlib import Path
import re
from zipfile import ZipFile

PARTIES = {"DEM": "D", "REP": "R", "LIB": "L", "GRE": "G"}
CANDIDATES = {"Roy Cooper", "Michael Whatley", "Shannon W. Bray", "Michael Dublin"}
MAJOR_CITIES = {
    "Asheville", "Charlotte", "Durham", "Fayetteville", "Greensboro", "Greenville",
    "Raleigh", "Wilmington", "Winston-Salem",
}
# The county Board of Elections identifies Carolina Village as a satellite
# polling site of Hendersonville 2 in its August 19, 2025 meeting minutes.
SATELLITE = ("HENDERSON", "CV")
PARENT = ("HENDERSON", "HV-2")


def precinct_results(archive_path):
    results = defaultdict(Counter)
    seen = set()
    with ZipFile(archive_path) as archive:
        data = archive.read("results_pct_20261103.txt").decode("utf-8-sig").replace("\x00", "")
    for row in csv.DictReader(io.StringIO(data), delimiter="\t"):
        if row["Contest Name"] != "US SENATE":
            continue
        if row["Election Date"] != "11/03/2026" or row["Contest Group ID"] != "1383":
            raise ValueError("Unexpected Senate contest")
        if row["Real Precinct"] != "Y":
            continue
        county = row["County"].strip().upper()
        code = row["Precinct"].strip().upper()
        candidate = (row["Choice"], PARTIES[row["Choice Party"]])
        entry = (county, code, candidate)
        votes = int(row["Total Votes"])
        methods = ("Election Day", "Early Voting", "Absentee by Mail", "Provisional")
        if entry in seen or votes < 0 or votes != sum(int(row[method]) for method in methods):
            raise ValueError(f"Invalid or duplicate precinct return: {entry}")
        seen.add(entry)
        results[county, code][candidate] = votes
    if len({county for county, _ in results}) != 100:
        raise ValueError("Expected returns from 100 counties")
    if any({name for name, _ in candidates} != CANDIDATES for candidates in results.values()):
        raise ValueError("A precinct has an unexpected candidate list")
    return results


def load_boundaries(directory):
    boundaries = {}
    for file in sorted(directory.glob("geo*.json")):
        for feature in json.loads(file.read_text())["features"]:
            props = feature["properties"]
            key = (props["county_nam"].strip().upper(), props["prec_id"].strip().upper())
            if key in boundaries or feature["geometry"]["type"] not in {"Polygon", "MultiPolygon"}:
                raise ValueError(f"Invalid or duplicate precinct boundary: {key}")
            name = props["enr_desc"].strip()
            if name.isupper():
                name = name.title()
            feature["properties"] = {"key": key[1], "name": name or key[1]}
            boundaries[key] = feature
    return boundaries


def place_labels(path):
    places = []
    for item in json.loads(path.read_text())["features"]:
        props = item["attributes"]
        name = re.sub(r" (city|town|village)$", "", props["NAME"])
        area = int(props["AREALAND"]) / 2_589_988
        tier = 0 if name in MAJOR_CITIES else 1 if area >= 15 else 2 if area >= 5 else 3
        places.append({
            "id": props["GEOID"], "name": name, "tier": tier, "minZoom": (1, 1.6, 3, 6)[tier],
            "coordinates": [float(props["INTPTLON"]), float(props["INTPTLAT"])],
        })
    return sorted(places, key=lambda place: (place["tier"], place["name"]))


def build(directory):
    returns = precinct_results(directory / "results.zip")
    boundaries = load_boundaries(directory)
    satellite_combined = SATELLITE in returns and SATELLITE not in boundaries
    if satellite_combined:
        if PARENT not in boundaries or PARENT not in returns:
            raise ValueError("The Carolina Village satellite requires Hendersonville 2")
        returns[PARENT].update(returns.pop(SATELLITE))
    if returns.keys() - boundaries.keys():
        raise ValueError(f"Missing precinct boundaries: {sorted(returns.keys() - boundaries.keys())}")

    counties = {}
    unfilled = []
    for (county, code), feature in sorted(boundaries.items()):
        votes = returns.get((county, code))
        if votes is None:
            unfilled.append(feature)
            continue
        name = feature["properties"]["name"]
        if satellite_combined and (county, code) == PARENT:
            name += " (includes Carolina Village)"
        entry = counties.setdefault(county, {"county": county.title(), "features": [],
                                             "races": [{"office": "senate", "rows": []}]})
        entry["features"].append(feature)
        entry["races"][0]["rows"].append({
            "key": code, "name": name, "total": sum(votes.values()),
            "candidates": [{"name": candidate, "party": party, "votes": count}
                           for (candidate, party), count in sorted(votes.items())],
        })
    coverage = f"{len(returns):,} precinct areas across {len(counties)} counties. "
    coverage += "Unofficial results. Votes reported only in countywide batches are excluded."
    if satellite_combined:
        coverage += " Hendersonville 2 includes Carolina Village."
    return {"counties": list(counties.values()), "unfilled": unfilled, "boundaryYear": 2026,
            "coverageNote": coverage, "places": place_labels(directory / "places.json")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("north-carolina-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.NORTH_CAROLINA_PRECINCT_RESULTS_2026=" +
                           json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(data["coverageNote"])

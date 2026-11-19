#!/usr/bin/env python3
"""Build the Iowa and Alaska Senate maps from downloaded boundaries and returns.

Inputs: IA24 and Precincts shapefiles (including their .prj files), TIGERweb
place exports, the Alaska precinct CSV, and verified Iowa precinct counts keyed
by the exact IA24 GEOID. Iowa records carry the source report URL.
"""
import argparse
from collections import defaultdict
import csv
import json
from pathlib import Path
import re

from pyproj import CRS, Transformer
import shapefile
from shapely import union_all
from shapely.geometry import mapping, shape
from shapely.ops import transform

ALASKA_CANDIDATES = {
    "524": ("Gerald L. Heikes", "R"),
    "525": ("Mary Peltola", "D"),
    "526": ("Daniel J. Sullivan Jr.", "NPA"),
    "527": ("Dan S. Sullivan", "R"),
}
IOWA_CANDIDATES = [("Ashley Hinson", "R"), ("Josh Turek", "D"),
                   ("Thomas Laehn", "L"), ("Write-In", "W")]
MAJOR = {
    "iowa": {"Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City",
             "Waterloo", "Ames", "Dubuque", "Council Bluffs", "Fort Dodge",
             "Mason City", "Ottumwa", "Burlington", "Spencer"},
    "alaska": {"Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Kodiak",
               "Bethel", "Nome", "Utqiaġvik", "Unalaska", "Cold Bay", "Adak"},
}


def rounded(value):
    if isinstance(value, (list, tuple)):
        return [rounded(item) for item in value]
    return round(value, 6)


def outlines(path):
    crs = CRS.from_wkt(path.with_suffix(".prj").read_text())
    project = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)
    with shapefile.Reader(str(path)) as source:
        for record in source.iterShapeRecords():
            geometry = shape(record.shape.__geo_interface__).simplify(35 if crs.is_projected else .0003)
            if geometry.is_empty or geometry.geom_type not in {"Polygon", "MultiPolygon"}:
                raise ValueError(f"Invalid outline: {record.record}")
            geometry = mapping(transform(project.transform, geometry))
            geometry["coordinates"] = rounded(geometry["coordinates"])
            yield record.record.as_dict(), geometry


def city_labels(state, paths):
    places = {}
    for path in paths:
        for feature in json.loads(path.read_bytes())["features"]:
            row = feature["attributes"]
            name = re.sub(r" (?:city and borough|municipality|city|CDP|CBD)$", "", row["NAME"], flags=re.I)
            area = int(row["AREALAND"])
            tier = 0 if name in MAJOR[state] else 1 if area >= 20_000_000 else 2 if area >= 3_000_000 else 3
            places[row["GEOID"]] = {"id": row["GEOID"], "name": name, "tier": tier,
                                    "minZoom": (1, 2.5, 5, 10)[tier], "area": area,
                                    "coordinates": [float(row["INTPTLON"]), float(row["INTPTLAT"])]}
    return sorted(places.values(), key=lambda place: (place["tier"], -place["area"], place["name"]))


def candidates(labels, counts):
    if len(labels) != len(counts) or any(type(count) is not int or count < 0 for count in counts):
        raise ValueError(f"Invalid candidate counts: {counts}")
    return [{"name": name, "party": party, "votes": count}
            for (name, party), count in zip(labels, counts)]


def alaska(path, csv_path):
    records = defaultdict(dict)
    with csv_path.open(encoding="utf-8-sig", newline="") as stream:
        for row in csv.DictReader(stream):
            if row["Contest_title"] != "U.S. Senator":
                continue
            key = row["Pct_Id"]
            if not re.fullmatch(r"(?:0[1-9]|[1-3][0-9]|40)-[0-9]{3}", key):
                continue
            candidate = row["candidate_id"]
            votes = int(row["total_votes"])
            if candidate in records[key] or votes != int(row["Election Day_votes"]):
                raise ValueError(f"Unexpected precinct return: {key}/{candidate}")
            records[key][candidate] = votes

    entries = []
    for row, geometry in outlines(path):
        key, name = row["Precinct_N"].split(" ", 1)
        counts = records.pop(key)
        if counts.keys() != ALASKA_CANDIDATES.keys():
            raise ValueError(f"Unexpected candidate IDs: {key}")
        entries.append((key, name, f"House District {row['HouseDistr']}", geometry,
                        candidates(ALASKA_CANDIDATES.values(), [counts[key] for key in ALASKA_CANDIDATES])))
    if records or len(entries) != 402:
        raise ValueError("Alaska precinct coverage changed")
    return entries


def iowa(path, returns):
    records = json.loads(returns.read_bytes())
    fragments = defaultdict(list)
    for row, geometry in outlines(path):
        fragments[row["GEOID"]].append(geometry)
    entries = []
    for key, pieces in fragments.items():
        fips, name = key.split("-", 1)
        geometry = pieces[0]
        if len(pieces) > 1:
            geometry = mapping(union_all([shape(piece) for piece in pieces], grid_size=.000001))
            geometry["coordinates"] = rounded(geometry["coordinates"])
        result = records.pop(key, None)
        if result and "geometry" in result:
            boundary = shape(result["geometry"]).simplify(.00015, preserve_topology=True)
            geometry = mapping(boundary)
            geometry["coordinates"] = rounded(geometry["coordinates"])
        county = result["county"] if result else fips
        entries.append((key, result["name"] if result else name, county, geometry,
                        candidates(IOWA_CANDIDATES, result["votes"]) if result else []))
    if records:
        raise ValueError(f"Unmapped Iowa result keys: {list(records)}")
    return entries


def build(entries, places, year, note, sources):
    counties = {}
    unfilled = []
    matched = 0
    seen = set()
    for key, name, county, geometry, choices in entries:
        if key in seen:
            raise ValueError(f"Duplicate geometry: {key}")
        seen.add(key)
        feature = {"type": "Feature", "geometry": geometry, "properties": {"key": key, "name": name}}
        total = sum(choice["votes"] for choice in choices)
        if not total:
            unfilled.append(feature)
            continue
        if county not in counties:
            counties[county] = {"county": county, "features": [], "races": [{"office": "senate", "rows": []}]}
        group = counties[county]
        group["features"].append(feature)
        group["races"][0]["rows"].append({"key": key, "name": name, "total": total, "candidates": choices})
        matched += 1
    return {"counties": list(counties.values()), "unfilled": unfilled, "places": places,
            "boundaryYear": year, "matchedPrecincts": matched, "totalPrecincts": len(entries),
            "coverageNote": note.format(matched=matched, total=len(entries)), "sources": sources}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).parent)
    args = parser.parse_args()
    root = args.inputs
    iowa_returns = root / "ia-returns.json"
    data = {
        "iowa": build(iowa(root / "ia/IA24", iowa_returns),
                      city_labels("iowa", [root / "ia-places.json"]), 2024,
                      "{matched:,} of {total:,} mapped precincts have matched 2026 returns from county auditors. Gray areas have no verified match. Lee County reports absentee votes separately.",
                      sorted({row[field] for row in json.loads(iowa_returns.read_bytes()).values()
                              for field in ("source", "boundarySource") if field in row}) +
                      ["https://github.com/21MetcalfJ/2024Precincts/tree/main/states/Iowa"]),
        "alaska": build(alaska(root / "ak/Precincts", root / "ak.csv"),
                        city_labels("alaska", [root / "ak-places.json", root / "ak-cdp-places.json"]), 2023,
                        "{matched:,} of {total:,} precincts have first-choice votes for listed candidates. Alaska reports absentee, early, and questioned ballots separately from these precinct totals.",
                        ["https://www.elections.alaska.gov/enr/26GENR/results/GA_ENR_Precinct_State_of_Alaska.csv",
                         "https://www.elections.alaska.gov/doc/maps/AK_Election_Precincts_2023Final.zip"]),
    }
    for state, payload in data.items():
        target = args.output / f"{state}-precinct-results-2026-data.js"
        target.write_text(f"window.{state.upper()}_PRECINCT_RESULTS_2026 = " +
                          json.dumps(payload, separators=(",", ":"), ensure_ascii=False) + ";\n")
        print(state, payload["coverageNote"])


if __name__ == "__main__":
    main()

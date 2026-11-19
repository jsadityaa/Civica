#!/usr/bin/env python3
"""Build Virginia's Senate map from the ELECT results export and precinct GIS.

Inputs: results.json (ELECT 2026 November General export), boundaries.json
(list of features from Districts_Union_Simplified layer 0), and places.json
(Census TIGERweb Virginia incorporated places).
"""

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re

from shapely import make_valid, union_all
from shapely.geometry import mapping, shape

CANDIDATES = {"cs290": ("Mark Warner", "D"), "cs291": ("Bert Mizusawa", "R"),
              "wi-cc142": ("Write-In", "W")}
CONTEST = "cc142"
MAJOR = {"Virginia Beach", "Richmond", "Norfolk", "Chesapeake", "Newport News",
         "Alexandria", "Hampton", "Roanoke", "Lynchburg", "Charlottesville",
         "Winchester", "Fredericksburg", "Danville", "Bristol", "Suffolk"}


def senate(report):
    contest = next(item for item in report["ballotItems"] if item["id"] == CONTEST)
    if contest["name"] != "Member, United States Senate":
        raise ValueError("Unexpected Senate contest")
    options = {option["id"]: option for option in contest["ballotOptions"]}
    if set(options) != set(CANDIDATES):
        raise ValueError(f"Unexpected candidates in {report['name']}")
    return options


def returns(path):
    data = json.loads(path.read_bytes())
    if data["electionDate"] != "2026-11-03" or data["electionName"] != "2026 November General":
        raise ValueError("Unexpected election")
    localities = {}
    totals = Counter()
    for locality in data["localResults"]:
        fips = locality["id"]
        if fips in localities:
            raise ValueError(f"Duplicate locality: {fips}")
        records = defaultdict(dict)
        for candidate, option in senate(locality).items():
            precinct_total = 0
            for row in option["precinctResults"]:
                votes = row["voteCount"]
                precinct_total += votes
                if votes < 0 or votes != sum(group["voteCount"] for group in row["groupResults"]):
                    raise ValueError(f"Invalid precinct count: {fips} / {row['name']}")
                if row["isVirtual"]:
                    continue
                name = re.sub(r"\s+\([\d,]+\)$", "", row["name"].strip())
                match = re.fullmatch(r"(\d+)(?:\s*-\s*|\s+)(.+)", name)
                if not match:
                    raise ValueError(f"Unexpected precinct name: {fips} / {name}")
                number = str(int(match[1]))
                if candidate in records[number]:
                    raise ValueError(f"Duplicate candidate count: {fips} / {number}")
                records[number][candidate] = (votes, match[2], row["reportingStatus"])
            if precinct_total != option["voteCount"]:
                raise ValueError(f"Precinct votes disagree with locality total: {fips} / {candidate}")
            totals[candidate] += precinct_total
        for number, choices in records.items():
            if choices.keys() != CANDIDATES.keys() or len({x[1] for x in choices.values()}) != 1:
                raise ValueError(f"Inconsistent precinct entries: {fips} / {number}")
        name = locality["name"].strip().title()
        localities[fips] = (name, records)
    if len(localities) != 133 or totals != {key: value["voteCount"] for key, value in senate(data["results"]).items()}:
        raise ValueError("Locality totals disagree with statewide results")
    return localities


def polygons(geometry):
    if geometry.geom_type == "Polygon" and geometry.area:
        yield geometry
    elif geometry.geom_type in {"MultiPolygon", "GeometryCollection"}:
        for part in geometry.geoms:
            yield from polygons(part)


def outlines(path):
    pieces = defaultdict(list)
    names = {}
    for feature in json.loads(path.read_bytes()):
        props = feature["properties"]
        if not props["CountyFIPS"] or not props["PrcnctNum"] or not feature["geometry"]:
            continue
        key = props["CountyFIPS"], str(int(props["PrcnctNum"]))
        pieces[key].extend(polygons(make_valid(shape(feature["geometry"]))))
        names[key] = props["PrcnctName"]
    features = {}
    for key, fragments in pieces.items():
        dissolved = union_all(fragments, grid_size=.000001)
        if dissolved.geom_type not in {"Polygon", "MultiPolygon"} or dissolved.is_empty:
            raise ValueError(f"Missing polygon: {key}")
        features[key] = {"type": "Feature", "geometry": mapping(dissolved),
                         "properties": {"key": key[1], "name": names[key].title()}}
    return features


def places(path):
    labels = []
    for feature in json.loads(path.read_bytes())["features"]:
        props = feature["attributes"]
        name = re.sub(r" (city|town|village)$", "", props["NAME"])
        area = int(props["AREALAND"]) / 2_589_988
        tier = 0 if name in MAJOR else 1 if area >= 12 else 2 if area >= 4 else 3
        labels.append({"id": props["GEOID"], "name": name, "tier": tier,
                       "minZoom": (1, 1.6, 3, 6)[tier],
                       "coordinates": [float(props["INTPTLON"]), float(props["INTPTLAT"])]})
    return sorted(labels, key=lambda place: (place["tier"], place["name"]))


def build(directory):
    geometry = outlines(directory / "boundaries.json")
    localities = returns(directory / "results.json")
    counties = []
    partial = 0
    for fips, (locality, records) in sorted(localities.items(), key=lambda item: item[1][0]):
        features, rows = [], []
        for number, choices in sorted(records.items(), key=lambda item: int(item[0])):
            total = sum(choice[0] for choice in choices.values())
            if not total:
                continue
            feature = geometry.pop((fips, number), None)
            if feature is None:
                raise ValueError(f"Missing geometry: {locality} / {number}")
            partial += any(choice[2] == "Partially Reported" for choice in choices.values())
            name = f"{number} - {next(iter(choices.values()))[1].title()}"
            feature["properties"]["name"] = name
            features.append(feature)
            rows.append({"key": number, "name": name, "total": total,
                         "candidates": [{"name": CANDIDATES[key][0], "party": CANDIDATES[key][1], "votes": vote[0]}
                                        for key, vote in choices.items()]})
        counties.append({"county": locality, "features": features, "races": [{"office": "senate", "rows": rows}]})
    matched = sum(len(county["features"]) for county in counties)
    total = matched + len(geometry)
    coverage = (f"Unofficial returns for {matched:,} of {total:,} precincts in the state’s boundary layer. "
                f"{partial} precincts were partially reported. Gray outlines have no mapped votes.")
    return {"counties": counties, "unfilled": list(geometry.values()), "boundaryYear": 2026,
            "coverageNote": coverage, "places": places(directory / "places.json")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("virginia-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.VIRGINIA_PRECINCT_RESULTS_2026="
                           + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(data["coverageNote"])

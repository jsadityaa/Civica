#!/usr/bin/env python3
"""Build the Senate map from SC Votes Detail XML and official GIS exports.

Inputs in the source directory: statewide.zip (SC Votes Detail XML),
counties/<county>.xml (all 46 county Detail XML reports), geo-*.json
(SC RFA Voter_Precincts layer in WGS84), owings.json (Laurens County
PollingPlace layer 4, PCode 019, in WGS84), and places.txt (Census Gazetteer).
Requires Shapely for the Owings boundary split.
"""

import argparse
from collections import Counter, defaultdict
import csv
import json
from pathlib import Path
import re
import unicodedata
import xml.etree.ElementTree as ET
from zipfile import ZipFile

from shapely.geometry import mapping, shape

PARTIES = {"REP": "R", "DEM": "D", "LIB": "L", "CON": "C", "NON": "W"}
NON_GEOGRAPHIC = {"failsafe", "provisional", "failsafeprovisional", "failsafeprovisioal"}
MAJOR_CITIES = {"Charleston", "Columbia", "Florence", "Greenville", "Hilton Head Island",
                "Myrtle Beach", "Rock Hill", "Spartanburg", "Sumter", "Aiken"}
# The RFA layer uses county FIPS order. The reports use alphabetical names.
FIPS_ORDER = {"McCormick": "65", "Marion": "67", "Marlboro": "69"}
# County report spellings mapped to the corresponding official boundary name.
ALIASES = {
    "Calhoun": {"Murph Hill": "Murph Mill"},
    "Chester": {"Lando/Lansford": "Lando/Landsford"},
    "Chesterfield": {"Angelus-Cararrh": "Angelus-Catarrh", "Mt. Groghan": "Mt. Croghan"},
    "Edgefield": {"Trenton No. 1": "Trenton", "Merriweather No. 1": "Merriwether No. 1",
                  "Merriweather No. 2": "Merriwether No. 2"},
    "Fairfield": {"Woodard": "Woodward", "Dutchmans Creek": "Dutchman Creek"},
    "Florence": {f"Cowards No. {n}": f"Coward {n}" for n in (1, 2)},
    "Georgetown": {"Spring Gully": "Spring Gulley"},
    "Greenwood": {"Levi's Knoll": "Livi's Knoll"},
    "Hampton": {"Hampton Courthouse No. 1": "Hampton No. 1",
                "Hampton Courthouse No. 2": "Hampton No. 2", "Crocket-Miley": "Crocketville-Miley"},
    "Horry": {"Cresent": "Crescent", "Gallivants Ferry": "Galivants Ferry",
              "Jerigans X Roads": "Jernigans X Roads"},
    "Kershaw": {"Camden No. 2 & 3": "Camden No. 2", "Rabon’s X Roads": "Rabon’s Crossroads"},
    "Lancaster": {"Chesterfield Avenue": "Chesterfield Ave", "McIlwain": "McllWain"},
    "Lexington": {"Old Barnwell Road": "Old Barnwell Rd", "Pilgrim Chruch": "Pilgrim Church",
                  **{f"Cayce No. {n}": f"Cayce Ward No. {n}" for n in (1, 2, 3)}},
    "Marlboro": {"E Bennettsville": "East Bennettsville"},
    "Oconee": {"Long Creek": "Long Cree"},
    "Orangeburg": {f"{'Ornageburg' if n == 7 else 'Orangeburg'} WD {n}": f"Orangeburg Ward {n}"
                   for n in range(1, 11)},
    "Pickens": {"McAllister": "McAlister", "Lenhart": "Lenhardt"},
    "Spartanburg": {"Morningside Baptist": "Morningside", "Pacolet Elementary": "Pacolet Elementary School"},
    "Sumter": {"Oakland Plantation 1": "Oakland Plant 1", "Oakland Plantation 2": "Oakland Plant 2",
               "Green Swamp": "Green Swamp 1", "Bunrs-Downs": "Burns-Downs"},
    "Union": {"Monarch": "Monarch, Box 1"},
}


def key(name):
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]", "", re.sub(r"\bno\.?\s*(?=\d)", "", ascii_name))


def senate(report):
    date = report.findtext(".//ElectionDate")
    if date != "11/3/2026":
        raise ValueError(f"Unexpected election date: {date}")
    return next(contest for contest in report.iter("Contest")
                if " ".join(contest.attrib["text"].split()) == "U.S. Senate")


def load_boundaries(directory, counties):
    county_codes = {FIPS_ORDER.get(county, f"{2 * i + 1:02}"): county for i, county in enumerate(counties)}
    boundaries = defaultdict(dict)
    for file in sorted(directory.glob("geo-*.json")):
        for feature in json.loads(file.read_text())["features"]:
            fields = feature["properties"]
            county = county_codes[fields["CodeMapNum"].split("-")[1]]
            name = fields["PName"]
            county_features = boundaries[county]
            if key(name) in county_features:
                raise ValueError(f"Duplicate boundary: {county} / {name}")
            county_features[key(name)] = {"type": "Feature", "geometry": feature["geometry"],
                                          "properties": {"key": key(name), "name": name}}

    # The RFA geometry includes Owings inside Gray Court. The county GIS and
    # election report identify Owings as a separate precinct, so split the area.
    owings, = json.loads((directory / "owings.json").read_text())["features"]
    gray_court = boundaries["Laurens"]["graycourt"]
    gray_geometry = shape(gray_court["geometry"])
    owings_geometry = shape(owings["geometry"]).intersection(gray_geometry)
    if owings_geometry.is_empty:
        raise ValueError("Owings does not intersect the Gray Court boundary")
    gray_court["geometry"] = mapping(gray_geometry.difference(owings_geometry))
    boundaries["Laurens"]["owings"] = {"type": "Feature", "geometry": mapping(owings_geometry),
                                      "properties": {"key": "owings", "name": "Owings"}}
    return boundaries


def load_county(report, expected, county):
    if report.findtext(".//Region") != county:
        raise ValueError(f"Wrong county in {county} report")
    contest = senate(report)
    rows = defaultdict(list)
    found = set()
    for choice in contest.findall("Choice"):
        label = choice.attrib["text"]
        party = choice.attrib["party"]
        votes = Counter()
        for precinct in choice.findall("./VoteType/Precinct"):
            votes[precinct.attrib["name"]] += int(precinct.attrib["votes"])
        if sum(votes.values()) != int(choice.attrib["totalVotes"]) or sum(votes.values()) != expected[label]:
            raise ValueError(f"County totals disagree: {county} / {label}")
        found.add(label)
        for name, count in votes.items():
            if key(name) not in NON_GEOGRAPHIC:
                rows[name].append({"name": label.removeprefix(party + " "), "party": PARTIES[party], "votes": count})
    if found != set(expected) or len(rows) != int(contest.attrib["precinctsReported"]):
        raise ValueError(f"Incomplete county report: {county}")
    return rows


def places(file):
    result = []
    with file.open(encoding="latin-1") as source:
        for record in csv.DictReader((line.rstrip() for line in source), delimiter="\t"):
            name = re.sub(r" (city|town|CDP)\b.*$", "", record["NAME"])
            area = float(record["ALAND_SQMI"])
            tier = 0 if name in MAJOR_CITIES else 1 if area >= 15 else 2 if area >= 5 else 3
            result.append({"id": record["GEOID"], "name": name,
                           "coordinates": [float(record["INTPTLONG"]), float(record["INTPTLAT"])],
                           "tier": tier, "minZoom": (1, 1.6, 3, 6)[tier]})
    return sorted(result, key=lambda place: (place["tier"], place["name"]))


def build(directory):
    with ZipFile(directory / "statewide.zip") as archive:
        statewide = senate(ET.fromstring(archive.read("detail.xml")))
    expected = defaultdict(Counter)
    for choice in statewide.findall("Choice"):
        for county in choice.findall("./VoteType/County"):
            expected[county.attrib["name"]][choice.attrib["text"]] += int(county.attrib["votes"])
    if len(expected) != 46:
        raise ValueError("Expected 46 statewide county records")
    boundaries = load_boundaries(directory, sorted(expected))
    counties, unfilled = [], []
    for county in sorted(expected):
        report = ET.parse(directory / "counties" / f"{county}.xml")
        aliases = {key(original): key(mapped) for original, mapped in ALIASES.get(county, {}).items()}
        available = boundaries[county]
        rows, features = [], []
        for name, candidates in load_county(report, expected[county], county).items():
            name_key = key(name)
            boundary = available.pop(aliases.get(name_key, name_key), None)
            if boundary is None:
                raise ValueError(f"No unique boundary for {county} / {name}")
            rows.append({"key": boundary["properties"]["key"], "name": boundary["properties"]["name"],
                         "total": sum(candidate["votes"] for candidate in candidates), "candidates": candidates})
            features.append(boundary)
        counties.append({"county": county, "features": features, "races": [{"office": "senate", "rows": rows}]})
        unfilled.extend(available.values())
    matched = sum(len(county["features"]) for county in counties)
    reported = int(statewide.attrib["precinctsReported"])
    if matched != reported:
        raise ValueError(f"Expected {reported} matched precincts, found {matched}")
    total = matched + len(unfilled)
    return {"boundaryYear": 2026, "matchedPrecincts": matched, "totalPrecincts": total,
            "coverageNote": f"Results are recorded for {matched:,} of {total:,} precincts. "
                            "Gray outlines show precincts without matched returns.",
            "counties": counties, "unfilled": unfilled, "places": places(directory / "places.txt")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("south-carolina-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.SOUTH_CAROLINA_PRECINCT_RESULTS_2026=" +
                           json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")

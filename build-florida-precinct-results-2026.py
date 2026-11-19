#!/usr/bin/env python3
"""Join Nov. 3 Florida county Senate reports to county GIS and 2024 reference outlines.

Inputs: county Voter Focus precinct/summary CSV pairs (CODE-pct.csv and
CODE-summary.csv) or HTML pairs (CODE-senate.html and CODE-senate-summary.html),
Duval Senate precinct and summary pages, Broward results
page, 2024Precincts FL24.zip, county GIS GeoJSON, and Census places JSON.
"""

import argparse
from collections import Counter, defaultdict
import csv
from html import unescape
import json
from pathlib import Path
import re

import shapefile
from bs4 import BeautifulSoup
from shapely.geometry import mapping, shape

CANDIDATES = {"ashley moody": ("Ashley Moody", "R"), "angie nixon": ("Angie Nixon", "D"),
              "neil j. gillespie": ("Neil J. Gillespie", "NPA")}
CONTEST = re.compile(r"(?:United States|U\.?\s*S\.?) Senat(?:or|e)(?: District \d+)?", re.I)
MAJOR = {"Jacksonville", "Miami", "Tallahassee", "Tampa", "Orlando", "St. Petersburg",
         "Pensacola", "Fort Myers", "West Palm Beach", "Key West", "Gainesville",
         "Sarasota", "Fort Lauderdale", "Naples", "Panama City", "Daytona Beach"}
# County election offices publish these precinct numbers beside the polling places.
POLLING_PLACE_IDS = {
    "GUL": {name: str(i) for i, name in enumerate((
        "Honeyville Community Center", "Wewahitchka Public Library", "St. Joe Beach Fire Station",
        "Port St Joe Fire Station", "Centennial Building", "White City Fire Station",
        "Cape San Blas Fire Station", "Howard Creek Fire Station", "Overstreet Fire Station",
        "Highland View Fire Station"), 1)},
    "LIB": {name: str(i) for i, name in enumerate((
        "Rock Bluff", "Annex", "Bristol", "Lake Mystic", "Hosford", "Telogia", "Sumatra", "Orange"), 1)},
    "UNI": {"SREC Building 3C": "3C", "SREC Building 4A & 4C": "4A",
            "Providence Community Center 4B": "4B", "Palestine Fire Station 5B": "5B"},
}
# Washington's reference layer uses polling-place names, with three misleading
# "0001" prefixes. Match those places by name before joining to the 2026 IDs.
WASHINGTON_OUTLINES = {name: str(i) for i, name in enumerate((
    "Caryville", "Five Points", "Hinson Crossroads", "First Baptist Church - Chipley",
    "Vernon City Hall", "New Hope - Campbells Park", "Orange Hill Fire Station",
    "Armory - Chipley", "Wausau", "0001-Ebro Town Hall", "0001-Greenhead", "0001-Sunny Hills"), 1)}


def precinct_id(value):
    value = re.sub(r"^(?:PCT|PRECINCT|PRECICNT)\s*", "", str(value).strip().upper())
    match = re.match(r"^([A-Z]?)(\d+)([A-Z]?)(?:\.(\d+))?(?=$|[ -])", value)
    if not match:
        return value
    prefix, number, suffix, decimal = match.groups()
    return f"{prefix}{int(number)}{suffix}" + (f".{int(decimal)}" if decimal and int(decimal) else "")


def label(value):
    value = re.sub(r"^(REP|DEM|NPA)\s+|\s+-\s+(REP|DEM|NPA)$", "", value.strip(), flags=re.I)
    return CANDIDATES.get(value.lower())


def csv_results(path):
    with path.open(encoding="utf-8-sig", newline="") as file:
        for row in csv.DictReader(file):
            if CONTEST.fullmatch(row["Contest"].strip()) and (person := label(row["Candidate Issue"])):
                yield row.get("Precinct Name", ""), person, int(row["Total Votes"].replace(",", ""))


def checked_rows(records, expected):
    rows = defaultdict(Counter)
    totals = Counter()
    for name, person, votes in records:
        if person in rows[name] or votes < 0:
            raise ValueError(f"Duplicate or invalid count: {name} / {person}")
        rows[name][person] = votes
        totals[person] += votes
    if set(expected) != set(CANDIDATES.values()) or totals != expected or not sum(totals.values()):
        raise ValueError(f"Precinct totals {dict(totals)} differ from summary {dict(expected)}")
    if any(set(votes) != set(expected) for votes in rows.values()):
        raise ValueError("Missing candidate rows")
    return rows


def html_results(detail_path, summary_path):
    precincts = detail_path.read_text()
    summary = summary_path.read_text()
    if any("11/3/2026" not in page for page in (precincts, summary)):
        raise ValueError(f"Unexpected election: {detail_path}")
    table_rows = re.compile(
        r'<td class="ChoiceColumn">\s*([^<]+?)\s*\((REP|DEM|NPA|NON)\).*?'
        r'<td class="DetailResultsColumn notranslate TotalVotes">([\d,]+)</td>', re.S
    )
    def choices(section):
        entries = [(name, count) for name, _, count in table_rows.findall(section)]
        if not entries:
            for row in BeautifulSoup(section, "html.parser").select(".ResultsRow"):
                choice = row.select_one(".ChoiceColumn")
                values = row.select(".ResultsColumn")
                if choice and values:
                    name = re.sub(r"\s+\((REP|DEM|NPA|NON)\)$", "", choice.get_text(" ", strip=True))
                    entries.append((name, values[-1].get_text(strip=True)))
        for name, count in entries:
            person = label(unescape(name))
            if person is None:
                raise ValueError(f"Unexpected candidate {name}: {detail_path}")
            yield person, int(count.replace(",", ""))

    sections = re.split(r'<span class="PrecinctName">([^<]+)</span>', precincts)[1:]
    records = [(unescape(name), person, count)
               for name, section in zip(sections[::2], sections[1::2])
               for person, count in choices(section)]
    contest = re.split(r"<label>(?:United States|U\.?\s*S\.?) Senat(?:or|e)</label>", summary,
                       maxsplit=1, flags=re.I)[1].split('class="Race row"', 1)[0]
    expected = Counter(dict(choices(contest)))
    return checked_rows(records, expected)


def broward(path):
    page = path.read_text()
    if "November 3, 2026 General Election" not in page:
        raise ValueError("Unexpected Broward election")
    precincts = re.findall(
        r'aria-label="Precinct: ([A-Z0-9]+) - Contest: United States Senator".*?<tbody>(.*?)</tbody>',
        page, re.S,
    )
    candidates = re.compile(
        r'aria-hidden="true">((?:REP|DEM|NPA) [^<]+)</span>.*?data-label="Total">([\d,]+)</td>',
        re.S,
    )
    records = [(name, label(candidate), int(count.replace(",", "")))
               for name, table in precincts for candidate, count in candidates.findall(table)]
    summary = re.search(r"\[\['REP Ashley Moody', [^\r\n]+", page)[0]
    expected = Counter({label(name): int(count)
                        for name, count in re.findall(r"\['([^']+)',(?: \d+,){4} (\d+)\]", summary)})
    return checked_rows(records, expected)


def precinct_features(directory):
    outlines = defaultdict(dict)
    names = {}
    with shapefile.Reader(str(directory / "fl24.zip")) as boundaries:
        for item in boundaries.iterShapeRecords(fields=["UNIQUE_ID", "Florida_20"]):
            county, identifier = item.record["UNIQUE_ID"].split("-", 1)
            names[county] = {"PAL": "Palm Beach", "HER": "Hernando"}.get(county, item.record["Florida_20"])
            key = WASHINGTON_OUTLINES[identifier] if county == "WAS" else precinct_id(identifier)
            outlines[county][key] = (shape(item.shape.__geo_interface__), 2024)
    if len(outlines) != 67:
        raise ValueError("Expected Florida boundaries for all 67 counties")
    for county, field in {"DAD": "ID", "ORA": "Precinct", "PAL": "PRECINCT"}.items():
        data = json.loads((directory / f"{county}-geo.json").read_bytes())
        features = data["features"]
        updated = {precinct_id(f["properties"][field]): (shape(f["geometry"]), 2026) for f in features}
        if len(updated) != len(features) or data.get("exceededTransferLimit") or len(updated) < 200:
            raise ValueError(f"Incomplete or duplicate county GIS boundaries: {county}")
        outlines[county] = updated
    return names, outlines


def places(path):
    labels = []
    for row in json.loads(path.read_bytes())["features"]:
        props = row["attributes"]
        name = re.sub(r" (city|town|village)$", "", props["NAME"])
        area = int(props["AREALAND"]) / 2_589_988
        tier = 0 if name in MAJOR else 1 if area >= 16 else 2 if area >= 5 else 3
        labels.append({"id": props["GEOID"], "name": name, "tier": tier,
                       "minZoom": (1, 1.6, 3, 6)[tier],
                       "coordinates": [float(props["INTPTLON"]), float(props["INTPTLAT"])]})
    return sorted(labels, key=lambda place: (place["tier"], place["name"]))


def feature(identifier, polygon, year):
    return {"type": "Feature", "geometry": mapping(polygon.simplify(.00005, preserve_topology=True)),
            "properties": {"key": identifier, "name": f"Precinct {identifier}", "boundaryYear": year}}


def build(directory):
    names, outlines = precinct_features(directory)
    sources = {"BRO": broward(directory / "broward.html"),
               "DUV": html_results(directory / "duv-detail.html", directory / "duv-summary.html")}
    for path in sorted(directory.glob("*-pct.csv")):
        county = path.name.split("-", 1)[0]
        if county not in names or county in sources:
            continue
        expected = Counter({person: votes for _, person, votes in csv_results(directory / f"{county}-summary.csv")})
        records = list(csv_results(path))
        if not sum(votes for _, _, votes in records):
            print(f"Skipping precinct export with no vote totals: {county}")
            continue
        try:
            sources[county] = checked_rows(records, expected)
        except ValueError as error:
            raise ValueError(f"{county}: {error}") from error
    for detail in sorted(directory.glob("*-senate.html")):
        county = detail.name.split("-", 1)[0]
        if county in names and county not in sources:
            sources[county] = html_results(detail, directory / f"{county}-senate-summary.html")
    counties = []
    for county, records in sorted(sources.items(), key=lambda item: names[item[0]]):
        features, rows = [], []
        matched = set()
        for name, votes in records.items():
            if not sum(votes.values()):
                continue
            identifier = precinct_id(name)
            identifier = POLLING_PLACE_IDS.get(county, {}).get(name, identifier)
            if county == "BAK":
                identifier = precinct_id(name.split()[-1])
            if county in {"CAL", "SUW"} and re.search(r" - \d+$", name):
                identifier = precinct_id(name.rsplit(" - ", 1)[1])
            if identifier not in outlines[county]:
                print(f"Unmatched: {county} / {name} ({sum(votes.values()):,} votes)")
                continue
            if identifier in matched:
                raise ValueError(f"Ambiguous precinct match: {county} / {name}")
            matched.add(identifier)
            features.append(feature(identifier, *outlines[county][identifier]))
            rows.append({"key": identifier, "name": f"Precinct {identifier}", "total": sum(votes.values()),
                         "candidates": [{"name": person, "party": party, "votes": count}
                                        for (person, party), count in votes.items()]})
        if rows:
            for identifier in matched:
                del outlines[county][identifier]
            counties.append({"county": names[county], "features": features,
                             "races": [{"office": "senate", "rows": rows}]})
            print(f"{names[county]}: {len(rows):,} matched")
    unfilled = [feature(identifier, *values) for county in outlines.values() for identifier, values in county.items()]
    count = sum(len(county["features"]) for county in counties)
    coverage = (f"Returns for {count:,} precincts across {len(counties)} counties. "
                "Boundaries use county GIS where available and 2024 reference outlines elsewhere. "
                "Areas without matched returns are gray. Some returns are unofficial.")
    return {"counties": counties, "unfilled": unfilled, "boundaryYear": "2024–2026",
            "coverageNote": coverage, "places": places(directory / "places.json")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("florida-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.FLORIDA_PRECINCT_RESULTS_2026="
                           + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(data["coverageNote"])

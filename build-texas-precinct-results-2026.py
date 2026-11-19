#!/usr/bin/env python3
"""Build the Texas Senate precinct layer from county returns and TLC Precincts26P.

Input filenames match the county Clarity detail ZIPs, Harris results-by-ballot
and precinct JSON, county results PDFs, and Census TIGERweb place JSON.
For Nolan, transcribe the scanned precinct report to nolan.csv with columns
precinct, Paxton, Talarico, Brown, write-ins and total, without a header.
"""

import argparse
from collections import Counter, defaultdict
import csv
import json
from pathlib import Path
import re
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from pyproj import Transformer
from pypdfium2 import PdfDocument
import shapefile
from shapely.geometry import mapping, shape
from shapely.ops import transform

COUNTIES = {
    "Bexar": 29, "Caldwell": 55, "Collin": 85, "Dallas": 113, "Denton": 121,
    "El Paso": 141, "Fort Bend": 157, "Harris": 201, "Kerr": 265, "Liberty": 291,
    "Nacogdoches": 347, "Nolan": 353, "Tarrant": 439, "Travis": 453,
    "Uvalde": 463, "Williamson": 491,
}
PARTIES = {"REP": "R", "DEM": "D", "LIB": "L", "W": "W", "NON": "W", "": "W"}
TOP = (("Ken Paxton", "R"), ("James Talarico", "D"), ("Ted Brown", "L"))
WRITE_INS = ("Write-in", "W")
CANVASS_CHOICES = (*TOP, ("Avery Ayers", "W"), ('Bradford "Brad" Hall', "W"),
                   ("Jade Simmons", "W"), ("Zul Mohamed", "W"))
COUNTY_REPORTS = {
    "Caldwell": "https://www.co.caldwell.tx.us/upload/page/0213/docs/2026/November%203/pct%20by%20pct_unofficial%20results%2011032026.pdf",
    "Kerr": "https://legacy.co.kerr.tx.us/elections/results/2026-11-03/UnOfficial_Precinct_by_Precinct_Results-11-3-2026.pdf",
    "Nacogdoches": "https://www.nacogdochesco.gov/DocumentCenter/View/733/2026-11-03---Nacogdoches-County---General-Election---Canvass-Results-PDF",
    "Nolan": "https://www.co.nolan.tx.us/upload/page/0503/Official%20Precinct%20Summary%20Results%2011032026.pdf",
    "Uvalde": "https://www.uvaldecountyelections.com/_files/ugd/79e9bc_28c56ffba1164645b9cfdcb29b3819f7.pdf",
}
MAJOR_CITIES = {
    "Amarillo", "Austin", "Beaumont", "Brownsville", "Corpus Christi", "Dallas",
    "El Paso", "Fort Worth", "Houston", "Laredo", "Lubbock", "Midland",
    "San Antonio", "Tyler", "Waco", "Wichita Falls",
}


def candidate(name, party=""):
    name = re.sub(r"\s+\((REP|DEM|LIB|W)\)$", "", name.strip(), flags=re.I)
    if name.upper().startswith(party.upper() + " "):
        name = name[len(party) + 1:]
    if re.match(r"write[- ]in", name, re.I):
        return WRITE_INS
    if name.isupper():
        name = name.title()
    return name, PARTIES[party.upper()]


def clarity(path, county):
    with ZipFile(path) as archive:
        report = ET.fromstring(archive.read("detail.xml"))
    if report.findtext("ElectionDate") != "11/3/2026" or report.findtext("Region") != county:
        raise ValueError(f"Unexpected election report: {path}")
    contest = next(c for c in report.findall("Contest")
                   if re.fullmatch(r"(?:United States|U\.?\s*S\.?) Senator", c.get("text").strip(), re.I))
    rows = defaultdict(Counter)
    labels = set()
    for choice in contest.findall("Choice"):
        label = candidate(choice.get("text"), choice.get("party", ""))
        labels.add(label)
        total = 0
        for method in choice.findall("VoteType"):
            counts = [(precinct.get("name").strip(), int(precinct.get("votes")))
                      for precinct in method.findall("Precinct")]
            if sum(votes for _, votes in counts) != int(method.get("votes")):
                raise ValueError(f"Precinct vote sum disagrees: {county} / {label} / {method.get('name')}")
            for name, votes in counts:
                rows[name][label] += votes
                total += votes
        if total != int(choice.get("totalVotes")):
            raise ValueError(f"County vote sum disagrees: {county} / {label}")
    if not set(TOP) <= labels:
        raise ValueError(f"Unexpected candidates: {county}")
    return rows


def harris(directory):
    summary = json.loads((directory / "harris-ballot.json").read_bytes())
    data = json.loads((directory / "harris-senate.json").read_bytes())
    contest = next(c for c in summary["contests"] if c["t"] == "United States Senator")
    if summary["edt"] != "November 03, 2026" or data["i"] != contest["i"]:
        raise ValueError("Unexpected Harris election or contest")
    columns = [candidate(name, name.rsplit("(", 1)[-1].rstrip(")")) for name in contest["ca"]]
    if columns[:3] != list(TOP):
        raise ValueError("Unexpected Harris candidates")
    rows = {}
    for name, counts, total in zip(data["p"], data["v"], data["t"]):
        if len(counts) != len(columns) or sum(counts) != total or name in rows:
            raise ValueError(f"Unexpected Harris precinct: {name}")
        rows[name] = Counter(dict(zip(columns, counts)))
    if len(rows) != contest["tp"] or [sum(row[col] for row in rows.values()) for col in columns] != contest["tv"]:
        raise ValueError("Harris precinct returns disagree with county totals")
    return rows


def pdf_pages(path):
    with PdfDocument(path) as document:
        for page in document:
            content = page.get_textpage()
            text = content.get_text_bounded()
            page.close()
            yield text.replace("\r\n", "\n")


def collin(directory):
    columns = (*TOP, WRITE_INS)

    def contest_lines(path):
        for page in pdf_pages(path):
            if "\nUnited States Senator\n" not in page:
                continue
            if "\nNovember 3, 2026\n" not in page or "\nCOLLIN COUNTY\n" not in page:
                raise ValueError(f"Unexpected Collin election: {path}")
            before, section = page.split("\nUnited States Senator\n", 1)
            names = ["REP Ken Paxton", "DEM James Talarico", "LIB Ted Brown", "Write-In Totals", "Total Votes Cast"]
            counts = [int(re.search(r"^" + name + r" ([\d,]+)(?: |$)", section, re.M)[1].replace(",", ""))
                      for name in names]
            if sum(counts[:-1]) != counts[-1]:
                raise ValueError("Collin candidate totals disagree with votes cast")
            yield before, Counter(dict(zip(columns, counts[:-1])))

    rows = {}
    for header, votes in contest_lines(directory / "collin.pdf"):
        name = re.search(r"^(?:PCT )?(\d{3}|LB \d+|FPCA\b[^\n]*)$", header, re.M)
        if not name or name[1] in rows:
            raise ValueError(f"Unexpected Collin precinct header: {header}")
        rows[name[1]] = votes
    _, county_votes = next(contest_lines(directory / "collin-summary.pdf"))
    precinct_votes = {col: sum(row[col] for row in rows.values()) for col in columns}
    # The county released these reports at different times. Keep the precinct
    # report's counts and flag large discrepancies instead of allocating a gap.
    if any(abs(precinct_votes[col] - county_votes[col]) > county_votes[col] * .002
           for col in columns):
        raise ValueError("Collin precinct returns disagree with county totals")
    print(f"Collin report difference: {sum(county_votes.values()) - sum(precinct_votes.values()):,} votes")
    return rows


def liberty(path):
    columns = CANVASS_CHOICES
    rows = defaultdict(Counter)
    totals = Counter()
    labels = set()
    for page in pdf_pages(path):
        if "\nUnited States Senator\n" not in page:
            continue
        if not page.startswith("LIBERTY COUNTY, TEXAS\nGENERAL ELECTION\n11/3/2026\n"):
            raise ValueError("Unexpected Liberty election")
        header, body = page.split("Turnout Percentage\n", 1)
        if "KEN PAXTON, REPJAMES TALARICO, DEMTED BROWN, LIB" not in header:
            raise ValueError("Unexpected Liberty candidate order")
        for line in body.splitlines():
            match = re.fullmatch(r"(\d+ - BS\d+|Totals) ((?:[\d,]+ ){17})[\d.]+%", line)
            if not match or match[1] in labels:
                raise ValueError(f"Unexpected Liberty precinct row: {line}")
            labels.add(match[1])
            counts = [int(value.replace(",", "")) for value in match[2].split()]
            votes = Counter(dict(zip(columns, counts[:7])))
            if sum(votes.values()) != counts[7]:
                raise ValueError(f"Liberty candidate totals disagree: {match[1]}")
            if match[1] == "Totals":
                if totals != votes:
                    raise ValueError("Liberty precinct returns disagree with county totals")
                return rows
            totals.update(votes)
            rows[match[1].split(" - ")[0]].update(votes)
    raise ValueError("Missing Liberty totals")


def insert_report_row(rows, name, columns, values):
    counts = [int(value.replace(",", "")) for value in values]
    votes = Counter(dict(zip(columns, counts)))
    if sum(votes.values()) != counts[len(columns)] or name in rows:
        raise ValueError(f"Inconsistent or duplicate precinct row: {name}")
    rows[name] = votes


def check_report_totals(rows, county):
    total = rows.pop("Totals")
    combined = Counter()
    for votes in rows.values():
        combined.update(votes)
    if combined != total:
        raise ValueError(f"{county} precinct returns disagree with county totals")
    return rows


def caldwell(path):
    rows = {}
    for page in pdf_pages(path):
        if "\nUS Senator\n" not in page:
            continue
        if "November 3, 2026 Caldwell County" not in page:
            raise ValueError("Unexpected Caldwell election")
        header, body = page.split("Contest Total\n", 1)
        if "REP Ken\nPaxton\nDEM James\nTalarico\nLIB Ted Brown\nWrite-in Totals" not in header:
            raise ValueError("Unexpected Caldwell candidate order")
        pattern = r"(PCT \d+|Totals) ((?:[\d,]+ ){7}[\d,]+)"
        for name, values in re.findall(pattern, body):
            insert_report_row(rows, name.removeprefix("PCT "), (*TOP, WRITE_INS), values.split())
    return check_report_totals(rows, "Caldwell")


def kerr(path):
    rows = {}
    for page in pdf_pages(path):
        if "\nUnited States Senator\n" not in page:
            continue
        if "KERR COUNTY, TEXAS\nGENERAL ELECTION\n11/3/2026\n" not in page:
            raise ValueError("Unexpected Kerr election")
        key = re.match(r"^(\d+) ", page)[1]
        _, body = page.split("\nUnited States Senator\n", 1)
        candidates, total = body.split("\nCast Votes:", 1)
        votes = Counter()
        for name, code, total_votes in re.findall(
                r"^(.+?) (REP|DEM|LIB) (?:[\d,]+ [\d.]+% ){3}([\d,]+) [\d.]+%$",
                candidates, re.M):
            votes[candidate(name, code)] = int(total_votes.replace(",", ""))
        expected = int(total.splitlines()[0].split()[-2].replace(",", ""))
        if set(votes) != set(TOP) or sum(votes.values()) != expected or key in rows:
            raise ValueError(f"Unexpected Kerr precinct result: {key}")
        rows[key] = votes
    if len(rows) != 20:
        raise ValueError("Incomplete Kerr precinct report")
    return rows


def county_canvass(path, county):
    rows = {}
    for page in pdf_pages(path):
        header, separator, body = page.partition("Turnout Percentage\n" if county == "Uvalde"
                                                else "Voters\n")
        if not separator or "United States Senator" not in page:
            continue
        if f"{county.upper()} COUNTY, TEXAS\nGENERAL ELECTION\n11/3/2026\n" not in page:
            raise ValueError(f"Unexpected {county} election")
        if "KEN PAXTON, REPJAMES TALARICO, DEMTED BROWN, LIB" not in header:
            continue  # Some Nacogdoches pages contain only the turnout column.
        for line in body.splitlines():
            match = re.fullmatch(r"(\d+(?: - [A-Z]+\d*)?|Totals) ((?:[\d,]+ ){7}[\d,]+) .+", line)
            if match:
                insert_report_row(rows, match[1], CANVASS_CHOICES, match[2].split())
    return check_report_totals(rows, county)


def nolan(path):
    rows = {}
    columns = (*TOP, WRITE_INS)
    with path.open(newline="") as report:
        for name, *values in csv.reader(report):
            if len(values) != 5 or not all(value.isdecimal() for value in values):
                raise ValueError(f"Invalid Nolan precinct row: {name}")
            insert_report_row(rows, name, columns, values)
    if set(rows) != {str(number) for number in range(1, 10)}:
        raise ValueError("Incomplete Nolan precinct report")
    # The November 9 county canvass summary reports these candidate totals.
    insert_report_row(rows, "Totals", columns, ["2511", "1048", "160", "16", "3735"])
    return check_report_totals(rows, "Nolan")


def precinct_id(county, name):
    # Dallas reports ballot-style fragments. Tarrant's county precinct report
    # rolls its limited and federal ballot rows into the numbered home precinct.
    if county == "Dallas" and re.fullmatch(r"\d+-\d+", name):
        name = name.split("-")[0]
    if county == "Tarrant" and re.fullmatch(r"\d+ - (?:L\d+|F99|FSS|FSC)", name):
        name = name.split(" - ")[0]
    if ((county == "Nacogdoches" and re.fullmatch(r"\d+ - [AB]", name))
            or (county == "Uvalde" and re.fullmatch(r"\d+ - CU\d*", name))):
        name = name.split(" - ")[0]
    return str(int(name)).zfill(4) if name.isdecimal() else name


def geometry(path):
    with ZipFile(path) as archive:
        crs = archive.read("Precincts26P.prj").decode()
    to_wgs84 = Transformer.from_crs(crs, "EPSG:4326", always_xy=True).transform
    by_county = defaultdict(dict)

    def rounded(value):
        if isinstance(value, (list, tuple)):
            return [rounded(part) for part in value]
        return round(value, 6)

    with shapefile.Reader(str(path)) as boundaries:
        for item in boundaries.iterShapeRecords():
            county, precinct = item.record["CNTY"], item.record["PREC"]
            identifier = precinct_id("", precinct)
            if identifier in by_county[county]:
                raise ValueError(f"Duplicate boundary: {county} / {precinct}")
            polygon = shape(item.shape.__geo_interface__).simplify(6, preserve_topology=True)
            geo = mapping(transform(to_wgs84, polygon))
            geo["coordinates"] = rounded(geo["coordinates"])
            by_county[county][identifier] = {"type": "Feature", "geometry": geo,
                                              "properties": {"key": identifier, "name": f"Precinct {precinct}"}}
    return by_county


def places(path):
    labels = []
    for row in json.loads(path.read_bytes())["features"]:
        props = row["attributes"]
        name = re.sub(r" (city|town|village)$", "", props["NAME"])
        area = int(props["AREALAND"]) / 2_589_988
        tier = 0 if name in MAJOR_CITIES else 1 if area >= 24 else 2 if area >= 6 else 3
        labels.append({"id": props["GEOID"], "name": name, "tier": tier,
                       "minZoom": (1, 1.6, 3, 6)[tier],
                       "coordinates": [float(props["INTPTLON"]), float(props["INTPTLAT"])]})
    return sorted(labels, key=lambda place: (place["tier"], place["name"]))


def build(directory):
    sources = {
        county: clarity(directory / f"{county.replace(' ', '_')}.zip", county)
        for county in COUNTIES if county not in {"Harris", "Collin", "Liberty", *COUNTY_REPORTS}
    }
    sources.update(Harris=harris(directory), Collin=collin(directory), Liberty=liberty(directory / "liberty.pdf"))
    sources.update(Caldwell=caldwell(directory / "caldwell.pdf"), Kerr=kerr(directory / "kerr.pdf"))
    sources["Nolan"] = nolan(directory / "nolan.csv")
    for county in ("Nacogdoches", "Uvalde"):
        sources[county] = county_canvass(directory / f"{county.lower()}.pdf", county)
    boundaries = geometry(directory / "precincts26p.zip")
    counties = []
    for county, fips in COUNTIES.items():
        precincts = defaultdict(Counter)
        for name, votes in sources[county].items():
            if sum(votes.values()):
                precincts[precinct_id(county, name)].update(votes)
        rows, features = [], []
        for identifier, votes in sorted(precincts.items()):
            feature = boundaries[fips].pop(identifier, None)
            if feature is None:
                print(f"Unmatched: {county} / {identifier} ({sum(votes.values()):,} votes)")
                continue
            features.append(feature)
            rows.append({"key": identifier, "name": feature["properties"]["name"], "total": sum(votes.values()),
                         "candidates": [{"name": name, "party": party, "votes": count}
                                        for (name, party), count in votes.items() if count]})
        if not rows:
            raise ValueError(f"No joined precinct returns: {county}")
        print(f"{county}: {len(rows):,} joined precincts")
        bundle = {"county": county, "features": features, "races": [{"office": "senate", "rows": rows}]}
        if county in COUNTY_REPORTS:
            bundle["source"] = COUNTY_REPORTS[county]
        counties.append(bundle)
    matched = sum(len(county["features"]) for county in counties)
    coverage = (f"Returns for {matched:,} precincts across {len(counties)} counties. "
                "Boundaries are from the 2026 primary and may differ from November boundaries. "
                "Areas without matched returns are gray. Some county returns are unofficial.")
    return {"counties": counties, "unfilled": [feature for county in boundaries.values() for feature in county.values()],
            "boundaryYear": "2026 primary", "coverageNote": coverage, "places": places(directory / "places.json")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("texas-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.TEXAS_PRECINCT_RESULTS_2026="
                           + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(data["coverageNote"])

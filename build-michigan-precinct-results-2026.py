#!/usr/bin/env python3
"""Join county-published 2026 U.S. Senate returns to Michigan's 2026 precinct GIS.

Inputs are State of Michigan VotingPrecinct GeoJSON pages, Census county and
place JSON, Branch, Ingham and Kent Enhanced Voting contest JSON, Oakland Clarity
detail ZIP, Wayne precinct workbooks, Washtenaw's Senate canvass HTML, and
Clinton, Montcalm and Ottawa canvass PDFs.
"""

import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

from bs4 import BeautifulSoup
from openpyxl import load_workbook
from pypdf import PdfReader

PARTIES = {"DEM": "D", "REP": "R", "LIB": "L", "UST": "UST", "GRN": "G", "GRE": "G",
           "NL": "NLP", "NLP": "NLP"}
MAJOR = {"Detroit", "Grand Rapids", "Ann Arbor", "Lansing", "Flint", "Saginaw",
         "Marquette", "Traverse City", "Kalamazoo", "Muskegon", "Bay City", "Sault Ste. Marie"}


def key(name):
    name = name.lower()
    name = re.sub(r"\b(?:charter )?(?:township|twp) of ([^,]+)", r"\1 township", name)
    name = re.sub(r"\bcharter township\b|\btwp\b", "township", name)
    name = re.sub(r"\b(?:city|village) of\b|\bthe\b", "", name)
    name = re.sub(r"\bcity(?=\s*,)", "", name)
    name = re.sub(r"\bdistrict\s+(?=\d)", "ward ", name)
    name = re.sub(r"\b(precinct|ward)\s*#?\s*0*(\d+)", r"\1\2", name)
    return re.sub(r"[^a-z0-9]", "", name)


def candidate(name, party):
    return (name.strip(), PARTIES.get(party.strip().upper(), "W"))


def enhanced(path):
    data = json.loads(path.read_text())
    race = data["ballotItemWithBreakdown"]
    if data["election"]["electionDate"] != "2026-11-03" or not data["election"]["isProduction"]:
        raise ValueError(f"Unexpected election: {path}")
    if race["name"][0]["text"] != "United States Senator":
        raise ValueError(f"Unexpected contest: {path}")
    if sum(row["voteTotal"] for row in race["breakdownResults"]) != race["voteTotal"]:
        raise ValueError(f"Incomplete precinct download: {path}")
    for row in race["breakdownResults"]:
        precinct = row["precinct"]
        if precinct["isVirtual"] or not row["voteTotal"]:
            continue
        votes = Counter()
        for option in row["ballotOptions"]:
            label = candidate(option["name"][0]["text"], (option.get("party") or {}).get("abbreviation") or "")
            votes[label] += option["voteCount"]
        if sum(votes.values()) != row["voteTotal"]:
            raise ValueError(f"Vote totals disagree: {precinct}")
        yield precinct["name"][0]["text"], votes


def clarity(path):
    with ZipFile(path) as archive:
        report = ET.fromstring(archive.read("detail.xml"))
    if report.findtext("ElectionDate") != "11/3/2026" or report.findtext("Region") != "Oakland":
        raise ValueError("Unexpected Oakland election report")
    contest = next(c for c in report.findall("Contest") if c.attrib["text"].strip() == "United States Senator")
    rows = defaultdict(Counter)
    for choice in contest.findall("Choice"):
        label = candidate(choice.attrib["text"], choice.get("party", ""))
        counts = Counter()
        for precinct in choice.findall("./VoteType/Precinct"):
            counts[precinct.attrib["name"]] += int(precinct.attrib["votes"])
        if sum(counts.values()) != int(choice.attrib["totalVotes"]):
            raise ValueError(f"Incomplete Oakland results for {label}")
        for name, votes in counts.items():
            rows[name][label] += votes
    return rows.items()


def wayne(path):
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        for sheet in workbook:
            rows = iter(sheet.values)
            next(rows)
            if not str(next(rows, ("",))[0]).startswith("United States Senator"):
                continue
            next(rows)
            header = next(rows)
            columns = {}
            for i, value in enumerate(header[5:], 5):
                if not value or value == "Total Votes":
                    continue
                name, _, party = value.partition("\n")
                columns[i] = candidate(name, party.strip().strip("()"))
            if ("Abdul El-Sayed", "D") not in columns.values() or ("Mike Rogers", "R") not in columns.values():
                raise ValueError(f"Unexpected Wayne contest: {path}")
            precinct = None
            for row in rows:
                label = str(row[0]).strip()
                if re.search(r"\bPrecinct\s+\d", label, re.I):
                    precinct = label
                elif label == "Total" and precinct:
                    votes = Counter({name: int(row[i] or 0) for i, name in columns.items()})
                    if sum(votes.values()) != int(row[header.index("Total Votes")] or 0):
                        raise ValueError(f"Wayne total disagrees: {precinct}")
                    yield precinct, votes
                    precinct = None
                elif label not in {"Early Voting", "Election Day", "Absentee", "Pre-Process Absentee"}:
                    precinct = None
            return
        raise ValueError(f"Missing Senate worksheet: {path}")
    finally:
        workbook.close()


def washtenaw(path):
    soup = BeautifulSoup(path.read_bytes(), "html.parser")
    table = next(t for t in soup.find_all("table") if t.find("th", string="PRECINCT NAME"))
    columns = []
    for th in table.find_all("th")[1:]:
        parts = th.get_text("\n", strip=True).splitlines()
        columns.append(candidate(parts[0], parts[1].strip("()") if len(parts) > 1 else ""))
    if columns[:2] != [("Abdul El-Sayed", "D"), ("Mike Rogers", "R")]:
        raise ValueError("Unexpected Washtenaw candidate list")
    totals = Counter()
    rows = []
    for tr in table.find_all("tr")[1:]:
        cells = tr.find_all("td")
        name = cells[0].get_text(strip=True)
        if name == "Totals":
            reported = [int(cell.get_text("\n", strip=True).splitlines()[0]) for cell in cells[1:]]
            if [totals[label] for label in columns] != reported:
                raise ValueError("Washtenaw precincts do not sum to reported totals")
            break
        counts = [int(cell.get_text(strip=True)) for cell in cells[1:]]
        votes = Counter(dict(zip(columns, counts)))
        totals.update(votes)
        rows.append((name, Counter({label: count for label, count in votes.items() if label[0] != "Rejected write-ins"})))
    return rows


def canvass_pdf(path, county):
    contest = "United States Senator - Vote for not more than 1"
    rows = defaultdict(Counter)
    totals = Counter()
    names = set()
    for page in PdfReader(path).pages:
        header, match, body = page.extract_text().partition(contest)
        if not match:
            continue
        if not header.startswith(f"{county} County, Michigan\nGeneral Election\n11/3/2026\n"):
            raise ValueError(f"Unexpected canvass date or county: {path}")
        headings, body = body.split("Turnout Percentage\n", 1)
        candidate_headings = headings.strip().splitlines()[1:]
        cast_index = candidate_headings.index("Cast Votes")
        columns = [candidate(*line.rsplit(", ", 1)) for line in candidate_headings[:cast_index]]
        if {("Abdul El-Sayed", "D"), ("Mike Rogers", "R")} - set(columns):
            raise ValueError(f"Unexpected canvass candidates: {path}")
        for record in re.findall(r"(.*?\d+\.\d+%)\s*", body, flags=re.S):
            fields = record.strip().splitlines()
            offset = len(candidate_headings) + 1
            name = " ".join(field.strip() for field in fields[:-offset])
            counts = [int(field.replace(",", "")) for field in fields[-offset:-1]]
            votes = Counter(dict(zip(columns, counts[:cast_index])))
            if not name or name in names or sum(votes.values()) != counts[cast_index]:
                raise ValueError(f"Unexpected canvass record: {county} / {name}")
            if name == "Totals":
                if totals != votes:
                    raise ValueError(f"Canvass precincts do not sum to reported totals: {path}")
                return rows.items()
            names.add(name)
            totals.update(votes)
            # Ottawa reports separate ballot styles within the same voting precinct.
            precinct = name.split(" - ", 1)[0] if county == "Ottawa" else name
            rows[precinct].update(votes)
    raise ValueError(f"Missing Senate canvass totals: {path}")


def city_labels(path):
    places = []
    for row in json.loads(path.read_text())["features"]:
        props = row["attributes"]
        name = re.sub(r" (city|village|town)$", "", props["NAME"])
        area = int(props["AREALAND"]) / 2_589_988
        tier = 0 if name in MAJOR else 1 if area >= 14 else 2 if area >= 5 else 3
        places.append({"id": props["GEOID"], "name": name, "tier": tier, "minZoom": (1, 1.6, 3, 6)[tier],
                       "coordinates": [float(props["INTPTLON"]), float(props["INTPTLAT"])]})
    return sorted(places, key=lambda place: (place["tier"], place["name"]))


def build(directory):
    county_names = {row["attributes"]["COUNTY"]: row["attributes"]["NAME"].removesuffix(" County")
                    for row in json.loads((directory / "counties.json").read_text())["features"]}
    geometry = defaultdict(list)
    for path in sorted(directory.glob("geo-*.json")):
        for feature in json.loads(path.read_text())["features"]:
            props = feature["properties"]
            county = county_names[props["CountyFIPS"]]
            name = props["PrecinctLongName"]
            identifier = props["PrecinctID"]
            feature["properties"] = {"name": name, "key": identifier}
            geometry[county, key(name)].append(feature)
    sources = {
        "Branch": enhanced(directory / "branch-senate.json"),
        "Clinton": canvass_pdf(directory / "clinton.pdf", "Clinton"),
        "Ingham": enhanced(directory / "ingham-senate.json"),
        "Kent": enhanced(directory / "kent-senate.json"),
        "Montcalm": canvass_pdf(directory / "montcalm.pdf", "Montcalm"),
        "Oakland": clarity(directory / "oakland.zip"),
        "Ottawa": canvass_pdf(directory / "ottawa.pdf", "Ottawa"),
        "Washtenaw": washtenaw(directory / "washtenaw-senate"),
        "Wayne": [*wayne(directory / "wayne.xlsx"), *wayne(directory / "wayne-vbs.xlsx")],
    }
    for county in ("Isabella", "Kalamazoo", "Monroe", "St. Clair"):
        report = directory / f"{county.lower().replace(' ', '').replace('.', '')}-senate.json"
        if report.is_file():
            sources[county] = enhanced(report)
    counties = []
    mapped = set()
    for county, records in sources.items():
        features, rows = [], []
        for name, votes in records:
            if not sum(votes.values()):
                continue
            lookup_name = name
            if county == "Isabella":
                lookup_name = lookup_name.replace("Mt. Pleasant", "Mount Pleasant")
            if county == "St. Clair":
                lookup_name = re.sub(r"^St\. Clair City, Ward \d+, ", "City of St. Clair, ", lookup_name)
            if county == "Branch" and name.startswith("City of Coldwater, Precinct "):
                ward = name.rsplit(" ", 1)[1]
                lookup_name = f"City of Coldwater, Ward {ward}, Precinct 1"
            if county == "Oakland":
                lookup_name = lookup_name.replace("Orchard Lake,", "Orchard Lake Village,")
                if lookup_name.startswith(("Pontiac,", "Rochester Hills,")):
                    plain = key(lookup_name)
                    geo = [f for (area, label), fragments in geometry.items()
                           if area == county and re.sub(r"ward\d+(?=precinct)", "", label) == plain
                           for f in fragments]
                else:
                    geo = geometry.get((county, key(lookup_name)), [])
            else:
                geo = geometry.get((county, key(lookup_name)), [])
            identifiers = {feature["properties"]["key"] for feature in geo}
            if len(identifiers) != 1:
                print(f"Unmatched: {county} / {name}")
                continue
            identifier, = identifiers
            if identifier in mapped:
                raise ValueError(f"Duplicate result match: {county} / {name}")
            mapped.add(identifier)
            features.extend(geo)
            rows.append({"name": name, "key": identifier, "total": sum(votes.values()),
                         "candidates": [{"name": label, "party": party, "votes": count}
                                        for (label, party), count in votes.items() if count]})
        counties.append({"county": county, "features": features, "races": [{"office": "senate", "rows": rows}]})
    unfilled = [feature for group in geometry.values() for feature in group
                if feature["properties"]["key"] not in mapped]
    coverage = f"Unofficial returns for {len(mapped):,} precincts across {len(counties)} counties. "
    coverage += "Areas without matched returns are gray. Combined counting-board votes appear only where assigned to a precinct."
    return {"counties": counties, "unfilled": unfilled, "boundaryYear": 2026,
            "coverageNote": coverage, "places": city_labels(directory / "places.json")}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("michigan-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.MICHIGAN_PRECINCT_RESULTS_2026=" +
                           json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(data["coverageNote"])

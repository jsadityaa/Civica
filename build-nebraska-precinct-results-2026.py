#!/usr/bin/env python3
"""Join Nebraska's six-year Senate precinct export to Census and county GIS.

The source directory contains results.xlsx from the statewide Senate contest's
Precinct Level export, Census TIGERweb census.json (2020 voting districts),
county.json (county FIPS), places.json (incorporated places), and county
GIS exports douglas.json, lancaster.json, sarpy.json, hall.json, madison.json,
and cass.json. NE24.zip is the Nebraska boundary archive from
https://github.com/21MetcalfJ/2024Precincts/tree/main/states/Nebraska.
"""

import argparse
from collections import defaultdict
import json
from pathlib import Path
import re

from openpyxl import load_workbook
from pyproj import Transformer
import shapefile
from shapely.geometry import mapping, shape
from shapely.ops import transform

CANDIDATES = (("Pete Ricketts", "R"), ("Mike Marvin", "LMN"), ("Robin Richards", "NWP"),
              ("Chuck Conboy", "AF"), ("Dan Osborn", "I"))
STATE_TOTALS = (378244, 16238, 19541, 9094, 331250)
COUNTY_LAYERS = {
    "Douglas": ("douglas", "ward_precinct"), "Lancaster": ("lancaster", "PRECINCT"),
    "Sarpy": ("sarpy", "NAME"), "Hall": ("hall", "ABDISTRICT"),
    "Madison": ("madison", "Precinct_N"), "Cass": ("cass", "NAME20"),
}
MAJOR_CITIES = {"Omaha", "Lincoln", "Grand Island", "Kearney", "Norfolk", "North Platte",
                "Scottsbluff", "Chadron", "Valentine", "McCook", "Fremont"}
# These counties use the more recent precinct boundaries compiled from county
# records for the 2024 election. Labels are compared to the 2026 returns below.
UPDATED_COUNTIES = {
    "Adams", "Antelope", "Box Butte", "Buffalo", "Butler", "Cherry", "Custer",
    "Dakota", "Dixon", "Fillmore", "Gage", "Gosper", "Harlan", "Holt", "Howard",
    "Kearney", "Keith", "Keya Paha", "Nemaha", "Nuckolls", "Otoe", "Perkins",
    "Phelps", "Platte", "Polk", "Saunders", "Seward", "Stanton", "Thayer",
    "Webster", "York",
}
UPDATED_NAMES = {
    "Adams": {"Wstbl/Hgh": "West Blue/Highland"},
    "Butler": {"Plum Creek-Richardson-Uly": "Plum Creek-Richardson-Ulysses"},
    "Dakota": {f"Ward {n} South Sioux City": f"SSC Ward {n}" for n in range(1, 6)},
    "Fillmore": {"City of Geneva": "Geneva City"},
    "Holt": {
        "Antelope Iowa & Verdigris": "Antelope, Iowa & Verdigris",
        "Atkinson Surronunding TWNSPS": "Atk & Surrounding Twps",
        "Chambers & Surrounding TWNSHPS": "Chmbrs/Surrounding Twps",
        "Emmet & Northeast TWNSHPS": "Emmet & Northeast Twps",
        "Ewing, Golden & Deloit TWNSHPS": "Ewing, Golden & Deloit",
        "Inman Township": "Inman Twp",
        "Stuart & Cleveland Townships": "Stuart & Cleveland Twps",
        "Grattan & Shields Townships": "Grattan & Shields Twps",
        **{f"Grattan-O'Neill Ward {n}": f"O'Neill Ward {n}" for n in ("I", "II", "III", "IV")},
    },
    "Howard": {"St. Paul Ward I": "St. Paul Ward 1", "St. Paul Ward II": "St. Paul Ward 2",
               "Cushing": "Spring Creek", "Farwell": "Posen", "Boelus": "Loup Fork"},
    "Otoe": {"So Branch": "South Branch"},
    "Perkins": {"District 1": "Precinct 1", "District 2": "Precinct 2"},
    "Phelps": {"Rockfall-Industry": "Rockfalls-Industry",
               **{f"Holdrege Ward {n}": f"Ward {n}" for n in range(1, 5)}},
    "Webster": {"Village of Bladen & Rural NW": "Bladen", "City of BH & Rural NE": "Blue Hill",
                "Village of Guide Rock & Rural": "Guide Rock",
                "City of RC & Rural Central Co.": "Red Cloud 1st", "City of RC & Rural SW": "Red Cloud 2nd"},
    "York": {"Morton-Arborville-Bradshaw-Loc": "MABL"},
}
# An explicit alias may include multiple older polygons for a single reporting precinct.
ALIASES = {
    "Banner": {"Precinct 1": ("Long Springs",)},
    "Boone": {"Cedar": ("Ceder",)},
    "Boyd": {"Butte/Basin/McCulley": ("Basin - McCulley - Butte",),
             "Lynch/Mullen/Bush/Bristow": ("Bristow - Mullen - Lynch - Bush",)},
    "Burt": {"Bell-Oak-Persh": ("BellCreek-Oakland-Pershing",), "Decatur-Quinn": ("Decatur-Quinbaugh",),
             "Lyons City": ("Lyons",), "Oakland I": ("Oakland City 1",), "Oakland II": ("Oakland City 2",),
             "Tekamah I": ("Tekamah 1",), "Tekamah II": ("Tekamah 2",)},
    "Clay": {"Harvard Cons": ("Harvard",), "SpringRanch/Fairfield 2nd Cons": ("Spring Ranch/Fairfield",),
             "Fairfield 1st": ("Fairfield",), "Clay Center City": ("Clay Center",), "LLLM": ("L.L.L.M. CONS",)},
    "Cuming": {"BCN": ("Bancroft, Cleveland & Neligh",), "BL": ("Beemer & Logan",),
               "SSGC": ("St. Charles Sherman Garfield & Cuming",), "BGW": ("Wisner, Blaine & Grant",),
               "West Point": ("West Point Ward 1 & 3", "West Point Ward 2")},
    "Dawson": {"Goth East": ("Gothenburg East",), "Goth West": ("Gothenburg West",),
               **{f"Lex {n}": (f"Lexington {n}",) for n in ("1st", "2nd", "3rd", "4th", "5th")}},
    "Cass": {"West Rock Bluff": ("West Rock Bluff", "Mount Pleasant"),
             "Weeping Water": ("North Weeping Water", "South Weeping Water"),
             **{f"Plattsmouth {ward} Ward": tuple(f"Plattsmouth {ward} Ward {part} Precinct"
                                                  for part in ("1st", "2nd"))
                for ward in ("1st", "2nd", "3rd", "4th")}},
    "Furnas": {"Arapahoe": ("Arapahoe", "Arapahoe North Ward", "Arapahoe South Ward"),
               "Cambridge": ("Cambridge", "Cambridge Ward 1", "Cambridge Ward 2", "Cambridge Ward 3")},
    "Knox": {"Bloomfield": ("001 Bloomfield Area",), "Crofton": ("002 Crofton Area",),
             "Creighton": ("003 Creighton Area",), "Lindy/Santee/Ctr": ("004 Center Area", "005 Lindy / Santee Area"),
             "Wausa": ("008 Wausa Area",), "Niobrara": ("006 Niobrara Area",), "Verdigre": ("007 Verdigre Area",)},
    "Scotts Bluff": {"Gering-Roubadeau": ("Gering", "Roubadeau"),
                    "Minatare I & II": ("Minitare 1 & 2",), "Mitchell (Rural)": ("Mitchell",),
                    "Mitchell I": ("Mitchell 1",), "Mitchell II": ("Mitchell 2",), "Morrill": ("Village of Morrill",),
                    **{f"Gering {roman}": (f"Gering {n}",)
                       for n, roman in enumerate(("I", "II", "III", "IV"), 1)}},
    "Dodge": {"City of North Bend": ("North Bend Village",), "City of Scribner": ("Scribner City",),
              "City of Hooper": ("Hooper City",), "Nickerson/Maple Twps": ("Maple-Nickerson",),
              "UN/CT/RG/PV Twps": ("Ridgely-Union-Cotterell Precinct- Pleasant Valley",)},
    "Frontier": {"Stockville Orafino Moorefield": ("Stockville",)},
    "Garfield": {"City of Burwell": ("Ward 1", "Ward 2"), "Rural Garfield Co.": ("Rural 1",)},
    "Greeley": {"Wolbach": ("Wolbach 2",)},
    "Hamilton": {f"W{i}": (f"Aurora Ward {i}",) for i in range(1, 4)},
    "Hooker": {"Hooker County": ("Hooker",)},
    "Jefferson": {"Plymouth Gibson": ("Ply-Gib",), "Lincoln Meridian Fairbury Rich": ("Lin-Mer-Fby-Rich",),
                  "Jefferson Pleasant Newton": ("Jeff-Pleas-New",),
                  **{f"Ward {n}": (f"Fairbury Ward {n}",) for n in range(1, 5)}},
    "Johnson": {"Nemaha I": ("Nemaha 1",), "Nemaha II": ("Nemaha 2",)},
    "Kimball": {"1st Ward": ("Kimball Ward 1",), "2nd Ward": ("Kimball Ward 2",)},
    "Logan": {"Logan County": ("Logan",)},
    "Madison": {"MG-J-T-G-H": ("MG-J-Tilden-G-H",), "BC City-BC": ("BC-Battle Creek",)},
    "Merrick": {f"Ward {n}": (f"Central City Ward {n}",) for n in (1, 2)},
    "Morrill": {"North Camp Clarke": ("North Campe Clarke",)},
    "Nance": {"Beav,Genoa,Ccreek,Pcreek": ("BGCP",), "Ctnwd,Lferry,Full,Wnew,Enew": ("CLFWE",),
              "Cedar,Tcreek,Sbranch": ("CTS",), "Fullerton": ("Fullerton Ward",),
              "Genoa": ("Genoa Ward 1", "Genoa Ward 2")},
    "Pierce": {"Osmond": ("Osmond Area",), "Plainview": ("Plainview Area",),
               "Pierce": ("Pierce Rural Area",), "South Branch": ("Hadar Area/South Branch",)},
    "Richardson": {"FC Rural/Ohio": ("Falls City Rural/Ohio",), "Franklin/Hrr/Spi": ("Franklin/Humboldt Rural/Speiser",),
                   "Humboldt I": ("Humboldt Ward 1",), "Humboldt II": ("Humboldt Ward 2",),
                   **{f"FC Ward {n}": (f"Falls City Ward {n}",) for n in range(1, 5)}},
    "Saline": {"C & B": ("C and B",), "Friend": ("Friend Ward 1", "Friend Ward 2"),
               "Wilber": ("Wilbur 1", "Wilbur 2"), "Western": ("Olive", "South Fork")},
    "Sheridan": {"Mirage Flats": ("Mirage",)},
    "Sherman": {f"{side} LC": (f"{side} Loup City",) for side in ("North", "Central", "South")},
    "Sioux": {"Sheep C": ("Sheep Creek",)},
    "Thurston": {"Bryan/Thayer/Pender": ("Bryan", "Thayer", "Pender"), "Flournoy/Merry/Perry": ("Flournoy/Merry", "Perry")},
    "Wayne": {"Strahan/Wilbur": ("Strahan/Wilber",),
              **{f"{word} Ward": (f"Wayne Ward {i}",) for i, word in enumerate(("First","Second","Third","Fourth"), 1)}},
    "Wheeler": {"Wheeler": ("Bartlett", "Ericson")},
}


def key(name):
    name = re.sub(r"\b(?:voting district|voting|precinct|precint|township|twps?|pct)\b", "", str(name).lower())
    result = re.sub(r"[^a-z0-9]", "", name)
    return str(int(result)) if result.isdigit() else result


def updated_label(county, name):
    if county == "Dixon" and name == "Ponca Township":
        return "Ponca Rural"
    if county in {"Box Butte", "Buffalo"}:
        match = re.match(r"^(?:Precinct )?(\d+)\b", name)
        return match[1] if match else name.split()[-1]
    if county in {"Adams", "Butler", "Dakota", "Holt"}:
        name = re.sub(r"^\d+\s+(?:-\s*)?", "", name)
    if county == "Stanton":
        name = name.split(" (", 1)[0]
    if county == "Howard":
        name = name.removeprefix("Village of ").removesuffix(" & Rural")
    return name


def boundary_keys(county, name):
    if county in UPDATED_COUNTIES:
        name = updated_label(county, name)
        return (key(UPDATED_NAMES.get(county, {}).get(name, name)),)
    # Normalize county-specific numbers and printed prefixes before joining.
    if county in {"Cedar", "Valley"}:
        if prefix := re.match(r"(?:PCT |Wp )?(\d+)\b", name, re.I):
            return (key(prefix[1]),)
    if county in {"Dawson", "Dodge", "Hamilton", "Hall"}:
        if county == "Hall":
            return (key(name.split()[0]),)
        name = re.sub(r"\s+\d{3}$", "", name)
    if county == "Dodge":
        name = name.replace("City of Fremont", "Fremont")
    if county == "Cass":
        name = re.sub(r"^\d+ - ", "", name)
    if county == "Dawes" and name.isdigit() and int(name) == 4:
        return (key(name), key("4C"))
    if county == "Furnas":
        name = name.removesuffix(" & Rural")
    if county == "Knox":
        name = name.split(" - ")[-1].removesuffix(" Area")
    if county == "Saunders" and (ward := re.fullmatch(r"(Wahoo|Ashland) Ward (\d+)", name, re.I)):
        name = f"{ward[1]} W{ward[2]}"
    if county == "Lincoln" and (number := re.match(r"\d+\.North Platte.* (\d+)$", name)):
        return (f"northplatte{int(number[1])}",)
    if county == "Colfax" and (number := re.search(r" (\d+)$", name)):
        return (key(number[1]),)
    if county == "Red Willow" and (pair := re.fullmatch(r"Ward (\d+) Precinct (\d+)", name)):
        name = f"W{pair[1]}P{pair[2]}"
    aliases = {key(label): targets for label, targets in ALIASES.get(county, {}).items()}
    return tuple(map(key, aliases.get(key(name), (name,))))


def read_features(directory, source):
    return json.loads((directory / f"{source}.json").read_text())["features"]


def load_boundaries(directory):
    county_names = {f["properties"]["COUNTY"]: f["properties"]["NAME"].removesuffix(" County")
                    for f in read_features(directory, "county")}
    boundaries = defaultdict(lambda: defaultdict(list))
    for feature in read_features(directory, "census"):
        props = feature["properties"]
        county = county_names[props["COUNTY"]]
        if county not in COUNTY_LAYERS and county not in UPDATED_COUNTIES:
            name = props["NAME"]
            identifier = key(name)
            if county == "Lincoln" and (number := re.fullmatch(r"w\d+p(\d+)", identifier)):
                identifier = f"northplatte{int(number[1])}"
            if county == "Valley" and (number := re.match(r"^Precinct (\d+)", name)):
                identifier = key(number[1])
            boundaries[county][identifier].append((name, feature["geometry"]))
    for county, (source, field) in COUNTY_LAYERS.items():
        for feature in read_features(directory, source):
            name = str(feature["properties"][field])
            boundaries[county][key(name)].append((name, feature["geometry"]))
    to_lonlat = Transformer.from_crs(3857, 4326, always_xy=True).transform
    with shapefile.Reader(str(directory / "NE24.zip")) as archive:
        for item in archive.iterShapeRecords():
            county, name = item.record["COUNTY"], item.record["PRECINCT"]
            if county not in UPDATED_COUNTIES:
                continue
            geometry = shape(item.shape.__geo_interface__).simplify(7, preserve_topology=True)
            geometry = mapping(transform(to_lonlat, geometry))
            boundaries[county][key(updated_label(county, name))].append((name, geometry))
    return boundaries


def load_votes(path):
    workbook = load_workbook(path, read_only=True, data_only=True)
    counties = {}
    state_total = [0] * len(CANDIDATES)
    for sheet in workbook:
        rows = list(sheet.values)
        if rows[0][0] != "2026 Unofficial General Election Results" or "6  Year Term" not in rows[6][0]:
            raise ValueError(f"Unexpected election or contest in {sheet.title}")
        if tuple(" ".join(n.split()) for n in rows[6][2:]) != tuple(n for n, _ in CANDIDATES):
            raise ValueError(f"Unexpected candidates in {sheet.title}")
        records = [(name, counts) for _, name, *counts in rows[7:] if name and name != "TOTALS"]
        totals = [sum(column) for column in zip(*(counts for _, counts in records))]
        if totals != list(rows[-1][2:]) or len(records) != len({name for name, _ in records}):
            raise ValueError(f"Invalid county totals or duplicate precincts in {sheet.title}")
        state_total = [a + b for a, b in zip(state_total, totals)]
        counties[sheet.title] = [(name, counts) for name, counts in records if name != "Countywide"]
    if len(counties) != 93 or sum(map(len, counties.values())) != 1322 or tuple(state_total) != STATE_TOTALS:
        raise ValueError("Precinct export does not match the November 12 statewide snapshot")
    return counties


def geometry_feature(geometry, name, identifier):
    return {"type": "Feature", "geometry": geometry, "properties": {"name": name, "key": identifier}}


def place_labels(directory):
    labels = []
    for feature in read_features(directory, "places"):
        props = feature["properties"]
        name = re.sub(r" (city|village|town)$", "", props["NAME"])
        area = int(props["AREALAND"]) / 2_589_988
        tier = 0 if name in MAJOR_CITIES else 1 if area >= 10 else 2 if area >= 3 else 3
        labels.append({"id": props["GEOID"], "name": name, "tier": tier, "minZoom": (1, 1.6, 3, 6)[tier],
                       "coordinates": [float(props["INTPTLON"]), float(props["INTPTLAT"])]})
    return sorted(labels, key=lambda place: (place["tier"], place["name"]))


def build(directory):
    ballots = load_votes(directory / "results.xlsx")
    boundaries = load_boundaries(directory)
    counties, unfilled = [], []
    for county, records in ballots.items():
        available = boundaries[county]
        requests = {name: boundary_keys(county, name) for name, _ in records}
        owners = defaultdict(set)
        for name, identifiers in requests.items():
            for identifier in identifiers:
                owners[identifier].add(name)
        features, rows = [], []
        for name, votes in records:
            identifiers = requests[name]
            if not all(available.get(i) and len(owners[i]) == 1 for i in identifiers):
                continue
            if any(len(available[i]) != 1 for i in identifiers) and county != "Lancaster":
                continue
            for identifier in identifiers:
                features.extend(geometry_feature(geometry, name, name) for _, geometry in available.pop(identifier))
            rows.append({"key": name, "name": name, "total": sum(votes),
                         "candidates": [{"name": candidate, "party": party, "votes": count}
                                        for (candidate, party), count in zip(CANDIDATES, votes)]})
        counties.append({"county": county, "features": features, "races": [{"office": "senate", "rows": rows}]})
        unfilled.extend(geometry_feature(geometry, f"{name} ({county} County)", identifier)
                        for identifier, parts in available.items() for name, geometry in parts)
    matched = sum(len(county["races"][0]["rows"]) for county in counties)
    if matched != 1322:
        raise ValueError(f"Expected 1,322 matched precincts, found {matched:,}")
    return {"counties": counties, "unfilled": unfilled, "places": place_labels(directory),
            "coverageNote": "All 1,322 reported precincts matched to available boundaries. "
                            "Results are unofficial.",
            "boundaryYear": "Available precinct", "matchedPrecincts": matched, "totalPrecincts": 1322}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_directory", type=Path)
    parser.add_argument("--output", type=Path, default=Path("nebraska-precinct-results-2026-data.js"))
    args = parser.parse_args()
    data = build(args.source_directory)
    args.output.write_text("window.NEBRASKA_PRECINCT_RESULTS_2026=" +
                           json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    print(data["coverageNote"])

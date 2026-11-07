"""Build progressive place labels from the Census Ohio Places Gazetteer.

No population estimates or election data are inferred. Major city coordinates
reuse the site's established state-map labels for consistent placement.
"""
import csv
import io
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_gaz_place_39.txt"
REGIONAL = set("Youngstown|Canton|Lorain|Elyria|Springfield|Lima|Mansfield|Newark|Zanesville|Sandusky|Chillicothe|Marietta|Portsmouth|Findlay|Lancaster|Delaware|Ashtabula|Steubenville|Athens|Oxford|Kent|Wooster|Xenia|Piqua|Sidney|Hamilton|Middletown|Bowling Green|Tiffin|Defiance|Marion|Bellefontaine|Cambridge|Warren|East Liverpool|New Philadelphia|Norwalk|Mount Vernon|Celina|Wilmington".split("|"))


def build():
    with urllib.request.urlopen(SOURCE, timeout=30) as response:
        content = response.read().decode("utf-8-sig")
    major_block = re.search(r"  Ohio: \[([\s\S]*?)\n  \]", (ROOT / "state-city-labels.js").read_text()).group(1)
    major = {name: [float(lon), float(lat)] for name, lon, lat in re.findall(r'name: "([^"]+)", coordinates: \[([-\d.]+), ([-\d.]+)\]', major_block)}
    places = []
    for row in csv.DictReader((line.strip() for line in io.StringIO(content)), delimiter="\t"):
        name = re.sub(r" (city|village|CDP)$", "", row["NAME"])
        kind = {"25": "city", "47": "village", "57": "CDP"}.get(row["LSAD"], "place")
        tier = 0 if name in major else 1 if name in REGIONAL else 2 if kind == "city" else 3 if kind == "village" else 4
        coordinates = major.get(name, [float(row["INTPTLONG"]), float(row["INTPTLAT"])])
        if not (-85 < coordinates[0] < -80 and 38 < coordinates[1] < 43):
            raise ValueError("Place outside Ohio bounds; output unchanged")
        places.append({"id": row["GEOID"], "name": name, "coordinates": coordinates, "tier": tier, "minZoom": [1, 1.5, 2.4, 5, 8][tier]})
    if len(places) < 1200 or len({p["id"] for p in places}) != len(places):
        raise ValueError("Incomplete or duplicate city labels; output unchanged")
    places.sort(key=lambda place: (place["tier"], place["name"], place["id"]))
    data = {"source": SOURCE, "majorCitySource": "state-city-labels.js", "places": places}
    (ROOT / "ohio-city-labels.js").write_text("// Census representative place coordinates; existing major-city positions retained.\nwindow.OHIO_CITY_LABELS = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"{len(places):,} Ohio place labels; {len(major)} major cities; five progressive zoom tiers")


if __name__ == "__main__":
    build()

"""Intersect detailed Census county/town geometry with current House boundaries.

Requires Shapely and pyshp. Geometry only: never estimates or allocates votes.
Inputs:
https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_500k.zip
https://www2.census.gov/programs-surveys/decennial/rdo/mapping-files/2027/120-congressional-district-befs/cd120.zip
Use the October 2026 corrected national BEF, including unchanged Missouri plans.
County membership comes from block assignments, not tiny geometric overlaps.
Connecticut retains town geography from house-town-geojson.js.
"""
import argparse
import csv
import io
import json
import zipfile
import shapefile
from pathlib import Path
from shapely import make_valid
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent


def read(name):
    return json.loads((ROOT / name).read_text().split(" = ", 1)[1].rstrip(";\n"))


def build():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--counties", required=True, help="Census cb_2025_us_county_500k.zip")
    parser.add_argument("--assignments", required=True, help="Census October 2026 corrected cd120.zip")
    args = parser.parse_args()
    membership = {}
    with zipfile.ZipFile(args.assignments) as archive:
        with archive.open("NationalCD120.txt") as stream:
            for row in csv.DictReader(io.TextIOWrapper(stream)):
                if row["CDFP"].isdigit():
                    membership.setdefault(row["STATEFP"] + row["CDFP"], set()).add(row["STATEFP"] + row["COUNTYFP"])
    by_state = {}
    with zipfile.ZipFile(args.counties) as archive:
        stem = next(n[:-4] for n in archive.namelist() if n.endswith(".shp"))
        reader = shapefile.Reader(**{ext: io.BytesIO(archive.read(stem + "." + ext)) for ext in ("shp", "shx", "dbf")})
        for record in reader.iterShapeRecords():
            properties = record.record.as_dict()
            by_state.setdefault(properties["STATEFP"], []).append((
                {"id": properties["GEOID"], "name": properties["NAME"]},
                make_valid(shape(record.shape.__geo_interface__))))

    by_state["09"] = [({"id": f["properties"]["GEOID"], "name": f["properties"]["NAME"]}, make_valid(shape(f["geometry"]))) for f in read("house-town-geojson.js")["CT"]["features"]]
    result = {}
    for district in read("house-2026-geojson.js")["features"]:
        geoid = district["properties"]["GEOID"]
        state = district["properties"]["STATE"]
        if geoid not in membership:
            raise ValueError("Missing official district assignment: " + geoid)
        boundary = make_valid(shape(district["geometry"]))
        parts = []
        for properties, county in by_state.get(state, []):
            # Town boundaries remain the map unit in Connecticut. Elsewhere,
            # authoritative block assignments exclude spurious county slivers.
            if state != "09" and properties["id"] not in membership[geoid]:
                continue
            if not county.intersects(boundary):
                continue
            clipped = make_valid(county.intersection(boundary))
            if clipped.is_empty or clipped.area < 1e-9:
                continue
            if clipped.geom_type == "GeometryCollection":
                clipped = unary_union([g for g in clipped.geoms if g.geom_type in ["Polygon", "MultiPolygon"]])
            if clipped.geom_type in ["Polygon", "MultiPolygon"]:
                parts.append({"type": "Feature", "properties": properties, "geometry": mapping(clipped)})
        result[geoid] = parts
    if len(result) != 435 or not all(result.values()):
        raise ValueError("Missing district geography; output unchanged")
    if {f["properties"]["id"] for f in result["4210"]} != {"42041", "42043", "42133"}:
        raise ValueError("Pennsylvania 10 county membership failed validation")
    target = ROOT / "district-county-geography-2026.js"
    temporary = target.with_suffix(".tmp")
    temporary.write_text("// Census 2025 1:500,000 county geometry; official corrected 120th Congress block assignments. No inferred votes.\nwindow.DISTRICT_COUNTY_GEOGRAPHY_2026 = " + json.dumps(result, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    print("435 districts; " + str(sum(len(parts) for parts in result.values())) + " clipped county/town parts")


if __name__ == "__main__":
    build()

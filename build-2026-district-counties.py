"""Intersect Census county/town geometry with the current House boundaries.

Requires Shapely. Geometry only: this never estimates or allocates votes.
"""
import json
from pathlib import Path
from shapely import make_valid
from shapely.geometry import shape, mapping
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent


def read(name):
    return json.loads((ROOT / name).read_text().split(" = ", 1)[1].rstrip(";\n"))


def build():
    topo = read("county-geography-2026.js")
    transform = topo.get("transform")
    cache = {}

    def arc(index):
        key = index if index >= 0 else ~index
        if key not in cache:
            x = y = 0
            coords = []
            for xx, yy in topo["arcs"][key]:
                if transform:
                    x += xx
                    y += yy
                    coords.append([x * transform["scale"][0] + transform["translate"][0], y * transform["scale"][1] + transform["translate"][1]])
                else:
                    coords.append([xx, yy])
            cache[key] = coords
        return cache[key] if index >= 0 else list(reversed(cache[key]))

    def ring(indices):
        out = []
        for index in indices:
            coordinates = arc(index)
            out.extend(coordinates if not out else coordinates[1:])
        if out and out[0] != out[-1]:
            out.append(out[0])
        return out

    def polygon(indices):
        rings = [ring(arc_indices) for arc_indices in indices]
        if not rings or len(rings[0]) < 4:
            return None
        return [r for r in rings if len(r) >= 4]

    by_state = {}
    for feature in topo["objects"]["counties"]["geometries"]:
        fips = str(feature["id"]).zfill(5)
        if feature["type"] == "MultiPolygon":
            coordinates = [p for p in (polygon(p) for p in feature["arcs"]) if p]
        else:
            coordinates = polygon(feature["arcs"])
        if not coordinates:
            continue
        geometry = make_valid(shape({"type": feature["type"], "coordinates": coordinates}))
        by_state.setdefault(fips[:2], []).append(({"id": fips, "name": feature.get("properties", {}).get("name", fips)}, geometry))

    by_state["09"] = [({"id": f["properties"]["GEOID"], "name": f["properties"]["NAME"]}, make_valid(shape(f["geometry"]))) for f in read("house-town-geojson.js")["CT"]["features"]]
    result = {}
    for district in read("house-2026-geojson.js")["features"]:
        boundary = make_valid(shape(district["geometry"]))
        parts = []
        for properties, county in by_state.get(district["properties"]["STATE"], []):
            if not county.intersects(boundary):
                continue
            clipped = make_valid(county.intersection(boundary))
            if clipped.is_empty or clipped.area < 1e-9:
                continue
            if clipped.geom_type == "GeometryCollection":
                clipped = unary_union([g for g in clipped.geoms if g.geom_type in ["Polygon", "MultiPolygon"]])
            if clipped.geom_type in ["Polygon", "MultiPolygon"]:
                parts.append({"type": "Feature", "properties": properties, "geometry": mapping(clipped)})
        result[district["properties"]["GEOID"]] = parts
    if len(result) != 435 or not all(result.values()):
        raise ValueError("Missing district geography; output unchanged")
    (ROOT / "district-county-geography-2026.js").write_text("// Census/us-atlas geographic intersections only. No inferred votes.\nwindow.DISTRICT_COUNTY_GEOGRAPHY_2026 = " + json.dumps(result, separators=(",", ":")) + ";\n")
    print("435 districts; " + str(sum(len(parts) for parts in result.values())) + " clipped county/town parts")


if __name__ == "__main__":
    build()

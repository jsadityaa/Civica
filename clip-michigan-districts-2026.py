"""Remove Great Lakes water territory from Michigan's displayed House districts.

Uses the same land outline as the national state map. Requires Shapely.
"""
import json
from pathlib import Path
from shapely import make_valid
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parent


def read(name):
    return json.loads((ROOT / name).read_text().split(" = ", 1)[1].rstrip(";\n"))


def build():
    topo = read("midterms-2026-states.js")
    transform = topo["transform"]

    def arc(index):
        x = y = 0
        points = []
        for dx, dy in topo["arcs"][index if index >= 0 else ~index]:
            x += dx
            y += dy
            points.append([x * transform["scale"][0] + transform["translate"][0],
                           y * transform["scale"][1] + transform["translate"][1]])
        return points if index >= 0 else points[::-1]

    def ring(indices):
        points = []
        for index in indices:
            part = arc(index)
            points.extend(part if not points else part[1:])
        if points[0] != points[-1]:
            points.append(points[0])
        return points

    state = next(g for g in topo["objects"]["states"]["geometries"] if str(g["id"]) == "26")
    polygons = state["arcs"] if state["type"] == "MultiPolygon" else [state["arcs"]]
    land = make_valid(shape({"type": "MultiPolygon", "coordinates": [[ring(r) for r in p] for p in polygons]}))
    data = read("house-2026-geojson.js")
    count = 0
    for feature in data["features"]:
        if feature["properties"]["STATE"] != "26":
            continue
        clipped = make_valid(shape(feature["geometry"])).intersection(land)
        if clipped.is_empty or clipped.geom_type not in ("Polygon", "MultiPolygon"):
            raise ValueError("Invalid Michigan district intersection; output unchanged")
        feature["geometry"] = mapping(clipped)
        count += 1
    if count != 13:
        raise ValueError("Expected 13 Michigan districts; output unchanged")
    (ROOT / "house-2026-geojson.js").write_text("window.HOUSE_2026_GEOJSON = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print("Clipped 13 Michigan districts to the state shoreline")


if __name__ == "__main__":
    build()

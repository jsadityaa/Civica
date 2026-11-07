"""Build a geometry-only statewide backdrop; exclude current Cuyahoga geography.

Usage: python3 build-ohio-unfilled-precincts.py OH24.zip
Requires pyshp and Shapely. Historical vote columns are never imported.
Source: https://github.com/21MetcalfJ/2024Precincts/tree/main/states/Ohio
"""
import io
import json
import sys
import zipfile
from pathlib import Path
import shapefile
from shapely import make_valid
from shapely.geometry import shape, mapping, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parent


def build(archive):
    current = json.loads((ROOT / "ohio-precinct-results-2026-data.js").read_text().split(" = ", 1)[1].rstrip(";\n"))
    county = unary_union([make_valid(shape(f["geometry"])) for f in current["features"]])
    with zipfile.ZipFile(archive) as source:
        reader = shapefile.Reader(shp=io.BytesIO(source.read("OH24.shp")), shx=io.BytesIO(source.read("OH24.shx")), dbf=io.BytesIO(source.read("OH24.dbf")))
        features = []
        for index, record in enumerate(reader.iterShapeRecords()):
            # Some source rings collapse to a line at the published precision.
            # Remove zero-area rings before pyshp classifies their nesting.
            boundaries = list(record.shape.parts) + [len(record.shape.points)]
            rings = [record.shape.points[start:end] for start, end in zip(boundaries, boundaries[1:])]
            rings = [ring for ring in rings if len(ring) >= 4 and Polygon(ring).area > 1e-12]
            if not rings:
                continue
            record.shape.parts = []
            record.shape.points = []
            for ring in rings:
                record.shape.parts.append(len(record.shape.points))
                record.shape.points.extend(ring)
            geometry = make_valid(shape(record.shape.__geo_interface__))
            if geometry.intersects(county):
                geometry = geometry.difference(county)
            if geometry.geom_type == "GeometryCollection":
                geometry = unary_union([g for g in geometry.geoms if g.geom_type in ("Polygon", "MultiPolygon")])
            if geometry.is_empty or geometry.area < 1e-10 or geometry.geom_type not in ("Polygon", "MultiPolygon"):
                continue
            geometry = geometry.simplify(.00002, preserve_topology=True)
            features.append({"type": "Feature", "properties": {"name": record.record.as_dict()["Statewides"], "boundaryYear": 2024}, "geometry": mapping(geometry)})
    if len(features) < 7000:
        raise ValueError("Incomplete statewide precinct backdrop; output unchanged")
    data = {"type": "FeatureCollection", "boundaryYear": 2024, "source": "https://github.com/21MetcalfJ/2024Precincts/tree/main/states/Ohio", "credit": "OPoliticsGuru / 21MetcalfJ", "features": features}
    (ROOT / "ohio-unfilled-precincts.js").write_text("// Historical boundary geometry only. No vote data. Credit: OPoliticsGuru / 21MetcalfJ.\nwindow.OHIO_UNFILLED_PRECINCTS = " + json.dumps(data, separators=(",", ":")) + ";\n")
    print(f"{len(features):,} unfilled boundary features; current Cuyahoga geography excluded; no historical votes imported")


if __name__ == "__main__":
    build(sys.argv[1])

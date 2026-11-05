"""Strip historic election colors and editor content from the Ohio SVG.

Usage: python3 build-ohio-precinct-preview.py path/to/OH_President_2024.svg
Geometry only; this file does not contain or estimate 2026 votes.
"""
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NS = "{http://www.w3.org/2000/svg}"
SOURCE = "https://commons.wikimedia.org/wiki/File:OH_President_2024.svg"
LICENSE = "https://creativecommons.org/licenses/by-sa/4.0/"


def build(source):
    original = ET.parse(source).getroot()
    art = original.find(NS + "g")
    precincts = art[0]
    transforms = {child.get("transform", "") for child in precincts}
    if len(transforms) != 1:
        raise ValueError("Unexpected source transforms; output unchanged")
    groups = [{"transform": precincts.get("transform", "") + " " + transforms.pop(),
               "paths": [p.attrib["d"] for p in precincts.iter(NS + "path")]}]
    # Preserve the source's five separately drawn island corrections.
    groups.append({"transform": "", "paths": [p.attrib["d"] for p in art if p.tag == NS + "path"]})
    if len(groups[0]["paths"]) != 11048 or len(groups[1]["paths"]) != 5:
        raise ValueError("Unexpected boundary geometry; output unchanged")
    data = {"viewBox": original.attrib["viewBox"], "transform": art.get("transform", ""),
            "groups": groups, "boundaryYear": 2024, "source": SOURCE, "license": LICENSE,
            "attribution": "Orca and Putitonamap98 / Wikimedia Commons", "results": None}
    (ROOT / "ohio-precinct-boundaries.js").write_text(
        "// Geometry adapted from OH President 2024.svg; CC BY-SA 4.0. See ohio-precincts-NOTICE.md.\n"
        "window.OHIO_PRECINCT_BOUNDARIES = " + json.dumps(data, separators=(",", ":")) + ";\n")
    ET.register_namespace("", NS[1:-1])
    svg = ET.Element(NS + "svg", {"viewBox": data["viewBox"], "role": "img", "aria-labelledby": "title description"})
    ET.SubElement(svg, NS + "title", {"id": "title"}).text = "Ohio precinct boundaries — 2024 geography"
    ET.SubElement(svg, NS + "desc", {"id": "description"}).text = (
        "Boundary preview, not 2026 election results. 2026 boundary changes have not been verified. "
        + data["attribution"] + ". Source: " + SOURCE + ". Adapted: historic result colors removed. License: " + LICENSE)
    container = ET.SubElement(svg, NS + "g", {"transform": data["transform"], "fill": "#c9ced6", "stroke": "#626b78", "stroke-width": "0.6", "fill-rule": "evenodd"})
    for group in groups:
        element = ET.SubElement(container, NS + "g", {"transform": group["transform"]})
        for d in group["paths"]:
            ET.SubElement(element, NS + "path", {"d": d})
    ET.ElementTree(svg).write(ROOT / "ohio-precinct-boundaries.svg", encoding="utf-8", xml_declaration=True)
    print("Imported 11,053 boundary paths; historic colors removed; no vote data imported")


if __name__ == "__main__":
    build(sys.argv[1])

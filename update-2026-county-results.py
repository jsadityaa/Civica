#!/usr/bin/env python3
"""Import public 2026 county/town returns without substituting statewide votes."""
import concurrent.futures
import argparse
import gzip
import json
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "https://apps.npr.org/2026-election-results/"
TOWNS = {"CT", "ME", "MA", "NH", "RI", "VT"}


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "PolycivicResults/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        raw = response.read()
    return gzip.decompress(raw) if raw[:2] == b"\x1f\x8b" else raw


def get_race(race):
    url = BASE + "data/counties/" + race["state"] + "-" + race["id"] + ".json"
    try:
        records = json.loads(download(url))["results"]
        clean = []
        for record in records:
            if record.get("test") is not False or record.get("resultsType") != "live" or record.get("office") != race["office"] or str(record.get("id")) != race["id"] or record.get("state") != race["state"]:
                raise ValueError("County feed does not match the live race: " + url)
            choices = [{k: c[k] for k in ["first", "last", "party", "id", "votes", "percent", "incumbent"] if k in c} for c in record["candidates"]]
            # The feed repeats statewide winner markers on county rows. Drop
            # those markers: county colors must follow actual local vote totals.
            clean.append({"fips": str(record.get("censusID") or record.get("fips") or record.get("reportingunitID")), "name": record.get("townshipName") or record.get("county", {}).get("countyName") or record.get("reportingunitName") or "", "eevp": record.get("eevp"), "candidates": choices})
        if not clean:
            raise ValueError("Empty county feed: " + url)
        return race["id"], {"source": url, "state": race["state"], "office": race["office"], "rows": clean}
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return race["id"], {"state": race["state"], "office": race["office"], "rows": [], "unavailable": True}
        raise


def get_map(state):
    path = "assets/synced/towns/" if state in TOWNS else "assets/counties/"
    root = ET.fromstring(download(BASE + path + state + ".svg"))
    shapes = []
    def visit(element, transforms):
        transforms = transforms + ([element.attrib["transform"]] if element.attrib.get("transform") else [])
        if element.tag.split("}")[-1] == "path" and element.attrib.get("d"):
            shapes.append({"id": element.attrib.get("id", ""), "d": element.attrib["d"], "transform": " ".join(transforms)})
        for child in element:
            visit(child, transforms)
    visit(root, [])
    return state, {"viewBox": root.attrib.get("viewBox", "0 0 " + root.attrib["width"] + " " + root.attrib["height"]), "paths": shapes, "unit": "Town" if state in TOWNS else "County"}


def collect():
    parser = argparse.ArgumentParser()
    parser.add_argument("--senate-only", action="store_true")
    args = parser.parse_args()
    snapshot = json.loads((ROOT / "midterms-2026-results-data.js").read_text().split(" = ", 1)[1].rstrip(";\n"))
    races = snapshot["offices"]["senate"]["races"] + ([] if args.senate_only else snapshot["offices"]["house"]["races"] + snapshot["offices"]["governor"]["races"])
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = dict(pool.map(get_race, races))
    existing = {}
    if (ROOT / "county-results-2026-data.js").exists():
        existing = json.loads((ROOT / "county-results-2026-data.js").read_text().split(" = ", 1)[1].rstrip(";\n"))
        # Official district-specific county returns take precedence over NPR's
        # unavailable House county feeds. Never discard a validated import.
        results.update({key: value for key, value in existing["races"].items()
                        if value.get("sourceType") == "official" and value["office"] == "H"})
    if args.senate_only and (ROOT / "county-results-2026-data.js").exists():
        existing = json.loads((ROOT / "county-results-2026-data.js").read_text().split(" = ", 1)[1].rstrip(";\n"))
        results.update({key: value for key, value in existing["races"].items() if value["office"] != "S"})
    states = sorted({r["state"] for r in races if results[r["id"]]["rows"]})
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        maps = dict(pool.map(get_map, states))
    if args.senate_only and (ROOT / "county-results-2026-data.js").exists():
        maps = {**existing.get("maps", {}), **maps}
    payload = {"capturedAt": datetime.now(timezone.utc).isoformat(), "races": results, "maps": maps}
    if existing.get("officialHouseCapturedAt"):
        payload["officialHouseCapturedAt"] = existing["officialHouseCapturedAt"]
    target = ROOT / "county-results-2026-data.js"
    temporary = target.with_suffix(".tmp")
    temporary.write_text("window.COUNTY_RESULTS_2026 = " + json.dumps(payload, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    geometry = download("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json")
    (ROOT / "county-geography-2026.js").write_text("window.COUNTY_GEOGRAPHY_2026 = " + geometry.decode() + ";\n")
    for code, name in [("S", "Senate"), ("G", "Governor"), ("H", "House")]:
        available = [r for r in results.values() if r["office"] == code and r["rows"]]
        print(name + ": " + str(len(available)) + " races with local returns; " + str(sum(len(r["rows"]) for r in available)) + " local result rows")


if __name__ == "__main__":
    collect()

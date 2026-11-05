#!/usr/bin/env python3
"""Refresh the local 2026 results snapshot from NPR's public live feeds."""
import gzip
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OFFICES = {"senate": ("senate", "S", 35), "governor": ("gov", "G", 36), "house": ("house", "H", 435)}


def collect():
    data = {"capturedAt": datetime.now(timezone.utc).isoformat(), "offices": {}}
    for office, (feed, code, expected) in OFFICES.items():
        url = "https://apps.npr.org/2026-election-results/data/" + feed + ".json"
        request = urllib.request.Request(url, headers={"User-Agent": "PolycivicResults/1.0", "Cache-Control": "no-cache"})
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
        if raw[:2] == b"\x1f\x8b":
            raw = gzip.decompress(raw)
        races = json.loads(raw)["results"]
        if len(races) != expected or len({r["id"] for r in races}) != expected:
            raise ValueError("Incomplete or duplicate " + office + " races; snapshot unchanged")
        for race in races:
            if race.get("test") is not False or race.get("resultsType") != "live" or race.get("office") != code:
                raise ValueError("Unexpected non-live race; snapshot unchanged")
            winners = [c for c in race["candidates"] if c.get("winner") == "X"]
            if race.get("called") and len(winners) != 1:
                raise ValueError("Called race has no unique winner; snapshot unchanged")
            if race.get("eevp") is not None and not 0 <= race["eevp"] <= 1:
                raise ValueError("Invalid estimated vote share; snapshot unchanged")
        data["offices"][office] = {"source": url, "races": races}
    target = ROOT / "midterms-2026-results-data.js"
    temporary = target.with_suffix(".tmp")
    temporary.write_text("window.POLYCIVIC_MIDTERM_RESULTS_2026 = " + json.dumps(data, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    print("Updated 506 races from NPR at " + data["capturedAt"])


if __name__ == "__main__":
    collect()

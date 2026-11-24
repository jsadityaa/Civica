#!/usr/bin/env python3
"""Build static Senate result pages with state-specific link preview metadata."""

import argparse
from html import escape
import json
from pathlib import Path
import re
import struct
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
STATES = (
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Washington", "West Virginia", "Wisconsin", "Wyoming",
)


def build(thumbnails_zip=None):
    snapshot = (ROOT / "midterms-2026-results-data.js").read_text()
    data = json.loads(snapshot.partition("=")[2].strip().removesuffix(";"))
    races = data["offices"]["senate"]["races"]
    if len(races) != 35 or len({race["stateName"] for race in races}) != 35:
        raise ValueError("Expected 35 distinct states with 2026 Senate races")

    images = {}
    if thumbnails_zip:
        with ZipFile(thumbnails_zip) as archive:
            names = [name for name in archive.namelist() if name.lower().endswith(".png")]
            def page_number(name):
                if name == "1.png":
                    return 0
                if name == "Alaska Senate Results.png":
                    return 1
                match = re.fullmatch(r"Alaska Senate Results \((\d+)\)\.png", name)
                if not match:
                    raise ValueError(f"Unrecognized thumbnail filename: {name}")
                return int(match[1])

            names.sort(key=page_number)
            if [page_number(name) for name in names] != list(range(50)):
                raise ValueError("Expected all 50 thumbnail pages in alphabetical state order")
            images = {state: archive.read(name) for state, name in zip(STATES, names)}

    template = (ROOT / "race-result-2026.html").read_text()
    pages = []
    for race in races:
        state, code = race["stateName"], race["state"].lower()
        filename = f"senate-2026-{code}-results.html"
        image_path = ROOT / "assets" / "social" / "senate-2026" / f"{code}.png"
        image_bytes = images[state] if images else image_path.read_bytes()
        if image_bytes[:8] != b"\x89PNG\r\n\x1a\n":
            raise ValueError(f"Invalid PNG for {state}")
        width, height = struct.unpack(">II", image_bytes[16:24])
        title = f"{state} U.S. Senate {'Special Election' if code in {'fl', 'oh'} else 'Election'} Results 2026 | Polycivic"
        description = f"View {state}’s 2026 U.S. Senate election results, candidate vote totals, and county map on Polycivic."
        url = f"https://polycivic.com/{filename}"
        image_url = f"https://polycivic.com/assets/social/senate-2026/{code}.png"
        alt = f"Polycivic 2026 {state} Senate Results with the state silhouette on a blue-to-red gradient."
        page = template
        page = re.sub(r'<title>.*?</title>', f'<title>{escape(title)}</title>', page, count=1)
        for name, value in (
            ("description", description), ("og:title", title),
            ("og:description", description), ("og:url", url),
        ):
            page, count = re.subn(
                rf'(<meta (?:name|property)="{re.escape(name)}" content=")[^"]*("\s*/>)',
                lambda match: match[1] + escape(value, quote=True) + match[2], page, count=1,
            )
            if count != 1:
                raise ValueError(f"Missing metadata in result template: {name}")
        page = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda match: match[1] + url, page, count=1)
        preview = (
            f'  <meta property="og:image" content="{image_url}" />\n'
            f'  <meta property="og:image:secure_url" content="{image_url}" />\n'
            f'  <meta property="og:image:type" content="image/png" />\n'
            f'  <meta property="og:image:width" content="{width}" />\n'
            f'  <meta property="og:image:height" content="{height}" />\n'
            f'  <meta property="og:image:alt" content="{escape(alt)}" />\n'
            f'  <meta name="twitter:title" content="{escape(title)}" />\n'
            f'  <meta name="twitter:description" content="{escape(description)}" />\n'
            f'  <meta name="twitter:image" content="{image_url}" />\n'
            f'  <meta name="twitter:image:alt" content="{escape(alt)}" />\n'
        )
        page = page.replace('  <meta name="twitter:card"', preview + '  <meta name="twitter:card"', 1)
        page = page.replace('data-results-office="race"', f'data-results-office="race" data-race-office="senate" data-race-id="{escape(race["id"])}"', 1)
        page = page.replace('<h1 id="results-detail-title">2026 Election Results</h1>', f'<h1 id="results-detail-title">{escape(state)} U.S. Senate Election Results 2026</h1>', 1)
        pages.append((ROOT / filename, page, image_path, image_bytes))

    for page_path, page, image_path, image_bytes in pages:
        image_path.parent.mkdir(parents=True, exist_ok=True)
        if images:
            image_path.write_bytes(image_bytes)
        page_path.write_text(page)
    print(f"Built {len(pages)} Senate result pages with matching state thumbnails")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--thumbnails-zip", type=Path)
    args = parser.parse_args()
    build(args.thumbnails_zip)

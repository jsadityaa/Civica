#!/usr/bin/env python3
"""Build district-specific House result pages from Canva PNG exports."""
import argparse
from collections import Counter
from html import escape
import json
from pathlib import Path
import re
import struct
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
AT_LARGE = {'AK', 'DE', 'ND', 'SD', 'VT', 'WY'}


def build(archives):
    data = json.loads((ROOT / 'midterms-2026-results-data.js').read_text().partition('=')[2].strip().removesuffix(';'))
    races = data['offices']['house']['races']
    if len(races) != 435 or len({(r['state'], int(r['seatNumber'])) for r in races}) != 435:
        raise ValueError('Expected 435 distinct House districts')
    images = {}
    for path in archives:
        with ZipFile(path) as archive:
            for name in archive.namelist():
                if not name.endswith('.png') or name.startswith('__MACOSX/'):
                    continue
                label = Path(name).stem
                if label in images:
                    raise ValueError(f'Duplicate thumbnail: {label}')
                images[label] = archive.read(name)
    expected = {f"{r['stateName']} {'At-Large' if r['state'] in AT_LARGE else 'District ' + str(int(r['seatNumber']))}" for r in races}
    if images and set(images) != expected:
        raise ValueError(f'Thumbnail mismatch: missing={sorted(expected - set(images))}; unexpected={sorted(set(images) - expected)}')
    template = (ROOT / 'race-result-2026.html').read_text()
    pages = []
    for race in races:
        code, district = race['state'].lower(), int(race['seatNumber'])
        label = f"{race['stateName']} {'At-Large' if race['state'] in AT_LARGE else 'District ' + str(district)}"
        filename = f'house-2026-{code}-{district}-results.html'
        image_path = ROOT / 'assets/social/house-2026' / f'{code}-{district}.png'
        raw = images[label] if images else image_path.read_bytes()
        if raw[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', raw[16:24]) != (1200, 630):
            raise ValueError(f'Expected 1200 × 630 PNG: {label}')
        title = f'{label} U.S. House Election Results 2026 | Polycivic'
        description = f'View the 2026 U.S. House election results, candidate vote totals, and district map for {label} on Polycivic.'
        district_slug = 'at-large' if race['state'] in AT_LARGE else str(district)
        url = f"https://polycivic.com/united-states/2026/house-of-reps/{race['stateName'].lower().replace(' ', '-')}-{district_slug}"
        image_url = f'https://polycivic.com/assets/social/house-2026/{code}-{district}.png'
        page = re.sub(r'<title>.*?</title>', f'<title>{escape(title)}</title>', template, count=1)
        for name, value in [('description', description), ('og:title', title), ('og:description', description), ('og:url', url)]:
            page, count = re.subn(rf'(<meta (?:name|property)="{re.escape(name)}" content=")[^"]*("\s*/>)', lambda m: m[1] + escape(value, quote=True) + m[2], page, count=1)
            if count != 1:
                raise ValueError(f'Missing template metadata: {name}')
        page = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m[1] + url, page, count=1)
        # No og:image:alt or twitter:image:alt metadata, per requested output.
        preview = ''.join(f'  <meta {kind}="{name}" content="{escape(value, quote=True)}" />\n' for kind, name, value in [
            ('property', 'og:image', image_url), ('property', 'og:image:secure_url', image_url),
            ('property', 'og:image:type', 'image/png'), ('property', 'og:image:width', '1200'),
            ('property', 'og:image:height', '630'), ('name', 'twitter:title', title),
            ('name', 'twitter:description', description), ('name', 'twitter:image', image_url)])
        page = page.replace('  <meta name="twitter:card"', preview + '  <meta name="twitter:card"', 1)
        page = page.replace('data-results-office="race"', f'data-results-office="race" data-race-office="house" data-race-id="{escape(race["id"])}"', 1)
        page = page.replace('<h1 id="results-detail-title">2026 Election Results</h1>', f'<h1 id="results-detail-title">{escape(label)} U.S. House Election Results 2026</h1>', 1)
        pages.append((ROOT / filename, page, image_path, raw))
    for path, page, image_path, raw in pages:
        image_path.parent.mkdir(parents=True, exist_ok=True)
        if images:
            image_path.write_bytes(raw)
        path.write_text(page)
    print(f'Built {len(pages)} House result pages with matching district thumbnails and no image-alt metadata')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--thumbnails-zip', type=Path, action='append', default=[])
    build(parser.parse_args().thumbnails_zip)

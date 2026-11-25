#!/usr/bin/env python3
"""Build governor result pages with matching Canva link-preview thumbnails."""
import argparse
from html import escape
import json
from pathlib import Path
import re
import struct
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent


def build(archive_path=None):
    data = json.loads((ROOT / 'midterms-2026-results-data.js').read_text().partition('=')[2].strip().removesuffix(';'))
    races = data['offices']['governor']['races']
    if len(races) != 36 or len({r['state'] for r in races}) != 36:
        raise ValueError('Expected 36 distinct governor races')
    images = {}
    if archive_path:
        with ZipFile(archive_path) as archive:
            for name in archive.namelist():
                if name.lower().endswith('.png') and not name.startswith('__MACOSX/'):
                    label = Path(name).stem
                    if label in images:
                        raise ValueError(f'Duplicate thumbnail: {label}')
                    images[label] = archive.read(name)
        expected = {r['stateName'] + ' Governor Results' for r in races}
        if set(images) != expected:
            raise ValueError(f'Thumbnail mismatch: missing={expected-set(images)}, unexpected={set(images)-expected}')
    template = (ROOT / 'race-result-2026.html').read_text()
    pages = []
    for race in races:
        state, code = race['stateName'], race['state'].lower()
        image_path = ROOT / 'assets/social/governor-2026' / f'{code}.png'
        raw = images[state + ' Governor Results'] if images else image_path.read_bytes()
        if raw[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', raw[16:24]) != (1200, 630):
            raise ValueError(f'Expected 1200 × 630 PNG: {state}')
        title = f'{state} Governor Election Results 2026 | Polycivic'
        description = f'View {state}’s 2026 gubernatorial election results, candidate vote totals, and county map on Polycivic.'
        url = 'https://polycivic.com/elections/united-states/2026/governor/' + state.lower().replace(' ', '-')
        image_url = f'https://polycivic.com/assets/social/governor-2026/{code}.png'
        page = re.sub(r'<title>.*?</title>', f'<title>{escape(title)}</title>', template, count=1)
        for name, value in [('description', description), ('og:title', title), ('og:description', description), ('og:url', url)]:
            page, count = re.subn(rf'(<meta (?:name|property)="{re.escape(name)}" content=")[^"]*("\s*/>)', lambda m: m[1] + escape(value, quote=True) + m[2], page, count=1)
            if count != 1:
                raise ValueError(f'Missing template metadata: {name}')
        page = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m[1] + url, page, count=1)
        preview = ''.join(f'  <meta {kind}="{name}" content="{escape(value, quote=True)}" />\n' for kind, name, value in [
            ('property', 'og:image', image_url), ('property', 'og:image:secure_url', image_url),
            ('property', 'og:image:type', 'image/png'), ('property', 'og:image:width', '1200'),
            ('property', 'og:image:height', '630'), ('name', 'twitter:title', title),
            ('name', 'twitter:description', description), ('name', 'twitter:image', image_url)])
        page = page.replace('  <meta name="twitter:card"', preview + '  <meta name="twitter:card"', 1)
        page = page.replace('data-results-office="race"', f'data-results-office="race" data-race-office="governor" data-race-id="{escape(race["id"])}"', 1)
        page = page.replace('<h1 id="results-detail-title">2026 Election Results</h1>', f'<h1 id="results-detail-title">{escape(state)} Governor Election Results 2026</h1>', 1)
        pages.append((ROOT / f'governor-2026-{code}-results.html', page, image_path, raw))
    for path, page, image_path, raw in pages:
        image_path.parent.mkdir(parents=True, exist_ok=True)
        if images:
            image_path.write_bytes(raw)
        path.write_text(page)
    print(f'Built {len(pages)} governor result pages with matching thumbnails and no image-alt metadata')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--thumbnails-zip', type=Path)
    build(parser.parse_args().thumbnails_zip)

#!/usr/bin/env python3
"""Build overall-state result pages with matching Canva link-preview thumbnails."""
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
    races = [dict(state=code, stateName=name) for code, name in sorted({r['state']: r['stateName'] for r in data['offices']['house']['races']}.items())]
    if len(races) != 50 or len({r['state'] for r in races}) != 50:
        raise ValueError('Expected 50 distinct states')
    images = {}
    if archive_path:
        with ZipFile(archive_path) as archive:
            for name in archive.namelist():
                if name.lower().endswith('.png') and not name.startswith('__MACOSX/'):
                    label = Path(name).stem
                    if label in images:
                        raise ValueError(f'Duplicate thumbnail: {label}')
                    images[label] = archive.read(name)
        expected = {r['stateName'] + ' Results' for r in races}
        if set(images) != expected:
            raise ValueError(f'Thumbnail mismatch: missing={expected-set(images)}, unexpected={set(images)-expected}')
    template = (ROOT / 'state-election-results-2026.html').read_text()
    pages = []
    for race in races:
        state, code = race['stateName'], race['state'].lower()
        image_path = ROOT / 'assets/social/states-2026' / f'{code}.png'
        raw = images[state + ' Results'] if images else image_path.read_bytes()
        if raw[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', raw[16:24]) != (1200, 630):
            raise ValueError(f'Expected 1200 × 630 PNG: {state}')
        title = f'{state} Election Results 2026 | Polycivic'
        description = f'View {state}’s 2026 election results for U.S. Senate, governor, and U.S. House races on Polycivic.'
        url = 'https://polycivic.com/elections/united-states/2026/states/' + state.lower().replace(' ', '-')
        image_url = f'https://polycivic.com/assets/social/states-2026/{code}.png'
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
        page = page.replace('data-results-office="state"', f'data-results-office="state" data-results-state="{escape(state)}"', 1)
        page = page.replace('<h1 id="results-detail-title">2026 Election Results</h1>', f'<h1 id="results-detail-title">{escape(state)} Election Results 2026</h1>', 1)
        pages.append((ROOT / f'state-election-results-2026-{code}.html', page, image_path, raw))
    for path, page, image_path, raw in pages:
        image_path.parent.mkdir(parents=True, exist_ok=True)
        if images:
            image_path.write_bytes(raw)
        path.write_text(page)
    print(f'Built {len(pages)} overall-state result pages with matching thumbnails and no image-alt metadata')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--thumbnails-zip', type=Path)
    build(parser.parse_args().thumbnails_zip)

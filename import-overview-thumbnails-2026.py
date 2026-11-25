#!/usr/bin/env python3
"""Attach the five Canva overview exports to their corresponding 2026 pages."""
import argparse
from html import escape, unescape
from pathlib import Path
import re
import struct
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
TARGETS = [
    ('1.png', 'senate', 'senate-2026-results.html', '/elections/united-states/2026/senate'),
    ('2.png', 'governor', 'governor-2026-results.html', '/elections/united-states/2026/governor'),
    ('3.png', 'house', 'house-2026-results.html', '/elections/united-states/2026/house-of-reps'),
    ('4.png', 'states', 'state-results-2026.html', '/elections/united-states/2026/states'),
    ('5.png', 'precinct-maps', 'precinct-map-2026.html', '/elections/united-states/2026/senate/precinct-maps'),
]


def build(archive_path):
    pending = []
    with ZipFile(archive_path) as archive:
        names = [n for n in archive.namelist() if n.lower().endswith('.png')]
        if set(names) != {x[0] for x in TARGETS}:
            raise ValueError('Expected five numbered Canva PNG exports')
        for member, key, filename, route in TARGETS:
            raw = archive.read(member)
            if raw[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', raw[16:24]) != (1200, 630):
                raise ValueError(f'Expected 1200 × 630 PNG: {member}')
            path = ROOT / filename
            page = path.read_text()
            title = unescape(re.search(r'<title>(.*?)</title>', page).group(1))
            description = unescape(re.search(r'<meta name="description" content="([^"]*)"', page).group(1))
            image = ROOT / 'assets/social/overview-2026' / f'{key}.png'
            image_url = f'https://polycivic.com/assets/social/overview-2026/{key}.png'
            values = [
                ('property', 'og:site_name', 'Polycivic'), ('property', 'og:type', 'website'),
                ('property', 'og:title', title), ('property', 'og:description', description),
                ('property', 'og:url', 'https://polycivic.com' + route),
                ('property', 'og:image', image_url), ('property', 'og:image:secure_url', image_url),
                ('property', 'og:image:type', 'image/png'), ('property', 'og:image:width', '1200'),
                ('property', 'og:image:height', '630'), ('name', 'twitter:card', 'summary_large_image'),
                ('name', 'twitter:title', title), ('name', 'twitter:description', description),
                ('name', 'twitter:image', image_url),
            ]
            # Replace social tags as one block, with no thumbnail alt metadata.
            page = re.sub(r'^\s*<meta (?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>[^\S\n]*\n', '', page, flags=re.M)
            block = ''.join(f'  <meta {kind}="{name}" content="{escape(value, quote=True)}" />\n' for kind, name, value in values)
            page = page.replace('</head>', block + '</head>', 1)
            pending.append((path, page, image, raw))
    for path, page, image, raw in pending:
        image.parent.mkdir(parents=True, exist_ok=True)
        image.write_bytes(raw)
        path.write_text(page)
    print('Imported all five overview thumbnails with matching link-preview metadata and no image-alt text')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    build(parser.parse_args().archive)

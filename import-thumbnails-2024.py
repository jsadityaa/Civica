#!/usr/bin/env python3
"""Import the two titled Canva 2024 PNG exports into route-specific previews."""
import argparse
import json
import re
import struct
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
PREFIX = '/elections/united-states/2024/'


def image_for(route, districts):
    section, _, suffix = route['path'].removeprefix(PREFIX).partition('/')
    if not suffix:
        office = {'presidency': 'Presidential', 'senate': 'Senate',
                  'governor': 'Governor', 'house-of-reps': 'House', 'states': 'State'}
        if section == 'california':
            return 'California Results 2024'
        return f'United States {office[section]} Results 2024'
    name = route['params'].get('name')
    if section == 'house-of-reps':
        district = districts[route['params']['code']]
        label = 'At-Large' if suffix.endswith('-at-large') else f'District {int(district["district"])}'
        return f'{district["stateName"]} {label} House Results 2024'
    office = {'presidency': 'Presidential ', 'senate': 'Senate ',
              'governor': 'Governor ', 'states': ''}[section]
    special = 'Special ' if route['params'].get('seat') == 'Special' else ''
    return f'{name} {special}{office}Results 2024'


def build(archives):
    routes = json.loads((ROOT / 'election-routes.json').read_text())
    districts = json.loads((ROOT / 'house-2024-data.js').read_text().partition('=')[2].strip().removesuffix(';'))['districts']
    images = {}
    for archive_path in archives:
        with ZipFile(archive_path) as archive:
            for member in archive.namelist():
                if not member.endswith('.png'):
                    continue
                name = Path(member).stem
                raw = archive.read(member)
                if name in images:
                    raise ValueError(f'Duplicate thumbnail: {name}')
                if raw[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', raw[16:24]) != (1200, 630):
                    raise ValueError(f'Expected 1200 × 630 PNG: {member}')
                images[name] = raw
    mapping = {}
    used = set()
    for route in routes:
        if not route['path'].startswith(PREFIX) or '/forecasts/' in route['path']:
            continue
        name = image_for(route, districts)
        if name not in images:
            raise ValueError(f'Missing thumbnail for {route["path"]}: {name}')
        used.add(name)
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        mapping[route['path']] = f'/assets/social/results-2024/{slug}.png'
    if used != images.keys():
        raise ValueError(f'Unused exports: {sorted(images.keys() - used)}')
    for name in sorted(used):
        slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        destination = ROOT / 'assets/social/results-2024' / f'{slug}.png'
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(images[name])
    (ROOT / 'thumbnails-2024.json').write_text(json.dumps(mapping, indent=2) + '\n')
    print(f'Imported {len(used)} thumbnails for {len(mapping)} 2024 result routes')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archives', type=Path, nargs=2)
    build(parser.parse_args().archives)

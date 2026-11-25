#!/usr/bin/env python3
"""Recover separately reported candidate totals only when local returns reconcile.

Keep saved ballot identities, but never distribute an aggregate Other vote total.
Each supplemental snapshot includes the exact national totals it reconciles to,
so a timestamp-only refresh does not erase otherwise valid candidate totals.
"""
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def read(name):
    return json.loads((ROOT / name).read_text().split(' = ', 1)[1].strip().removesuffix(';'))


def identity(candidate):
    name = ' '.join([candidate.get('first', ''), candidate.get('last', '')])
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    return re.sub('[^a-z0-9]', '', name), candidate.get('party')


def build():
    snapshot = read('midterms-2026-results-data.js')
    county = read('county-results-2026-data.js')
    previous = read('race-candidates-2026-data.js')
    output = {}
    for office in snapshot['offices'].values():
        for race in office['races']:
            named = [dict(c) for c in race['candidates'] if c.get('first')]
            canonical = {identity(c): c for c in named}
            known_ids = {str(c['id']) for c in named}
            extras = {}
            for c in previous.get(race['id'], {}).get('candidates', []):
                if c.get('first') and identity(c) not in canonical and str(c['id']) not in known_ids:
                    extras[identity(c)] = {**c, 'votes': None, 'percent': None, 'individuallyReported': False}
            local = county['races'].get(race['id'], {})
            totals = Counter()
            all_total = 0
            for row in local.get('rows', []):
                for c in row['candidates']:
                    all_total += c['votes']
                    if not c.get('first'):
                        continue
                    key = identity(c)
                    totals[key] += c['votes']
                    if key not in canonical:
                        extras[key] = {**extras.get(key, {}), **c, 'votes': None, 'percent': None, 'individuallyReported': False}
            summary_total = sum(c['votes'] for c in race['candidates'])
            grouped = sum(c['votes'] for c in race['candidates'] if not c.get('first'))
            reconciled = bool(local.get('rows')) and all_total == summary_total and all(
                totals[identity(c)] == c['votes'] for c in named)
            individual_total = sum(totals[key] for key in extras)
            reconciled = reconciled and individual_total <= grouped
            if reconciled:
                for key, c in extras.items():
                    if key in totals:
                        c.update(votes=totals[key], percent=totals[key] / summary_total if summary_total else 0,
                                 individuallyReported=True)
            if not grouped and not extras:
                continue
            sources = previous.get(race['id'], {}).get('sources', [])
            if local.get('source'):
                sources = list(dict.fromkeys([*sources, local['source']]))
            output[race['id']] = {
                'snapshotCapturedAt': snapshot['capturedAt'],
                'snapshotVotes': {str(c['id']): c['votes'] for c in race['candidates']},
                'candidates': named + list(extras.values()),
                'groupedVotes': grouped - individual_total if reconciled else grouped,
                'groupedCount': sum(c.get('count', 0) for c in race['candidates'] if not c.get('first')),
                'sources': sources,
                'fullyReconciled': reconciled and individual_total == grouped,
            }
    target = ROOT / 'race-candidates-2026-data.js'
    temporary = target.with_suffix('.tmp')
    temporary.write_text('// Named candidates; null totals are not separately reported.\nwindow.RACE_CANDIDATES_2026 = ' + json.dumps(output, separators=(',', ':')) + ';\n')
    temporary.replace(target)
    print(f"Reconciled {sum(r['fullyReconciled'] for r in output.values())} complete candidate rosters; "
          f"{sum(c.get('individuallyReported') is True for r in output.values() for c in r['candidates'])} supplemental individual totals")


if __name__ == '__main__':
    build()

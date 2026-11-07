#!/usr/bin/env python3
"""Validate saved official returns and merge House county portions atomically.

Inputs are public, unofficial November 3, 2026 results captured from the
respective election authorities. No countywide votes are apportioned to districts.
Run again after replacing the source captures in data/official-house-counties-2026.
"""
import json
import re
import unicodedata
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / 'data/official-house-counties-2026'
PARTIES = {'DEM': 'Dem', 'Democratic': 'Dem', 'REP': 'GOP',
           'Republican': 'GOP', 'LIB': 'Lib', 'Libertarian': 'Lib',
           'GRE': 'Grn', 'Green': 'Grn', 'Independent': 'Ind', 'TIP': 'Other'}
PREFIX = {'MD': '24', 'NC': '37', 'OH': '39', 'PA': '42', 'SD': '46'}


def read_js(name):
    return json.loads((ROOT / name).read_text().split(' = ', 1)[1].rstrip(';\n'))


def key(name):
    return re.sub('[^a-z0-9]', '', unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower())


def surname(name):
    name = re.sub(r',?\s+(Jr\.?|Sr\.?|II|III|IV)$', '', name.strip(), flags=re.I)
    return key(name.split()[-1])


def integer(value):
    value = str(value).replace(',', '').strip()
    if not re.fullmatch(r'\d+', value):
        raise ValueError('Missing or invalid vote count: ' + value)
    return int(value)


def english(value):
    return next(x['text'] for x in value if x['languageId'] == 'en')


def build():
    snapshot = read_js('midterms-2026-results-data.js')
    bundle = read_js('county-results-2026-data.js')
    extra = read_js('race-candidates-2026-data.js')
    races = {(r['state'], int(r['seatNumber'])): r for r in snapshot['offices']['house']['races']}
    geography = read_js('county-geography-2026.js')['objects']['counties']['geometries']
    county_ids = {}
    county_names = {}
    for geometry in geography:
        fips = str(geometry['id']).zfill(5)
        county_ids[(fips[:2], key(geometry['properties']['name']))] = fips
        county_names[fips] = geometry['properties']['name']
    # us-atlas labels Baltimore city and Baltimore County identically.
    county_ids[('24', 'baltimore')] = '24005'
    county_ids[('24', 'baltimorecity')] = '24510'
    county_ids[('46', 'oglalalakota')] = '46102'
    county_ids[('24', 'saintmarys')] = '24037'
    collected = {}

    def add(state, district, county, votes, source, total=None, as_of=None):
        race = races[(state, district)]
        assert race['office'] == 'H' and race['test'] is False and race['resultsType'] == 'live'
        county_name = re.sub(r' County$', '', county, flags=re.I).strip()
        fips = county_ids[(PREFIX[state], key(county_name))]
        county_name = 'Baltimore City' if fips == '24510' else county_names[fips]
        assert fips.startswith(PREFIX[state])
        candidates = []
        known = race['candidates'] + extra.get('races', {}).get(race['id'], {}).get('candidates', [])
        for full_name, affiliation, count in votes:
            count = integer(count)
            party = PARTIES.get(affiliation, affiliation or 'Other')
            full_name = re.sub(r'\s+', ' ', full_name).strip()
            last = surname(full_name)
            matches = {str(c['id']): c for c in known if c.get('party') == party and
                       (key(' '.join([c.get('first', ''), c.get('last', '')])) == key(full_name)
                        or (c.get('last') and surname(c['last']) == last))}
            if len(matches) == 1:
                identity = next(iter(matches.values()))
                candidate = {k: identity[k] for k in ['id', 'first', 'last', 'incumbent'] if k in identity}
            else:
                parts = full_name.rsplit(' ', 1)
                candidate = {'id': 'official-' + race['id'] + '-' + key(full_name),
                             'first': parts[0] if len(parts) == 2 else '', 'last': parts[-1]}
            candidates.append({**candidate, 'party': party, 'votes': count})
        vote_total = sum(c['votes'] for c in candidates)
        if total is not None:
            assert vote_total == integer(total), (state, district, county, vote_total, total)
        assert candidates and len({c['id'] for c in candidates}) == len(candidates)
        for c in candidates:
            c['percent'] = c['votes'] / vote_total if vote_total else 0
        record = collected.setdefault(race['id'], {'state': state, 'office': 'H',
            'sourceType': 'official', 'districtSpecific': True, 'rows': []})
        assert not any(row['fips'] == fips for row in record['rows']), (state, district, county)
        record['rows'].append({'fips': fips, 'name': county_name, 'eevp': None,
                              'candidates': candidates, 'source': source,
                              'reportingStatus': 'Unofficial returns', **({'asOf': as_of} if as_of else {})})

    sd = json.loads((SOURCES / 'sd.json').read_text())
    assert len(sd) == 66
    for row in sd:
        assert row['electionDate'] == '2026-11-03'
        add('SD', 1, row['name'], [(c['name'], c['party'], c['votes']) for c in row['candidates']], row['source'], row['total'])

    md = json.loads((SOURCES / 'md.json').read_text())
    assert len(md) == 24
    for county in md:
        assert '2026' in county['heading'] and 'General Election' in county['heading']
        for contest in county['results']:
            rows = contest['rows']
            assert rows[0][-2:] == ['Total', 'Percentage'] and rows[-1][0] == 'Totals'
            add('MD', int(contest['district'].split()[-1]), county['name'],
                [(r[0], r[1], r[-2]) for r in rows[1:-1]], county['url'], rows[-1][-2])

    nc = json.loads((SOURCES / 'nc.json').read_text())
    assert len(nc) == 14
    for contest in nc:
        assert '11/03/2026' in contest['source']
        district = int(re.search(r'DISTRICT (\d+)', contest['heading'])[1])
        summary_table = contest['summary']['rows']
        summary = [[cell.removeprefix(summary_table[0][i]) for i, cell in enumerate(row)]
                   for row in summary_table[1:]]
        totals = Counter()
        table = contest['tables'][0]
        headers = table[0]
        by_name = {key(r[0]): (r[0], r[1], integer(r[2])) for r in summary}
        assert headers[:2] == ['County', 'Reporting Status']
        for row in table[1:]:
            votes = []
            for i, header in enumerate(headers[2:], 2):
                name, affiliation, _ = by_name[key(header)]
                cell = row[i]
                # Responsive tables include a visible/accessibility header label in each cell.
                if cell.startswith(header):
                    cell = cell[len(header):]
                count = integer(cell)
                votes.append((name, affiliation, count))
                totals[key(name)] += count
            add('NC', district, row[0].removeprefix('County'), votes, contest['source'])
        assert totals == Counter({k: v[2] for k, v in by_name.items()}), ('NC district totals', district, totals, by_name)

    pa = json.loads((SOURCES / 'pa.json').read_text())
    pa_summary = json.loads((SOURCES / 'pa-summary.json').read_text())
    assert len(pa) == len(pa_summary) == 17
    for contest in pa:
        assert 'ElectionID=117' in contest['source'] and 'ElectionType=G' in contest['source']
        district = int(re.search(r'(\d+)\w+ Congressional District', contest['heading'])[1])
        totals = Counter()
        for county in contest['counties']:
            votes = []
            for c in county['candidates']:
                name, affiliation = re.fullmatch(r'(.+) \(([^)]+)\)', c['name']).groups()
                count = re.search(r'Votes: ([\d,]+)', c['result'])[1]
                totals[c['name']] += integer(count)
                # Display ordinary names rather than all-capitals source typography.
                votes.append((name.title(), affiliation, count))
            add('PA', district, county['name'], votes, contest['source'])
        summary = next(s for s in pa_summary if int(re.match(r'\d+', s['district'])[0]) == district)
        assert totals == Counter({c['name']: integer(re.search(r'Votes: ([\d,]+)', c['result'])[1])
                                  for c in summary['candidates']}), ('PA district totals', district)

    ohio = json.loads((SOURCES / 'oh-cuyahoga.json').read_text())
    election = ohio['election']
    assert election['isProduction'] is True and election['isPrimary'] is False and election['electionDate'].startswith('2026-11-03')
    for contest in ohio['ballotItems']:
        district = int(re.search(r'\((\d+)\w+ District\)', english(contest['name']))[1])
        add('OH', district, 'Cuyahoga', [(english(c['name']), c.get('party', {}).get('abbreviation', ''), c['voteCount'])
            for c in contest['summaryResults']['ballotOptions']],
            'https://app.enhancedvoting.com/results/public/cuyahoga-county-oh/GE2026', contest['voteTotal'], election['asOf'])

    for race_id, record in collected.items():
        record['rows'].sort(key=lambda r: r['fips'])
        record['sources'] = sorted({row['source'] for row in record['rows']})
        bundle['races'][race_id] = record
    bundle['officialHouseCapturedAt'] = datetime.now(timezone.utc).isoformat()
    target = ROOT / 'county-results-2026-data.js'
    temp = target.with_suffix('.tmp')
    temp.write_text('window.COUNTY_RESULTS_2026 = ' + json.dumps(bundle, separators=(',', ':')) + ';\n')
    temp.replace(target)
    for state in PREFIX:
        records = [r for r in collected.values() if r['state'] == state]
        print(f'{state}: {len(records)} House races, {sum(len(r["rows"]) for r in records)} county portions')


if __name__ == '__main__':
    build()

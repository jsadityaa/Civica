"""Expose named candidates omitted from NPR's national summary tables.

County returns provide candidate identities. Public state voter guides supplement
ballot names where county returns are unavailable. Never allocate grouped votes
to a person unless the county totals reconcile exactly with the saved snapshot.
"""
import html
import json
import re
from collections import Counter
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

ROOT = Path(__file__).resolve().parent
spec = spec_from_file_location("campaign", ROOT / "import-campaign-portraits-2026.py")
campaign = module_from_spec(spec)
spec.loader.exec_module(campaign)
read = campaign.base.read


def clean_name(value):
    name = campaign.base.clean(value)
    if "Ã" in name or "Â" in name:
        try:
            name = name.encode("latin-1").decode("utf-8")
        except (UnicodeEncodeError, UnicodeDecodeError):
            pass
    return name


def build():
    snapshot = read("midterms-2026-results-data.js")
    county = read("county-results-2026-data.js")
    records = {}
    for office, bundle in snapshot["offices"].items():
        for race in bundle["races"]:
            grouped = [c for c in race["candidates"] if not c.get("first")]
            if not grouped:
                continue
            named = [dict(c) for c in race["candidates"] if c.get("first")]
            identities = {(campaign.key(" ".join([c["first"], c["last"]])), c["party"]): c for c in named}
            local = county["races"].get(race["id"], {})
            totals = Counter()
            county_names = {}
            for row in local.get("rows", []):
                for candidate in row["candidates"]:
                    totals[candidate["id"]] += candidate["votes"]
                    if candidate.get("first"):
                        county_names[candidate["id"]] = candidate
            all_total = sum(c["votes"] for c in race["candidates"])
            reconciled = bool(local.get("rows")) and all(
                totals[c["id"]] == c["votes"] for c in named
            ) and sum(totals.values()) == all_total and all(
                c.get("first") for row in local["rows"] for c in row["candidates"]
            )
            sources = []
            if county_names:
                sources.append(local["source"])
            for id, candidate in county_names.items():
                identity = (campaign.key(" ".join([candidate["first"], candidate["last"]])), candidate["party"])
                if identity in identities:
                    continue
                c = {k: candidate[k] for k in ("id", "first", "last", "party", "incumbent") if k in candidate}
                c.update(votes=totals[id] if reconciled else None,
                         percent=totals[id] / all_total if reconciled and all_total else None,
                         individuallyReported=reconciled)
                named.append(c)
                identities[identity] = c
            # The guide's race block must agree with all named summary candidates.
            # This prevents similarly named people in another district being used.
            page = Path("/tmp/polycivic-state-portrait-pages") / (race["state"] + ".html")
            if not county_names and not page.exists():
                campaign.collect_state((race["state"], race["stateName"]))
            if page.exists() and not county_names:
                label = {"senate": "U.S. Senate", "governor": "Governor", "house": f"U.S. House - {race['state']}-{int(race.get('seatNumber') or 0)}"}[office]
                for block in page.read_text().split('<details class="bl-row"')[1:]:
                    header = block.split(">", 1)[0]
                    if f'data-office="{label}"' not in header:
                        continue
                    roster = []
                    for chunk in block.split('<div class="bl-cand">')[1:]:
                        n = re.search(r'class="bl-name"[^>]*>(.*?)</', chunk, re.S)
                        p = re.search(r'class="bl-party"[^>]*>(.*?)</', chunk, re.S)
                        if not n or not p:
                            continue
                        name = clean_name(n[1])
                        party = {"Democrat": "Dem", "Democratic": "Dem", "Republican": "GOP", "Independent": "Ind", "Libertarian": "Lib", "Green": "Grn", "No Labels": "NoL"}.get(campaign.base.clean(p[1]), campaign.base.clean(p[1]))
                        roster.append((name, party))
                    roster_keys = {(campaign.key(n), p) for n, p in roster}
                    main_keys = {(campaign.key(" ".join([c["first"], c["last"]])), c["party"]) for c in race["candidates"] if c.get("first")}
                    if not main_keys.issubset(roster_keys):
                        continue
                    sources.append("https://theballotbrief.com/state/" + race["stateName"].lower().replace(" ", "-"))
                    for name, party in roster:
                        if " " not in name or re.search(r"write.in|other candidate", name, re.I):
                            continue
                        identity = (campaign.key(name), party)
                        if identity in identities or any(k == identity[0] for k, _ in identities):
                            continue
                        first, last = name.rsplit(" ", 1)
                        c = {"id": "ballot-" + race["id"] + "-" + campaign.base.normalized(name), "first": first, "last": last, "party": party, "votes": None, "percent": None, "individuallyReported": False}
                        named.append(c)
                        identities[identity] = c
                    break
            records[race["id"]] = {
                "snapshotCapturedAt": snapshot["capturedAt"],
                "candidates": named,
                "groupedVotes": sum(c["votes"] for c in grouped) if not reconciled else 0,
                "groupedCount": sum(c.get("count", 0) for c in grouped),
                "sources": sources,
                "fullyReconciled": reconciled,
            }
    target = ROOT / "race-candidates-2026-data.js"
    target.write_text("// Named ballot candidates; null totals are not separately reported.\nwindow.RACE_CANDIDATES_2026 = " + json.dumps(records, separators=(",", ":")) + ";\n")
    extras = sum(sum(c.get("individuallyReported") is not None for c in r["candidates"]) for r in records.values())
    print(f"Added {extras} named candidates across {len(records)} races; {sum(r['fullyReconciled'] for r in records.values())} county totals reconcile exactly.")


if __name__ == "__main__":
    build()

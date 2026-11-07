"""Import actual 2026 Cuyahoga precinct votes and current county GIS boundaries.

No county vote allocation, historic returns, or inferred precinct matches.
"""
import concurrent.futures
import datetime
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "https://app.enhancedvoting.com/results/public/api/elections/cuyahoga-county-oh/GE2026"
PUBLIC = "https://app.enhancedvoting.com/results/public/cuyahoga-county-oh/GE2026"
GEOGRAPHY = "https://services7.arcgis.com/GXM8JipKyc0m6HBi/arcgis/rest/services/Voting_Precincts_region/FeatureServer/0"


def get(url):
    with urllib.request.urlopen(url, timeout=45) as response:
        return json.load(response)


def text(value):
    return re.sub(r"<[^>]+>", " ", next((v["text"] for v in value if v.get("languageId") == "en"), "")).strip()


def key(name):
    # Only punctuation/case differ between the two county publications.
    return re.sub(r"[^A-Z0-9]", "", (name or "").upper())


def votes(options):
    result = []
    for candidate in options:
        count = candidate.get("voteCount")
        if count is None:
            count = 0
        if not isinstance(count, int) or count < 0:
            raise ValueError("Invalid precinct candidate vote count")
        party = (candidate.get("party") or {}).get("abbreviation", "")
        result.append({"name": text(candidate["name"]), "party": {"DEM": "D", "REP": "R", "LIB": "L"}.get(party, party or "Other"), "votes": count})
    return result


def build():
    data = get(BASE + "/data")
    election = data["election"]
    if election.get("electionDate") != "2026-11-03" or election.get("isProduction") is not True or election.get("isPrimary"):
        raise ValueError("Not the live 2026 general election; output unchanged")
    query = urllib.parse.urlencode({"f": "geojson", "where": "1=1", "outFields": "Name,City,Precinct,EditDate", "outSR": 4326, "geometryPrecision": 5, "maxAllowableOffset": .00002, "resultRecordCount": 2000})
    geography = get(GEOGRAPHY + "/query?" + query)
    if geography.get("exceededTransferLimit") or not geography.get("features"):
        raise ValueError("Incomplete precinct geometry; output unchanged")
    features = []
    for feature in geography["features"]:
        properties = feature["properties"]
        if not feature.get("geometry"):
            raise ValueError("Missing precinct geometry; output unchanged")
        feature["properties"] = {"key": key(properties.get("Name")), "name": properties.get("Name") or "Unmatched boundary", "city": properties.get("City") or ""}
        features.append(feature)
    available = {f["properties"]["key"] for f in features if f["properties"]["key"]}
    contests = []
    for item in data["ballotItems"]:
        name = text(item["name"])
        office = "senate" if name.startswith("U.S. Senator") else "governor" if name.startswith("Governor") else "house" if name.startswith("For Representative to Congress") else None
        if office:
            contests.append((item, office))

    def contest(entry):
        item, office = entry
        response = get(BASE + "/data/ballot-item/" + item["id"])
        current = response["election"]
        if current.get("electionDate") != "2026-11-03" or current.get("isProduction") is not True:
            raise ValueError("Invalid contest snapshot; output unchanged")
        race = response["ballotItemWithBreakdown"]
        rows = []
        seen = set()
        for part in race["breakdownResults"]:
            precinct = part["precinct"]
            name = text(precinct["name"])
            identifier = key(name)
            if identifier in seen:
                raise ValueError("Duplicate precinct result; output unchanged")
            seen.add(identifier)
            candidates = votes(part["ballotOptions"])
            total = sum(c["votes"] for c in candidates)
            if total != part["voteTotal"]:
                raise ValueError("Precinct votes do not reconcile; output unchanged")
            rows.append({"key": identifier, "name": name, "total": total, "candidates": candidates, "mapped": identifier in available, "virtual": precinct.get("isVirtual", False)})
        if not rows or sum(r["total"] for r in rows) != race["voteTotal"]:
            raise ValueError("Precinct totals do not reconcile to the county contest total")
        return {"id": item["id"], "office": office, "name": text(race["name"]), "total": race["voteTotal"], "asOf": current["asOf"], "official": current["isOfficialResults"], "rows": rows,
                "mapped": sum(r["mapped"] for r in rows), "unmapped": [r["name"] for r in rows if not r["mapped"]]}

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        races = list(pool.map(contest, contests))
    if len(races) != 4 or {r["office"] for r in races} != {"senate", "governor", "house"}:
        raise ValueError("Missing Senate, governor or House contests; output unchanged")
    result = {"capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "county": "Cuyahoga", "state": "Ohio", "source": PUBLIC,
              "geometrySource": GEOGRAPHY, "geometryItem": "https://www.arcgis.com/home/item.html?id=933db63595cc49f5a1c9eccebf84d536", "features": features, "races": races}
    target = ROOT / "ohio-precinct-results-2026-data.js"
    temporary = target.with_suffix(".tmp")
    temporary.write_text("// Actual county precinct returns; exact normalized-name joins only.\nwindow.OHIO_PRECINCT_RESULTS_2026 = " + json.dumps(result, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    for race in races:
        print(race["name"], f"{race['mapped']}/{len(race['rows'])} precincts mapped; {race['total']:,} votes; unmapped: {race['unmapped']}")


if __name__ == "__main__":
    build()

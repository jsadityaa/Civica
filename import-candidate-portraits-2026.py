"""Find verified candidate biography portraits; never infer identity from images.

Uses Wikipedia biographies matched by full name and election state. Commons
image metadata records source, author, and license for attribution. Existing
2024 headshots remain a fallback; this file imports no election results.
"""
import concurrent.futures
import html
import json
import re
import time
import urllib.parse
import urllib.request
import urllib.error
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HEADERS = {"User-Agent": "PolycivicPortraitLookup/1.0"}


def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=25) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503) or attempt == 3:
                raise
            delay = int(error.headers.get("Retry-After", "30"))
            if delay > 180:
                raise
            print(f"Source rate limit; waiting {delay}s", flush=True)
            time.sleep(delay)


def api(domain, **params):
    cache = Path("/tmp/polycivic-portrait-api-cache.json")
    saved = json.loads(cache.read_text()) if cache.exists() else {}
    url = "https://" + domain + "/w/api.php?" + urllib.parse.urlencode({"action": "query", "format": "json", **params})
    if url in saved:
        return saved[url]
    time.sleep(2)
    result = json.loads(get(url))
    saved[url] = result
    cache.write_text(json.dumps(saved))
    return result


def read(name):
    return json.loads((ROOT / name).read_text().split(" = ", 1)[1].rstrip(";\n"))


def clean(value):
    return html.unescape(re.sub("<[^>]*>", "", value or "")).strip()


def normalized(value):
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", value.lower())


def build():
    candidates = {}
    major = set()
    for office in read("midterms-2026-results-data.js")["offices"].values():
        for race in office["races"]:
            if race["office"] in ("S", "G"):
                major.update(" ".join(filter(None, [c.get("first"), c.get("last")])) for c in sorted(race["candidates"], key=lambda c: -c["votes"])[:2])
            for c in race["candidates"]:
                name = " ".join(filter(None, [c.get("first"), c.get("last")]))
                if not c.get("first") or name.lower() in {"other", "write-in", "write in"}:
                    continue
                candidates.setdefault(name, {"ids": set(), "states": set()})
                candidates[name]["ids"].add(c["id"])
                candidates[name]["states"].add(race["stateName"])
    found = {}
    names = sorted(candidates)
    for offset in range(0, len(names), 35):
        group = names[offset:offset + 35]
        result = api("en.wikipedia.org", titles="|".join(group), prop="pageimages|extracts|pageterms", pithumbsize=200, exintro=1, explaintext=1, wbptterms="description", redirects=1)
        aliases = {r["from"]: r["to"] for r in result.get("query", {}).get("normalized", []) + result.get("query", {}).get("redirects", [])}
        pages = {p["title"]: p for p in result.get("query", {}).get("pages", {}).values()}
        for name in group:
            title = name
            for _ in range(4):
                title = aliases.get(title, title)
            page = pages.get(title, {})
            intro = page.get("extract", "")
            desc = " ".join(page.get("terms", {}).get("description", []))
            image = page.get("pageimage", "")
            if not page.get("thumbnail") or not image or re.search(r"flag|logo|signature|seal|map\.", image, re.I):
                continue
            # A name alone cannot establish identity. Require the relevant state
            # in a political biography, including common nonprofit challengers.
            if not any(state.lower() in intro.lower() for state in candidates[name]["states"]):
                continue
            if not re.search(r"politici|senat|congress|governor|election|candidate|representative|legislat", intro + " " + desc, re.I):
                continue
            if normalized(name.split()[-1]) not in normalized(intro[:1200]):
                continue
            found[name] = {"name": name, "file": image, "image": page["thumbnail"]["source"].split("?")[0], "biography": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))}
        print(f"Checked {min(offset + 35, len(names))}/{len(names)} biographies; {len(found)} portraits", flush=True)
    aliases = {"Doug Jones": "Doug Jones (politician)", "Josh Green": "Josh Green (politician)", "Rick Jackson": "Rick Jackson (businessman)", "Joseph Lombardo": "Joe Lombardo", "Greggory Hull": "Gregg Hull", "Charles Booker": "Charles Booker (American politician)", "Ben Lujan": "Ben Ray Luján", "John Sununu": "John E. Sununu", "David Crowley": "David Crowley (Wisconsin politician)", "Jermaine Johnson": "Jermaine Johnson (politician)", "Michael Minogue": "Mike Minogue (businessman)", "Kenneth Block": "Ken Block (politician)", "Alan Wilson": "Alan Wilson (South Carolina politician)", "Thomas Tuberville": "Tommy Tuberville", "Keisha Bottoms": "Keisha Lance Bottoms", "Edward Markey": "Ed Markey", "Shelley Capito": "Shelley Moore Capito", "Robert Charles": "Robert Charles (attorney)", "Terri Pickens": "Terri Pickens Manweiler"}
    alternatives = {}
    remaining_file = ROOT / "candidate-portraits-2026-unresolved.json"
    remaining_names = {c["name"] for c in json.loads(remaining_file.read_text())} if remaining_file.exists() else set()
    for name in (major | remaining_names) - found.keys():
        if name not in candidates:
            continue
        for title in [aliases.get(name, name), name + " (politician)", name + " (American politician)"]:
            alternatives[title] = name
    titles = sorted(alternatives)
    for offset in range(0, len(titles), 35):
        result = api("en.wikipedia.org", titles="|".join(titles[offset:offset + 35]), prop="pageimages|extracts|pageterms", pithumbsize=200, exintro=1, explaintext=1, wbptterms="description", redirects=1)
        resolved = dict(alternatives)
        redirects = result.get("query", {}).get("normalized", []) + result.get("query", {}).get("redirects", [])
        for _ in range(3):
            for alias in redirects:
                if alias["from"] in resolved:
                    resolved[alias["to"]] = resolved[alias["from"]]
        for p in result.get("query", {}).get("pages", {}).values():
            name = resolved.get(p["title"])
            if not name or not p.get("thumbnail") or not p.get("pageimage"):
                continue
            intro = p.get("extract", "")
            if not any(state.lower() in intro.lower() for state in candidates[name]["states"]):
                continue
            if not re.search(r"politici|senat|congress|governor|election|candidate|representative|legislat", intro[:1200], re.I):
                continue
            if normalized(name.split()[-1]) not in normalized(intro[:1200]):
                continue
            found[name] = {"name": name, "file": p["pageimage"], "image": p["thumbnail"]["source"].split("?")[0], "biography": "https://en.wikipedia.org/wiki/" + urllib.parse.quote(p["title"].replace(" ", "_"))}
    existing = read("candidate-portraits-2026.js") if (ROOT / "candidate-portraits-2026.js").exists() else {}
    found = {name: item for name, item in found.items() if not all(id in existing for id in candidates[name]["ids"])}
    metadata = {}
    cache = Path("/tmp/polycivic-portrait-api-cache.json")
    for url, response in (json.loads(cache.read_text()) if cache.exists() else {}).items():
        if "commons.wikimedia.org" not in url:
            continue
        for p in response.get("query", {}).get("pages", {}).values():
            if p.get("imageinfo"):
                metadata[p["title"].removeprefix("File:").replace("_", " ")] = p["imageinfo"][0]
    files = sorted({item["file"] for item in found.values() if item["file"].replace("_", " ") not in metadata})
    for offset in range(0, len(files), 35):
        result = api("commons.wikimedia.org", titles="|".join("File:" + f for f in files[offset:offset + 35]), prop="imageinfo", iiprop="extmetadata|url", redirects=1)
        for p in result.get("query", {}).get("pages", {}).values():
            if p.get("imageinfo"):
                metadata[p["title"].removeprefix("File:").replace("_", " ")] = p["imageinfo"][0]
    folder = ROOT / "assets/candidates/2026"
    folder.mkdir(parents=True, exist_ok=True)
    def download(item):
        meta = metadata.get(item["file"].replace("_", " "), {})
        extra = meta.get("extmetadata", {})
        license = clean(extra.get("LicenseShortName", {}).get("value", ""))
        if not re.search(r"public domain|^CC0(?: |$)|^CC BY(?:-SA)?(?: [0-9.]+)?$", license, re.I):
            return []
        ids = sorted(candidates[item["name"]]["ids"])
        try:
            image = get(item["image"])
            ext = ".jpg" if image[:2] == b"\xff\xd8" else ".png" if image[:8] == b"\x89PNG\r\n\x1a\n" else None
            if not ext:
                return []
            path = folder / (ids[0] + ext)
            path.write_bytes(image)
            record = {"name": item["name"], "image": "./" + str(path.relative_to(ROOT)), "source": meta.get("descriptionurl", item["biography"]), "biography": item["biography"], "author": clean(extra.get("Artist", {}).get("value", "")), "license": license, "licenseUrl": extra.get("LicenseUrl", {}).get("value", "")}
            return [(id, record) for id in ids]
        except Exception as error:
            print("Portrait unavailable: " + item["name"] + " · " + str(error), flush=True)
            return []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        records = {**existing, **dict(pair for batch in pool.map(download, found.values()) for pair in batch)}
    if not records:
        raise ValueError("No verified portraits; existing manifest unchanged")
    target = ROOT / "candidate-portraits-2026.js"
    temporary = target.with_suffix(".tmp")
    temporary.write_text("// Verified biography portraits. Source and license retained per candidate.\nwindow.CANDIDATE_PORTRAITS_2026 = " + json.dumps(records, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    unresolved = [{"name": name, "states": sorted(item["states"]), "ids": sorted(item["ids"])} for name, item in candidates.items() if not any(id in records for id in item["ids"])]
    (ROOT / "candidate-portraits-2026-unresolved.json").write_text(json.dumps(unresolved, indent=2) + "\n")
    print(f"Saved {len(records)} verified candidate portraits; {len(unresolved)} biographies unresolved.", flush=True)


if __name__ == "__main__":
    build()

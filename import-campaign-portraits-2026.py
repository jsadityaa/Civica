"""Discover missing portraits in public state voter guides.

The Ballot Brief state pages identify the person, party, campaign source, and
portrait URL together. Match all three identity fields before importing. Photo
copyright remains with its owner; source links and attribution are retained.
"""
import concurrent.futures
import argparse
import html
import json
import re
import time
import urllib.parse
from pathlib import Path
from importlib.util import spec_from_file_location, module_from_spec

ROOT = Path(__file__).resolve().parent
spec = spec_from_file_location("portraits", ROOT / "import-candidate-portraits-2026.py")
base = module_from_spec(spec)
spec.loader.exec_module(base)


def key(name):
    words = re.findall(r"[\w'-]+", name)
    words = [base.normalized(w) for w in words if base.normalized(w) not in {"jr", "sr", "ii", "iii", "iv"}]
    if not words:
        return ""
    nicknames = {"thomas": "tom", "tommy": "tom", "robert": "bob", "bobby": "bob", "michael": "mike", "joseph": "joe", "william": "bill", "edward": "ed", "kenneth": "ken", "greggory": "gregg", "benjamin": "ben", "daniel": "dan", "richard": "rick", "raymond": "ray", "christopher": "chris"}
    return nicknames.get(words[0], words[0]) + ":" + words[-1]


def attributes(tag):
    return {k: html.unescape(v) for k, v in re.findall(r'([\w-]+)="([^"]*)"', tag)}


def collect_state(item):
    code, name = item
    url = "https://theballotbrief.com/state/" + name.lower().replace(" ", "-")
    cache = Path("/tmp/polycivic-state-portrait-pages")
    cache.mkdir(exist_ok=True)
    path = cache / (code + ".html")
    try:
        if not path.exists():
            time.sleep(.5)
            path.write_bytes(base.get(url))
        page = path.read_text()
        result = []
        for chunk in page.split('<div class="bl-cand">')[1:]:
            image = re.search(r'<img\b[^>]*class="bl-photo"[^>]*>', chunk)
            party = re.search(r'class="bl-party"[^>]*>(.*?)</', chunk, re.S)
            if not image or not party:
                continue
            image = attributes(image.group())
            if not image.get("src", "").startswith("https://") or not image.get("alt"):
                continue
            if re.search(r"placeholder|silhouette|no[-_ ]?photo|no[-_ ]?image", image["src"], re.I):
                continue
            campaign = re.search(r'<a\b[^>]*href="([^"]+)"[^>]*>Campaign site', chunk)
            result.append({"name": image["alt"], "party": base.clean(party.group(1)), "image": image["src"], "source": html.unescape(campaign.group(1)) if campaign else url, "index": url, "state": code})
        print(f"{code}: {len(result)} publicly identified portraits", flush=True)
        return result
    except Exception as error:
        print(f"{code}: source unavailable: {error}", flush=True)
        return []


def build():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit-only", action="store_true")
    args = parser.parse_args()
    data = base.read("midterms-2026-results-data.js")
    supplement = base.read("race-candidates-2026-data.js") if (ROOT / "race-candidates-2026-data.js").exists() else {}
    for office in data["offices"].values():
        for race in office["races"]:
            known = {c["id"] for c in race["candidates"]}
            race["candidates"].extend(c for c in supplement.get(race["id"], {}).get("candidates", []) if c["id"] not in known)
    existing = base.read("candidate-portraits-2026.js")
    old = base.read("house-candidate-images.js")
    archive = {}
    def remember(state, party, name, image):
        if image:
            archive.setdefault((state, key(name), party), set()).add(image)
    state_codes = {race["stateName"]: race["state"] for office in data["offices"].values() for race in office["races"]}
    for race in base.read("house-2024-data.js")["districts"].values():
        for candidate in race["candidates"]:
            remember(race["state"], {"D": "Dem", "R": "GOP", "I": "Ind"}.get(candidate["party"], candidate["party"]), candidate["name"], old.get(candidate["name"]))
    for filename in ("senate-2024-data.js", "governor-2024-data.js"):
        for race in base.read(filename)["races"]:
            old.update({c["name"]: c["imageUrl"] for c in race.get("tooltipRows", race.get("candidates", [])) if c.get("imageUrl")})
            state = race.get("code") or state_codes.get(race.get("state"))
            for candidate in race.get("tooltipRows", race.get("candidates", [])):
                party = {"Dem.": "Dem", "Rep.": "GOP", "D": "Dem", "R": "GOP", "Ind.": "Ind", "I": "Ind"}.get(candidate["party"], candidate["party"])
                remember(state, party, candidate["name"], candidate.get("imageUrl"))
    candidates = {}
    states = {}
    for office in data["offices"].values():
        for race in office["races"]:
            states[race["state"]] = race["stateName"]
            for c in race["candidates"]:
                name = " ".join(filter(None, [c.get("first"), c.get("last")]))
                if existing.get(c["id"], {}).get("author") == "Existing candidate photo archive" and existing[c["id"]]["image"] not in archive.get((race["state"], key(name), c["party"]), set()):
                    del existing[c["id"]]
                if not c.get("first") or c["id"] in existing or name in old:
                    continue
                candidates[c["id"]] = {"name": name, "party": c["party"], "state": race["state"], "office": race["office"], "seat": race.get("seatNumber", "")}
    # Resolve unambiguous first/last-name variations in existing image mappings.
    for id, c in list(candidates.items()):
        images = archive.get((c["state"], key(c["name"]), c["party"]), set())
        if len(images) == 1:
            existing[id] = {"name": c["name"], "image": next(iter(images)), "source": next(iter(images)), "author": "Existing candidate photo archive", "license": "Source photo", "state": c["state"]}
            del candidates[id]
    if args.audit_only:
        (ROOT / "candidate-portraits-2026.js").write_text("// Candidate portraits with source attribution. Election results are separate.\nwindow.CANDIDATE_PORTRAITS_2026 = " + json.dumps(existing, separators=(",", ":")) + ";\n")
        print(f"Audited {len(existing)} portrait records against legacy state and party identities.")
        return
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        discovered = [p for batch in pool.map(collect_state, sorted(states.items())) for p in batch]
    by_identity = {}
    for p in discovered:
        party = {"Democrat": "Dem", "Democratic": "Dem", "Republican": "GOP", "Independent": "Ind", "Libertarian": "Lib", "Green": "Grn"}.get(p["party"], p["party"])
        by_identity.setdefault((p["state"], key(p["name"]), party), []).append(p)
    folder = ROOT / "assets/candidates/2026"
    unresolved = []
    jobs = []
    for id, c in candidates.items():
        matches = by_identity.get((c["state"], key(c["name"]), c["party"]), [])
        urls = {p["image"] for p in matches}
        if len(urls) != 1:
            unresolved.append({"id": id, **c, "reason": "No unique name/state/party portrait match"})
            continue
        jobs.append((id, c, matches[0]))
    def download(job):
        id, candidate, p = job
        try:
            raw = base.get(p["image"])
            ext = ".jpg" if raw[:2] == b"\xff\xd8" else ".png" if raw[:8] == b"\x89PNG\r\n\x1a\n" else ".webp" if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP" else ".avif" if b"ftypavif" in raw[:32] else None
            if not ext or len(raw) < 1500:
                raise ValueError("Image is not a usable portrait")
            target = folder / (id + ext)
            target.write_bytes(raw)
            return id, {"name": candidate["name"], "image": "./" + str(target.relative_to(ROOT)), "source": p["source"], "discoverySource": p["index"], "originalImage": p["image"], "author": "Candidate campaign / source photographer", "license": "Photo credit: source; copyright retained by owner", "state": candidate["state"]}
        except Exception as error:
            print(f"{candidate['name']}: image unavailable: {error}", flush=True)
            unresolved.append({"id": id, **candidate, "reason": str(error), "source": p["source"]})
            return None
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for item in pool.map(download, jobs):
            if item:
                existing[item[0]] = item[1]
    target = ROOT / "candidate-portraits-2026.js"
    temporary = target.with_suffix(".tmp")
    temporary.write_text("// Candidate portraits with source attribution. Election results are separate.\nwindow.CANDIDATE_PORTRAITS_2026 = " + json.dumps(existing, separators=(",", ":")) + ";\n")
    temporary.replace(target)
    (ROOT / "candidate-portraits-2026-unresolved.json").write_text(json.dumps(unresolved, indent=2) + "\n")
    print(f"Saved {len(existing)} portrait records; {len(unresolved)} candidates still need a verified usable photo.", flush=True)


if __name__ == "__main__":
    build()

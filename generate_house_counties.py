import json
import re
import html
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

root = Path("/Users/adityapoduri/Desktop/coding:comp sci/election-website")
text = (root / "house-2024-data.js").read_text()
data = json.loads(text[text.find("{"):text.rfind(";")])
districts = data["districts"]

UA = {"User-Agent": "Mozilla/5.0"}
TAG_RE = re.compile(r"<[^>]+>")
HEADER_RE = re.compile(r"<th[^>]*colspan=2[^>]*>(.*?)</th>", re.S | re.I)
ROW_RE = re.compile(r"<tr><td[^>]*\bid=(\d+)[^>]*>(.*?)</td>(.*?)</tr>", re.S | re.I)
TD_RE = re.compile(r"<td[^>]*>(.*?)</td>", re.S | re.I)


def clean(value: str) -> str:
    return " ".join(html.unescape(TAG_RE.sub(" ", value or "")).split())


def parse_int(value: str) -> int:
    value = clean(value).replace(",", "").replace("$", "").strip()
    if not value or value == "—":
        return 0
    try:
        return int(float(value))
    except Exception:
        return 0


def parse_float(value: str) -> float:
    value = clean(value).replace("%", "").replace(",", "").strip()
    if not value or value == "—":
        return 0.0
    try:
        return float(value)
    except Exception:
        return 0.0


def parse_header_entry(raw: str) -> dict:
    text = clean(raw)
    if text.lower() == "other":
        return {"name": "Other", "party": "I"}

    match = re.match(r"(.+?)\s*\(([^)]+)\)$", text)
    if match:
        name = match.group(1).replace("*", "").strip()
        party = match.group(2).split(",")[0].strip()
        return {"name": name, "party": party}

    return {"name": text.replace("*", "").strip(), "party": "I"}


def fetch_one(code: str):
    state = code.split("-")[0]
    district_num = code.split("-")[1].lstrip("0") or "0"
    url = f"https://rightdatausa.com/election_results?c=all&d={district_num}&p=N&r=N&s={state}&t=H&y=2024"
    req = urllib.request.Request(url, headers=UA)

    try:
        html_text = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore")
    except Exception as exc:
        return code, {"url": url, "error": str(exc), "candidates": [], "rows": []}

    start = html_text.find("<div id=electable>")
    if start == -1:
        return code, {"url": url, "candidates": [], "rows": []}

    end = html_text.find("</table>", start)
    block = html_text[start:end] if end != -1 else html_text[start:]

    header_entries = [parse_header_entry(item) for item in HEADER_RE.findall(block)]
    row_matches = ROW_RE.findall(block)
    rows = []

    for county_id, county_html, rest in row_matches:
        county = clean(county_html)
        cells = [clean(cell) for cell in TD_RE.findall(rest)]
        expected = len(header_entries) * 2 + 2
        if not county or len(cells) < expected:
            continue

        cursor = 0
        candidates = []
        for header in header_entries:
            votes = parse_int(cells[cursor])
            pct = parse_float(cells[cursor + 1])
            cursor += 2
            candidates.append(
                {
                    "name": header["name"],
                    "party": header["party"],
                    "votes": votes,
                    "pct": pct,
                }
            )

        margin_votes = parse_int(cells[cursor]) if cursor < len(cells) else 0
        total_votes = parse_int(cells[cursor + 1]) if cursor + 1 < len(cells) else sum(candidate["votes"] for candidate in candidates)

        rows.append(
            {
                "countyFipsSuffix": county_id,
                "county": county,
                "candidates": candidates,
                "marginVotes": margin_votes,
                "totalVotes": total_votes,
            }
        )

    return code, {"url": url, "candidates": header_entries, "rows": rows}


results = {}
with ThreadPoolExecutor(max_workers=12) as executor:
    futures = {executor.submit(fetch_one, code): code for code in districts.keys()}
    completed = 0
    for future in as_completed(futures):
        code, payload = future.result()
        results[code] = payload
        completed += 1
        if completed % 50 == 0:
            print("completed", completed)

(root / "house-district-county-results.js").write_text(
    "window.HOUSE_DISTRICT_COUNTY_RESULTS = " + json.dumps(results, separators=(",", ":")) + ";\n"
)

errors = [code for code, payload in results.items() if payload.get("error")]
nonempty = sum(1 for payload in results.values() if payload.get("rows"))
print({"districts": len(results), "nonempty": nonempty, "errors": len(errors), "sample_errors": errors[:10]})

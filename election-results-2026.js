(() => {
  const data = window.POLYCIVIC_MIDTERM_RESULTS_2026;
  if (!data || !window.d3 || !window.topojson) return;
  const office = document.body.dataset.resultsOffice;
  const offices = { senate: "U.S. Senate", governor: "Governor", house: "U.S. House" };
  const rows = key => data.offices[key].races;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const party = value => value === "Dem" ? "D" : value === "GOP" ? "R" : "I";
  const tone = value => ({ D: "dem", R: "rep", I: "ind" }[value] || "ind");
  const partyName = value => ({ Dem: "Democrat", GOP: "Republican", Ind: "Independent", NP: "Nonpartisan", NPP: "No Party Preference", NPA: "No Party Affiliation", Lib: "Libertarian", Grn: "Green", Other: "Other", Oth: "Other", Una: "Unaffiliated", NoL: "No Labels", UDC: "United Citizens", CST: "Constitution", IAP: "Independent American" }[value] || value);
  const candidateName = candidate => [candidate.first, candidate.last].filter(Boolean).join(" ");
  const candidates = race => [...race.candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
  const winner = race => race.called === true ? race.candidates.find(c => c.winner === "X") : null;
  const leader = race => winner(race) || candidates(race).find(c => c.votes > 0);
  const pct = (value, digits = 1) => Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "—";
  const number = value => Number(value || 0).toLocaleString("en-US");
  const isSpecial = race => race.office === "S" && ["FL", "OH"].includes(race.state);
  const title = race => `${race.stateName}${race.office === "H" ? ` ${Number(race.seatNumber)}` : isSpecial(race) ? " (Special)" : ""}`;
  const keyOf = race => `${race.state}-${Number(race.seatNumber)}`;
  const href = race => `./race-result-2026.html?office=${race.office === "S" ? "senate" : race.office === "G" ? "governor" : "house"}&id=${encodeURIComponent(race.id)}`;
  const stateHref = state => `./state-election-results-2026.html?name=${encodeURIComponent(state)}`;
  const margin = race => {
    const list = candidates(race);
    return list.length > 1 && list.slice(0, 2).every(c => Number.isFinite(c.percent)) ? Math.max(0, (list[0].percent - list[1].percent) * 100) : null;
  };
  const marginLabel = race => {
    const lead = leader(race), amount = margin(race);
    return lead && amount !== null ? `${party(lead.party)}+${amount < 1 ? amount.toFixed(2) : amount.toFixed(1)}` : "—";
  };
  const marginClass = race => `${tone(party(leader(race)?.party))}-${winner(race) && race.flippedSeat ? "flip" : "win"}${winner(race) ? "" : " result-2026-leading"}`;
  const stamp = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(data.capturedAt));
  const source = () => `<p class="panel-heading-note results-2026-source">Snapshot ${esc(stamp)} · Unofficial results. Pale colors indicate uncalled leaders.</p>`;
  const states = topojson.feature(window.MIDTERMS_2026_STATES, window.MIDTERMS_2026_STATES.objects.states).features.filter(f => Number(f.id) <= 56 && Number(f.id) !== 11);
  const namesByFips = new Map(states.map(f => [String(f.id).padStart(2, "0"), f.properties.name]));
  const abbr = new Map(rows("house").map(r => [r.stateName, r.state]));
  const houseByCode = new Map(rows("house").map(r => [keyOf(r), r]));
  const districts = window.HOUSE_2026_GEOJSON.features.map(feature => {
    const name = namesByFips.get(feature.properties.STATE);
    feature.properties.code = `${abbr.get(name)}-${Number(feature.properties.CD120) || 1}`;
    feature.properties.stateName = name;
    // D3 uses clockwise spherical exterior rings; Census GeoJSON follows RFC 7946.
    if (d3.geoArea(feature) > 2 * Math.PI) {
      const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      polygons.forEach(polygon => polygon.forEach(ring => ring.reverse()));
    }
    return feature;
  });
  const colors = { D: "#2879b5", R: "#cf2f2f", I: "#c8a44d" };
  function patterns(svg, prefix) {
    const defs = svg.append("defs");
    for (const [p, base] of Object.entries(colors)) {
      const pattern = defs.append("pattern").attr("id", `${prefix}-${p}-flip`).attr("patternUnits", "userSpaceOnUse").attr("width", 12).attr("height", 12).attr("patternTransform", "rotate(45)");
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", base);
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#ffffff44");
    }
  }
  function fill(race, prefix) {
    const lead = race && leader(race);
    if (!lead) return "#3a3d42";
    const p = party(lead.party);
    if (winner(race) && race.flippedSeat) return `url(#${prefix}-${p}-flip)`;
    if (!winner(race)) return { D: "#8fb4cf", R: "#d89a9a", I: "#d7c58f" }[p];
    return colors[p];
  }
  function candidateRows(race, tooltip = false) {
    return candidates(race).map(c => `<tr class="${winner(race) === c ? "winner-row" : ""}"><td>${tooltip ? `<div class="tooltip-candidate"><span class="tooltip-candidate-bar ${tone(party(c.party))}"></span><span>${esc(candidateName(c))}</span>${c.incumbent ? '<span class="tooltip-incumbent">Inc.</span>' : ""}</div>` : esc(candidateName(c)) + (c.incumbent ? ' <span class="tooltip-incumbent">Incumbent</span>' : "")}</td><td>${esc(partyName(c.party))}</td><td>${number(c.votes)}</td><td>${pct(c.percent, 2)}</td></tr>`).join("");
  }
  const tooltipHTML = race => `<div class="tooltip-header"><div class="tooltip-title">${esc(title(race))}</div><div class="tooltip-ev">${pct(race.eevp)} in</div></div>${!winner(race) ? '<p class="results-2026-call">Uncalled</p>' : race.flippedSeat ? '<p class="results-2026-call">Flip</p>' : ""}<table><thead><tr><th style="text-align:left">Candidate</th><th>Party</th><th>Votes</th><th>Pct.</th></tr></thead><tbody>${candidateRows(race, true)}</tbody></table>`;
  function drawMap(selector, features, lookup, prefix, tooltipSelector, small = false) {
    const svg = d3.select(selector);
    if (svg.empty()) return;
    const width = small ? 540 : 1600, height = small ? 520 : 900;
    const collection = { type: "FeatureCollection", features };
    const center = d3.geoCentroid(collection);
    const projection = small ? d3.geoAzimuthalEqualArea().rotate([-center[0], -center[1]]).fitExtent([[25, 25], [width - 25, height - 25]], collection) : d3.geoAlbersUsa().fitExtent([[30, 20], [1570, 880]], collection);
    const path = d3.geoPath(projection);
    const artwork = svg.append("g"); patterns(svg, prefix);
    const tooltip = d3.select(tooltipSelector);
    function show(event, feature) {
      const race = lookup(feature); if (tooltip.empty()) return;
      tooltip.html(race ? tooltipHTML(race) : `<div class="tooltip-header"><div class="tooltip-title">${esc(feature.properties.name || feature.properties.stateName)}</div></div><p>No ${esc(offices[office] || "statewide")} race on the ballot.</p>`).style("opacity", 1);
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX ?? rect.x + rect.width / 2, y = event.clientY ?? rect.y;
      tooltip.style("left", `${Math.max(12, Math.min(x + 14, window.innerWidth - tooltip.node().offsetWidth - 12))}px`).style("top", `${Math.max(12, Math.min(y + 14, window.innerHeight - tooltip.node().offsetHeight - 12))}px`);
    }
    artwork.selectAll("path").data(features).join("path").attr("d", path)
      .attr("class", prefix.includes("house") ? "house-district" : "governor-state-2024")
      .attr("fill", f => fill(lookup(f), prefix)).attr("tabindex", f => lookup(f) ? 0 : null).attr("role", f => lookup(f) ? "link" : null)
      .attr("aria-label", f => { const r = lookup(f); return r ? `${title(r)}: ${winner(r) ? "Called" : "Uncalled"}, ${marginLabel(r)}, ${pct(r.eevp)} counted` : `${f.properties.name}: no race`; })
      .on("mouseover mousemove focus", show).on("mouseout blur", () => tooltip.style("opacity", 0))
      .on("click keydown", (event, f) => {
        if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
        const race = lookup(f); if (race) { event.preventDefault(); window.location.href = href(race); }
      });
    if (!prefix.includes("house") && !small) {
      const offsets = { Michigan: [20, 18], Florida: [14, 4], Louisiana: [-10, 5], Massachusetts: [40, 0], "Rhode Island": [40, 15], "New Jersey": [25, 5], Delaware: [19, 7] };
      artwork.selectAll("text").data(features.filter(lookup)).join("text").attr("class", "map-label")
        .attr("transform", f => { const [x, y] = path.centroid(f); const [dx, dy] = offsets[f.properties.name] || [0, 0]; return `translate(${x + dx},${y + dy})`; }).text(f => abbr.get(f.properties.name));
    }
    if (!small) { const b = artwork.node().getBBox(); artwork.attr("transform", `translate(${800 - b.x - b.width / 2},${450 - b.y - b.height / 2})`); }
  }
  function summary(key) {
    const races = rows(key), held = key === "senate" ? { D: 34, R: 31 } : { D: 0, R: 0 };
    const counts = { ...held, I: 0 };
    races.forEach(r => { if (winner(r)) counts[party(winner(r).party)]++; });
    const total = key === "senate" ? 100 : 435, pending = races.filter(r => !winner(r)).length;
    for (const [p, id] of [["D", "dem"], ["R", "rep"]]) {
      document.getElementById(`${key}-${id}-count`).textContent = counts[p];
      const bar = document.getElementById(`${key}-bar-${id}`); bar.style.flex = "0 0 auto"; bar.style.width = `${counts[p] / total * 100}%`;
    }
    const track = document.querySelector(".ev-bar-track");
    const rep = document.getElementById(`${key}-bar-rep`);
    const remaining = document.createElement("div"); remaining.className = "ev-bar-fill results-2026-pending"; remaining.style.width = `${(pending + counts.I) / total * 100}%`; track.insertBefore(remaining, rep);
    const allCandidates = races.flatMap(r => r.candidates);
    for (const [p, id] of [["D", "dem"], ["R", "rep"]]) document.getElementById(`${key}-votes-${id}`).textContent = `${number(allCandidates.filter(c => party(c.party) === p).reduce((sum, c) => sum + c.votes, 0))} votes`;
    document.getElementById(`${key}-votes-total`).textContent = `${pending} uncalled${key !== "senate" && counts.I ? ` · ${counts.I} independent / other wins` : ""}`;
  }
  function board(key) {
    const target = document.getElementById(key === "senate" ? "senate-state-results-board" : key === "house" ? "house-results-board" : "governor-forecast-board");
    let sort = "margin", query = "", state = "all";
    const groups = key === "senate" ? [
      ["dem-strong", "Democratic wins", 0], ["dem-narrow", "Democratic edge", 0], ["ind", "Independent wins", 1], ["competitive", "Most competitive races", 1], ["rep-narrow", "Republican edge", 2], ["rep-strong", "Republican wins", 2]
    ] : [["dem-easy", "Democrats expected to win easily", 0], ["dem-narrow", "Democrats expected to win narrowly", 1], ["competitive", key === "house" ? "Most competitive districts" : "Most competitive states", 2], ["rep-narrow", "Republicans expected to win narrowly", 3], ["rep-easy", "Republicans expected to win easily", 4]];
    function group(race) {
      const p = party(leader(race)?.party), amount = margin(race) || 0;
      if (key === "senate") {
        if (!winner(race) || amount < 5) return "competitive";
        if (p === "I") return "ind";
        return `${tone(p)}-${amount < 10 ? "narrow" : "strong"}`;
      }
      const rating = race.rating || "toss-up";
      return /^(solid|likely)-d$/.test(rating) ? "dem-easy" : rating === "lean-d" ? "dem-narrow" : /^(solid|likely)-r$/.test(rating) ? "rep-easy" : rating === "lean-r" ? "rep-narrow" : "competitive";
    }
    function render() {
      const columns = Array.from({ length: key === "senate" ? 3 : 5 }, () => []);
      const filtered = rows(key).filter(r => (state === "all" || r.state === state) && (!query || [title(r), keyOf(r), ...r.candidates.map(candidateName)].join(" ").toLowerCase().includes(query)));
      groups.forEach(([id, heading, column]) => {
        const list = filtered.filter(r => group(r) === id).sort((a, b) => sort === "alphabetical" ? a.stateName.localeCompare(b.stateName) || Number(a.seatNumber) - Number(b.seatNumber) : (margin(b) || 0) - (margin(a) || 0) || title(a).localeCompare(title(b)));
        if (key === "senate" && !list.length) return;
        columns[column].push(`<section class="state-results-group"><h3 class="state-results-title">${heading}</h3><table class="state-results-table"><thead><tr><th>${key === "house" ? "District" : "State"}</th><th>Margin</th><th>% In</th></tr></thead><tbody>${list.length ? list.map(r => `<tr><td><a class="state-link" href="${href(r)}">${esc(key === "house" ? keyOf(r) : title(r))}</a>${winner(r) ? "" : '<span class="results-2026-uncalled">Uncalled</span>'}</td><td><span class="margin-box ${marginClass(r)}">${marginLabel(r)}</span></td><td class="state-percent">${pct(r.eevp)}</td></tr>`).join("") : '<tr class="state-results-empty-row"><td colspan="3">No matching races.</td></tr>'}</tbody></table></section>`);
      });
      target.innerHTML = `<div class="state-results-grid ${key === "house" ? "house-results-grid" : key === "governor" ? "governor-results-grid" : ""}">${columns.map(list => `<div class="state-results-column">${list.join("")}</div>`).join("")}</div>`;
    }
    document.querySelectorAll(".state-results-sort-button").forEach(button => button.addEventListener("click", () => {
      sort = button.dataset.sort;
      document.querySelectorAll(".state-results-sort-button").forEach(b => { b.classList.toggle("is-active", b === button); b.setAttribute("aria-pressed", String(b === button)); }); render();
    }));
    const search = document.getElementById("house-district-search");
    search?.addEventListener("input", () => { query = search.value.trim().toLowerCase(); render(); });
    const select = document.getElementById("house-state-filter");
    if (select) {
      [...new Map(rows(key).map(r => [r.state, r.stateName]))].sort((a, b) => a[1].localeCompare(b[1])).forEach(([code, name]) => { const option = document.createElement("option"); option.value = code; option.textContent = name; select.append(option); });
      select.addEventListener("change", () => { state = select.value; render(); });
    }
    render();
  }
  function resultCard(race, key, index) {
    const lead = leader(race), p = lead ? party(lead.party) : null;
    const status = winner(race) ? "wins" : "leads in";
    const titleText = lead ? `${candidateName(lead)} ${status} ${race.stateName}${race.office === "H" ? ` District ${Number(race.seatNumber)}` : ""}.` : "No votes reported.";
    return `<section class="content-panel state-election-section" id="state-election-${key}-${index}"><div class="panel-heading"><h2>${esc(offices[key])}${isSpecial(race) ? " Special Election" : race.office === "H" ? ` · District ${Number(race.seatNumber)}` : ""}</h2></div><div class="state-election-two-column"><section class="detail-map-card state-election-map-card"><div class="detail-map-head"><h3>${race.office === "H" ? "District Map" : "State Map"}</h3></div><div class="detail-map-canvas state-election-map-canvas"><svg id="detail-map-${race.id}" viewBox="0 0 540 520" preserveAspectRatio="xMidYMid meet"></svg></div></section><section class="state-election-result-card winner-${tone(p)}" style="background:${p ? colors[p] : "#777e8b"}"><h3>${esc(titleText)}</h3><div class="state-election-stats"><div><span>Margin</span><strong>${marginLabel(race)}</strong></div><div><span>Total Votes</span><strong>${number(race.candidates.reduce((sum, c) => sum + c.votes, 0))}</strong></div></div><p>${winner(race) ? "Race called" : "Race uncalled"} · ${pct(race.eevp)} estimated votes counted${race.rankedChoice ? " · Ranked-choice voting" : ""}</p><div class="detail-vote-table-wrap"><table class="detail-vote-table"><thead><tr><th>Candidate</th><th>Party</th><th>Votes</th><th>Pct.</th></tr></thead><tbody>${candidateRows(race)}</tbody></table></div>${office === "state" ? `<a class="state-election-detail-button" href="${href(race)}">See results in detail &gt;</a>` : ""}</section></div></section>`;
  }
  function details() {
    const params = new URLSearchParams(window.location.search);
    const requestedOffice = params.get("office");
    let selected = [];
    if (office === "race" && offices[requestedOffice]) selected = rows(requestedOffice).filter(r => r.id === params.get("id")).map(r => [requestedOffice, r]);
    else if (office === "state") for (const key of ["senate", "governor", "house"]) selected.push(...rows(key).filter(r => r.stateName === (params.get("name") || "Alabama")).sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber)).map(r => [key, r]));
    const content = document.getElementById("results-detail-content"), heading = document.getElementById("results-detail-title");
    if (!selected.length) { heading.textContent = "Results not found"; content.innerHTML = '<p>Select a state from <a href="./state-results-2026.html">State Results</a>.</p>'; return; }
    heading.textContent = office === "state" ? `${selected[0][1].stateName} Election Results` : `${title(selected[0][1])} ${offices[selected[0][0]]} Election Results`;
    document.title = `${heading.textContent} 2026 | Polycivic`;
    const nav = document.getElementById("results-detail-nav");
    nav.innerHTML = office === "race" ? `<a class="detail-state-results-link" href="${stateHref(selected[0][1].stateName)}">See all ${esc(selected[0][1].stateName)} election results</a>` : [...new Set(selected.map(([key]) => key))].map(key => `<a href="#state-election-${key}-${selected.findIndex(([k]) => k === key)}">${offices[key]}</a>`).join("");
    const statewide = office === "state" ? selected.filter(([key]) => key !== "house") : selected;
    content.innerHTML = statewide.map(([key, race], index) => resultCard(race, key, index)).join("");
    if (office === "state") {
      const houseRaces = selected.filter(([key]) => key === "house").map(([, race]) => race);
      content.insertAdjacentHTML("beforeend", `<section class="content-panel state-election-section" id="state-election-house-${selected.findIndex(([key]) => key === "house")}"><div class="panel-heading"><h2>U.S. House of Representatives</h2></div><div class="state-election-two-column"><section class="detail-map-card state-election-map-card"><div class="detail-map-head"><h3>Congressional District Map</h3></div><div class="detail-map-canvas state-election-map-canvas"><svg id="state-election-house-map" viewBox="0 0 540 520" preserveAspectRatio="xMidYMid meet"></svg></div></section><div><div class="state-election-house-table-wrap"><table class="state-election-house-table"><thead><tr><th>District</th><th>Margin</th><th colspan="2">Candidates</th><th>% In</th><th aria-label="District details"></th></tr></thead><tbody>${houseRaces.map(race => {
        const list = candidates(race), lead = leader(race), runner = list.find(c => c !== lead), p = tone(party(lead?.party));
        return `<tr class="state-election-house-row" data-district-link="${href(race)}" tabindex="0"><td class="state-election-house-district-cell">${Number(race.seatNumber)}</td><td class="state-election-house-margin state-election-house-margin--${p}">${marginLabel(race)}</td><td class="state-election-house-candidate state-election-house-candidate--winner state-election-house-candidate--${p}${winner(race) && race.flippedSeat ? " state-election-house-candidate--flip" : ""}"><span class="state-election-house-candidate-name">${esc(lead ? candidateName(lead) : "No votes reported")}${lead?.incumbent ? ' <span class="state-election-district-incumbent">Incumbent</span>' : ""}</span><span class="state-election-house-party">${lead ? esc(partyName(lead.party)) : ""}${winner(race) ? "" : " · Uncalled"}</span></td><td class="state-election-house-candidate state-election-house-candidate--runner state-election-house-candidate--${tone(party(runner?.party))}">${runner ? `<span class="state-election-house-candidate-name">${esc(candidateName(runner))}${runner.incumbent ? ' <span class="state-election-district-incumbent">Incumbent</span>' : ""}</span><span class="state-election-house-party">${esc(partyName(runner.party))}</span>` : "Unopposed"}</td><td class="state-election-house-percent">${pct(race.eevp)}</td><td class="state-election-house-arrow">›</td></tr>`;
      }).join("")}</tbody></table></div></div></div></section>`);
      content.querySelectorAll(".state-election-house-row").forEach(row => {
        row.addEventListener("click", () => { window.location.href = row.dataset.districtLink; });
        row.addEventListener("keydown", event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); window.location.href = row.dataset.districtLink; } });
      });
      const houseRows = [...content.querySelectorAll(".state-election-house-row")];
      if (houseRows.length > 5) {
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "state-election-district-toggle";
        let expanded = false;
        const update = () => {
          houseRows.forEach((row, index) => { row.hidden = !expanded && index >= 5; });
          toggle.textContent = expanded ? "Show fewer districts" : `Show all ${houseRows.length} districts`;
          toggle.setAttribute("aria-expanded", String(expanded));
        };
        toggle.addEventListener("click", () => { expanded = !expanded; update(); });
        content.querySelector(".state-election-house-table-wrap").parentElement.append(toggle);
        update();
      }
    }
    content.insertAdjacentHTML("beforeend", source(selected[0][0]));
    const tooltip = document.createElement("div"); tooltip.className = "tooltip"; tooltip.id = "results-detail-tooltip"; document.body.append(tooltip);
    statewide.forEach(([key, race]) => {
      const features = key === "house" ? districts.filter(f => f.properties.code === keyOf(race)) : states.filter(f => f.properties.name === race.stateName);
      if ((key === "senate" || key === "house") && window.renderCountyMap2026) window.renderCountyMap2026(`#detail-map-${race.id}`, race, key === "house" ? features[0] : null);
      else drawMap(`#detail-map-${race.id}`, features, () => race, `detail-${key}-${race.id}`, "#results-detail-tooltip", true);
    });
    if (office === "state") drawMap("#state-election-house-map", districts.filter(f => f.properties.stateName === selected[0][1].stateName), f => houseByCode.get(f.properties.code), "detail-house-state", "#results-detail-tooltip", true);
  }
  if (["senate", "governor", "house"].includes(office)) {
    if (office !== "governor") summary(office);
    const mapId = office === "senate" ? "#senate-election-map" : office === "governor" ? "#governor-election-map" : "#house-district-map";
    const lookup = new Map(rows(office).map(r => [r.stateName, r]));
    drawMap(mapId, office === "house" ? districts : states, f => office === "house" ? houseByCode.get(f.properties.code) : lookup.get(f.properties.name), `results-${office}`, `#${office}-map-tooltip`);
    board(office);
    document.querySelector("main").insertAdjacentHTML("beforeend", source(office));
  } else if (office === "states") {
    const grid = document.getElementById("state-results-hub-grid");
    const stateNames = [...abbr.keys()].sort();
    grid.innerHTML = stateNames.map((state, i) => {
      const race = rows("senate").find(r => r.stateName === state) || rows("governor").find(r => r.stateName === state);
      const available = ["senate", "governor"].filter(key => rows(key).some(r => r.stateName === state)).map(key => offices[key]);
      const count = rows("house").filter(r => r.stateName === state).length;
      return `<a class="state-results-shape-card" href="${stateHref(state)}"><span class="state-results-shape-card__shape"><svg class="state-results-shape-card__svg" id="state-hub-map-${i}" viewBox="0 0 160 110" aria-hidden="true"></svg></span><span class="state-results-shape-card__name">${esc(state)}</span><span class="state-results-shape-card__meta">${race ? `${winner(race) ? "Called" : "Leading"}: ${esc(candidateName(leader(race)))} · ${marginLabel(race)}` : "U.S. House results"}</span><span class="state-results-shape-card__links"><span>${available.join(" · ") || "U.S. House results"}</span><span>${count} House district${count === 1 ? "" : "s"}</span></span></a>`;
    }).join("");
    stateNames.forEach((name, i) => {
      const feature = states.find(f => f.properties.name === name);
      const race = rows("senate").find(r => r.stateName === name) || rows("governor").find(r => r.stateName === name);
      const svg = d3.select(`#state-hub-map-${i}`); patterns(svg, `hub-${i}`);
      const center = d3.geoCentroid(feature);
      const path = d3.geoPath(d3.geoAzimuthalEqualArea().rotate([-center[0], -center[1]]).fitExtent([[12, 10], [148, 92]], feature));
      svg.append("path").attr("class", "state-results-shape-card__path").attr("d", path(feature)).attr("fill", fill(race, `hub-${i}`));
    });
    document.querySelector("main").insertAdjacentHTML("beforeend", source("senate"));
  } else details();
})();

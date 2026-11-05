(() => {
  const bundle = window.COUNTY_RESULTS_2026;
  if (!bundle || !window.d3 || !window.topojson) return;
  const ns = "http://www.w3.org/2000/svg";
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const name = candidate => [candidate.first, candidate.last].filter(Boolean).join(" ");
  const party = candidate => candidate.party === "Dem" ? "D" : candidate.party === "GOP" ? "R" : "I";
  const partyName = code => ({ Dem: "Democrat", GOP: "Republican", Ind: "Independent", Lib: "Libertarian", Grn: "Green", NP: "Nonpartisan", Other: "Other" }[code] || code);
  const percent = value => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "Unavailable";
  const choices = row => [...(row?.candidates || [])].sort((a, b) => b.votes - a.votes);
  function paint(row) {
    const sorted = choices(row), total = sorted.reduce((sum, c) => sum + c.votes, 0);
    if (!total || (sorted[1] && sorted[0].votes === sorted[1].votes)) return "#858b97";
    const share = sorted[0].votes / total;
    const palettes = { D: ["#a6c8e2", "#6ca6d0", "#2879b5", "#18517e"], R: ["#edb5b5", "#df8181", "#cf2f2f", "#8e2020"], I: ["#e1d3a8", "#d5bd76", "#c8a44d", "#8f712a"] };
    return palettes[party(sorted[0])][share >= .7 ? 3 : share >= .6 ? 2 : share >= .5 ? 1 : 0];
  }
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip county-tooltip-2026";
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  document.body.append(tooltip);
  const hide = () => { tooltip.style.opacity = "0"; tooltip.setAttribute("aria-hidden", "true"); };
  function show(event, row, label, race) {
    tooltip.innerHTML = `<div class="tooltip-header"><div class="tooltip-title">${escape(label)}</div><div class="tooltip-ev">${row ? `${percent(row.eevp)} in` : ""}</div></div>${race.office === "H" ? `<p class="results-2026-call">District ${Number(race.seatNumber)} portion</p>` : ""}${row ? `<table><thead><tr><th style="text-align:left">Candidate</th><th>Party</th><th>Votes</th><th>Pct.</th></tr></thead><tbody>${choices(row).map(c => `<tr><td><div class="tooltip-candidate"><span class="tooltip-candidate-bar ${party(c) === "D" ? "dem" : party(c) === "R" ? "rep" : "ind"}"></span><span>${escape(name(c))}</span>${c.incumbent ? '<span class="tooltip-incumbent">Inc.</span>' : ""}</div></td><td>${escape(partyName(c.party))}</td><td>${Number(c.votes).toLocaleString("en-US")}</td><td>${percent(c.percent)}</td></tr>`).join("")}</tbody></table>` : '<p>County-level returns are not available for this race.</p>'}`;
    tooltip.style.opacity = "1";
    tooltip.setAttribute("aria-hidden", "false");
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX ?? rect.x + rect.width / 2, y = event.clientY ?? rect.y;
    tooltip.style.left = `${Math.max(12, Math.min(x + 14, window.innerWidth - tooltip.offsetWidth - 12))}px`;
    tooltip.style.top = `${Math.max(12, Math.min(y + 14, window.innerHeight - tooltip.offsetHeight - 12))}px`;
  }
  window.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("resize", hide);
  document.addEventListener("keydown", event => { if (event.key === "Escape") hide(); });
  document.addEventListener("pointerdown", event => { if (!event.target.closest(".county-map-2026")) hide(); });
  function bind(paths, race, lookup, labels) {
    paths.attr("class", "county-map-2026-region").attr("fill", feature => paint(lookup(feature)))
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", feature => `${labels(feature)}: ${lookup(feature) ? `${percent(lookup(feature).eevp)} estimated votes counted` : "county returns unavailable"}`)
      .on("mouseover mousemove focus click", (event, feature) => show(event, lookup(feature), labels(feature), race))
      .on("mouseout blur", hide)
      .on("keydown", (event, feature) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); show(event, lookup(feature), labels(feature), race); } });
  }
  function table(svg, race, local, unit) {
    if (!local.length) return;
    const section = svg.closest(".state-election-section");
    const target = document.createElement("section"); target.className = "detail-county-board county-board-2026";
    target.innerHTML = `<div class="detail-county-board-head"><h3>${unit} Results</h3></div><div class="detail-county-board-table-wrap"><table class="detail-county-board-table"><thead><tr><th>${unit}</th><th>Margin</th><th>Votes</th><th>% In</th></tr></thead><tbody>${[...local].sort((a, b) => choices(b).reduce((s, c) => s + c.votes, 0) - choices(a).reduce((s, c) => s + c.votes, 0)).map(row => {
      const sorted = choices(row), total = sorted.reduce((sum, c) => sum + c.votes, 0), lead = sorted[0];
      const margin = total && sorted[1] ? `${party(lead)}+${((lead.votes - sorted[1].votes) / total * 100).toFixed(1)}` : "—";
      return `<tr data-county="${escape(row.fips)}"><td>${escape(row.name || row.fips)}</td><td>${margin}</td><td>${total.toLocaleString("en-US")}</td><td>${percent(row.eevp)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
    const allRows = [...target.querySelectorAll("tbody tr")];
    if (allRows.length > 10) {
      let expanded = false; const toggle = document.createElement("button");
      toggle.type = "button"; toggle.className = "state-election-district-toggle";
      const update = () => { allRows.forEach((row, i) => { row.hidden = !expanded && i >= 10; }); toggle.textContent = expanded ? `Show fewer ${unit.toLowerCase()} results` : `Show all ${allRows.length} ${unit.toLowerCase()} results`; toggle.setAttribute("aria-expanded", String(expanded)); };
      toggle.addEventListener("click", () => { expanded = !expanded; update(); }); target.append(toggle); update();
    }
    section.append(target);
  }
  window.renderCountyMap2026 = (selector, race, district) => {
    const svgNode = document.querySelector(selector); if (!svgNode) return;
    const svg = d3.select(svgNode); svg.selectAll("*").remove(); svg.classed("county-map-2026", true);
    const local = bundle.races[race.id]?.rows || [];
    const byFips = new Map(local.map(row => [row.fips.replace(/^fips-/, ""), row]));
    const map = bundle.maps[race.state];
    const card = svgNode.closest(".detail-map-card");
    const heading = card.querySelector("h3");
    const unit = race.office === "S" && map ? map.unit : race.state === "CT" ? "Town" : "County";
    heading.textContent = `${unit} Map`;
    const legend = document.createElement("div"); legend.className = "county-map-2026-legend";
    legend.innerHTML = local.length ? '<span><i class="dem"></i>Dem.</span><span><i class="rep"></i>Rep.</span><span>Darker colors: higher vote share</span>' : '<span>County boundaries · Returns unavailable</span>';
    card.querySelector(".detail-map-head").append(legend);
    if (race.office === "S" && map && local.length) {
      svg.attr("viewBox", map.viewBox);
      const paths = svg.append("g").selectAll("path").data(map.paths).join("path").attr("d", shape => shape.d).attr("transform", shape => shape.transform || null);
      const lookup = shape => byFips.get(shape.id.replace(/^fips-/, ""));
      bind(paths, race, lookup, shape => lookup(shape)?.name || `${unit} returns unavailable`);
      table(svgNode, race, local, unit);
      return;
    }
    svg.attr("viewBox", "0 0 540 520");
    const geography = window.COUNTY_GEOGRAPHY_2026;
    const allCounties = topojson.feature(geography, geography.objects.counties).features;
    const stateFeature = topojson.feature(window.MIDTERMS_2026_STATES, window.MIDTERMS_2026_STATES.objects.states).features.find(f => f.properties.name === race.stateName);
    const prefix = String(stateFeature.id).padStart(2, "0");
    let features = district && window.DISTRICT_COUNTY_GEOGRAPHY_2026?.[district.properties.GEOID]
      ? window.DISTRICT_COUNTY_GEOGRAPHY_2026[district.properties.GEOID]
      : race.state === "CT" && window.HOUSE_TOWN_GEOJSON?.CT ? window.HOUSE_TOWN_GEOJSON.CT.features : allCounties.filter(f => String(f.id).padStart(5, "0").startsWith(prefix));
    features.forEach(feature => { if (d3.geoArea(feature) > 2 * Math.PI) { const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates; polygons.forEach(poly => poly.forEach(ring => ring.reverse())); } });
    const outline = district || stateFeature;
    const center = d3.geoCentroid(outline);
    const path = d3.geoPath(d3.geoAzimuthalEqualArea().rotate([-center[0], -center[1]]).fitExtent([[20, 20], [520, 500]], outline));
    const clipId = `county-clip-${race.id}`;
    svg.append("defs").append("clipPath").attr("id", clipId).append("path").attr("d", path(outline));
    const paths = svg.append("g").attr("clip-path", `url(#${clipId})`).selectAll("path").data(features).join("path").attr("d", path);
    const lookup = feature => byFips.get(feature.properties.GEOID || feature.properties.id || String(feature.id).padStart(5, "0"));
    const label = feature => {
      if (lookup(feature)?.name) return lookup(feature).name;
      const n = feature.properties.NAME || feature.properties.name || "County";
      return race.state === "CT" ? n : race.state === "AK" ? n : race.state === "LA" ? `${n} Parish` : race.state === "VA" && Number(feature.id) >= 51510 ? `${n} city` : `${n} County`;
    };
    bind(paths, race, lookup, label);
    svg.append("path").attr("d", path(outline)).attr("class", "county-map-2026-outline");
    if (!local.length) {
      const note = document.createElement("p"); note.className = "panel-heading-note county-map-2026-note";
      note.textContent = "Hover over or tap a county to see its name. County-level vote returns are not available for this race.";
      card.append(note);
    }
    table(svgNode, race, local, unit);
  };
})();

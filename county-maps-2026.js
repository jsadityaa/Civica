(() => {
  const bundle = window.COUNTY_RESULTS_2026;
  if (!bundle || !window.d3 || !window.topojson) return;
  const ns = "http://www.w3.org/2000/svg";
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const name = candidate => [candidate.first, candidate.last].filter(Boolean).join(" ");
  const party = candidate => candidate.party === "Dem" ? "D" : candidate.party === "GOP" ? "R" : "I";
  const partyName = code => ({ Dem: "Democrat", GOP: "Republican", Ind: "Independent", Lib: "Libertarian", Grn: "Green", NP: "Nonpartisan", Other: "Other" }[code] || code);
  const percent = value => Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "—";
  const choices = row => [...(row?.candidates || [])].sort((a, b) => b.votes - a.votes);
  function paint(row) {
    const sorted = choices(row), total = sorted.reduce((sum, c) => sum + c.votes, 0);
    if (!total || (sorted[1] && sorted[0].votes === sorted[1].votes)) return "#858b97";
    const share = sorted[0].votes / total;
    const palettes = { D: ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"], R: ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"], I: ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"] };
    return palettes[party(sorted[0])][share >= .7 ? 3 : share >= .6 ? 2 : share >= .5 ? 1 : 0];
  }
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip county-tooltip-2026";
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  document.body.append(tooltip);
  const hide = () => { tooltip.style.opacity = "0"; tooltip.setAttribute("aria-hidden", "true"); };
  function show(event, row, label, race) {
    tooltip.innerHTML = `<div class="tooltip-header"><div class="tooltip-title">${escape(label)}</div><div class="tooltip-ev">${Number.isFinite(row?.eevp) ? `${percent(row.eevp)} in` : ""}</div></div>${race.office === "H" ? `<p class="results-2026-call">District ${Number(race.seatNumber)} portion</p>` : ""}${row ? `<table><thead><tr><th style="text-align:left">Candidate</th><th>Party</th><th>Votes</th><th>Pct.</th></tr></thead><tbody>${choices(row).map(c => `<tr><td><div class="tooltip-candidate"><span class="tooltip-candidate-bar ${party(c) === "D" ? "dem" : party(c) === "R" ? "rep" : "ind"}"></span><span>${escape(name(c))}</span>${c.incumbent ? '<span class="tooltip-incumbent">Inc.</span>' : ""}</div></td><td>${escape(partyName(c.party))}</td><td>${Number(c.votes).toLocaleString("en-US")}</td><td>${percent(c.percent)}</td></tr>`).join("")}</tbody></table>` : '<p>County-level returns are not available for this race.</p>'}`;
    const ranked = choices(row);
    if (ranked[0]?.votes > 0 && ranked[0].votes > (ranked[1]?.votes || 0)) tooltip.querySelector("tbody tr")?.classList.add("winner-row");
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
      .attr("aria-label", feature => `${labels(feature)}: ${lookup(feature) ? (Number.isFinite(lookup(feature).eevp) ? `${percent(lookup(feature).eevp)} estimated votes counted` : "county returns available") : "county returns unavailable"}`)
      .on("mouseover mousemove focus click", (event, feature) => show(event, lookup(feature), labels(feature), race))
      .on("mouseout blur", hide)
      .on("keydown", (event, feature) => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); show(event, lookup(feature), labels(feature), race); } });
  }
  function table(svg, race, local, unit) {
    if (!local.length || document.body.dataset.resultsOffice === "state") return;
    const section = svg.closest(".state-election-section");
    const target = document.createElement("section"); target.className = "detail-county-board county-board-2026";
    target.innerHTML = `<div class="detail-county-board-head"><h2>${unit} Results</h2></div><div class="detail-county-board-table-wrap"><table class="detail-county-board-table senate-county-board-table"><thead><tr><th>${unit}</th><th>Margin</th><th>Votes</th><th>% In</th></tr></thead><tbody>${[...local].sort((a, b) => choices(b).reduce((s, c) => s + c.votes, 0) - choices(a).reduce((s, c) => s + c.votes, 0)).map(row => {
      const sorted = choices(row), total = sorted.reduce((sum, c) => sum + c.votes, 0), lead = sorted[0];
      const margin = total && sorted[1] ? `${party(lead)}+${((lead.votes - sorted[1].votes) / total * 100).toFixed(1)}` : "—";
      const marginTone = margin === "—" ? "none" : party(lead) === "D" ? "dem" : party(lead) === "R" ? "rep" : "ind";
      const label = (row.name || row.fips).replace(/ County$/, "");
      return `<tr data-county="${escape(row.fips)}"><td>${escape(label)}</td><td><span class="detail-county-margin ${marginTone}">${margin}</span></td><td>${total.toLocaleString("en-US")}</td><td>${percent(row.eevp)}</td></tr>`;
    }).join("")}</tbody></table></div>`;
    const allRows = [...target.querySelectorAll("tbody tr")];
    if (allRows.length > 10) {
      let expanded = false; const toggle = document.createElement("button");
      toggle.type = "button"; toggle.className = "detail-county-board-toggle";
      const update = () => { allRows.forEach((row, i) => { row.hidden = !expanded && i >= 10; }); toggle.textContent = expanded ? `Show fewer ${unit.toLowerCase()} results` : `Show all ${allRows.length} ${unit.toLowerCase()} results`; toggle.setAttribute("aria-expanded", String(expanded)); };
      toggle.addEventListener("click", () => { expanded = !expanded; update(); }); target.append(toggle); update();
    }
    // In the 2024 layout the table follows the summary in the left column.
    const mainColumn = section.querySelector(".detail-main-column");
    if (mainColumn) { mainColumn.append(target); return; }
    const layout = document.createElement("div"); layout.className = "detail-grid";
    const column = document.createElement("div"); column.className = "detail-main-column";
    column.append(target); layout.append(column); section.after(layout);
  }
  function mapModes(svg, paths, race, lookup, labels, local, card, legend, centroid, projection) {
    if (!local.length) return;
    const control = document.createElement("div"); control.className = "state-election-map-mode";
    control.setAttribute("role", "group"); control.setAttribute("aria-label", "County map display");
    control.innerHTML = '<button class="state-election-map-mode-button is-active" type="button" data-map-mode="share" aria-pressed="true">Vote Share</button><button class="state-election-map-mode-button" type="button" data-map-mode="lead" aria-pressed="false">Size of Lead</button>';
    card.querySelector(".detail-map-head").insertBefore(control, legend);
    const leadLegend = document.createElement("div"); leadLegend.className = "state-election-lead-legend"; leadLegend.hidden = true;
    leadLegend.innerHTML = '<span><i class="dem"></i>Dem.</span><span><i class="rep"></i>Rep.</span>';
    if (local.some(row => choices(row).length && party(choices(row)[0]) === "I")) leadLegend.innerHTML += '<span><i class="ind"></i>Ind.</span>';
    legend.after(leadLegend);
    const lead = row => { const list = choices(row); return list.length > 1 ? Math.abs(list[0].votes - list[1].votes) : list[0]?.votes || 0; };
    const unit = svg.node().viewBox.baseVal.width / 540;
    const radius = d3.scaleSqrt().domain([0, d3.max(local, lead) || 1]).range([2.5 * unit, 40 * unit]);
    control.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
      hide();
      const share = button.dataset.mapMode === "share";
      legend.hidden = !share; leadLegend.hidden = share;
      control.querySelectorAll("button").forEach(b => { b.classList.toggle("is-active", b === button); b.setAttribute("aria-pressed", String(b === button)); });
      paths.attr("fill", f => share ? paint(lookup(f)) : "var(--panel)");
      svg.selectAll(".county-lead-bubbles-2026").remove();
      if (!share) {
        const circles = svg.append("g").attr("class", "county-lead-bubbles-2026").selectAll("circle")
          .data(paths.data().filter(f => choices(lookup(f)).some(c => c.votes > 0)).sort((a, b) => lead(lookup(b)) - lead(lookup(a))))
          .join("circle").attr("cx", f => centroid(f)[0]).attr("cy", f => centroid(f)[1]).attr("r", f => radius(lead(lookup(f))));
        bind(circles, race, lookup, labels);
        circles.attr("class", f => `state-election-lead-bubble ${{D:"dem",R:"rep",I:"ind"}[party(choices(lookup(f))[0])]}`);
      }
      if (projection && window.stateElectionRenderCityLabels) window.stateElectionRenderCityLabels(svg, projection, race.stateName);
    }));
  }
  window.renderCountyMap2026 = (selector, race, district) => {
    const svgNode = document.querySelector(selector); if (!svgNode) return;
    const svg = d3.select(svgNode); svg.selectAll("*").remove(); svg.classed("county-map-2026", true);
    const local = bundle.races[race.id]?.rows || [];
    const byFips = new Map(local.map(row => [row.fips.replace(/^fips-/, ""), row]));
    const map = bundle.maps[race.state];
    const card = svgNode.closest(".detail-map-card");
    const heading = card.querySelector("h3");
    const unit = race.office !== "H" && map ? map.unit : race.state === "CT" ? "Town" : "County";
    heading.textContent = `${unit} Map`;
    const legend = document.createElement("div"); legend.className = local.length ? "detail-map-legend" : "county-map-2026-legend";
    legend.innerHTML = local.length ? ['dem','rep',...(local.some(r => choices(r)[0]?.votes > 0 && party(choices(r)[0]) === 'I') ? ['ind'] : [])].map(p => `<div class="detail-map-legend-row"><span>${{dem:'Dem.',rep:'Rep.',ind:'Ind.'}[p]}</span>${[1,2,3,4].map(n => `<div class="detail-map-swatch ${p}-${n}"></div>`).join('')}</div>`).join('')+'<div class="detail-map-legend-scale"><span></span><span></span><span>50</span><span>60</span><span>70%</span></div>' : '<span>County boundaries · Returns unavailable</span>';
    card.querySelector(".detail-map-head").append(legend);
    if (race.office !== "H" && map?.unit === "Town" && local.length) {
      svg.attr("viewBox", map.viewBox);
      const paths = svg.append("g").selectAll("path").data(map.paths).join("path").attr("d", shape => shape.d).attr("transform", shape => shape.transform || null);
      const lookup = shape => byFips.get(shape.id.replace(/^fips-/, ""));
      bind(paths, race, lookup, shape => lookup(shape)?.name || `${unit} returns unavailable`);
      const centers = new Map();
      paths.each(function(feature) {
        const b = this.getBBox(), point = new DOMPoint(b.x + b.width / 2, b.y + b.height / 2);
        const center = point.matrixTransform(this.getCTM()).matrixTransform(svgNode.getCTM().inverse());
        centers.set(feature, [center.x, center.y]);
      });
      mapModes(svg, paths, race, lookup, shape => lookup(shape)?.name || unit, local, card, legend, shape => centers.get(shape));
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
    features = structuredClone(features);
    // Intersections can contain differently wound polygon fragments. Normalize
    // every exterior and hole rather than reversing an entire MultiPolygon.
    features.forEach(feature => {
      const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
      polygons.forEach(polygon => polygon.forEach((ring, index) => {
        const signed = ring.reduce((sum, point, i) => {
          const next = ring[(i + 1) % ring.length];
          return sum + point[0] * next[1] - next[0] * point[1];
        }, 0);
        if ((index === 0 && signed > 0) || (index > 0 && signed < 0)) ring.reverse();
      }));
    });
    const outline = district || stateFeature;
    const center = d3.geoCentroid(outline);
    const projection = d3.geoAzimuthalEqualArea().rotate([-center[0], -center[1]]).fitExtent([[20, 20], [520, 500]], outline);
    const path = d3.geoPath(projection);
    const clipId = `county-clip-${race.id}`;
    svg.append("defs").append("clipPath").attr("id", clipId).append("path").attr("d", path(outline));
    svg.append("path").attr("d", path(outline)).attr("fill", "#858b97").attr("aria-hidden", "true");
    const paths = svg.append("g").attr("clip-path", `url(#${clipId})`).selectAll("path").data(features).join("path").attr("d", path);
    const lookup = feature => byFips.get(feature.properties.GEOID || feature.properties.id || String(feature.id).padStart(5, "0"));
    const label = feature => {
      if (lookup(feature)?.name) return lookup(feature).name;
      const n = feature.properties.NAME || feature.properties.name || "County";
      const fips = feature.properties.id || feature.id;
      return race.state === "CT" ? n : race.state === "AK" ? n : race.state === "LA" ? `${n} Parish` : race.state === "VA" && Number(fips) >= 51510 ? `${n} city` : `${n} County`;
    };
    bind(paths, race, lookup, label);
    mapModes(svg, paths, race, lookup, label, local, card, legend, feature => path.centroid(feature), projection);
    svg.append("path").attr("d", path(outline)).attr("class", "county-map-2026-outline");
    if (window.stateElectionRenderCityLabels && !district) window.stateElectionRenderCityLabels(svg, projection, race.stateName);
    if (!local.length) {
      const note = document.createElement("p"); note.className = "panel-heading-note county-map-2026-note";
      note.textContent = "Hover over or tap a county to see its name. County-level vote returns are not available for this race.";
      card.append(note);
    } else if (race.office === "H" && features.some(feature => !lookup(feature))) {
      const note = document.createElement("p"); note.className = "panel-heading-note county-map-2026-note";
      note.textContent = "Gray areas have no published county returns for this district yet.";
      card.append(note);
    }
    table(svgNode, race, local, unit);
  };
})();

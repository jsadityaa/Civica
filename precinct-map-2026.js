(() => {
  const $ = selector => document.querySelector(selector);
  const tooltip = $('#precinct-tooltip');
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => value.toLocaleString('en-US');
  let pinned = false;
  function hideTooltip() { pinned = false; tooltip.hidden = true; }
  try {
    const data = window.OHIO_PRECINCT_RESULTS_2026;
    const race = data.races.find(r => r.office === 'senate');
    const lookup = new Map(race.rows.map(row => [row.key,row]));
    const sorted = row => [...row.candidates].sort((a,b) => b.votes-a.votes);
    const color = row => {
      if(!row?.total) return '#a5acb7';
      const dem=d3.sum(row.candidates.filter(c=>c.party==='D'),c=>c.votes);
      const rep=d3.sum(row.candidates.filter(c=>c.party==='R'),c=>c.votes);
      // Hue describes the two-party split; density independently controls shade.
      // RGB interpolation deliberately retains purple at an even split.
      const hue=dem+rep?d3.interpolateRgb('#cf293b','#2864c5')(dem/(dem+rep)):'#b79942';
      const density=voteDensity.get(row.key);
      if(!Number.isFinite(density))return '#a5acb7';
      const strength=.16+.84*Math.sqrt(Math.min(1,density/denseReference));
      return d3.interpolateRgb('#ffffff',hue)(strength);
    };
    function showTooltip(event,row) {
      if(!row) return hideTooltip();
      tooltip.innerHTML = `<h3>${esc(row.name)}</h3><p class="precinct-detail-subtitle">Cuyahoga County · U.S. Senate special election · ${number(row.total)} votes</p><table><thead><tr><th>Candidate</th><th>Votes</th><th>Share</th></tr></thead><tbody>${sorted(row).map(c=>`<tr><td><span class="precinct-candidate-party" data-party="${esc(c.party)}">${esc(c.party)}</span>${esc(c.name)}</td><td>${number(c.votes)}</td><td>${(row.total?c.votes/row.total*100:0).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`;
      tooltip.hidden = false;
      const box = tooltip.getBoundingClientRect();
      tooltip.style.left = `${Math.max(8,Math.min(event.clientX+16,innerWidth-box.width-8))}px`;
      tooltip.style.top = `${Math.max(8,Math.min(event.clientY-box.height-12,innerHeight-box.height-8))}px`;
    }
    const svg = d3.select('#ohio-precinct-map').attr('hidden',null).attr('viewBox','0 0 1200 900')
      .attr('aria-label','Ohio statewide 2026 U.S. Senate precinct map. City labels, gray roads, and street names appear progressively as you zoom. Roads load from the Census Bureau while online. Verified Cuyahoga precinct returns are colored on current county boundaries. Unfilled precinct outlines elsewhere use 2024 geography, with no 2026 returns assigned. Use plus and minus to zoom, arrow keys to pan, or zero to reset.');
    svg.append('desc').text('Color blends from Republican red through evenly split purple to Democratic blue using the two-party vote share. Darker shading indicates more votes cast per square mile of precinct area; this is voting density, not population density. Unfilled boundary geometry: OPoliticsGuru / 21MetcalfJ, 2024Precincts Ohio dataset. Historic vote fields are not used. Colored boundaries and returns: Cuyahoga County GIS and Board of Elections, November 2026. Road geometry and names: U.S. Census Bureau TIGERweb Transportation service.');
    const viewport = svg.append('g');
    const ohio = topojson.feature(window.MIDTERMS_2026_STATES,window.MIDTERMS_2026_STATES.objects.states).features.find(f=>String(f.id)==='39');
    const features = structuredClone(data.features);
    const unfilled = structuredClone(window.OHIO_UNFILLED_PRECINCTS.features);
    for(const feature of [...features,...unfilled]) {
      const polygons = feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
      polygons.forEach(p=>p.forEach((ring,index)=>{
        const signed=ring.reduce((sum,point,i)=>{const next=ring[(i+1)%ring.length];return sum+point[0]*next[1]-next[0]*point[1];},0);
        if((index===0&&signed>0)||(index>0&&signed<0))ring.reverse();
      }));
    }
    // Sum geographic fragments before dividing each precinct's votes by area.
    const areaByKey=new Map();
    for(const feature of features) {
      const key=feature.properties.key,area=d3.geoArea(feature)*3958.7613**2;
      if(Number.isFinite(area)&&area>0)areaByKey.set(key,(areaByKey.get(key)||0)+area);
    }
    const voteDensity=new Map();
    for(const row of race.rows) {
      const area=areaByKey.get(row.key);
      if(area>0&&row.total>0)voteDensity.set(row.key,row.total/area);
    }
    // Tiny polygons cannot wash out the rest of the map. Both parties and both
    // themes share one square-root density scale, capped at the 95th percentile.
    const denseReference=d3.quantileSorted([...voteDensity.values()].sort((a,b)=>a-b),.95)||1;
    const projection = d3.geoMercator().fitExtent([[35,70],[1165,865]],ohio);
    const path = d3.geoPath(projection);
    viewport.append('path').datum(ohio).attr('class','precinct-state-backdrop').attr('d',path);
    const clipId = 'ohio-unfilled-land';
    svg.append('defs').append('clipPath').attr('id',clipId).append('path').datum(ohio).attr('d',path);
    viewport.append('g').attr('clip-path',`url(#${clipId})`).selectAll('.precinct-unfilled-shape').data(unfilled).join('path')
      .attr('class','precinct-unfilled-shape').attr('d',path)
      .append('title').text(f=>`${f.properties.name} · 2024 boundary · 2026 precinct returns not loaded`);
    viewport.selectAll('.precinct-result-shape').data(features).join('path').attr('class','precinct-result-shape').attr('d',path).attr('fill',f=>color(lookup.get(f.properties.key)))
      .on('pointermove',(event,f)=>{if(!pinned)showTooltip(event,lookup.get(f.properties.key));})
      .on('pointerleave',()=>{if(!pinned)hideTooltip();})
      .on('click',(event,f)=>{if(!event.defaultPrevented){showTooltip(event,lookup.get(f.properties.key));pinned=!tooltip.hidden;}});
    // Keep labels outside the zoomed geometry so their text and dots stay the
    // same screen size. Prioritized, collision-free placement runs per frame.
    let streetLayer;
    const cityLayer = svg.append('g').attr('class','precinct-city-labels').attr('aria-hidden','true');
    const cities = (window.OHIO_CITY_LABELS?.places || []).map(city=>({...city,point:projection(city.coordinates)}));
    const measure = document.createElement('canvas').getContext('2d');
    let cityTransform = d3.zoomIdentity, cityFrame = null;
    function renderCities() {
      cityFrame = null;
      const bounds = svg.node().getBoundingClientRect();
      const screenScale = Math.min(bounds.width/1200,bounds.height/900);
      if(!screenScale)return;
      const unit = 1/screenScale, occupied = [], placed = [];
      const controls = $('.precinct-map-controls').getBoundingClientRect();
      occupied.push({x:(controls.left-bounds.left-(bounds.width-1200*screenScale)/2)/screenScale-5*unit,
        y:(controls.top-bounds.top-(bounds.height-900*screenScale)/2)/screenScale-5*unit,
        width:(controls.width+10)/screenScale,height:(controls.height+10)/screenScale});
      const overlaps = box=>occupied.some(other=>box.x<other.x+other.width && box.x+box.width>other.x && box.y<other.y+other.height && box.y+box.height>other.y);
      for(const city of cities) {
        if(cityTransform.k<city.minZoom)continue;
        const [x,y]=cityTransform.apply(city.point);
        if(x<8*unit||x>1200-8*unit||y<8*unit||y>900-8*unit)continue;
        const font=city.tier===0?13.5:12.5;
        measure.font=`${city.tier===0?800:600} ${font}px Inter, sans-serif`;
        const width=(measure.measureText(city.name).width+4)*unit,height=(font+5)*unit;
        const dot={x:x-3*unit,y:y-3*unit,width:6*unit,height:6*unit};
        if(overlaps(dot))continue;
        const candidates=[{dx:7,dy:-6,anchor:'start'},{dx:7,dy:16,anchor:'start'},
          {dx:-7,dy:-6,anchor:'end'},{dx:-7,dy:16,anchor:'end'},
          {dx:0,dy:-12,anchor:'middle'},{dx:0,dy:22,anchor:'middle'}];
        for(const candidate of candidates) {
          const labelX=x+candidate.dx*unit,labelY=y+candidate.dy*unit;
          const box={x:labelX-(candidate.anchor==='end'?width:candidate.anchor==='middle'?width/2:0)-2*unit,
            y:labelY-font*unit-2*unit,width:width+4*unit,height};
          if(box.x<6*unit||box.y<6*unit||box.x+box.width>1200-6*unit||box.y+box.height>900-6*unit||overlaps(box))continue;
          occupied.push(box,dot);placed.push({...city,x,y,labelX,labelY,anchor:candidate.anchor,font});break;
        }
      }
      const labels=cityLayer.selectAll('g').data(placed,city=>city.id).join(enter=>{
        const group=enter.append('g').attr('class','precinct-city-label');group.append('circle');group.append('text');return group;
      }).attr('data-tier',city=>city.tier);
      labels.select('circle').attr('cx',city=>city.x).attr('cy',city=>city.y).attr('r',2.2*unit).attr('stroke-width',1.3*unit);
      labels.select('text').attr('x',city=>city.labelX).attr('y',city=>city.labelY).attr('text-anchor',city=>city.anchor)
        .attr('font-size',city=>city.font*unit).attr('stroke-width',3*unit).text(city=>city.name);
      streetLayer?.renderLabels(cityTransform,occupied,unit);
    }
    function scheduleCities(transform=cityTransform) {
      cityTransform=transform;
      if(cityFrame===null)cityFrame=requestAnimationFrame(renderCities);
    }
    streetLayer=window.createPrecinctStreetLayer({svg,viewport,projection,path,land:ohio,clipId,onUpdate:()=>scheduleCities()});
    // Keep city names above the subtler road names.
    cityLayer.raise();
    const zoom = d3.zoom().extent([[0,0],[1200,900]]).scaleExtent([1,128]).translateExtent([[0,0],[1200,900]])
      .on('start.streets',()=>streetLayer.start())
      .on('end.streets',event=>streetLayer.refresh(event.transform))
      .on('zoom',event=>{viewport.attr('transform',event.transform);$('#precinct-zoom-level').textContent=`${Math.round(event.transform.k*100)}%`;scheduleCities(event.transform);hideTooltip();});
    svg.call(zoom);
    scheduleCities();
    document.fonts?.ready.then(()=>scheduleCities());
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches?0:160;
    const scale = amount => svg.transition().duration(duration).call(zoom.scaleBy,amount);
    $('#precinct-zoom-in').onclick=()=>scale(1.6);$('#precinct-zoom-out').onclick=()=>scale(1/1.6);
    $('#precinct-reset').onclick=()=>svg.transition().duration(duration).call(zoom.transform,d3.zoomIdentity);
    svg.on('keydown',event=>{
      const directions={ArrowLeft:[100,0],ArrowRight:[-100,0],ArrowUp:[0,100],ArrowDown:[0,-100]};
      if(['+','=','-','0',...Object.keys(directions)].includes(event.key))event.preventDefault();
      if(['+','='].includes(event.key))scale(1.6);else if(event.key==='-')scale(1/1.6);else if(event.key==='0')svg.call(zoom.transform,d3.zoomIdentity);else if(directions[event.key])svg.call(zoom.translateBy,...directions[event.key]);
    });
    document.querySelectorAll('.precinct-map-controls button').forEach(button=>{button.disabled=false;});
    window.addEventListener('scroll',hideTooltip,true);window.addEventListener('resize',()=>{hideTooltip();scheduleCities();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')hideTooltip();});
    document.addEventListener('pointerdown',event=>{if(!event.target.closest('.precinct-result-shape'))hideTooltip();});
    $('#precinct-loading').hidden=true;
  } catch(error) {
    $('#ohio-precinct-map').hidden=true;
    $('#precinct-loading').textContent='Precinct results could not load. Refresh the page to try again.';
    console.error(error);
  }
})();

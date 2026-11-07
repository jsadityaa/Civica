// Public Census TIGERweb geometry. No API key or election-result inference.
window.createPrecinctStreetLayer = function({svg,viewport,projection,path,land,clipId,onUpdate}) {
  const SOURCE='https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Transportation_LargeScale/MapServer';
  const roads=viewport.append('g').attr('class','precinct-streets').attr('clip-path',`url(#${clipId})`).attr('aria-hidden','true');
  const names=svg.append('g').attr('class','precinct-street-names').attr('aria-hidden','true');
  const status=svg.append('text').attr('class','precinct-street-status').attr('x',1180).attr('y',880).attr('text-anchor','end');
  const measure=document.createElement('canvas').getContext('2d');
  const cache=new Map();
  const ZOOM={roads:6,streets:12,names:24};
  let controller=null,retryTimer=null,requestVersion=0,features=[],loaded=null,moving=false,current=d3.zoomIdentity;
  const contains=(outer,inner)=>outer&&outer[0]<=inner[0]&&outer[1]<=inner[1]&&outer[2]>=inner[2]&&outer[3]>=inner[3];
  const extentFor=transform=>{
    const a=projection.invert(transform.invert([0,0])),b=projection.invert(transform.invert([1200,900]));
    return [Math.max(-84.83,Math.min(a[0],b[0])),Math.max(38.39,Math.min(a[1],b[1])),Math.min(-80.50,Math.max(a[0],b[0])),Math.min(42.02,Math.max(a[1],b[1]))];
  };
  function report(message='') {
    const bounds=svg.node().getBoundingClientRect(),scale=Math.min(bounds.width/1200,bounds.height/900)||1;
    status.style('font-size',`${11/scale}px`).text(message);
  }
  async function query(layer,box,signal) {
    const output=[];
    for(let offset=0;offset<=50000;offset+=10000) {
      const params=new URLSearchParams({f:'geojson',where:'1=1',outFields:'OBJECTID,NAME,MTFCC',geometry:box.join(','),geometryType:'esriGeometryEnvelope',inSR:'4326',outSR:'4326',spatialRel:'esriSpatialRelIntersects',geometryPrecision:'6',maxAllowableOffset:'0.000005',resultRecordCount:'10000',resultOffset:String(offset),orderByFields:'OBJECTID'});
      const response=await fetch(`${SOURCE}/${layer}/query?${params}`,{signal,credentials:'omit'});
      if(!response.ok)throw new Error(`Road service returned ${response.status}`);
      const data=await response.json();
      if(data.error||!Array.isArray(data.features))throw new Error('Road service response unavailable');
      for(const feature of data.features)if(['LineString','MultiLineString'].includes(feature.geometry?.type))output.push({...feature,roadLayer:layer});
      if(!data.exceededTransferLimit)return output;
    }
    throw new Error('Road viewport too large for a complete response');
  }
  function draw(items,box,profile) {
    features=items.map(feature=>({...feature,lines:(feature.geometry.type==='LineString'?[feature.geometry.coordinates]:feature.geometry.coordinates).map(line=>line.map(coordinate=>projection(coordinate)))}));
    loaded={box,profile};
    roads.selectAll('path').data(features,f=>`${f.roadLayer}-${f.id??f.properties.OBJECTID}`).join('path')
      .attr('class',f=>`precinct-street-road road-level-${f.roadLayer}`).attr('d',path);
    onUpdate();
  }
  async function refresh(transform,attempt=0) {
    clearTimeout(retryTimer);retryTimer=null;
    current=transform;moving=false;
    if(controller)controller.abort();
    controller=null;
    const version=++requestVersion;
    roads.attr('display',transform.k>=ZOOM.roads?null:'none');
    names.selectAll('*').remove();
    if(transform.k<ZOOM.roads){report();return;}
    const bounds=extentFor(transform),profile=transform.k>=ZOOM.streets?'streets':'highways';
    if(bounds[0]>=bounds[2]||bounds[1]>=bounds[3]){report();return;}
    if(loaded?.profile===profile&&contains(loaded.box,bounds)){report();onUpdate();return;}
    const padX=(bounds[2]-bounds[0])*.15,padY=(bounds[3]-bounds[1])*.15;
    const box=[Math.floor((bounds[0]-padX)*1000)/1000,Math.floor((bounds[1]-padY)*1000)/1000,Math.ceil((bounds[2]+padX)*1000)/1000,Math.ceil((bounds[3]+padY)*1000)/1000];
    const key=`${profile}:${box.join(',')}`;
    if(cache.has(key)){report();draw(cache.get(key),box,profile);return;}
    controller=new AbortController();
    const active=controller,timeout=setTimeout(()=>active.abort(),25000);
    report('Loading roads…');
    try {
      const result=await Promise.allSettled((profile==='streets'?[0,1,2]:[0,1]).map(layer=>query(layer,box,active.signal)));
      if(version!==requestVersion)return;
      const good=result.filter(item=>item.status==='fulfilled').flatMap(item=>item.value);
      if(!good.length&&result.some(item=>item.status==='rejected'))throw new Error('Road service unavailable');
      draw(good,box,profile);
      if(result.some(item=>item.status==='rejected')){loaded=null;retry();}
      else{report();cache.set(key,good);if(cache.size>6)cache.delete(cache.keys().next().value);}
    }catch(error){if(version===requestVersion)retry();}
    finally{clearTimeout(timeout);if(controller===active)controller=null;}
    function retry() {
      if(attempt>=2){report('Roads unavailable · zoom or pan to retry');return;}
      report('Retrying roads…');
      retryTimer=setTimeout(()=>{
        retryTimer=null;
        if(version===requestVersion&&!moving)refresh(current,attempt+1);
      },1500*(attempt+1));
    }
  }
  function start() {
    clearTimeout(retryTimer);retryTimer=null;
    moving=true;names.selectAll('*').remove();
    requestVersion++;if(controller)controller.abort();
    controller=null;report();
  }
  // Clip a projected segment to the visible map before choosing a street-name
  // position, so a long road can be named near the area actually in view.
  function clip(a,b,pad) {
    let lo=0,hi=1;const dx=b[0]-a[0],dy=b[1]-a[1];
    const p=[-dx,dx,-dy,dy],q=[a[0]-pad,1200-pad-a[0],a[1]-pad,900-pad-a[1]];
    for(let i=0;i<4;i++) {
      if(p[i]===0){if(q[i]<0)return null;continue;}
      const t=q[i]/p[i];if(p[i]<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);
      if(lo>hi)return null;
    }
    return [[a[0]+lo*dx,a[1]+lo*dy],[a[0]+hi*dx,a[1]+hi*dy]];
  }
  function renderLabels(transform,occupied,unit) {
    current=transform;
    if(moving||transform.k<ZOOM.names){names.selectAll('*').remove();return;}
    const candidates=new Map();measure.font='500 11px Inter, sans-serif';
    for(const feature of features) {
      const name=(feature.properties.NAME||'').trim();if(!name)continue;
      for(const line of feature.lines) {
        const pieces=[];let length=0;
        for(let i=1;i<line.length;i++) {
          const piece=clip(transform.apply(line[i-1]),transform.apply(line[i]),22*unit);
          if(!piece)continue;
          const size=Math.hypot(piece[1][0]-piece[0][0],piece[1][1]-piece[0][1]);
          if(size){pieces.push({a:piece[0],b:piece[1],size});length+=size;}
        }
        const width=(measure.measureText(name).width+6)*unit;
        if(length<width*1.5||length<=(candidates.get(name)?.length||0))continue;
        let remaining=length/2,point=null,angle=0;
        for(const piece of pieces){if(remaining<=piece.size){const f=remaining/piece.size;point=[piece.a[0]+(piece.b[0]-piece.a[0])*f,piece.a[1]+(piece.b[1]-piece.a[1])*f];angle=Math.atan2(piece.b[1]-piece.a[1],piece.b[0]-piece.a[0])*180/Math.PI;break;}remaining-=piece.size;}
        if(!point||!d3.geoContains(land,projection.invert(transform.invert(point))))continue;
        if(angle>90)angle-=180;if(angle<-90)angle+=180;
        candidates.set(name,{name,x:point[0],y:point[1],angle,width,length,priority:feature.roadLayer});
      }
    }
    const placed=[];
    for(const candidate of [...candidates.values()].sort((a,b)=>a.priority-b.priority||b.length-a.length)) {
      const theta=candidate.angle*Math.PI/180,height=15*unit;
      const width=Math.abs(candidate.width*Math.cos(theta))+Math.abs(height*Math.sin(theta));
      const h=Math.abs(candidate.width*Math.sin(theta))+Math.abs(height*Math.cos(theta));
      const box={x:candidate.x-width/2-3*unit,y:candidate.y-h/2-3*unit,width:width+6*unit,height:h+6*unit};
      if(occupied.some(other=>box.x<other.x+other.width&&box.x+box.width>other.x&&box.y<other.y+other.height&&box.y+box.height>other.y))continue;
      occupied.push(box);placed.push(candidate);if(placed.length>=70)break;
    }
    names.selectAll('text').data(placed,d=>d.name).join('text').attr('transform',d=>`translate(${d.x},${d.y}) rotate(${d.angle})`)
      .attr('font-size',11*unit).attr('stroke-width',2.5*unit).attr('text-anchor','middle').attr('dominant-baseline','central').text(d=>d.name);
  }
  return {start,refresh,renderLabels};
};

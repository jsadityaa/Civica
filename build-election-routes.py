#!/usr/bin/env python3
"""Build clean election routes, static social metadata, and legacy redirects."""
from pathlib import Path
import json
import re
from html import escape
from urllib.parse import urlencode, urlsplit, parse_qsl, urlunsplit
import html as html_module

ROOT=Path(__file__).resolve().parent
AT_LARGE={'AK','DE','ND','SD','VT','WY'}
def load(name):
 return json.loads((ROOT/name).read_text().partition('=')[2].strip().removesuffix(';'))
def slug(value):return re.sub(r'[^a-z0-9]+','-',value.lower()).strip('-')

def social_thumbnail(html, image):
 """Set a static preview for crawlers, without image-alt metadata."""
 html=re.sub(r'\s*<meta\b(?=[^>]*(?:property|name)="(?:og:image(?::[^"]+)?|twitter:image(?::[^"]+)?|twitter:card)")[^>]*>', '', html)
 url='https://polycivic.com'+image
 values=[('property','og:image',url),('property','og:image:secure_url',url),
         ('property','og:image:type','image/png'),('property','og:image:width','1200'),
         ('property','og:image:height','630'),('name','twitter:card','summary_large_image'),
         ('name','twitter:image',url)]
 block=''.join(f'  <meta {kind}="{key}" content="{escape(value,quote=True)}" />\n' for kind,key,value in values)
 return html.replace('</head>',block+'</head>',1)

def build():
 thumbnails_path=ROOT/'thumbnails-2024.json'
 thumbnails=json.loads(thumbnails_path.read_text()) if thumbnails_path.exists() else {}
 routes=[]
 def add(path,template,params=None,title=None,aliases=None):
  if any(r['path']==path for r in routes):raise ValueError('Duplicate route '+path)
  routes.append(dict(path=path,template=template,params=params or {},title=title,aliases=aliases if aliases is not None else ['/'+template.removesuffix('.html')]))
 def detail(path,template,params,title):
  add(path,template,params,title,['/'+template.removesuffix('.html')+'?'+urlencode(params)])
 # Results and forecasts always occupy different namespaces.
 for name,path in {
 'presidency-2024':'/united-states/2024/presidency','house-2024':'/united-states/2024/house-of-reps',
 'senate-2024':'/united-states/2024/senate','governor-2024':'/united-states/2024/governor',
 'state-results-2024':'/united-states/2024/states','california-2024':'/united-states/2024/california',
 'presidential-2020':'/united-states/2020/presidency','midterms-2022':'/united-states/2022',
 'midterms-2026':'/united-states/2026','house-2026-results':'/united-states/2026/house-of-reps',
 'senate-2026-results':'/united-states/2026/senate','governor-2026-results':'/united-states/2026/governor',
 'state-results-2026':'/united-states/2026/states','precinct-map-2026':'/united-states/2026/senate/precinct-maps',
 'senate-2026':'/united-states/2026/forecasts/senate','governor-2026':'/united-states/2026/forecasts/governor',
 'house-2026':'/united-states/2026/forecasts/house-of-reps',
 'us-senate-2024-forecast':'/united-states/2024/forecasts/senate',
 'governor-2024-forecast':'/united-states/2024/forecasts/governor',
 'virginia-governor-2025-forecast':'/united-states/2025/forecasts/governor/virginia',
 'new-jersey-governor-2025-forecast':'/united-states/2025/forecasts/governor/new-jersey',
 'wisconsin-supreme-court-2025-forecast':'/united-states/2025/forecasts/supreme-court/wisconsin',
 'brazil-2026':'/brazil/2026','brazil-president-2026':'/brazil/2026/presidency',
 'brazil-congress-2026':'/brazil/2026/congress','brazil-governors-2026':'/brazil/2026/governor',
 'brazil-state-legislatures-2026':'/brazil/2026/state-legislatures',
 }.items():add(path,name+'.html')
 data=load('midterms-2026-results-data.js')
 states={r['state']:r['stateName'] for r in data['offices']['house']['races']}
 states['DC']='District of Columbia'
 for code,name in sorted(states.items()):
  for year in [2024,2026]:
   if year==2026 and code!='DC':
    state_template=f'state-election-results-2026-{code.lower()}.html'
    add(f'/united-states/2026/states/{slug(name)}',state_template,{'name':name},f'{name} Election Results 2026 | Polycivic',['/state-election-results-2026?'+urlencode({'name':name}),'/'+state_template.removesuffix('.html')])
   else:
    detail(f'/united-states/{year}/states/{slug(name)}',f'state-election-results-{year}.html',{'name':name},f'{name} Election Results {year} | Polycivic')
  detail(f'/united-states/2024/presidency/{slug(name)}','state-result.html',{'name':name},f'{name} Presidential Election Results 2024 | Polycivic')
 for office,section in [('house','house-of-reps'),('senate','senate'),('governor','governor')]:
  for race in data['offices'][office]['races']:
   code=race['state'].lower();number=int(race.get('seatNumber') or 1);name=race['stateName']
   suffix=('-at-large' if race['state'] in AT_LARGE else '-'+str(number)) if office=='house' else ''
   path=f'/united-states/2026/{section}/{slug(name)}{suffix}'
   params={'office':office,'id':race['id']}
   title=f'{name}{suffix.replace("-", " ").title()} {"U.S. House" if office=="house" else "U.S. Senate" if office=="senate" else "Governor"} Election Results 2026 | Polycivic'
   template=f'house-2026-{code}-{number}-results.html' if office=='house' else f'senate-2026-{code}-results.html' if office=='senate' else f'governor-2026-{code}-results.html'
   aliases=['/race-result-2026?'+urlencode(params)]
   aliases.append('/'+template.removesuffix('.html'))
   add(path,template,params,title,aliases)
 for district in load('house-2024-data.js')['districts'].values():
  suffix='at-large' if district['state'] in AT_LARGE else str(int(district['district']))
  detail(f'/united-states/2024/house-of-reps/{slug(district["stateName"])}-{suffix}','house-district-result.html',{'code':district['code']},f'{district["title"]} U.S. House Election Results 2024 | Polycivic')
 for race in load('senate-2024-data.js')['races']:
  name=states[race['code'][:2]]
  special=race.get('seatType')=='Special'
  detail(f'/united-states/2024/senate/{slug(name)}'+('-special' if special else ''),'senate-state-result.html',{'name':name,**({'seat':'Special'} if special else {})},f'{name} {"Special " if special else ""}Senate Election Results 2024 | Polycivic')
 for race in load('governor-2024-data.js')['races']:
  name=race['state']
  detail(f'/united-states/2024/governor/{slug(name)}','governor-county-result.html',{'name':name},f'{name} Governor Election Results 2024 | Polycivic')

 # Update literal links at build time; the runtime also handles dynamically rendered links.
 def alias_key(value):
  u=urlsplit(value);params=[(k,v.lower()) for k,v in parse_qsl(u.query) if k in {'name','code','office','id','seat'} and not (k=='seat' and v.lower()=='regular')]
  return (u.path.removesuffix('.html'),tuple(sorted(params)))
 lookup={alias_key(alias):r['path'] for r in routes for alias in r['aliases']}
 def clean_link(value):
  value=html_module.unescape(value);u=urlsplit(value)
  if u.netloc and u.netloc!='polycivic.com':return value
  path=u.path.removeprefix('./')
  path='/'+path.lstrip('/')
  target=lookup.get(alias_key(urlunsplit(('', '', path,u.query,''))))
  if not target:return value
  extra=urlencode([(k,v) for k,v in parse_qsl(u.query) if k not in {'name','code','office','id','seat'}])
  return (('https://polycivic.com' if u.netloc else '')+target+('?' + extra if extra else '')+('#'+u.fragment if u.fragment else ''))
 for page_path in ROOT.glob('*.html'):
  original=page_path.read_text()
  updated=re.sub(r'(<a\b[^>]*\bhref=")([^"]*)(")',lambda m:m[1]+escape(clean_link(m[2]),quote=True)+m[3],original)
  updated=re.sub(r'(<(?:link rel="canonical" href|meta property="og:url" content)=")([^"]*)(")',lambda m:m[1]+escape(clean_link(m[2]),quote=True)+m[3],updated)
  if updated!=original:page_path.write_text(updated)
 # The source overview files also need the exported preview when opened directly.
 for route in routes:
  if route['path'] in thumbnails and not route['params']:
   template=ROOT/route['template']
   original=template.read_text();updated=social_thumbnail(original,thumbnails[route['path']])
   if updated!=original:template.write_text(updated)
 # Route copies use root-based assets and supply the existing rendering code's parameters.
 out=ROOT/'election-route-pages';out.mkdir(exist_ok=True)
 for i,r in enumerate(routes):
  html=(ROOT/r['template']).read_text()
  html=re.sub(r'\s*<base\b[^>]*>','',html)
  html=html.replace('<head>','<head>\n  <base href="/" />',1)
  if r['params']:
   html=html.replace('<head>','<head>\n  <script>window.POLYCIVIC_ROUTE_PARAMS='+json.dumps(urlencode(r['params']))+';</script>',1)
  url='https://polycivic.com'+r['path']
  html=re.sub(r'<link rel="canonical"[^>]*>','<link rel="canonical" href="'+url+'" />',html)
  if 'rel="canonical"' not in html:html=html.replace('</head>','  <link rel="canonical" href="'+url+'" />\n</head>')
  html=re.sub(r'(<meta property="og:url" content=")[^"]*',lambda m:m[1]+url,html)
  if r['title']:
   html=re.sub(r'<title>.*?</title>','<title>'+escape(r['title'])+'</title>',html,count=1)
   html=re.sub(r'(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*',lambda m:m[1]+escape(r['title'],quote=True),html)
  if r['path'] in thumbnails:html=social_thumbnail(html,thumbnails[r['path']])
  (out/f'{i}.html').write_text(html)
  r['destination']=f'/election-route-pages/{i}.html'
 (ROOT/'election-routes.json').write_text(json.dumps(routes,indent=2)+'\n')
 # Export the alias table to the early client router for legacy query URLs and dynamic links.
 pairs=[(alias,r['path']) for r in routes for alias in r['aliases']]
 runtime=(ROOT/'election-routing-runtime.js').read_text()
 (ROOT/'election-routes.js').write_text('/* Generated by build-election-routes.py. */\n'+runtime.replace('/* ROUTE_ALIASES */ []',json.dumps(pairs,separators=(',',':'))))
 config=json.loads((ROOT/'firebase.json').read_text());hosting=config['hosting']
 aliases={a:r['path'] for r in routes for a in r['aliases'] if '?' not in a}
 retained=[r for r in hosting['redirects'] if r['source'].removesuffix('.html') not in aliases]
 hosting['redirects']=[{'source':a+ext,'destination':path,'type':301} for a,path in aliases.items() for ext in ['', '.html']]+retained
 hosting['rewrites']=[{'source':r['path'],'destination':r['destination']} for r in routes]+[r for r in hosting['rewrites'] if r['source'] not in aliases and not r.get('destination','').startswith('/election-route-pages/')]
 for header in list(hosting['headers']):
  if header['source'] in aliases:
   new={**header,'source':aliases[header['source']]}
   if new not in hosting['headers']:hosting['headers'].append(new)
 # Keep the sitemap canonical and include all indexable result routes.
 sitemap=ROOT/'sitemap.xml'
 import xml.etree.ElementTree as ET
 ns='http://www.sitemaps.org/schemas/sitemap/0.9'
 ET.register_namespace('',ns)
 tree=ET.parse(sitemap);urlset=tree.getroot()
 for loc in urlset.findall('{'+ns+'}url/{'+ns+'}loc'):
  loc.text=clean_link(loc.text)
 existing={loc.text for loc in urlset.findall('{'+ns+'}url/{'+ns+'}loc')}
 for route in routes:
  url='https://polycivic.com'+route['path']
  if '/forecasts/' in route['path'] or route['path'].startswith('/brazil/') or url in existing:continue
  el=ET.SubElement(urlset,'{'+ns+'}url');ET.SubElement(el,'{'+ns+'}loc').text=url;existing.add(url)
 tree.write(sitemap,encoding='unicode',xml_declaration=True)
 (ROOT/'firebase.json').write_text(json.dumps(config,indent=2)+'\n')
 print(f'Built {len(routes)} clean election routes, {len(pairs)} legacy aliases, and Firebase rewrites')

if __name__=='__main__':build()

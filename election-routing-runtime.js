(() => {
  const aliases = /* ROUTE_ALIASES */ [];
  const routeKeys = new Set(['name', 'code', 'office', 'id', 'seat']);
  function keyFor(url) {
    const pathname = url.pathname.replace(/\.html$/, '');
    const params = [...url.searchParams].filter(([key, value]) => routeKeys.has(key) && !(key === 'seat' && value.toLowerCase() === 'regular'));
    params.sort(([a], [b]) => a.localeCompare(b));
    return pathname + (params.length ? '?' + params.map(([key, value]) => `${key}=${value.toLowerCase()}`).join('&') : '');
  }
  const lookup = new Map(aliases.map(([old, path]) => [keyFor(new URL(old, 'https://polycivic.com')), path]));
  function cleanHref(href) {
    if (href.startsWith('#')) return location.pathname + location.search + href;
    const url = new URL(href, document.baseURI);
    if (url.origin !== location.origin) return href;
    const path = lookup.get(keyFor(url));
    if (!path) return href;
    const extra = new URLSearchParams([...url.searchParams].filter(([key]) => !routeKeys.has(key)));
    return path + (extra.size ? '?' + extra.toString() : '') + url.hash;
  }
  window.polycivicElectionHref = location.protocol === 'file:' ? href => href : cleanHref;
  if (location.protocol === 'file:') return;
  if (location.protocol !== 'file:') {
    const target = cleanHref(location.href);
    if (target !== location.href && target !== location.pathname + location.search + location.hash) {
      location.replace(target);
      return;
    }
  }
  function updateLinks(root) {
    // A root base keeps data and assets working at nested paths. Keep SVG paint
    // servers tied to this document rather than resolving their fragments to '/'.
    const svgNodes = [...(root.matches?.('svg *') ? [root] : []), ...root.querySelectorAll('svg [fill], svg [stroke], svg [clip-path], svg [mask], svg [filter], svg [style]')];
    for (const element of svgNodes) for (const attr of ['fill', 'stroke', 'clip-path', 'mask', 'filter', 'style']) {
      const old = element.getAttribute(attr);
      if (!old || !old.includes('url(#')) continue;
      element.setAttribute(attr, old.replace(/url\(#([^)]*)\)/g, (_, id) => `url(${location.origin}${location.pathname}${location.search}#${id})`));
    }
    const links = [...(root.matches?.('a[href]') ? [root] : []), ...root.querySelectorAll('a[href]')];
    for (const link of links) {
      const old = link.getAttribute('href');
      const next = cleanHref(old);
      if (next !== old) link.setAttribute('href', next);
    }
  }
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes') updateLinks(record.target);
      for (const node of record.addedNodes) if (node.nodeType === 1) updateLinks(node);
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['href', 'fill', 'stroke', 'clip-path', 'mask', 'filter', 'style'] });
  document.addEventListener('DOMContentLoaded', () => updateLinks(document));
})();

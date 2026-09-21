(function () {
  const pageConfigs = {
    "/state-result": {
      param: "name",
      title: (name) => `2024 ${name} Presidential Result | Polycivic`,
      description: (name) => `County map, vote totals, margins, and candidate results for the 2024 presidential election in ${name}.`
    },
    "/governor-county-result": {
      param: "name",
      title: (name) => `2024 ${name} Governor County Results | Polycivic`,
      description: (name) => `County map, vote totals, margins, and candidate results for the 2024 governor election in ${name}.`
    },
    "/senate-state-result": {
      param: "name",
      title: (name) => `2024 ${name} Senate Result | Polycivic`,
      description: (name) => `County map, vote totals, margins, and candidate results for the 2024 Senate election in ${name}.`
    },
    "/house-district-result": {
      param: "code",
      title: (code) => `2024 ${code} House District Result | Polycivic`,
      description: (code) => `County-level results, vote totals, margins, and candidate results for the 2024 ${code} House race.`
    }
  };

  const path = window.location.pathname.replace(/\.html$/, "");
  const config = pageConfigs[path];
  if (!config) return;

  const params = new URLSearchParams(window.location.search);
  const value = params.get(config.param);
  if (!value) return;

  const cleanUrl = `https://polycivic.com${path}?${config.param}=${encodeURIComponent(value)}`;
  const title = config.title(value);
  const description = config.description(value);

  document.title = title;

  const setMeta = (selector, attr, content) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      if (selector.includes("property=")) {
        el.setAttribute("property", selector.match(/property="([^"]+)"/)[1]);
      } else {
        el.setAttribute("name", selector.match(/name="([^"]+)"/)[1]);
      }
      document.head.appendChild(el);
    }
    el.setAttribute(attr, content);
  };

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", cleanUrl);

  setMeta('meta[name="description"]', "content", description);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description);
  setMeta('meta[property="og:url"]', "content", cleanUrl);
})();

window.dataLayer = window.dataLayer || [];

function gtag() {
  window.dataLayer.push(arguments);
}

const polycivicAnalyticsParams = new URLSearchParams(window.location.search);
const polycivicAnalyticsConfig = {
  page_title: document.title,
  page_location: window.location.href
};

if (polycivicAnalyticsParams.has("ga_debug")) {
  polycivicAnalyticsConfig.debug_mode = true;
}

gtag("js", new Date());
gtag("config", "G-TTQG0NLH31", polycivicAnalyticsConfig);

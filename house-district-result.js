const houseDetailDataBundle = window.HOUSE_2024_DATA;
const houseDetailGeojson = window.HOUSE_2024_GEOJSON;

if (houseDetailDataBundle && houseDetailGeojson && document.getElementById("house-detail-title")) {
  const PARTY_LABELS = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
    IND: "Independent",
    GR: "Green",
    LB: "Libertarian",
    W: "Working Families",
    CON: "Conservative",
    CST: "Constitution",
    PF: "Peace and Freedom",
    LMN: "Legal Marijuana Now",
    NPP: "No party preference",
    O: "Other",
    NP: "Other",
    UY: "Other"
  };

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-US");
  }

  function formatCompactNumber(value) {
    const numeric = Number(value || 0);
    const rounded = numeric < 1 ? numeric.toFixed(2) : numeric.toFixed(1);
    return rounded;
  }

  function getPortrait(name) {
    const mapped = window.HOUSE_CANDIDATE_IMAGES?.[name];
    if (mapped) return mapped;

    const initials = String(name || "H")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
    return `https://placehold.co/120x120/2f3540/f3f4f6?text=${encodeURIComponent(initials || "C")}`;
  }

  function formatHouseCandidateVotes(district, candidate) {
    if (district.uncontested && Number(candidate.votes || 0) === 0) return "Uncontested";
    return candidate.votesFormatted || formatNumber(candidate.votes);
  }

  function formatHouseCandidatePct(district, candidate) {
    if (district.uncontested && Number(candidate.pct || 0) === 0) return "Uncontested";
    return candidate.pctFormatted || `${formatCompactNumber(candidate.pct)}%`;
  }

  function normalizeDistricts() {
    return Object.fromEntries(
      Object.entries(houseDetailDataBundle.districts).map(([code, district]) => {
        const candidates = [...(district.candidates || [])].sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
        const winner = candidates.find((candidate) => candidate.winner) || candidates[0] || null;
        const winnerParty = winner?.party === "D" || winner?.party === "R"
          ? winner.party
          : (district.winnerParty === "D" || district.winnerParty === "R" ? district.winnerParty : "I");
        const uncontested = candidates.length < 2 || String(district.marginLabel || "").toLowerCase().includes("uncontested");
        const totalVotes = Number(district.totalVotes || 0);
        const computedMargin = candidates.length > 1 && totalVotes > 0
          ? (Math.abs(Number(candidates[0].votes || 0) - Number(candidates[1].votes || 0)) / totalVotes) * 100
          : candidates.length > 1
            ? Math.abs(Number(candidates[0].pct || 0) - Number(candidates[1].pct || 0))
            : 100;
        const providedMargin = Number(district.margin);
        const margin = uncontested
          ? (Number.isFinite(providedMargin) && providedMargin > 0 ? providedMargin : 100)
          : computedMargin;
        const marginLabel = uncontested
          ? `${winnerParty === "D" ? "D" : winnerParty === "R" ? "R" : "I"} Uncontested`
          : `${winnerParty === "D" ? "D" : winnerParty === "R" ? "R" : "I"}+${formatCompactNumber(margin)}`;
        const fillKey = district.flipped
          ? winnerParty === "D"
            ? "DemFlip"
            : winnerParty === "R"
              ? "RepFlip"
              : "IndFlip"
          : winnerParty === "D"
            ? "Dem"
            : winnerParty === "R"
              ? "Rep"
              : "Ind";

        return [code, {
          ...district,
          code,
          candidates,
          winnerName: winner?.name || district.winnerName || "Winner",
          winnerParty,
          margin,
          marginLabel,
          uncontested,
          fillKey
        }];
      })
    );
  }

  function districtFill(fillKey) {
    if (fillKey === "Dem") return "#2879b5";
    if (fillKey === "Rep") return "#cf2f2f";
    if (fillKey === "DemFlip") return "#2879b5";
    if (fillKey === "RepFlip") return "#cf2f2f";
    return "#c8a24a";
  }

  function getMapFitFeature(feature) {
    const geometry = feature?.geometry;
    if (!geometry || geometry.type !== "MultiPolygon") return feature;

    const largestPolygon = geometry.coordinates
      .map((coordinates) => ({
        type: "Feature",
        properties: feature.properties || {},
        geometry: {
          type: "Polygon",
          coordinates
        }
      }))
      .sort((a, b) => d3.geoArea(b) - d3.geoArea(a))[0];

    return largestPolygon || feature;
  }

  function createMapProjection(feature) {
    return d3.geoMercator().fitExtent([[18, 18], [522, 402]], getMapFitFeature(feature));
  }

  const COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
  const CONNECTICUT_TOWNS_GEOJSON_URL = "./assets/maps/connecticut-towns.geojson";
  const STATE_COUNTY_GEOJSON_URLS = {
    FL: "./assets/maps/florida-counties.geojson"
  };
  const DISTRICT_GEOJSON_URLS = {
    "FL-01": "./assets/maps/florida-district-1.geojson"
  };
  const DISTRICT_SVG_URLS = {
    "FL-01": "./assets/maps/florida-district-1-by-county.svg",
    "FL-14": "./assets/maps/florida-district-14-by-county.svg",
    "GA-04": "./assets/maps/georgia-district-4-by-county.svg",
    "GA-11": "./assets/maps/georgia-district-11-by-county.svg",
    "HI-02": "./assets/maps/hawaii-district-2-by-county.svg",
    "MD-03": "./assets/maps/maryland-district-3-dem-primary.svg",
    "MD-04": "./assets/maps/maryland-district-04-general.svg",
    "MD-05": "./assets/maps/maryland-district-05-general.svg",
    "MD-07": "./assets/maps/maryland-district-07-general.svg",
    "MN-03": "./assets/maps/minnesota-district-03-by-county.svg",
    "MN-04": "./assets/maps/minnesota-district-04-by-county.svg",
    "MN-05": "./assets/maps/minnesota-district-05-by-county.svg"
  };
  const DISTRICT_SVG_VIEW_BOXES = {
    "GA-04": "-210 -20 900 790"
  };
  const DISTRICT_SVG_COUNTY_PATHS = {
    "FL-01": {
      path134: "12033", // Escambia
      path136: "12113", // Santa Rosa
      path138: "12091", // Okaloosa
      path132: "12131" // Walton
    },
    // "2024 FL-14 election results.svg" by Incognito melon, CC BY 4.0, via Wikimedia Commons.
    "FL-14": {
      path2: "12103", // Pinellas
      path8: "12057" // Hillsborough
    },
    // "2024 GA-04 election results.svg" by Incognito melon and Putitonamap98, CC BY 4.0, via Wikimedia Commons.
    "GA-04": {
      path14: "13089", // DeKalb
      path154: "13135" // Gwinnett
    },
    // "2024 GA-11 election results.svg" by Incognito melon and Putitonamap98, CC BY 4.0, via Wikimedia Commons.
    "GA-11": {
      path20: "13015", // Bartow
      path22: "13057", // Cherokee
      path24: "13067", // Cobb
      path16: "13129", // Gordon
      path8: "13227" // Pickens
    },
    // "2024 HI-02 election results.svg" by Incognito melon, CC BY 4.0, via Wikimedia Commons.
    "HI-02": {
      path14: "15001", // Hawaii
      path109: "15003", // Honolulu
      path56: "15007", // Kauai
      path71: "15007", // Niihau, reported with Kauai County
      path96: "15009" // Maui
    },
    // "2024 MD-03 Democratic primary.svg" by Y2hyaXM, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "MD-03": {
      path30683: "24003", // Anne Arundel
      path30685: "24013", // Carroll
      path30681: "24027", // Howard
      path30687: "24003" // small Anne Arundel fragment
    },
    // Maryland general-election SVGs by Y2hyaXM, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "MD-04": {
      path12501: "24031", // Montgomery
      path13476: "24033" // Prince George's
    },
    "MD-05": {
      path15470: "24033", // Prince George's
      path15474: "24017", // Charles
      path15476: "24009", // Calvert
      path15480: "24037", // Saint Mary's
      path15482: "24037", // Saint Mary's fragment
      path15484: "24037", // Saint Mary's fragment
      path15486: "24037", // Saint Mary's fragment
      path15488: "24037", // Saint Mary's fragment
      path15490: "24037", // Saint Mary's fragment
      path15492: "24037", // Saint Mary's fragment
      path15494: "24003", // Anne Arundel
      path15496: "24003" // Anne Arundel fragment
    },
    "MD-07": {
      path132: "24510", // Baltimore City
      path1390: "24005", // Baltimore County
      path1450: "24005", // Baltimore County
      path1698: "24005" // Baltimore County fragment
    },
    // Minnesota district SVGs by Incognito melon and Putitonamap98, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with Minnesota Secretary of State 2024 general-election county results.
    "MN-03": {
      path1: "27003", // Anoka
      path34: "27053" // Hennepin
    },
    "MN-04": {
      path14: "27123", // Ramsey
      path181: "27163" // Washington
    },
    "MN-05": {
      path14: "27003", // Anoka
      path35: "27053" // Hennepin and same-shade Ramsey area in the source SVG
    }
  };
  const COUNTY_SUBDIVISION_GEOJSON_URLS = {
    CT: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/1/query?where=STATE%3D%2709%27&outFields=GEOID%2CNAME%2CBASENAME%2CSTATE%2CCOUNTY&returnGeometry=true&f=geojson&outSR=4326",
    ME: "./assets/maps/state-local-results-2024/maine-local-results-2024.geojson",
    MA: "./assets/maps/state-local-results-2024/massachusetts-local-results-2024.geojson"
  };
  const STATE_FIPS = {
    AL: "01",
    AK: "02",
    AZ: "04",
    AR: "05",
    CA: "06",
    CO: "08",
    CT: "09",
    DE: "10",
    DC: "11",
    FL: "12",
    GA: "13",
    HI: "15",
    ID: "16",
    IL: "17",
    IN: "18",
    IA: "19",
    KS: "20",
    KY: "21",
    LA: "22",
    ME: "23",
    MD: "24",
    MA: "25",
    MI: "26",
    MN: "27",
    MS: "28",
    MO: "29",
    MT: "30",
    NE: "31",
    NV: "32",
    NH: "33",
    NJ: "34",
    NM: "35",
    NY: "36",
    NC: "37",
    ND: "38",
    OH: "39",
    OK: "40",
    OR: "41",
    PA: "42",
    RI: "44",
    SC: "45",
    SD: "46",
    TN: "47",
    TX: "48",
    UT: "49",
    VT: "50",
    VA: "51",
    WA: "53",
    WV: "54",
    WI: "55",
    WY: "56"
  };
  const CALIFORNIA_COUNTY_FIPS = {
    "Alameda County": "06001",
    "Alpine County": "06003",
    "Amador County": "06005",
    "Butte County": "06007",
    "Calaveras County": "06009",
    "Colusa County": "06011",
    "Contra Costa County": "06013",
    "Del Norte County": "06015",
    "El Dorado County": "06017",
    "Fresno County": "06019",
    "Glenn County": "06021",
    "Humboldt County": "06023",
    "Imperial County": "06025",
    "Inyo County": "06027",
    "Kern County": "06029",
    "Kings County": "06031",
    "Lake County": "06033",
    "Lassen County": "06035",
    "Los Angeles County": "06037",
    "Madera County": "06039",
    "Marin County": "06041",
    "Mariposa County": "06043",
    "Mendocino County": "06045",
    "Merced County": "06047",
    "Modoc County": "06049",
    "Mono County": "06051",
    "Monterey County": "06053",
    "Napa County": "06055",
    "Nevada County": "06057",
    "Orange County": "06059",
    "Placer County": "06061",
    "Plumas County": "06063",
    "Riverside County": "06065",
    "Sacramento County": "06067",
    "San Benito County": "06069",
    "San Bernardino County": "06071",
    "San Diego County": "06073",
    "San Francisco County": "06075",
    "San Joaquin County": "06077",
    "San Luis Obispo County": "06079",
    "San Mateo County": "06081",
    "Santa Barbara County": "06083",
    "Santa Clara County": "06085",
    "Santa Cruz County": "06087",
    "Shasta County": "06089",
    "Sierra County": "06091",
    "Siskiyou County": "06093",
    "Solano County": "06095",
    "Sonoma County": "06097",
    "Stanislaus County": "06099",
    "Sutter County": "06101",
    "Tehama County": "06103",
    "Trinity County": "06105",
    "Tulare County": "06107",
    "Tuolumne County": "06109",
    "Ventura County": "06111",
    "Yolo County": "06113",
    "Yuba County": "06115"
  };

  const HOUSE_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
  const HOUSE_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
  const HOUSE_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];

  function normalizeCaliforniaCountyName(name) {
    return String(name || "")
      .replace(/\s*\(part\)$/i, "")
      .trim();
  }

  function formatCaliforniaCountyTableName(name) {
    return normalizeCaliforniaCountyName(name).replace(/ County$/i, "");
  }

  function formatCountyTableName(name) {
    return String(name || "")
      .replace(/\s*\(pt\.\)$/i, "")
      .replace(/\s*\(part\)$/i, "")
      .replace(/ (County|Parish)$/i, "")
      .trim();
  }

  function normalizeTownName(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getPartyName(party) {
    return PARTY_LABELS[party] || party || "Other";
  }

  function getShortPartyLabel(candidate) {
    const party = candidate?.party;
    const partyName = candidate?.partyName;
    if (party === "D" || partyName === "Democratic" || partyName === "Democrat") return "Dem.";
    if (party === "R" || partyName === "Republican") return "Rep.";
    if (party === "LB" || partyName === "Libertarian") return "Lib.";
    if (party === "GR" || partyName === "Green") return "Green";
    if (party === "W") return "Write-in";
    return partyName || getPartyName(party);
  }

  function getWinnerParty(candidates) {
    const winner = candidates[0];
    return winner?.party === "D" || winner?.party === "R" ? winner.party : "I";
  }

  function getCountyFill(row) {
    const shades = row.winnerParty === "D"
      ? HOUSE_DEM_SHADES
      : row.winnerParty === "R"
        ? HOUSE_REP_SHADES
        : HOUSE_IND_SHADES;
    const winnerPct = Math.max(...(row.candidates || []).map((candidate) => Number(candidate.pct || 0)), 0);

    if (winnerPct >= 70) return shades[3];
    if (winnerPct >= 60) return shades[2];
    if (winnerPct >= 50) return shades[1];
    return shades[0];
  }

  function hasIndependentUnitWinner(rows) {
    return (rows || []).some((row) => row?.winnerParty && row.winnerParty !== "D" && row.winnerParty !== "R");
  }

  function setMapLegendVisibility(visible, rows = []) {
    const legend = document.getElementById("house-detail-map-legend");
    const independentRow = document.getElementById("house-detail-map-legend-ind");
    if (legend) {
      legend.hidden = !visible;
    }
    if (independentRow) {
      independentRow.hidden = !visible || !hasIndependentUnitWinner(rows);
    }
  }

  function normalizeDistrictCountyRow(district, row) {
    const stateFips = STATE_FIPS[district.state];
    const countyFips = row.countyFips || (stateFips && row.countyFipsSuffix
      ? `${stateFips}${String(row.countyFipsSuffix).padStart(3, "0")}`
      : null);
    const totalVotes = Number(row.totalVotes || 0);
    const candidates = (row.candidates || [])
      .map((candidate) => {
        const votes = Number(candidate.votes || 0);
        const pct = Number.isFinite(Number(candidate.pct)) && Number(candidate.pct) > 0
          ? Number(candidate.pct)
          : totalVotes > 0
            ? (votes / totalVotes) * 100
            : 0;
        return {
          ...candidate,
          votes,
          pct,
          partyName: candidate.partyName || getPartyName(candidate.party)
        };
      })
      .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const first = candidates[0];
    const second = candidates[1];
    const margin = first && second
      ? Math.abs(Number(first.pct || 0) - Number(second.pct || 0))
      : first
        ? Number(first.pct || 0)
        : 0;
    const winnerParty = getWinnerParty(candidates);
    const marginLabel = first
      ? `${winnerParty === "D" ? "D" : winnerParty === "R" ? "R" : "I"}+${formatCompactNumber(margin)}`
      : "";

    return {
      ...row,
      countyFips,
      candidates,
      totalVotes,
      winnerParty,
      margin,
      marginLabel
    };
  }

  function normalizeDistrictTownRow(row) {
    const totalVotes = Number(row.totalVotes || 0);
    const candidates = (row.candidates || [])
      .map((candidate) => {
        const votes = Number(candidate.votes || 0);
        const pct = Number.isFinite(Number(candidate.pct)) && Number(candidate.pct) > 0
          ? Number(candidate.pct)
          : totalVotes > 0
            ? (votes / totalVotes) * 100
            : 0;
        return {
          ...candidate,
          votes,
          pct,
          partyName: candidate.partyName || getPartyName(candidate.party)
        };
      })
      .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const first = candidates[0];
    const second = candidates[1];
    const margin = first && second
      ? Math.abs(Number(first.pct || 0) - Number(second.pct || 0))
      : first
        ? Number(first.pct || 0)
        : 0;
    const winnerParty = getWinnerParty(candidates);
    const marginLabel = first
      ? `${winnerParty === "D" ? "D" : winnerParty === "R" ? "R" : "I"}+${formatCompactNumber(margin)}`
      : "";

    return {
      ...row,
      candidates,
      totalVotes,
      winnerParty,
      margin,
      marginLabel
    };
  }

  function getCaliforniaCountyFill(row) {
    return getCountyFill(row);
  }

  function getCountyFeatureFips(countyFeature) {
    return String(
      countyFeature?.id ||
      countyFeature?.properties?.GEOID ||
      countyFeature?.properties?.geoid ||
      ""
    ).padStart(5, "0");
  }

  function getFeatureWestLongitude(feature) {
    let west = Infinity;

    function visit(coordinates) {
      if (!Array.isArray(coordinates)) return;
      if (typeof coordinates[0] === "number") {
        west = Math.min(west, coordinates[0]);
        return;
      }
      coordinates.forEach(visit);
    }

    visit(feature?.geometry?.coordinates);
    return Number.isFinite(west) ? west : 0;
  }

  function getRingSignedArea(ring) {
    return ring.reduce((sum, point, index) => {
      const next = ring[(index + 1) % ring.length];
      return sum + (point[0] * next[1] - next[0] * point[1]);
    }, 0) / 2;
  }

  function normalizePolygonWinding(coordinates) {
    return coordinates.map((ring, index) => {
      const signedArea = getRingSignedArea(ring);
      const shouldReverse = index === 0
        ? signedArea > 0
        : signedArea < 0;
      return shouldReverse ? ring.slice().reverse() : ring.slice();
    });
  }

  function normalizeCountyFeatureGeometry(state, feature) {
    if (state !== "FL" || !feature?.geometry) return feature;
    const geometry = feature.geometry;

    if (geometry.type === "Polygon") {
      return {
        ...feature,
        geometry: {
          ...geometry,
          coordinates: normalizePolygonWinding(geometry.coordinates)
        }
      };
    }

    if (geometry.type === "MultiPolygon") {
      return {
        ...feature,
        geometry: {
          ...geometry,
          coordinates: geometry.coordinates.map(normalizePolygonWinding)
        }
      };
    }

    return feature;
  }

  function sortCountyFeaturesForDisplay(state, countyFeatures) {
    const features = countyFeatures.map((feature) => normalizeCountyFeatureGeometry(state, feature));
    if (state !== "FL") return features;

    return features.sort((a, b) => {
      return getFeatureWestLongitude(a) - getFeatureWestLongitude(b);
    });
  }

  async function getCountyFeaturesForRows(state, rowByFips) {
    const stateCountyUrl = STATE_COUNTY_GEOJSON_URLS[state];
    if (stateCountyUrl) {
      try {
        const stateCountyGeojson = await d3.json(stateCountyUrl);
        const stateCountyFeatures = (stateCountyGeojson?.features || [])
          .filter((countyFeature) => rowByFips.has(getCountyFeatureFips(countyFeature)));
        if (stateCountyFeatures.length) return sortCountyFeaturesForDisplay(state, stateCountyFeatures);
      } catch (error) {
        console.warn(`Detailed county geometry unavailable for ${state}; using fallback geometry.`, error);
      }
    }

    const countiesTopo = await d3.json(COUNTIES_TOPOJSON_URL);
    const fallbackFeatures = topojson.feature(countiesTopo, countiesTopo.objects.counties).features
      .filter((countyFeature) => rowByFips.has(getCountyFeatureFips(countyFeature)));
    return sortCountyFeaturesForDisplay(state, fallbackFeatures);
  }

  async function getDistrictDisplayFeature(district, fallbackFeature) {
    const districtGeojsonUrl = DISTRICT_GEOJSON_URLS[district.code];
    if (!districtGeojsonUrl) return getMapFitFeature(fallbackFeature);

    try {
      const districtGeojson = await d3.json(districtGeojsonUrl);
      const districtFeature = districtGeojson?.features?.[0];
      if (districtFeature) {
        return normalizeCountyFeatureGeometry(district.state, {
          ...districtFeature,
          properties: {
            ...(districtFeature.properties || {}),
            code: district.code
          }
        });
      }
    } catch (error) {
      console.warn(`Detailed district geometry unavailable for ${district.code}; using fallback geometry.`, error);
    }

    return getMapFitFeature(fallbackFeature);
  }

  async function renderDistrictSvgCountyMap(district, rowByFips) {
    const svgUrl = DISTRICT_SVG_URLS[district.code];
    const pathCountyMap = DISTRICT_SVG_COUNTY_PATHS[district.code];
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");

    if (!svgUrl || !pathCountyMap || svg.empty()) return false;

    try {
      const svgText = await d3.text(svgUrl);
      const parsedSvg = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
      const viewBox = DISTRICT_SVG_VIEW_BOXES[district.code]
        || parsedSvg.getAttribute("viewBox")
        || `0 0 ${parsedSvg.getAttribute("width") || 800} ${parsedSvg.getAttribute("height") || 433}`;
      const [sourceX, sourceY, sourceWidth, sourceHeight] = viewBox.split(/\s+/).map(Number);
      const viewportWidth = 540;
      const viewportHeight = 420;
      const viewportPadding = 28;
      const sourceScale = Number.isFinite(sourceWidth) && Number.isFinite(sourceHeight) && sourceWidth > 0 && sourceHeight > 0
        ? Math.min((viewportWidth - viewportPadding * 2) / sourceWidth, (viewportHeight - viewportPadding * 2) / sourceHeight)
        : 1;
      const sourceTranslateX = (viewportWidth - sourceWidth * sourceScale) / 2 - sourceX * sourceScale;
      const sourceTranslateY = (viewportHeight - sourceHeight * sourceScale) / 2 - sourceY * sourceScale;
      const sourcePaths = Array.from(parsedSvg.querySelectorAll("path"));
      const getPathTransform = (pathElement) => {
        const transforms = [];
        let currentElement = pathElement;
        while (currentElement && currentElement !== parsedSvg) {
          const transform = currentElement.getAttribute("transform");
          if (transform) transforms.unshift(transform);
          currentElement = currentElement.parentElement;
        }
        return transforms.join(" ");
      };
      const paths = sourcePaths
        .map((pathElement) => ({
          id: pathElement.getAttribute("id"),
          d: pathElement.getAttribute("d"),
          fillRule: pathElement.getAttribute("fill-rule"),
          transform: getPathTransform(pathElement),
          style: pathElement.getAttribute("style")
        }))
        .filter((pathData) => pathData.id && pathData.d && pathCountyMap[pathData.id]);

      if (!paths.length) return false;

      svg.selectAll("*").remove();
      svg
        .attr("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const layer = svg.append("g")
        .attr("class", "house-detail-svg-county-layer")
        .attr("transform", `translate(${sourceTranslateX} ${sourceTranslateY}) scale(${sourceScale})`);

      layer.selectAll("path")
        .data(paths)
        .enter()
        .append("path")
        .attr("class", "detail-county-shape house-detail-county house-detail-svg-county")
        .attr("data-fips", (pathData) => pathCountyMap[pathData.id])
        .attr("d", (pathData) => pathData.d)
        .attr("fill-rule", (pathData) => pathData.fillRule || null)
        .attr("transform", (pathData) => pathData.transform || null)
        .attr("fill", (pathData) => {
          const row = rowByFips.get(pathCountyMap[pathData.id]);
          return row ? getCountyFill(row) : "#2d3138";
        })
        .on("mouseover", (event, pathData) => {
          const row = rowByFips.get(pathCountyMap[pathData.id]);
          if (!row) return;
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      return true;
    } catch (error) {
      console.warn(`SVG district map unavailable for ${district.code}; using generated geometry.`, error);
      return false;
    }
  }

  function getDominantCountyRow(rows, threshold = 0.95) {
    const totalVotes = rows.reduce((sum, row) => sum + Number(row.totalVotes || 0), 0);
    if (!totalVotes) return null;

    const dominantRow = rows
      .slice()
      .sort((a, b) => Number(b.totalVotes || 0) - Number(a.totalVotes || 0))[0];

    return Number(dominantRow?.totalVotes || 0) / totalVotes >= threshold ? dominantRow : null;
  }

  function getVisibleCountyRows(rows) {
    const dominantRow = getDominantCountyRow(rows);
    if (!dominantRow) return rows;

    const totalVotes = rows.reduce((sum, row) => sum + Number(row.totalVotes || 0), 0);
    return rows.filter((row) => {
      const share = totalVotes ? Number(row.totalVotes || 0) / totalVotes : 0;
      return row === dominantRow || share >= 0.01;
    });
  }

  function positionTooltip(event, tooltip) {
    const node = tooltip.node();
    if (!node) return;

    const rect = node.getBoundingClientRect();
    let left = event.clientX - rect.width / 2;
    let top = event.clientY + 16;

    left = Math.max(12, Math.min(left, window.innerWidth - rect.width - 12));
    top = Math.min(top, window.innerHeight - rect.height - 12);

    tooltip.style("left", `${left}px`).style("top", `${top}px`);
  }

  function californiaCountyTooltipHTML(row, district) {
    const candidates = (row.candidates || []).slice().sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    const first = candidates[0];
    const second = candidates[1];
    const districtNumber = String(district.code || "").split("-")[1]?.replace(/^0/, "") || "";
    const title = districtNumber ? `${row.county} / District ${districtNumber}` : row.county;

    return `
      <div class="tooltip-header">
        <div class="tooltip-title">${title}</div>
        <div class="tooltip-ev">${row.marginLabel}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Candidate</th>
            <th>Party</th>
            <th>Votes</th>
            <th>Pct.</th>
          </tr>
        </thead>
        <tbody>
          ${first ? `
            <tr class="winner-row">
              <td>
                <div class="tooltip-candidate">
                  <span class="tooltip-candidate-bar ${first.party === "D" ? "dem" : first.party === "R" ? "rep" : "ind"}"></span>
                  <span>${first.name}</span>
                </div>
              </td>
              <td>${getShortPartyLabel(first)}</td>
              <td>${formatNumber(first.votes)}</td>
              <td>${Number(first.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
            </tr>
          ` : ""}
          ${second ? `
            <tr>
              <td>
                <div class="tooltip-candidate">
                  <span class="tooltip-candidate-bar ${second.party === "D" ? "dem" : second.party === "R" ? "rep" : "ind"}"></span>
                  <span>${second.name}</span>
                </div>
              </td>
              <td>${getShortPartyLabel(second)}</td>
              <td>${formatNumber(second.votes)}</td>
              <td>${Number(second.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
            </tr>
          ` : ""}
        </tbody>
      </table>
    `;
  }

  async function renderCaliforniaCountyMap(district, feature) {
    const countyData = window.HOUSE_CA_COUNTY_RESULTS?.[district.code];
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");
    if (!countyData?.counties?.length || svg.empty() || !window.topojson) {
      setMapLegendVisibility(false);
      return false;
    }

    const rows = countyData.counties
      .map((row) => {
        const normalizedCounty = normalizeCaliforniaCountyName(row.county);
        return {
          ...row,
          county: normalizedCounty,
          countyFips: CALIFORNIA_COUNTY_FIPS[normalizedCounty]
        };
      })
      .filter((row) => row.countyFips);

    if (!rows.length) {
      setMapLegendVisibility(false);
      return false;
    }

    const rowByFips = new Map(rows.map((row) => [row.countyFips, row]));
    const countyFeatures = await getCountyFeaturesForRows(district.state, rowByFips);

    if (!countyFeatures.length) {
      setMapLegendVisibility(false);
      return false;
    }

    svg.selectAll("*").remove();
    svg
      .attr("viewBox", "0 0 540 420")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const displayFeature = getMapFitFeature(feature);
    const projection = d3.geoMercator().fitExtent(
      [[18, 18], [522, 402]],
      displayFeature
    );
    const path = d3.geoPath().projection(projection);
    const districtPath = path(displayFeature);
    const dominantRow = getDominantCountyRow(rows);

    if (dominantRow) {
      svg.append("path")
        .datum(displayFeature)
        .attr("class", "detail-county-shape house-detail-county")
        .attr("data-fips", dominantRow.countyFips)
        .attr("d", districtPath)
        .attr("fill", getCountyFill(dominantRow))
        .attr("stroke", "rgba(255,255,255,0.95)")
        .attr("stroke-width", 2.1)
        .on("mouseover", (event) => {
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(dominantRow, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      if (subtitle) {
        subtitle.textContent = `${district.title} shaded by the dominant county result.`;
      }
      setMapLegendVisibility(true, rows);

      return true;
    }

    const clipPathId = `house-detail-district-clip-${district.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", clipPathId)
      .append("path")
      .attr("d", districtPath);

    const countyLayer = svg.append("g").attr("clip-path", `url(#${clipPathId})`);

    const gapFillRow = district.code === "MD-03" ? rowByFips.get("24003") : null;
    if (gapFillRow) {
      countyLayer.append("path")
        .datum(displayFeature)
        .attr("class", "house-detail-gap-fill")
        .attr("d", districtPath)
        .attr("fill", getCountyFill(gapFillRow))
        .attr("stroke", "none")
        .attr("pointer-events", "none");
    }

    countyLayer.selectAll("path.house-detail-county")
      .data(countyFeatures)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape house-detail-county")
      .attr("data-fips", (countyFeature) => String(countyFeature.id).padStart(5, "0"))
      .attr("d", path)
      .attr("fill", (countyFeature) => {
        const row = rowByFips.get(String(countyFeature.id).padStart(5, "0"));
        return row ? getCaliforniaCountyFill(row) : "#2d3138";
      })
      .on("mouseover", (event, countyFeature) => {
        const row = rowByFips.get(String(countyFeature.id).padStart(5, "0"));
        if (!row) return;
        tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    svg.append("path")
      .datum(displayFeature)
      .attr("class", "house-detail-shape")
      .attr("d", districtPath)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.95)")
      .attr("stroke-width", 2.1);

    if (subtitle) {
      subtitle.textContent = `${district.title} counties shaded by the winning county vote share.`;
    }
    setMapLegendVisibility(true, rows);

    return true;
  }

  async function renderDistrictTownMap(district, feature) {
    const unitData = window.HOUSE_DISTRICT_COUNTY_RESULTS?.[district.code];
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");
    const geojsonUrl = COUNTY_SUBDIVISION_GEOJSON_URLS[district.state];
    if (!unitData?.townRows?.length || !geojsonUrl || svg.empty()) {
      return false;
    }

    const rows = unitData.townRows
      .map((row) => normalizeDistrictTownRow(row))
      .filter((row) => row.townGeoId || row.town);

    if (!rows.length) {
      return false;
    }

    const useConnecticutTownShapes = district.state === "CT";
    const rowByGeoId = new Map(rows.map((row) => [String(row.townGeoId), row]));
    const rowByTownName = new Map(rows.map((row) => [normalizeTownName(row.town), row]));
    const townGeojson = useConnecticutTownShapes
      ? await d3.json(CONNECTICUT_TOWNS_GEOJSON_URL)
      : window.HOUSE_TOWN_GEOJSON?.[district.state] || await d3.json(geojsonUrl);
    const getTownRow = (townFeature) => {
      const properties = townFeature.properties || {};
      if (useConnecticutTownShapes) {
        return rowByTownName.get(normalizeTownName(properties.TOWN_NAME));
      }
      return rowByGeoId.get(String(properties.GEOID || ""))
        || rowByGeoId.get(String(properties.original_geoid || ""))
        || rowByTownName.get(normalizeTownName(properties.county_name || properties.NAME || properties.BASENAME || ""));
    };
    const townFeatures = (townGeojson.features || [])
      .filter((townFeature) => getTownRow(townFeature));

    if (!townFeatures.length) {
      return false;
    }

    svg.selectAll("*").remove();

    const townCollection = {
      type: "FeatureCollection",
      features: townFeatures
    };
    const displayFeature = getMapFitFeature(feature);
    const fitFeature = useConnecticutTownShapes ? townCollection : displayFeature;
    const projection = useConnecticutTownShapes
      ? d3.geoIdentity().reflectY(true).fitExtent([[18, 18], [522, 402]], fitFeature)
      : d3.geoMercator().fitExtent([[18, 18], [522, 402]], fitFeature);
    const path = d3.geoPath().projection(projection);
    const townLayer = svg.append("g");
    if (!useConnecticutTownShapes && displayFeature) {
      const clipPathId = `house-detail-town-clip-${district.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      svg.append("defs")
        .append("clipPath")
        .attr("id", clipPathId)
        .append("path")
        .datum(displayFeature)
        .attr("d", path);
      townLayer.attr("clip-path", `url(#${clipPathId})`);
    }

    townLayer.selectAll("path")
      .data(townFeatures)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape house-detail-county")
      .attr("data-geoid", (townFeature) => {
        const properties = townFeature.properties || {};
        return properties.GEOID || properties.original_geoid || properties.TOWN_NAME || properties.county_name;
      })
      .attr("d", path)
      .attr("fill", (townFeature) => {
        const row = getTownRow(townFeature);
        return row ? getCountyFill(row) : "#2d3138";
      })
      .on("mouseover", (event, townFeature) => {
        const row = getTownRow(townFeature);
        if (!row) return;
        tooltip.style("opacity", 1).html(californiaCountyTooltipHTML({ ...row, county: row.town }, district));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    if (subtitle) {
      subtitle.textContent = `${district.title} towns shaded by the winning town vote share.`;
    }
    setMapLegendVisibility(true, rows);

    return true;
  }

  async function renderDistrictCountyMap(district, feature) {
    const countyData = window.HOUSE_DISTRICT_COUNTY_RESULTS?.[district.code];
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");
    const unitLabel = district.state === "LA" ? "parish" : "county";
    if (!countyData?.rows?.length || svg.empty() || !window.topojson) {
      setMapLegendVisibility(false);
      return false;
    }

    const rows = countyData.rows
      .map((row) => normalizeDistrictCountyRow(district, row))
      .filter((row) => row.countyFips);

    if (!rows.length) {
      setMapLegendVisibility(false);
      return false;
    }

    const rowByFips = new Map(rows.map((row) => [row.countyFips, row]));
    if (await renderDistrictSvgCountyMap(district, rowByFips)) {
      if (subtitle) {
        subtitle.textContent = `${district.title} ${unitLabel === "parish" ? "parishes" : "counties"} shaded by the winning ${unitLabel} vote share.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
    }

    const countyFeatures = await getCountyFeaturesForRows(district.state, rowByFips);

    if (!countyFeatures.length) {
      setMapLegendVisibility(false);
      return false;
    }

    svg.selectAll("*").remove();
    svg
      .attr("viewBox", "0 0 540 420")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const displayFeature = await getDistrictDisplayFeature(district, feature);
    const projection = d3.geoMercator().fitExtent(
      [[18, 18], [522, 402]],
      displayFeature
    );
    const path = d3.geoPath().projection(projection);
    const districtPath = path(displayFeature);
    const dominantRow = getDominantCountyRow(rows);

    if (dominantRow) {
      svg.append("path")
        .datum(displayFeature)
        .attr("class", "detail-county-shape house-detail-county")
        .attr("data-fips", dominantRow.countyFips)
        .attr("d", districtPath)
        .attr("fill", getCountyFill(dominantRow))
        .attr("stroke", "rgba(255,255,255,0.95)")
        .attr("stroke-width", 2.1)
        .on("mouseover", (event) => {
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(dominantRow, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      if (subtitle) {
        subtitle.textContent = `${district.title} shaded by the dominant county result.`;
      }
      setMapLegendVisibility(true, rows);

      return true;
    }

    const clipPathId = `house-detail-district-clip-${district.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const defs = svg.append("defs");
    defs.append("clipPath")
      .attr("id", clipPathId)
      .append("path")
      .attr("d", districtPath);

    const countyLayer = svg.append("g").attr("clip-path", `url(#${clipPathId})`);

    const gapFillRow = district.code === "MD-03" ? rowByFips.get("24003") : null;
    if (gapFillRow) {
      countyLayer.append("path")
        .datum(displayFeature)
        .attr("class", "house-detail-gap-fill")
        .attr("d", districtPath)
        .attr("fill", getCountyFill(gapFillRow))
        .attr("stroke", "none")
        .attr("pointer-events", "none");
    }

    countyLayer.selectAll("path.house-detail-county")
      .data(countyFeatures)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape house-detail-county")
      .attr("data-fips", (countyFeature) => getCountyFeatureFips(countyFeature))
      .attr("d", path)
      .attr("fill", (countyFeature) => {
        const row = rowByFips.get(getCountyFeatureFips(countyFeature));
        return row ? getCountyFill(row) : "#2d3138";
      })
      .on("mouseover", (event, countyFeature) => {
        const row = rowByFips.get(getCountyFeatureFips(countyFeature));
        if (!row) return;
        tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    svg.append("path")
      .datum(displayFeature)
      .attr("class", "house-detail-shape")
      .attr("d", districtPath)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.95)")
      .attr("stroke-width", 2.1);

    if (subtitle) {
      subtitle.textContent = `${district.title} ${unitLabel === "parish" ? "parishes" : "counties"} shaded by the winning ${unitLabel} vote share.`;
    }
    setMapLegendVisibility(true, rows);

    return true;
  }

  function renderCaliforniaCountyBoard(district) {
    const board = document.getElementById("house-detail-county-board");
    const body = document.getElementById("house-detail-county-board-body");
    if (!board || !body) return false;

    const countyData = window.HOUSE_CA_COUNTY_RESULTS?.[district.code];
    if (!countyData?.counties?.length) {
      board.hidden = true;
      return false;
    }

    setUnitBoardLabels("County");
    board.hidden = false;
    body.innerHTML = countyData.counties
      .slice()
      .sort((a, b) => b.totalVotes - a.totalVotes || a.county.localeCompare(b.county))
      .map((row) => `
        <tr class="detail-county-row">
          <td>${formatCaliforniaCountyTableName(row.county)}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>${row.percentIn}</td>
        </tr>
      `)
      .join("");

    return true;
  }

  function setUnitBoardLabels(unitLabel) {
    const title = document.getElementById("house-detail-unit-board-title");
    const label = document.getElementById("house-detail-unit-board-label");
    if (title) title.textContent = `${unitLabel} Results`;
    if (label) label.textContent = unitLabel;
  }

  function renderDistrictTownBoard(district) {
    const board = document.getElementById("house-detail-county-board");
    const body = document.getElementById("house-detail-county-board-body");
    if (!board || !body) return false;

    const unitData = window.HOUSE_DISTRICT_COUNTY_RESULTS?.[district.code];
    if (!unitData?.townRows?.length) {
      return false;
    }

    const rows = unitData.townRows.map((row) => normalizeDistrictTownRow(row));

    setUnitBoardLabels("Town");
    board.hidden = false;
    body.innerHTML = rows
      .sort((a, b) => b.totalVotes - a.totalVotes || a.town.localeCompare(b.town))
      .map((row) => `
        <tr class="detail-county-row">
          <td>${row.town}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>100%</td>
        </tr>
      `)
      .join("");

    return true;
  }

  function renderDistrictCountyBoard(district) {
    const board = document.getElementById("house-detail-county-board");
    const body = document.getElementById("house-detail-county-board-body");
    if (!board || !body) return false;

    const countyData = window.HOUSE_DISTRICT_COUNTY_RESULTS?.[district.code];
    if (!countyData?.rows?.length) {
      return false;
    }

    const rows = getVisibleCountyRows(
      countyData.rows.map((row) => normalizeDistrictCountyRow(district, row))
    );

    setUnitBoardLabels(district.state === "LA" ? "Parish" : "County");
    board.hidden = false;
    body.innerHTML = rows
      .sort((a, b) => b.totalVotes - a.totalVotes || a.county.localeCompare(b.county))
      .map((row) => `
        <tr class="detail-county-row">
          <td>${formatCountyTableName(row.county)}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>100%</td>
        </tr>
      `)
      .join("");

    return true;
  }

  function getWinnerTone(party) {
    if (party === "D") return "dem";
    if (party === "R") return "rep";
    return "ind";
  }

  async function renderDistrictOutline(district, feature) {
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    if (!feature || svg.empty()) return;

    const renderedCountyMap = district.code.startsWith("CA-")
      ? await renderCaliforniaCountyMap(district, feature) || await renderDistrictTownMap(district, feature) || await renderDistrictCountyMap(district, feature)
      : await renderDistrictTownMap(district, feature) || await renderDistrictCountyMap(district, feature);

    if (renderedCountyMap) return;

    setMapLegendVisibility(false);

    const displayFeature = getMapFitFeature(feature);
    const projection = createMapProjection(feature);
    const path = d3.geoPath().projection(projection);
    svg.selectAll("*").remove();

    svg.append("path")
      .datum(displayFeature)
      .attr("class", "house-detail-shape")
      .attr("d", path)
      .attr("fill", districtFill(district.fillKey))
      .attr("stroke", "rgba(255,255,255,0.92)")
      .attr("stroke-width", 2.1);

    if (subtitle) {
      subtitle.textContent = district.flipped
        ? "District outline shown with flip-aware winner coloring."
        : "District outline shown with certified winner coloring.";
    }
  }

  const districts = normalizeDistricts();
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const district = code ? districts[code] : null;

  if (!district) {
    document.getElementById("house-detail-title").textContent = "District not found";
    document.getElementById("house-detail-subtitle").textContent = "This House district result could not be loaded.";
  } else {
    const tone = getWinnerTone(district.winnerParty);
    const summaryCard = document.getElementById("house-detail-summary-card");
    summaryCard.classList.add(`winner-${tone}`);

    document.title = `${district.title} House Result`;
    document.getElementById("house-detail-title").textContent = district.title;
    document.getElementById("house-detail-subtitle").textContent = `Certified congressional district result in ${district.stateName} for the 2024 House election.`;
    document.getElementById("house-detail-summary-title").textContent = `${district.winnerName} wins ${district.title}.`;
    document.getElementById("house-detail-summary-callout").textContent = district.flipped
      ? "This district flipped parties in the 2024 general election."
      : "Race called with certified district totals.";
    document.getElementById("house-detail-summary-portrait").src = getPortrait(district.winnerName);
    document.getElementById("house-detail-summary-portrait").alt = district.winnerName;

    document.getElementById("house-detail-margin").textContent = district.marginLabel;

    const voteBody = document.getElementById("house-detail-vote-body");
    voteBody.innerHTML = district.candidates.map((candidate) => `
      <tr class="${candidate.winner ? "winner-row" : ""}">
        <td>
          <div class="detail-candidate-cell">
            <img class="detail-candidate-photo" src="${getPortrait(candidate.name)}" alt="${candidate.name}">
            <span>${candidate.name}</span>
          </div>
        </td>
        <td>${PARTY_LABELS[candidate.party] || candidate.partyName || candidate.party}</td>
        <td>${formatHouseCandidateVotes(district, candidate)}</td>
        <td>${formatHouseCandidatePct(district, candidate)}</td>
      </tr>
    `).join("");

    const totals = {
      dem: district.candidates.filter((candidate) => candidate.party === "D").reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0),
      rep: district.candidates.filter((candidate) => candidate.party === "R").reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0),
      ind: district.candidates.filter((candidate) => !["D", "R"].includes(candidate.party)).reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0)
    };
    const totalVotes = Number(district.totalVotes || 0) || (totals.dem + totals.rep + totals.ind);
    const otherVotes = Math.max(0, totalVotes - totals.dem - totals.rep - totals.ind);

    document.getElementById("house-detail-certified-title").textContent = `The House vote has been certified in ${district.title}.`;
    document.getElementById("house-detail-certified-note").textContent = district.uncontested
      ? "Uncontested race."
      : `${formatNumber(totalVotes)} total votes reported.`;
    document.getElementById("house-detail-certified-dem").style.flex = district.uncontested && district.winnerParty === "D" ? "1" : String(totals.dem);
    document.getElementById("house-detail-certified-rep").style.flex = district.uncontested && district.winnerParty === "R" ? "1" : String(totals.rep);
    document.getElementById("house-detail-certified-ind").style.flex = district.uncontested && !["D", "R"].includes(district.winnerParty) ? "1" : String(totals.ind);
    document.getElementById("house-detail-certified-other").style.flex = district.uncontested ? "0" : String(otherVotes);

    const runnerUp = district.candidates[1] || null;
    const districtNumber = district.code.split("-")[1];
    const facts = [
      `<li><strong>Winner</strong><span>${district.winnerName} carried ${district.title} by ${district.marginLabel}.</span></li>`,
      `<li><strong>District</strong><span>${district.stateName} Congressional District ${districtNumber.replace(/^0/, "")} was contested in 2024.</span></li>`,
      `<li><strong>Total votes</strong><span>${district.uncontested ? "This race was uncontested, so comparable two-candidate vote totals are not shown here." : `${formatNumber(totalVotes)} votes were reported in the district.`}</span></li>`,
      `<li><strong>Runner-up</strong><span>${runnerUp ? `${runnerUp.name} finished second with ${runnerUp.pctFormatted || `${formatCompactNumber(runnerUp.pct)}%`}.` : "No runner-up was recorded because the race was uncontested."}</span></li>`,
      `<li><strong>Flip status</strong><span>${district.flipped ? "This district flipped parties in 2024." : "This district stayed with the same party in 2024."}</span></li>`
    ];
    document.getElementById("house-detail-facts").innerHTML = facts.join("");

    const feature = houseDetailGeojson.features.find((item) => item.properties.code === district.code);
    if (feature) {
      renderDistrictOutline(district, feature).then(() => {
        if (district.code.startsWith("CA-")) {
          renderCaliforniaCountyBoard(district) || renderDistrictTownBoard(district) || renderDistrictCountyBoard(district);
          return;
        }
        renderDistrictTownBoard(district) || renderDistrictCountyBoard(district);
      });
    } else {
      if (district.code.startsWith("CA-")) {
        renderCaliforniaCountyBoard(district) || renderDistrictTownBoard(district) || renderDistrictCountyBoard(district);
      } else {
        renderDistrictTownBoard(district) || renderDistrictCountyBoard(district);
      }
    }
  }
}

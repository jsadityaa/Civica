const houseDetailDataBundle = window.HOUSE_2024_DATA;
const houseDetailGeojson = window.HOUSE_2024_GEOJSON;

if (houseDetailDataBundle && houseDetailGeojson && document.getElementById("house-detail-title")) {
  const UNIT_BOARD_COLLAPSED_LIMIT = 6;
  let houseDetailMapMode = "share";
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
    return "https://placehold.co/120x120/2f3540/2f3540";
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
    return d3.geoMercator().fitExtent([[18, 18], [522, 602]], getMapFitFeature(feature));
  }

  const COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
  const CONNECTICUT_TOWNS_GEOJSON_URL = "./assets/maps/connecticut-towns.geojson";
  const STATE_COUNTY_GEOJSON_URLS = {
    FL: "./assets/maps/florida-counties.geojson",
    NJ: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=STATE%3D%2734%27&outFields=GEOID%2CNAME%2CSTATE&returnGeometry=true&f=geojson&outSR=4326",
    NM: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=STATE%3D%2735%27&outFields=GEOID%2CNAME%2CSTATE&returnGeometry=true&f=geojson&outSR=4326"
  };
  const DISTRICT_GEOJSON_URLS = {
    "FL-01": "./assets/maps/florida-district-1.geojson"
  };
  const DISTRICT_SVG_URLS = {
    "CA-10": "./assets/maps/california-district-10-by-county.svg",
    "CA-15": "./assets/maps/california-district-15-by-county.svg",
    "CA-17": "./assets/maps/california-district-17-by-county.svg",
    "CA-26": "./assets/maps/california-district-26-by-county.svg",
    "CA-40": "./assets/maps/california-district-40-by-county.svg",
    "CA-45": "./assets/maps/california-district-45-by-county.svg",
    "CA-49": "./assets/maps/california-district-49-by-county.svg",
    "CO-06": "./assets/maps/colorado-district-06-by-county.svg",
    "CO-08": "./assets/maps/colorado-district-08-by-county.svg",
    "FL-01": "./assets/maps/florida-district-1-by-county.svg",
    "FL-14": "./assets/maps/florida-district-14-by-county.svg",
    "GA-04": "./assets/maps/georgia-district-4-by-county.svg",
    "GA-11": "./assets/maps/georgia-district-11-by-county.svg",
    "HI-02": "./assets/maps/hawaii-district-2-by-county.svg",
    "MD-02": "./assets/maps/maryland-district-02-general.svg",
    "MD-03": "./assets/maps/maryland-district-3-dem-primary.svg",
    "MD-04": "./assets/maps/maryland-district-04-general.svg",
    "MD-05": "./assets/maps/maryland-district-05-general.svg",
    "MD-07": "./assets/maps/maryland-district-07-general.svg",
    "MN-03": "./assets/maps/minnesota-district-03-by-county.svg",
    "MN-04": "./assets/maps/minnesota-district-04-by-county.svg",
    "MO-01": "./assets/maps/missouri-district-01-by-county.svg",
    "MO-02": "./assets/maps/missouri-district-02-by-county.svg",
    "NE-02": "./assets/maps/nebraska-district-02-wikimedia.svg",
    "NC-14": "./assets/maps/north-carolina-district-14-by-county.svg",
    "NJ-01": "./assets/maps/new-jersey-district-01-by-county.svg",
    "NJ-02": "./assets/maps/new-jersey-district-02-by-county.svg",
    "NJ-03": "./assets/maps/new-jersey-district-03-by-county.svg",
    "NJ-04": "./assets/maps/new-jersey-district-04-by-county.svg",
    "NJ-05": "./assets/maps/new-jersey-district-05-by-county.svg",
    "NJ-06": "./assets/maps/new-jersey-district-06-by-county.svg",
    "NJ-07": "./assets/maps/new-jersey-district-07-by-county.svg",
    "NJ-08": "./assets/maps/new-jersey-district-08-by-county.svg",
    "NJ-09": "./assets/maps/new-jersey-district-09-by-county.svg",
    "NJ-10": "./assets/maps/new-jersey-district-10-by-county.svg",
    "NJ-11": "./assets/maps/new-jersey-district-11-by-county.svg",
    "NJ-12": "./assets/maps/new-jersey-district-12-by-county.svg",
    "NM-01": "./assets/maps/new-mexico-district-01-by-county.svg?v=20261004-2022-wikimedia",
    "NM-02": "./assets/maps/new-mexico-district-02-by-county.svg",
    "NM-03": "./assets/maps/new-mexico-district-03-by-county.svg",
    "NY-02": "./assets/maps/new-york-district-02-by-county.svg",
    "NY-03": "./assets/maps/new-york-district-03-by-county.svg",
    "NY-07": "./assets/maps/new-york-district-07-by-county.svg",
    "NY-10": "./assets/maps/new-york-district-10-by-county.svg",
    "NY-11": "./assets/maps/new-york-district-11-by-county.svg",
    "NY-13": "./assets/maps/new-york-district-13-by-county.svg",
    "NY-14": "./assets/maps/new-york-district-14-by-county.svg",
    "NY-16": "./assets/maps/new-york-district-16-by-county.svg",
    "NY-19": "./assets/maps/new-york-district-19-by-county.svg",
    "NY-20": "./assets/maps/new-york-district-20-by-county.svg",
    "OH-01": "./assets/maps/ohio-district-01-by-county.svg",
    "OH-12": "./assets/maps/ohio-district-12-by-county.svg",
    "OK-01": "./assets/maps/oklahoma-district-01-by-county.svg",
    "PA-01": "./assets/maps/pennsylvania-district-01-by-county.svg",
    "PA-04": "./assets/maps/pennsylvania-district-04-by-county.svg",
    "PA-05": "./assets/maps/pennsylvania-district-05-by-county.svg",
    "PA-06": "./assets/maps/pennsylvania-district-06-by-county.svg",
    "PA-07": "./assets/maps/pennsylvania-district-07-by-county.svg",
    "PA-10": "./assets/maps/pennsylvania-district-10-by-county.svg?v=20261005-york",
    "PA-12": "./assets/maps/pennsylvania-district-12-by-county.svg",
    "SC-01": "./assets/maps/south-carolina-district-01-by-county.svg",
    "TN-09": "./assets/maps/tennessee-district-09-by-county.svg",
    "TX-14": "./assets/maps/texas-district-14-by-county.svg",
    "TX-26": "./assets/maps/texas-district-26-by-county.svg",
    "VA-02": "./assets/maps/virginia-district-02-by-county.svg",
    "VA-03": "./assets/maps/virginia-district-03-by-county.svg",
    "VA-08": "./assets/maps/virginia-district-08-by-county.svg",
    "NV-04": "./assets/maps/nevada-district-04-by-county.svg"
  };
  const DISTRICT_SVG_VIEW_BOXES = {
    "NE-02": "0 0 8200 4300"
  };
  const DISTRICT_SVG_CORRECTIONS = {};
  const DISTRICT_SVG_HIT_AREAS = {};
  const DISTRICT_SVG_TOWN_URLS = {
    "RI-01": "./assets/maps/rhode-island-district-01-by-municipality.svg"
  };
  const DISTRICT_SVG_TOWN_PATHS = {
    // "2023 Rhode Island's 1st congressional district special Republican primary results map by municipality.svg"
    // by 02rufus02, CC BY-SA 4.0, via Wikimedia Commons. Recolored here with 2024 general-election municipality results.
    "RI-01": {
      path232981: "44007-007-Cumberland",
      path232983: "44007-007-Woonsocket",
      path232985: "44007-007-North Smithfield",
      path232989: "44007-007-Lincoln",
      path232991: "44007-007-Smithfield",
      path232995: "44007-007-Central Falls",
      path232997: "44007-007-Pawtucket",
      path232999: "44007-007-North Providence",
      path233003: "44007-007-Providence",
      path233005: "44007-007-East Providence",
      path233013: "44007-007-Providence",
      path233027: "44001-001-Barrington",
      path233031: "44001-001-Warren",
      path233039: "44005-005-Tiverton",
      path233051: "44001-001-Bristol",
      path233059: "44005-005-Portsmouth",
      path233065: "44005-005-Middletown",
      path233113: "44005-005-Jamestown",
      path233115: "44005-005-Little Compton",
      path233117: "44005-005-Newport",
      path233151: "44005-005-Newport"
    }
  };
  const DISTRICT_SVG_SUBPATH_COUNTIES = {
    "MO-02": {
      path14: ["29183", "29189"] // St. Charles, then the small St. Louis County piece bundled into that source path.
    }
  };
  const DISTRICT_SVG_COUNTY_PATHS = {
    // California district SVGs by Wikimedia Commons contributors; recolored here with 2024 general-election county results.
    "CA-10": {
      path4: "06001", // Alameda
      path6: "06013" // Contra Costa
    },
    "CA-15": {
      path2: "06081", // San Mateo fragment
      path4: "06081", // San Mateo
      path6: "06075" // San Francisco
    },
    "CA-17": {
      path3810: "06001", // Alameda
      path3938: "06085" // Santa Clara
    },
    "CA-26": {
      path2: "06111", // Ventura fragment
      path4: "06037", // Los Angeles
      path6: "06111", // Ventura
      path8: "06111" // Ventura fragment
    },
    "CA-40": {
      path5573: "06059", // Orange
      path5759: "06071", // San Bernardino
      path6267: "06065" // Riverside
    },
    "CA-45": {
      path1: "06037", // Los Angeles
      path7: "06059" // Orange
    },
    "CA-49": {
      path18443: "06059", // Orange
      path18759: "06073" // San Diego
    },
    // Colorado district SVGs by Wikimedia Commons contributors; recolored here with 2024 general-election county results.
    "CO-06": {
      path17: "08001", // Adams
      path16: "08005", // Arapahoe
      path14: "08031", // Denver fragment
      path15: "08031", // Denver fragment
      path34: "08035", // Douglas
      path38: "08059" // Jefferson
    },
    "CO-08": {
      path14: "08001", // Adams
      path262: "08069", // Larimer
      path271: "08123" // Weld
    },
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
    "MD-02": {
      path18449: "24510", // Baltimore City
      path19051: "24005", // Baltimore County
      path20235: "24013" // Carroll
    },
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
    // Missouri district SVGs by Wikimedia Commons contributors; recolored here with 2024 general-election county results.
    "MO-01": {
      path2: "29189", // St. Louis County
      path4: "29510" // St. Louis City
    },
    "MO-02": {
      path30: "29071", // Franklin
      path14: "29183", // St. Charles
      path118: "29189", // St. Louis County
      path24: "29219" // Warren
    },
    // "2024 NC-14 election results.svg" by Wikimedia Commons contributors, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "NC-14": {
      path40: "37023", // Burke
      path10: "37045", // Cleveland
      path12: "37071", // Gaston
      path20: "37119", // Mecklenburg
      path34: "37149", // Polk
      path36: "37161" // Rutherford
    },
    // Extracted from "2024 United States House of Representatives elections in Ohio results map by county.svg".
    // Recolored here with 2024 general-election county results.
    "OH-01": {
      Hamilton: "39061",
      Warren: "39165"
    },
    "OH-12": {
      Athens: "39009",
      Coshocton: "39031",
      Delaware: "39041",
      Fairfield: "39045",
      Guernsey: "39059",
      Holmes: "39075",
      Knox: "39083",
      Licking: "39089",
      Morgan: "39115",
      Muskingum: "39119",
      Perry: "39127",
      Tuscarawas: "39157"
    },
    // Extracted from "2024 United States House of Representatives elections in Oklahoma results map by county.svg".
    // Recolored here with 2024 general-election county results.
    "OK-01": {
      Creek: "40037",
      Rogers: "40131",
      Tulsa: "40143",
      Wagoner: "40145"
    },
    // Pennsylvania district SVGs by Wikimedia Commons contributors; recolored here with 2024 general-election county results.
    "PA-01": {
      path1615: "42017", // Bucks
      path1727: "42091" // Montgomery
    },
    "PA-04": {
      path2: "42011", // Berks
      path4: "42011", // Berks fragment
      path6: "42011", // Berks fragment
      path8: "42091", // Montgomery
      path10: "42011", // Berks fragment
      path12: "42011" // Berks fragment
    },
    "PA-05": {
      path4: "42091", // Montgomery
      path6: "42101", // Philadelphia
      path8: "42045" // Delaware
    },
    "PA-06": {
      path4: "42011", // Berks
      path10: "42029" // Chester
    },
    "PA-07": {
      path1603: "42025", // Carbon
      path1775: "42077", // Lehigh
      path1547: "42089", // Monroe
      path5533: "42095" // Northampton
    },
    "PA-10": {
      path140: "42041", // Cumberland
      path142: "42043", // Dauphin
      path146: "42133" // York
    },
    "PA-12": {
      path2: "42003", // Allegheny
      path6: "42129" // Westmoreland
    },
    // "2024 SC-01 election.svg" by Wikimedia Commons contributors, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "SC-01": {
      path3654: "45013", // Beaufort
      path3650: "45015", // Berkeley
      path3644: "45019", // Charleston
      path3652: "45029", // Colleton
      path3646: "45035", // Dorchester
      path3648: "45053" // Jasper
    },
    // "2022 Tennessee's 9th congressional district election results by county.svg"
    // by Ohaiyoan124 / Wikimedia contributors, CC BY-SA 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "TN-09": {
      path120309: "47157", // Shelby
      path120307: "47167" // Tipton
    },
    // "2024 NJ-01 election results.svg" by Incognito melon and Wikimedia contributors, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "NJ-01": {
      "Burlington County": "34005",
      path4: "34007", // Camden
      path6: "34015" // Gloucester
    },
    "NJ-02": {
      path2: "34001", // Atlantic
      path6: "34009", // Cape May
      path8: "34011", // Cumberland
      path10: "34015", // Gloucester
      path12: "34029", // Ocean
      path14: "34033" // Salem
    },
    "NJ-03": {
      path2: "34005", // Burlington
      path4: "34005", // Burlington fragment
      path6: "34021", // Mercer
      path8: "34025", // Monmouth
      path10: "34005" // Burlington fragment
    },
    "NJ-04": {
      path2: "34025", // Monmouth
      path4: "34029" // Ocean
    },
    "NJ-05": {
      path2: "34003", // Bergen
      path4: "34031", // Passaic
      path6: "34037", // Sussex
      path8: "34031" // Passaic fragment
    },
    "NJ-06": {
      path2: "34025", // Monmouth
      path4: "34023" // Middlesex
    },
    "NJ-07": {
      path68: "34019", // Hunterdon
      path80: "34027", // Morris
      "Somerset County": "34035",
      "Sussex County": "34037",
      "Union County": "34039",
      "Warren County": "34041"
    },
    "NJ-08": {
      path2: "34013", // Essex
      path4: "34017", // Hudson
      path6: "34039" // Union
    },
    "NJ-09": {
      path2: "34003", // Bergen
      path4: "34003", // Bergen fragment
      path6: "34017", // Hudson
      path8: "34031" // Passaic
    },
    "NJ-10": {
      path2: "34013", // Essex
      path4: "34017", // Hudson
      path6: "34039" // Union
    },
    "NJ-11": {
      "Essex County": "34013",
      path4: "34031", // Passaic
      path10: "34027" // Morris
    },
    "NJ-12": {
      path2: "34021", // Mercer
      path4: "34035", // Somerset
      path6: "34039", // Union
      path8: "34023" // Middlesex
    },
    // New Mexico district SVGs by Incognito melon and later Wikimedia contributors, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "NM-01": {
      path5156: "35001", // Bernalillo
      path5158: "35005", // Chaves
      path5150: "35005", // Chaves fragment
      path5152: "35011", // De Baca
      path5154: "35011", // De Baca fragment
      path5144: "35019", // Guadalupe
      path5170: "35027", // Lincoln
      path5142: "35035", // Otero fragment
      path5148: "35035", // Otero
      path5162: "35049", // Santa Fe
      path5164: "35043", // Sandoval
      path5146: "35057", // Torrance
      path5160: "35061" // Valencia
    },
    "NM-02": {
      path1896: "35001", // Bernalillo
      path52: "35003", // Catron
      path2372: "35005", // Chaves
      path1904: "35006", // Cibola
      path92: "35013", // Dona Ana
      path80: "35015", // Eddy
      path192: "35017", // Grant
      path3496: "35023", // Hidalgo
      path1524: "35025", // Lea
      path188: "35029", // Luna
      path1988: "35031", // McKinley
      path76: "35035", // Otero
      path96: "35051", // Sierra
      path36: "35053", // Socorro
      path1908: "35061" // Valencia
    },
    "NM-03": {
      path74: "35005", // Chaves
      path80: "35007", // Colfax
      path60: "35009", // Curry
      path84: "35015", // Eddy
      path66: "35021", // Harding
      path76: "35025", // Lea
      path4: "35028", // Los Alamos
      path56: "35031", // McKinley
      path82: "35033", // Mora
      path68: "35037", // Quay
      path42: "35039", // Rio Arriba
      path70: "35041", // Roosevelt
      path38: "35043", // Sandoval
      path52: "35045", // San Juan
      path78: "35047", // San Miguel
      path40: "35049", // Santa Fe
      path58: "35055", // Taos
      path50: "35059" // Union
    },
    // "2024 NV-04 election results.svg" by Incognito melon, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "NV-04": {
      path2: "32001", // Churchill
      path16: "32003", // Clark
      path4: "32009", // Esmeralda
      path24: "32017", // Lincoln
      path20: "32019", // Lyon
      path6: "32021", // Mineral
      path22: "32023" // Nye
    },
    // New York district SVGs by Wikimedia Commons contributors; recolored here with 2024 general-election county results.
    "NY-02": {
      path27: "36059", // Nassau
      path59: "36103" // Suffolk
    },
    "NY-03": {
      path30: "36081", // Queens
      path27: "36059", // Nassau
      path28: "36103" // Suffolk
    },
    "NY-07": {
      path27: "36047", // Kings
      path32: "36081" // Queens
    },
    "NY-10": {
      path28: "36061", // New York
      path27: "36047" // Kings
    },
    "NY-11": {
      path28: "36085", // Richmond
      path27: "36047" // Kings
    },
    "NY-13": {
      path31: "36005", // Bronx
      path27: "36061" // New York
    },
    "NY-14": {
      path27: "36005", // Bronx
      path35: "36081" // Queens
    },
    "NY-16": {
      path27: "36005", // Bronx
      path28: "36119" // Westchester
    },
    "NY-19": {
      path29: "36109", // Tompkins
      path37: "36023", // Cortland
      path33: "36017", // Chenango
      path31: "36007", // Broome
      path35: "36025", // Delaware
      path36: "36039", // Greene
      path30: "36083", // Rensselaer
      path34: "36021", // Columbia
      path32: "36111", // Ulster
      path28: "36105", // Sullivan
      path27: "36077" // Otsego
    },
    "NY-20": {
      path31: "36057", // Montgomery
      path29: "36091", // Saratoga
      path27: "36083", // Rensselaer
      path30: "36001", // Albany
      path28: "36093" // Schenectady
    },
    // "2024 TX-26 election results.svg" by Wikimedia Commons contributors, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "TX-26": {
      path20: "48097", // Cooke
      path6: "48121", // Denton
      path14: "48439", // Tarrant
      path16: "48497" // Wise
    },
    // "2024 TX-14 election results.svg" by Wikimedia Commons contributors, CC BY 4.0, via Wikimedia Commons.
    // Recolored here with 2024 general-election county results.
    "TX-14": {
      path18: "48039", // Brazoria
      path22: "48167", // Galveston
      path14: "48245", // Jefferson
      path16: "48361" // Orange
    },
    // Virginia district SVGs by Wikimedia Commons contributors; recolored here with 2024 general-election county/city results.
    "VA-02": {
      path40: "51001", // Accomack
      path20: "51810", // Virginia Beach
      path42: "51550", // Chesapeake
      path12: "51800", // Suffolk
      path26: "51093", // Isle of Wight
      path36: "51131", // Northampton
      path22: "51175", // Southampton
      path34: "51620" // Franklin City
    },
    "VA-03": {
      51: "51700", // Newport News
      83: "51650", // Hampton
      65: "51550", // Chesapeake
      31: "51740", // Portsmouth
      125: "51710" // Norfolk
    },
    "VA-08": {
      path4: "51059", // Fairfax
      path6: "51059", // Fairfax fragment
      path8: "51059", // Fairfax fragment
      path10: "51059", // Fairfax fragment
      path14: "51013", // Arlington
      path16: "51013", // Arlington fragment
      path2: "51510", // Alexandria
      path12: "51610" // Falls Church
    }
  };
  const COUNTY_SUBDIVISION_GEOJSON_URLS = {
    CT: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/1/query?where=STATE%3D%2709%27&outFields=GEOID%2CNAME%2CBASENAME%2CSTATE%2CCOUNTY&returnGeometry=true&f=geojson&outSR=4326",
    ME: "./assets/maps/state-local-results-2024/maine-local-results-2024.geojson?v=20261006-maine-labels",
    MA: "./assets/maps/state-local-results-2024/massachusetts-local-results-2024.geojson",
    NH: "./assets/maps/state-local-results-2024/new-hampshire-local-results-2024.geojson",
    RI: "./assets/maps/state-local-results-2024/rhode-island-local-results-2024.geojson",
    VT: "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/1/query?where=STATE%3D%2750%27&outFields=GEOID%2CNAME%2CBASENAME%2CSTATE%2CCOUNTY&returnGeometry=true&f=geojson&outSR=4326"
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

  function formatCountyTooltipName(name) {
    return String(name || "")
      .replace(/\s*\(pt\.\)$/i, "")
      .replace(/\s*\(part\)$/i, "")
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
    if (party === "I" || party === "IND" || partyName === "Independent") return "Ind.";
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
    if (!Number(row?.totalVotes || 0)) {
      return "#2d3138";
    }
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

  function getCountyUnitLabels(state) {
    if (state === "LA") {
      return { singular: "parish", plural: "parishes", board: "Parish" };
    }
    if (state === "VA") {
      return { singular: "county/city", plural: "counties and cities", board: "County/City" };
    }
    return { singular: "county", plural: "counties", board: "County" };
  }

  function hasIndependentUnitWinner(rows) {
    return (rows || []).some((row) => row?.winnerParty && row.winnerParty !== "D" && row.winnerParty !== "R");
  }

  function setMapLegendVisibility(visible, rows = []) {
    const legend = document.getElementById("house-detail-map-legend");
    const independentRow = document.getElementById("house-detail-map-legend-ind");
    const leadLegend = document.getElementById("house-detail-lead-legend");
    const leadIndependentRow = document.getElementById("house-detail-lead-legend-ind");
    const showLead = visible && houseDetailMapMode === "lead";
    if (legend) {
      legend.hidden = !visible || showLead;
    }
    if (independentRow) {
      independentRow.hidden = !visible || showLead || !hasIndependentUnitWinner(rows);
    }
    if (leadLegend) {
      leadLegend.hidden = !showLead;
    }
    if (leadIndependentRow) {
      leadIndependentRow.hidden = !showLead || !hasIndependentUnitWinner(rows);
    }
  }

  function getHouseUnitLead(row) {
    const candidates = (row?.candidates || [])
      .slice()
      .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
    if (!candidates.length) return 0;
    return Math.max(0, Number(candidates[0].votes || 0) - Number(candidates[1]?.votes || 0));
  }

  function setupHouseDetailMapMode(district, feature, rows) {
    const modeControl = document.getElementById("house-detail-map-mode");
    const canToggle = rows.length > 1 && rows.some((row) => getHouseUnitLead(row) > 0);
    if (!canToggle) {
      houseDetailMapMode = "share";
    }
    if (modeControl) {
      modeControl.hidden = !canToggle;
      modeControl.querySelectorAll("[data-map-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.mapMode === houseDetailMapMode);
        button.onclick = () => {
          if (houseDetailMapMode === button.dataset.mapMode) return;
          houseDetailMapMode = button.dataset.mapMode;
          renderDistrictOutline(district, feature);
        };
      });
    }
    setMapLegendVisibility(canToggle, rows);
    return canToggle && houseDetailMapMode === "lead";
  }

  function hideHouseDetailMapMode() {
    const modeControl = document.getElementById("house-detail-map-mode");
    const leadLegend = document.getElementById("house-detail-lead-legend");
    if (modeControl) modeControl.hidden = true;
    if (leadLegend) leadLegend.hidden = true;
  }

  function renderHouseLeadBubbles(svg, items, tooltip, district) {
    const maxLead = d3.max(items, (item) => getHouseUnitLead(item.row)) || 1;
    const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5, 40]);
    svg.append("g")
      .selectAll("circle")
      .data(items)
      .enter()
      .append("circle")
      .attr("class", (item) => `state-election-lead-bubble ${getWinnerTone(item.row.winnerParty)}`)
      .attr("data-fips", (item) => item.row.countyFips || item.row.townGeoId || item.row.town || item.row.county)
      .attr("cx", (item) => item.centroid[0])
      .attr("cy", (item) => item.centroid[1])
      .attr("r", (item) => radius(getHouseUnitLead(item.row)))
      .on("mouseover", (event, item) => {
        const tooltipRow = { ...item.row, county: item.row.county || item.row.town };
        tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(tooltipRow, district));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
  }

  function getSvgPathInteriorPoint(pathElement) {
    const bbox = pathElement.getBBox();
    const fallback = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
    if (!bbox.width || !bbox.height || typeof pathElement.isPointInFill !== "function") return fallback;

    const svg = pathElement.ownerSVGElement;
    const point = svg?.createSVGPoint?.();
    if (!point) return fallback;

    const edgePoints = [];
    try {
      const length = pathElement.getTotalLength();
      const samples = 44;
      for (let index = 0; index <= samples; index += 1) {
        const edge = pathElement.getPointAtLength((length * index) / samples);
        edgePoints.push([edge.x, edge.y]);
      }
    } catch (error) {
      return fallback;
    }

    const candidates = [
      fallback,
      [bbox.x + bbox.width * 0.35, bbox.y + bbox.height * 0.5],
      [bbox.x + bbox.width * 0.65, bbox.y + bbox.height * 0.5],
      [bbox.x + bbox.width * 0.5, bbox.y + bbox.height * 0.35],
      [bbox.x + bbox.width * 0.5, bbox.y + bbox.height * 0.65]
    ];
    const gridSteps = 8;
    for (let xStep = 1; xStep < gridSteps; xStep += 1) {
      for (let yStep = 1; yStep < gridSteps; yStep += 1) {
        candidates.push([
          bbox.x + (bbox.width * xStep) / gridSteps,
          bbox.y + (bbox.height * yStep) / gridSteps
        ]);
      }
    }

    let best = null;
    let bestScore = -1;
    candidates.forEach(([x, y]) => {
      point.x = x;
      point.y = y;
      if (!pathElement.isPointInFill(point)) return;
      const score = edgePoints.reduce((minDistance, edge) => {
        const distance = (x - edge[0]) ** 2 + (y - edge[1]) ** 2;
        return Math.min(minDistance, distance);
      }, Infinity);
      if (score > bestScore) {
        bestScore = score;
        best = [x, y];
      }
    });

    return best || fallback;
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

    if (!svgUrl || svg.empty()) {
      return false;
    }

    try {
      const svgText = await d3.text(svgUrl);
      const parsedSvg = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
      const viewBox = DISTRICT_SVG_VIEW_BOXES[district.code]
        || parsedSvg.getAttribute("viewBox")
        || `0 0 ${parsedSvg.getAttribute("width") || 800} ${parsedSvg.getAttribute("height") || 433}`;
      const [sourceX, sourceY, sourceWidth, sourceHeight] = viewBox.split(/\s+/).map(Number);
      const viewportWidth = 540;
      const viewportHeight = 620;
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
        .flatMap((pathElement) => {
          const id = pathElement.getAttribute("id");
          const d = pathElement.getAttribute("d");
          const defaultCountyFips = (pathCountyMap && pathCountyMap[id])
            || pathElement.getAttribute("data-fips");
          const subpathCounties = DISTRICT_SVG_SUBPATH_COUNTIES[district.code]?.[id];
          const subpaths = subpathCounties && d
            ? d.match(/[Mm][^Mm]*/g) || [d]
            : [d];

          return subpaths.map((subpathD, index) => ({
            id,
            countyFips: (subpathCounties && subpathCounties[index]) || defaultCountyFips,
            d: subpathD,
            fillRule: pathElement.getAttribute("fill-rule"),
            transform: getPathTransform(pathElement),
            style: pathElement.getAttribute("style")
          }));
        })
        .filter((pathData) => pathData.id && pathData.d && pathData.countyFips);

      if (!paths.length) return false;

      svg.selectAll("*").remove();
      svg
        .attr("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const layer = svg.append("g")
        .attr("class", "house-detail-svg-county-layer")
        .attr("transform", `translate(${sourceTranslateX} ${sourceTranslateY}) scale(${sourceScale})`);

      layer.selectAll("path.house-detail-svg-district-outline")
        .data(paths)
        .enter()
        .append("path")
        .attr("class", "house-detail-svg-district-outline")
        .attr("d", (pathData) => pathData.d)
        .attr("fill-rule", (pathData) => pathData.fillRule || null)
        .attr("transform", (pathData) => pathData.transform || null)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.96)")
        .attr("stroke-width", 2.1)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");

      if (houseDetailMapMode === "lead") {
        const leadItemByFips = new Map();
        layer.selectAll("path.house-detail-svg-county-lead")
          .data(paths)
          .enter()
          .append("path")
          .attr("class", "state-election-lead-county-shape house-detail-svg-county-lead")
          .attr("data-fips", (pathData) => pathData.countyFips)
          .attr("d", (pathData) => pathData.d)
          .attr("fill-rule", (pathData) => pathData.fillRule || null)
          .attr("transform", (pathData) => pathData.transform || null)
          .attr("vector-effect", "non-scaling-stroke")
          .each(function(pathData) {
            const row = rowByFips.get(pathData.countyFips);
            if (!row) return;
            const bbox = this.getBBox();
            const area = bbox.width * bbox.height;
            const item = {
              row,
              centroid: getSvgPathInteriorPoint(this),
              area
            };
            const existing = leadItemByFips.get(pathData.countyFips);
            if (!existing || area > existing.area) {
              leadItemByFips.set(pathData.countyFips, item);
            }
          });

        const leadItems = Array.from(leadItemByFips.values());
        const maxLead = d3.max(leadItems, (item) => getHouseUnitLead(item.row)) || 1;
        const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5 / sourceScale, 40 / sourceScale]);
        layer.append("g")
          .selectAll("circle")
          .data(leadItems)
          .enter()
          .append("circle")
          .attr("class", (item) => `state-election-lead-bubble ${getWinnerTone(item.row.winnerParty)}`)
          .attr("data-fips", (item) => item.row.countyFips)
          .attr("cx", (item) => item.centroid[0])
          .attr("cy", (item) => item.centroid[1])
          .attr("r", (item) => radius(getHouseUnitLead(item.row)))
          .attr("vector-effect", "non-scaling-stroke")
          .on("mouseover", (event, item) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(item.row, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });

        return true;
      }

      layer.selectAll("path.house-detail-svg-county")
        .data(paths)
        .enter()
        .append("path")
        .attr("class", "detail-county-shape house-detail-county house-detail-svg-county")
        .attr("data-fips", (pathData) => pathData.countyFips)
        .attr("d", (pathData) => pathData.d)
        .attr("fill-rule", (pathData) => pathData.fillRule || null)
        .attr("transform", (pathData) => pathData.transform || null)
        .attr("fill", (pathData) => {
          const row = rowByFips.get(pathData.countyFips);
          return row ? getCountyFill(row) : "#2d3138";
        })
        .attr("stroke", "rgba(255,255,255,0.95)")
        .attr("stroke-width", 2.1)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .on("mouseover", (event, pathData) => {
          const row = rowByFips.get(pathData.countyFips);
          if (!row) return;
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      const corrections = DISTRICT_SVG_CORRECTIONS[district.code] || [];
      corrections.forEach((correction) => {
        const row = rowByFips.get(correction.countyFips);
        if (!row) return;

        const transformSource = correction.transformSourceId
          ? sourcePaths.find((pathElement) => pathElement.getAttribute("id") === correction.transformSourceId)
          : null;
        const transform = transformSource ? getPathTransform(transformSource) : correction.transform;

        layer.append("path")
          .attr("class", "detail-county-shape house-detail-county house-detail-svg-county house-detail-svg-county-correction")
          .attr("data-fips", correction.countyFips)
          .attr("d", correction.d)
          .attr("transform", transform || null)
          .attr("fill", getCountyFill(row))
          .attr("stroke", correction.stroke || "none")
          .attr("stroke-width", correction.strokeWidth || 0)
          .attr("vector-effect", correction.strokeWidth ? "non-scaling-stroke" : null)
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      });

      const hitAreas = DISTRICT_SVG_HIT_AREAS[district.code] || [];
      hitAreas.forEach((hitArea) => {
        const row = rowByFips.get(hitArea.countyFips);
        if (!row) return;

        const transformSource = hitArea.transformSourceId
          ? sourcePaths.find((pathElement) => pathElement.getAttribute("id") === hitArea.transformSourceId)
          : null;
        const transform = transformSource ? getPathTransform(transformSource) : hitArea.transform;

        layer.append("path")
          .attr("class", "detail-county-shape house-detail-county house-detail-svg-county-hit-area")
          .attr("data-fips", hitArea.countyFips)
          .attr("d", hitArea.d)
          .attr("transform", transform || null)
          .attr("fill", "transparent")
          .attr("stroke", "none")
          .attr("pointer-events", "all")
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(row, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      });

      return true;
    } catch (error) {
      console.warn(`SVG district map unavailable for ${district.code}; using generated geometry.`, error);
      return false;
    }
  }

  async function renderDistrictSvgTownMap(district, rowByGeoId) {
    const svgUrl = DISTRICT_SVG_TOWN_URLS[district.code];
    const pathTownMap = DISTRICT_SVG_TOWN_PATHS[district.code];
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");

    if (!svgUrl || !pathTownMap || svg.empty()) {
      return false;
    }

    try {
      const svgText = await d3.text(svgUrl);
      const parsedSvg = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
      const viewBox = parsedSvg.getAttribute("viewBox")
        || `0 0 ${parsedSvg.getAttribute("width") || 800} ${parsedSvg.getAttribute("height") || 1259}`;
      const [sourceX, sourceY, sourceWidth, sourceHeight] = viewBox.split(/\s+/).map(Number);
      const viewportWidth = 540;
      const viewportHeight = 620;
      const viewportPadding = 24;
      const sourceScale = Number.isFinite(sourceWidth) && Number.isFinite(sourceHeight) && sourceWidth > 0 && sourceHeight > 0
        ? Math.min((viewportWidth - viewportPadding * 2) / sourceWidth, (viewportHeight - viewportPadding * 2) / sourceHeight)
        : 1;
      const sourceTranslateX = (viewportWidth - sourceWidth * sourceScale) / 2 - sourceX * sourceScale;
      const sourceTranslateY = (viewportHeight - sourceHeight * sourceScale) / 2 - sourceY * sourceScale;
      const paths = Array.from(parsedSvg.querySelectorAll("path"))
        .map((pathElement) => {
          const id = pathElement.getAttribute("id");
          return {
            id,
            townGeoId: pathTownMap[id],
            d: pathElement.getAttribute("d"),
            fillRule: pathElement.getAttribute("fill-rule")
          };
        })
        .filter((pathData) => pathData.id && pathData.d && pathData.townGeoId);

      if (!paths.length) return false;

      svg.selectAll("*").remove();
      svg
        .attr("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

      const layer = svg.append("g")
        .attr("class", "house-detail-svg-town-layer")
        .attr("transform", `translate(${sourceTranslateX} ${sourceTranslateY}) scale(${sourceScale})`);

      layer.selectAll("path.house-detail-svg-town-outline")
        .data(paths)
        .enter()
        .append("path")
        .attr("class", "house-detail-svg-town-outline")
        .attr("d", (pathData) => pathData.d)
        .attr("fill-rule", (pathData) => pathData.fillRule || null)
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.96)")
        .attr("stroke-width", 2.1)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .attr("pointer-events", "none");

      if (houseDetailMapMode === "lead") {
        const leadItemByGeoId = new Map();
        layer.selectAll("path.house-detail-svg-town-lead")
          .data(paths)
          .enter()
          .append("path")
          .attr("class", "state-election-lead-county-shape house-detail-svg-town-lead")
          .attr("data-fips", (pathData) => pathData.townGeoId)
          .attr("d", (pathData) => pathData.d)
          .attr("fill-rule", (pathData) => pathData.fillRule || null)
          .attr("vector-effect", "non-scaling-stroke")
          .each(function(pathData) {
            const row = rowByGeoId.get(pathData.townGeoId);
            if (!row) return;
            const bbox = this.getBBox();
            const area = bbox.width * bbox.height;
            const item = {
              row,
              centroid: getSvgPathInteriorPoint(this),
              area
            };
            const existing = leadItemByGeoId.get(pathData.townGeoId);
            if (!existing || area > existing.area) {
              leadItemByGeoId.set(pathData.townGeoId, item);
            }
          });

        const leadItems = Array.from(leadItemByGeoId.values());
        const maxLead = d3.max(leadItems, (item) => getHouseUnitLead(item.row)) || 1;
        const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5 / sourceScale, 40 / sourceScale]);
        layer.append("g")
          .selectAll("circle")
          .data(leadItems)
          .enter()
          .append("circle")
          .attr("class", (item) => `state-election-lead-bubble ${getWinnerTone(item.row.winnerParty)}`)
          .attr("data-fips", (item) => item.row.townGeoId || item.row.town)
          .attr("cx", (item) => item.centroid[0])
          .attr("cy", (item) => item.centroid[1])
          .attr("r", (item) => radius(getHouseUnitLead(item.row)))
          .attr("vector-effect", "non-scaling-stroke")
          .on("mouseover", (event, item) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML({ ...item.row, county: item.row.town }, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });

        return true;
      }

      layer.selectAll("path.house-detail-svg-town")
        .data(paths)
        .enter()
        .append("path")
        .attr("class", "detail-county-shape house-detail-county house-detail-svg-town")
        .attr("data-geoid", (pathData) => pathData.townGeoId)
        .attr("d", (pathData) => pathData.d)
        .attr("fill-rule", (pathData) => pathData.fillRule || null)
        .attr("fill", (pathData) => {
          const row = rowByGeoId.get(pathData.townGeoId);
          return row ? getCountyFill(row) : "#2d3138";
        })
        .attr("stroke", "rgba(255,255,255,0.95)")
        .attr("stroke-width", 2.1)
        .attr("stroke-linejoin", "round")
        .attr("vector-effect", "non-scaling-stroke")
        .on("mouseover", (event, pathData) => {
          const row = rowByGeoId.get(pathData.townGeoId);
          if (!row) return;
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML({ ...row, county: row.town }, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      return true;
    } catch (error) {
      console.warn(`SVG town map unavailable for ${district.code}; using generated local geometry.`, error);
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
    const tooltipCandidates = candidates.slice(0, 3);
    const districtNumber = String(district.code || "").split("-")[1]?.replace(/^0/, "") || "";
    const countyName = formatCountyTooltipName(row.county);
    const title = districtNumber ? `${countyName} / District ${districtNumber}` : countyName;

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
          ${tooltipCandidates.map((candidate, index) => `
            <tr class="${index === 0 ? "winner-row" : ""}">
              <td>
                <div class="tooltip-candidate">
                  <span class="tooltip-candidate-bar ${getWinnerTone(candidate.party)}"></span>
                  <span>${candidate.name}</span>
                </div>
              </td>
              <td>${getShortPartyLabel(candidate)}</td>
              <td>${formatNumber(candidate.votes)}</td>
              <td>${Number(candidate.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  async function renderCaliforniaCountyMap(district, feature) {
    const countyData = window.HOUSE_CA_COUNTY_RESULTS?.[district.code];
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");
    if (!countyData?.counties?.length || svg.empty()) {
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

    const showLead = setupHouseDetailMapMode(district, feature, rows);
    const rowByFips = new Map(rows.map((row) => [row.countyFips, row]));
    if (await renderDistrictSvgCountyMap(district, rowByFips)) {
      if (subtitle) {
        subtitle.textContent = showLead
          ? `${district.title} counties sized by the winning county vote lead.`
          : `${district.title} counties shaded by the winning county vote share.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
    }

    if (!window.topojson) {
      setMapLegendVisibility(false);
      return false;
    }

    const countyFeatures = await getCountyFeaturesForRows(district.state, rowByFips);

    if (!countyFeatures.length) {
      setMapLegendVisibility(false);
      return false;
    }

    svg.selectAll("*").remove();
    svg
      .attr("viewBox", "0 0 540 620")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const displayFeature = getMapFitFeature(feature);
    const projection = d3.geoMercator().fitExtent(
      [[18, 18], [522, 602]],
      displayFeature
    );
    const path = d3.geoPath().projection(projection);
    const districtPath = path(displayFeature);
    const dominantRow = getDominantCountyRow(rows);

    if (showLead) {
      const clipPathId = `house-detail-district-lead-clip-${district.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      svg.append("defs")
        .append("clipPath")
        .attr("id", clipPathId)
        .append("path")
        .attr("d", districtPath);

      const countyLayer = svg.append("g").attr("clip-path", `url(#${clipPathId})`);
      countyLayer.selectAll("path")
        .data(countyFeatures)
        .enter()
        .append("path")
        .attr("class", "state-election-lead-county-shape")
        .attr("data-fips", (countyFeature) => getCountyFeatureFips(countyFeature))
        .attr("d", path);

      renderHouseLeadBubbles(
        svg,
        countyFeatures
          .map((countyFeature) => ({
            row: rowByFips.get(getCountyFeatureFips(countyFeature)),
            centroid: path.centroid(countyFeature)
          }))
          .filter((item) => item.row),
        tooltip,
        district
      );

      svg.append("path")
        .datum(displayFeature)
        .attr("class", "state-election-lead-state-outline")
        .attr("d", districtPath);

      if (subtitle) {
        subtitle.textContent = `${district.title} counties sized by the winning county vote lead.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
    }

    if (district.code === "CA-38") {
      const losAngelesRow = rowByFips.get("06037");
      const orangeRow = rowByFips.get("06059");
      const clipPathId = "house-detail-district-clip-ca-38";

      svg.append("defs")
        .append("clipPath")
        .attr("id", clipPathId)
        .append("path")
        .attr("d", districtPath);

      svg.append("path")
        .datum(displayFeature)
        .attr("class", "detail-county-shape house-detail-county")
        .attr("data-fips", losAngelesRow?.countyFips || "06037")
        .attr("d", districtPath)
        .attr("fill", losAngelesRow ? getCountyFill(losAngelesRow) : "#5a96c8")
        .attr("stroke", "none")
        .on("mouseover", (event) => {
          if (!losAngelesRow) return;
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(losAngelesRow, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
        });

      if (orangeRow) {
        svg.append("path")
          .attr("class", "detail-county-shape house-detail-county")
          .attr("data-fips", orangeRow.countyFips)
          .attr("clip-path", `url(#${clipPathId})`)
          .attr("d", "M240 244 H330 V310 H240 Z")
          .attr("fill", getCountyFill(orangeRow))
          .attr("stroke", "none")
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(orangeRow, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      }

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

    const gapFillFips = district.code === "MD-03"
      ? "24003"
      : district.code === "NY-26"
        ? "36029"
        : null;
    const gapFillRow = district.code === "MD-03"
      ? rowByFips.get("24003")
      : district.code === "NY-26"
        ? rowByFips.get("36029")
        : null;
    if (gapFillRow) {
      countyLayer.append("path")
        .datum(displayFeature)
        .attr("class", district.code === "NY-26" ? "detail-county-shape house-detail-gap-fill" : "house-detail-gap-fill")
        .attr("data-fips", gapFillFips)
        .attr("d", districtPath)
        .attr("fill", getCountyFill(gapFillRow))
        .attr("stroke", "none")
        .attr("pointer-events", district.code === "NY-26" ? "auto" : "none")
        .on("mouseover", (event) => {
          if (district.code !== "NY-26") return;
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(gapFillRow, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => {
          if (district.code === "NY-26") positionTooltip(event, tooltip);
        })
        .on("mouseout", () => {
          if (district.code === "NY-26") tooltip.style("opacity", 0);
        });
    }

    const renderedCountyFeatures = district.code === "NY-26"
      ? countyFeatures.filter((countyFeature) => getCountyFeatureFips(countyFeature) !== "36029")
      : countyFeatures;

    countyLayer.selectAll("path.house-detail-county")
      .data(renderedCountyFeatures)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape house-detail-county")
      .attr("data-fips", (countyFeature) => String(countyFeature.id).padStart(5, "0"))
      .attr("d", (countyFeature) => {
        if (district.code === "NY-26" && String(countyFeature.id).padStart(5, "0") === "36063") {
          return "M108.47,78.484L115.421,68.34L117.528,64.636L118.648,61.53L123.325,48.562L122.766,45.97L121.847,41.712L119.906,38.745L113.826,33.365L120.638,27.034L124.344,25.298L128.299,19.21L131.003,19.166L132.796,19.248L133.699,19.358L137.905,18.826L138.391,18.83L152.276,19.503L156.009,19.5L156.572,19.697L167.599,19.768L171.884,19.544L172.79,19.586L214.759,18.824L218.167,18.683L222.1,18.692L231.72,19.081L263.818,19.079L267.295,19.049L270.996,19.088L277.248,19.048L292.698,18.867L310.81,18.359L320.075,18.398L322.102,18L322.48,30.565L311.363,31.079L311.643,38.272L312.097,49.797L312.757,74.509L312.771,75.03L312.959,83.192L317.3,83.039L318.199,81.27L319.788,81.23L323.591,75.49L323.612,76.158L324.4,113.294L331.664,113.168L337.207,110.961L339.534,109.055L339.17,106.65L337.947,105.101L337.402,102.102L338.238,99.717L341.73,96.68L343.846,95.916L346.288,96.294L354.702,95.773L361.761,97.107L365.438,95.468L368.414,92.29L369.914,91.72L378.351,90.667L379.621,90.746L381.47,91.661L385.08,92.62L390.118,92.001L391.969,90.641L393.621,86.08L396.681,82.105L397.967,77.968L400.144,75.138L405.575,72.821L408.33,73.686L410.264,75.813L411.273,78.304L412.568,78.835L415.219,76.691L416.723,76.329L418.8,77.319L420.61,77.123L421.832,75.15L422.414,72.015L426.197,72.305L429.27,72.023L431.465,72.663L406.573,72.985L342.245,97.074L308.549,151.245L265.663,148.236L262.6,122.158L219.714,95.067L155.386,96.071L109.437,83.023Z";
        }
        return path(countyFeature);
      })
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

    if (false && district.code === "NY-26") {
      const niagaraRow = rowByFips.get("36063");
      if (niagaraRow) {
        countyLayer.insert("path", ".house-detail-county")
          .attr("class", "detail-county-shape house-detail-county house-detail-county-correction")
          .attr("data-fips", "36063")
          .attr("d", "M108.47,78.48 L115.42,68.34 L117.53,64.64 L118.65,61.53 L123.33,48.56 L122.77,45.97 L121.85,41.71 L119.91,38.75 L113.83,33.37 L120.64,27.03 L124.34,25.30 L128.30,19.21 L137.91,18.83 L155.39,96.07 L109.44,83.02 Z")
          .attr("fill", getCountyFill(niagaraRow))
          .attr("stroke", "none")
          .attr("stroke-width", 0)
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(niagaraRow, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      }
    }

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
    const usePlanarTownShapes = useConnecticutTownShapes || district.state === "VT";
    const rowByGeoId = new Map(rows.map((row) => [String(row.townGeoId), row]));
    const rowByTownName = new Map(rows.map((row) => [normalizeTownName(row.town), row]));
    const showLead = setupHouseDetailMapMode(district, feature, rows);
    if (await renderDistrictSvgTownMap(district, rowByGeoId)) {
      if (subtitle) {
        subtitle.textContent = houseDetailMapMode === "lead"
          ? `${district.title} municipalities sized by the winning municipality vote lead.`
          : `${district.title} municipalities shaded by the winning municipality vote share.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
    }
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
    const fitFeature = usePlanarTownShapes ? townCollection : displayFeature;
    const projection = usePlanarTownShapes
      ? d3.geoIdentity().reflectY(true).fitExtent([[18, 18], [522, 602]], fitFeature)
      : d3.geoMercator().fitExtent([[18, 18], [522, 602]], fitFeature);
    const path = d3.geoPath().projection(projection);
    const townLayer = svg.append("g");
    if (!usePlanarTownShapes && displayFeature) {
      const clipPathId = `house-detail-town-clip-${district.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      svg.append("defs")
        .append("clipPath")
        .attr("id", clipPathId)
        .append("path")
        .datum(displayFeature)
        .attr("d", path);
      townLayer.attr("clip-path", `url(#${clipPathId})`);
    }

    if (showLead) {
      townLayer.selectAll("path")
        .data(townFeatures)
        .enter()
        .append("path")
        .attr("class", "state-election-lead-county-shape")
        .attr("data-fips", (townFeature) => {
          const row = getTownRow(townFeature);
          return row?.townGeoId || row?.town || null;
        })
        .attr("d", path)
        .attr("vector-effect", "non-scaling-stroke");

      renderHouseLeadBubbles(
        svg,
        townFeatures
          .map((townFeature) => ({
            row: getTownRow(townFeature),
            centroid: path.centroid(townFeature)
          }))
          .filter((item) => item.row),
        tooltip,
        district
      );

      if (!usePlanarTownShapes && displayFeature) {
        svg.append("path")
          .datum(displayFeature)
          .attr("class", "state-election-lead-state-outline")
          .attr("d", path);
      }

      if (subtitle) {
        const usesMunicipalities = district.state === "RI" || district.state === "VT";
        const unitPlural = usesMunicipalities ? "municipalities" : "towns";
        const unitSingular = usesMunicipalities ? "municipality" : "town";
        subtitle.textContent = `${district.title} ${unitPlural} sized by the winning ${unitSingular} vote lead.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
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
      .attr("vector-effect", "non-scaling-stroke")
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
      const usesMunicipalities = district.state === "RI" || district.state === "VT";
      const unitPlural = usesMunicipalities ? "municipalities" : "towns";
      const unitSingular = usesMunicipalities ? "municipality" : "town";
      subtitle.textContent = `${district.title} ${unitPlural} shaded by the winning ${unitSingular} vote share.`;
    }
    setMapLegendVisibility(true, rows);

    return true;
  }

  async function renderDistrictCountyMap(district, feature) {
    const countyData = window.HOUSE_DISTRICT_COUNTY_RESULTS?.[district.code];
    const subtitle = document.getElementById("house-detail-map-subtitle");
    const svg = d3.select("#house-detail-map");
    const tooltip = d3.select("#house-detail-map-tooltip");
    const unitLabels = getCountyUnitLabels(district.state);
    if (!countyData?.rows?.length || svg.empty()) {
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

    const showLead = setupHouseDetailMapMode(district, feature, rows);
    const rowByFips = new Map(rows.map((row) => [row.countyFips, row]));
    if (await renderDistrictSvgCountyMap(district, rowByFips)) {
      if (subtitle) {
        subtitle.textContent = showLead
          ? `${district.title} ${unitLabels.plural} sized by the winning ${unitLabels.singular} vote lead.`
          : `${district.title} ${unitLabels.plural} shaded by the winning ${unitLabels.singular} vote share.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
    }

    if (!window.topojson) {
      setMapLegendVisibility(false);
      return false;
    }

    const countyFeatures = await getCountyFeaturesForRows(district.state, rowByFips);

    if (!countyFeatures.length) {
      setMapLegendVisibility(false);
      return false;
    }

    svg.selectAll("*").remove();
    svg
      .attr("viewBox", "0 0 540 620")
      .attr("preserveAspectRatio", "xMidYMid meet");

    const displayFeature = await getDistrictDisplayFeature(district, feature);
    const projection = d3.geoMercator().fitExtent(
      [[18, 18], [522, 602]],
      displayFeature
    );
    const path = d3.geoPath().projection(projection);
    const districtPath = path(displayFeature);
    const dominantRow = getDominantCountyRow(rows);

    if (showLead) {
      const clipPathId = `house-detail-district-lead-clip-${district.code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      svg.append("defs")
        .append("clipPath")
        .attr("id", clipPathId)
        .append("path")
        .attr("d", districtPath);

      const countyLayer = svg.append("g").attr("clip-path", `url(#${clipPathId})`);
      countyLayer.selectAll("path")
        .data(countyFeatures)
        .enter()
        .append("path")
        .attr("class", "state-election-lead-county-shape")
        .attr("data-fips", (countyFeature) => getCountyFeatureFips(countyFeature))
        .attr("d", path);

      renderHouseLeadBubbles(
        svg,
        countyFeatures
          .map((countyFeature) => ({
            row: rowByFips.get(getCountyFeatureFips(countyFeature)),
            centroid: path.centroid(countyFeature)
          }))
          .filter((item) => item.row),
        tooltip,
        district
      );

      svg.append("path")
        .datum(displayFeature)
        .attr("class", "state-election-lead-state-outline")
        .attr("d", districtPath);

      if (subtitle) {
        subtitle.textContent = `${district.title} ${unitLabels.plural} sized by the winning ${unitLabels.singular} vote lead.`;
      }
      setMapLegendVisibility(true, rows);
      return true;
    }

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

    const gapFillFips = district.code === "MD-03"
      ? "24003"
      : district.code === "NY-26"
        ? "36029"
        : null;
    const gapFillRow = district.code === "MD-03"
      ? rowByFips.get("24003")
      : district.code === "NY-26"
        ? rowByFips.get("36029")
        : null;
    if (gapFillRow) {
      countyLayer.append("path")
        .datum(displayFeature)
        .attr("class", district.code === "NY-26" ? "detail-county-shape house-detail-gap-fill" : "house-detail-gap-fill")
        .attr("data-fips", gapFillFips)
        .attr("d", districtPath)
        .attr("fill", getCountyFill(gapFillRow))
        .attr("stroke", "none")
        .attr("pointer-events", district.code === "NY-26" ? "auto" : "none")
        .on("mouseover", (event) => {
          if (district.code !== "NY-26") return;
          tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(gapFillRow, district));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => {
          if (district.code === "NY-26") positionTooltip(event, tooltip);
        })
        .on("mouseout", () => {
          if (district.code === "NY-26") tooltip.style("opacity", 0);
        });
    }

    const renderedCountyFeatures = district.code === "NY-26"
      ? countyFeatures.filter((countyFeature) => getCountyFeatureFips(countyFeature) !== "36029")
      : countyFeatures;

    countyLayer.selectAll("path.house-detail-county")
      .data(renderedCountyFeatures)
      .enter()
      .append("path")
        .attr("class", "detail-county-shape house-detail-county")
        .attr("data-fips", (countyFeature) => getCountyFeatureFips(countyFeature))
        .attr("d", (countyFeature) => {
          if (district.code === "NY-26" && getCountyFeatureFips(countyFeature) === "36063") {
            return "M108.47,78.484L115.421,68.34L117.528,64.636L118.648,61.53L123.325,48.562L122.766,45.97L121.847,41.712L119.906,38.745L113.826,33.365L120.638,27.034L124.344,25.298L128.299,19.21L131.003,19.166L132.796,19.248L133.699,19.358L137.905,18.826L138.391,18.83L152.276,19.503L156.009,19.5L156.572,19.697L167.599,19.768L171.884,19.544L172.79,19.586L214.759,18.824L218.167,18.683L222.1,18.692L231.72,19.081L263.818,19.079L267.295,19.049L270.996,19.088L277.248,19.048L292.698,18.867L310.81,18.359L320.075,18.398L322.102,18L322.48,30.565L311.363,31.079L311.643,38.272L312.097,49.797L312.757,74.509L312.771,75.03L312.959,83.192L317.3,83.039L318.199,81.27L319.788,81.23L323.591,75.49L323.612,76.158L324.4,113.294L331.664,113.168L337.207,110.961L339.534,109.055L339.17,106.65L337.947,105.101L337.402,102.102L338.238,99.717L341.73,96.68L343.846,95.916L346.288,96.294L354.702,95.773L361.761,97.107L365.438,95.468L368.414,92.29L369.914,91.72L378.351,90.667L379.621,90.746L381.47,91.661L385.08,92.62L390.118,92.001L391.969,90.641L393.621,86.08L396.681,82.105L397.967,77.968L400.144,75.138L405.575,72.821L408.33,73.686L410.264,75.813L411.273,78.304L412.568,78.835L415.219,76.691L416.723,76.329L418.8,77.319L420.61,77.123L421.832,75.15L422.414,72.015L426.197,72.305L429.27,72.023L431.465,72.663L406.573,72.985L342.245,97.074L308.549,151.245L265.663,148.236L262.6,122.158L219.714,95.067L155.386,96.071L109.437,83.023Z";
          }
          return path(countyFeature);
        })
        .attr("fill", (countyFeature) => {
          const row = rowByFips.get(getCountyFeatureFips(countyFeature));
          return row ? getCountyFill(row) : "#2d3138";
        })
        .attr("stroke", district.code === "NY-26" ? "none" : null)
        .attr("stroke-width", district.code === "NY-26" ? 0 : null)
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

    if (false && district.code === "NY-26") {
      const niagaraRow = rowByFips.get("36063");
      if (niagaraRow) {
        countyLayer.insert("path", ".house-detail-county")
          .attr("class", "detail-county-shape house-detail-county house-detail-county-correction")
          .attr("data-fips", "36063")
          .attr("d", "M108.47,78.48 L115.42,68.34 L117.53,64.64 L118.65,61.53 L123.33,48.56 L122.77,45.97 L121.85,41.71 L119.91,38.75 L113.83,33.37 L120.64,27.03 L124.34,25.30 L128.30,19.21 L137.91,18.83 L155.39,96.07 L109.44,83.02 Z")
          .attr("fill", getCountyFill(niagaraRow))
          .attr("stroke", "none")
          .attr("stroke-width", 0)
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(californiaCountyTooltipHTML(niagaraRow, district));
            positionTooltip(event, tooltip);
          })
          .on("mousemove", (event) => positionTooltip(event, tooltip))
          .on("mouseout", () => {
            tooltip.style("opacity", 0);
          });
      }
    }

    svg.append("path")
      .datum(displayFeature)
      .attr("class", "house-detail-shape")
      .attr("d", districtPath)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.95)")
      .attr("stroke-width", 2.1);

    if (subtitle) {
      subtitle.textContent = `${district.title} ${unitLabels.plural} shaded by the winning ${unitLabels.singular} vote share.`;
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
    renderExpandableUnitBoard({
      body,
      rows: countyData.counties
        .slice()
        .sort((a, b) => b.totalVotes - a.totalVotes || a.county.localeCompare(b.county)),
      unitPlural: "counties",
      renderRow: (row) => `
        <tr class="detail-county-row">
          <td>${formatCaliforniaCountyTableName(row.county)}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>${row.percentIn}</td>
        </tr>
      `
    });

    return true;
  }

  function setUnitBoardLabels(unitLabel) {
    const title = document.getElementById("house-detail-unit-board-title");
    const label = document.getElementById("house-detail-unit-board-label");
    if (title) title.textContent = `${unitLabel} Results`;
    if (label) label.textContent = unitLabel;
  }

  function renderExpandableUnitBoard({ body, rows, unitPlural, renderRow }) {
    const toggle = document.getElementById("house-detail-county-board-toggle");
    let expanded = false;
    const normalizedPlural = unitPlural || "results";

    const render = () => {
      const visibleRows = expanded ? rows : rows.slice(0, UNIT_BOARD_COLLAPSED_LIMIT);
      body.innerHTML = visibleRows.map(renderRow).join("");

      if (!toggle) return;
      if (rows.length <= UNIT_BOARD_COLLAPSED_LIMIT) {
        toggle.hidden = true;
        toggle.textContent = "";
        toggle.onclick = null;
        toggle.removeAttribute("aria-expanded");
        return;
      }

      toggle.hidden = false;
      toggle.textContent = expanded
        ? "Show fewer"
        : `Show all ${rows.length} ${normalizedPlural}`;
      toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    };

    if (toggle) {
      toggle.onclick = () => {
        expanded = !expanded;
        render();
      };
    }
    render();
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

    const usesMunicipalities = district.state === "RI" || district.state === "VT";
    setUnitBoardLabels(usesMunicipalities ? "Municipality" : "Town");
    board.hidden = false;
    renderExpandableUnitBoard({
      body,
      rows: rows.sort((a, b) => b.totalVotes - a.totalVotes || a.town.localeCompare(b.town)),
      unitPlural: usesMunicipalities ? "municipalities" : "towns",
      renderRow: (row) => `
        <tr class="detail-county-row">
          <td>${row.town}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>100%</td>
        </tr>
      `
    });

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

    const unitLabels = getCountyUnitLabels(district.state);
    setUnitBoardLabels(unitLabels.board);
    board.hidden = false;
    renderExpandableUnitBoard({
      body,
      rows: rows.sort((a, b) => b.totalVotes - a.totalVotes || a.county.localeCompare(b.county)),
      unitPlural: unitLabels.plural,
      renderRow: (row) => `
        <tr class="detail-county-row">
          <td>${formatCountyTableName(row.county)}</td>
          <td><span class="detail-county-margin ${row.winnerParty === "D" ? "dem" : row.winnerParty === "R" ? "rep" : "ind"}">${row.marginLabel}</span></td>
          <td>${formatNumber(row.totalVotes)}</td>
          <td>100%</td>
        </tr>
      `
    });

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

    const renderedCountyMap = district.uncontested
      ? false
      : district.code.startsWith("CA-")
        ? await renderCaliforniaCountyMap(district, feature) || await renderDistrictTownMap(district, feature) || await renderDistrictCountyMap(district, feature)
        : await renderDistrictTownMap(district, feature) || await renderDistrictCountyMap(district, feature);

    if (renderedCountyMap) return;

    setMapLegendVisibility(false);
    hideHouseDetailMapMode();

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
      subtitle.textContent = district.uncontested
        ? `${district.title} shown as a solid ${getPartyName(district.winnerParty).toLowerCase()} hold.`
        : district.flipped
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
  } else {
    const tone = getWinnerTone(district.winnerParty);
    const summaryCard = document.getElementById("house-detail-summary-card");
    summaryCard.classList.add(`winner-${tone}`);

    document.title = `${district.title} House Result`;
    document.getElementById("house-detail-title").textContent = district.title;
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

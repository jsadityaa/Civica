const COUNTY_REFERENCE_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const CONNECTICUT_TOWNS_GEOJSON_URL = "./assets/maps/connecticut-towns.geojson";
const MAINE_TOWNS_GEOJSON_URL = "./assets/maps/state-local-results-2024/maine-local-results-2024.geojson";
const MASSACHUSETTS_MUNICIPALITIES_GEOJSON_URL = "./assets/maps/state-local-results-2024/massachusetts-local-results-2024.geojson";
const RHODE_ISLAND_MUNICIPALITIES_GEOJSON_URL = "./assets/maps/state-local-results-2024/rhode-island-local-results-2024.geojson";
const VERMONT_TOWNS_GEOJSON_URL = "./assets/maps/state-local-results-2024/vermont-local-results-2024.geojson";
const SENATE_COUNTY_BOARD_PREVIEW_LIMIT = 6;

const SENATE_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const SENATE_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
let senateDetailMapMode = "share";
const SENATE_MAJOR_CITY_LABELS = {
  Alabama: [
    { name: "Huntsville", coordinates: [-86.5861, 34.7304] },
    { name: "Birmingham", coordinates: [-86.8025, 33.5186] },
    { name: "Tuscaloosa", coordinates: [-87.5692, 33.2098] },
    { name: "Montgomery", coordinates: [-86.3000, 32.3668] },
    { name: "Mobile", coordinates: [-88.0431, 30.6954] }
  ],
  Arizona: [
    { name: "Phoenix", coordinates: [-112.0740, 33.4484] },
    { name: "Tucson", coordinates: [-110.9747, 32.2226] }
  ],
  Arkansas: [
    { name: "Little Rock", coordinates: [-92.2896, 34.7465] },
    { name: "Fayetteville", coordinates: [-94.1574, 36.0626] },
    { name: "Fort Smith", coordinates: [-94.3985, 35.3859] },
    { name: "Jonesboro", coordinates: [-90.7043, 35.8423] }
  ],
  California: [
    { name: "Sacramento", coordinates: [-121.4944, 38.5816] },
    { name: "San Francisco", coordinates: [-122.4194, 37.7749] },
    { name: "San Jose", coordinates: [-121.8863, 37.3382] },
    { name: "Fresno", coordinates: [-119.7871, 36.7378] },
    { name: "Los Angeles", coordinates: [-118.2437, 34.0522] },
    { name: "San Diego", coordinates: [-117.1611, 32.7157] }
  ],
  Colorado: [
    { name: "Fort Collins", coordinates: [-105.0844, 40.5853] },
    { name: "Denver", coordinates: [-104.9903, 39.7392] },
    { name: "Colorado Springs", coordinates: [-104.8214, 38.8339] },
    { name: "Pueblo", coordinates: [-104.6091, 38.2544] }
  ],
  Connecticut: [
    { name: "Hartford", coordinates: [-72.6851, 41.7658] },
    { name: "New Haven", coordinates: [-72.9279, 41.3083] },
    { name: "Bridgeport", coordinates: [-73.1952, 41.1865] }
  ],
  Delaware: [
    { name: "Dover", coordinates: [-75.5244, 39.1582] },
    { name: "Wilmington", coordinates: [-75.5466, 39.7447] }
  ],
  Florida: [
    { name: "Tallahassee", coordinates: [-84.2807, 30.4383] },
    { name: "Jacksonville", coordinates: [-81.6557, 30.3322] },
    { name: "Orlando", coordinates: [-81.3792, 28.5383] },
    { name: "Tampa", coordinates: [-82.4572, 27.9506] },
    { name: "W. Palm Beach", coordinates: [-80.0534, 26.7153] },
    { name: "Miami", coordinates: [-80.1918, 25.7617] }
  ],
  Georgia: [
    { name: "Atlanta", coordinates: [-84.3880, 33.7490] },
    { name: "Athens", coordinates: [-83.3576, 33.9519] },
    { name: "Augusta", coordinates: [-81.9748, 33.4735] },
    { name: "Columbus", coordinates: [-84.9877, 32.4609] },
    { name: "Macon", coordinates: [-83.6324, 32.8407] },
    { name: "Savannah", coordinates: [-81.0998, 32.0809] }
  ],
  Hawaii: [
    { name: "Hilo", coordinates: [-155.0885, 19.7074] },
    { name: "Honolulu", coordinates: [-157.8583, 21.3069] }
  ],
  Idaho: [
    { name: "Boise", coordinates: [-116.2023, 43.6150] },
    { name: "Idaho Falls", coordinates: [-112.0341, 43.4917] },
    { name: "Pocatello", coordinates: [-112.4455, 42.8713] }
  ],
  Illinois: [
    { name: "Rockford", coordinates: [-89.0937, 42.2711] },
    { name: "Chicago", coordinates: [-87.6298, 41.8781] },
    { name: "Peoria", coordinates: [-89.5890, 40.6936] },
    { name: "Springfield", coordinates: [-89.6501, 39.7817] }
  ],
  Indiana: [
    { name: "Indianapolis", coordinates: [-86.1581, 39.7684] },
    { name: "Evansville", coordinates: [-87.5711, 37.9716] },
    { name: "Fort Wayne", coordinates: [-85.1394, 41.0793] },
    { name: "Gary", coordinates: [-87.3464, 41.5934] }
  ],
  Iowa: [
    { name: "Des Moines", coordinates: [-93.6091, 41.5868] },
    { name: "Sioux City", coordinates: [-96.4003, 42.4999] },
    { name: "Cedar Rapids", coordinates: [-91.6656, 41.9779] },
    { name: "Davenport", coordinates: [-90.5776, 41.5236] }
  ],
  Kansas: [
    { name: "Wichita", coordinates: [-97.3301, 37.6872] },
    { name: "Topeka", coordinates: [-95.6890, 39.0473] }
  ],
  Kentucky: [
    { name: "Louisville", coordinates: [-85.7585, 38.2527] },
    { name: "Lexington", coordinates: [-84.5037, 38.0406] }
  ],
  Louisiana: [
    { name: "Baton Rouge", coordinates: [-91.1403, 30.4515] },
    { name: "Shreveport", coordinates: [-93.7502, 32.5252] },
    { name: "Lafayette", coordinates: [-92.0198, 30.2241] },
    { name: "New Orleans", coordinates: [-90.0715, 29.9511] }
  ],
  Maine: [
    { name: "Portland", coordinates: [-70.2553, 43.6591] },
    { name: "Bangor", coordinates: [-68.7778, 44.8016] }
  ],
  Maryland: [
    { name: "Frederick", coordinates: [-77.4105, 39.4143] },
    { name: "Baltimore", coordinates: [-76.6122, 39.2904] },
    { name: "Rockville", coordinates: [-77.1528, 39.0840] }
  ],
  Massachusetts: [
    { name: "Springfield", coordinates: [-72.5898, 42.1015] },
    { name: "Worcester", coordinates: [-71.8023, 42.2626] },
    { name: "Lowell", coordinates: [-71.3162, 42.6334] },
    { name: "Boston", coordinates: [-71.0589, 42.3601] }
  ],
  Michigan: [
    { name: "Detroit", coordinates: [-83.0458, 42.3314] },
    { name: "Ann Arbor", coordinates: [-83.7430, 42.2808] },
    { name: "Grand Rapids", coordinates: [-85.6681, 42.9634] }
  ],
  Minnesota: [
    { name: "Minneapolis", coordinates: [-93.2650, 44.9778] },
    { name: "Duluth", coordinates: [-92.1005, 46.7867] },
    { name: "Rochester", coordinates: [-92.4802, 44.0121] }
  ],
  Mississippi: [
    { name: "Jackson", coordinates: [-90.1848, 32.2988] },
    { name: "Tupelo", coordinates: [-88.7034, 34.2576] },
    { name: "Hattiesburg", coordinates: [-89.2903, 31.3271] },
    { name: "Biloxi", coordinates: [-88.8853, 30.3960] }
  ],
  Missouri: [
    { name: "Kansas City", coordinates: [-94.5786, 39.0997] },
    { name: "St. Louis", coordinates: [-90.1994, 38.6270] },
    { name: "Columbia", coordinates: [-92.3341, 38.9517] },
    { name: "Springfield", coordinates: [-93.2923, 37.2089] }
  ],
  Montana: [
    { name: "Missoula", coordinates: [-113.9966, 46.8721] },
    { name: "Great Falls", coordinates: [-111.3008, 47.5053] },
    { name: "Helena", coordinates: [-112.0391, 46.5891] },
    { name: "Billings", coordinates: [-108.5007, 45.7833] }
  ],
  Nebraska: [
    { name: "Omaha", coordinates: [-95.9345, 41.2565] },
    { name: "Lincoln", coordinates: [-96.6852, 40.8136] }
  ],
  Nevada: [
    { name: "Reno", coordinates: [-119.8138, 39.5296] },
    { name: "Carson City", coordinates: [-119.7674, 39.1638] },
    { name: "Las Vegas", coordinates: [-115.1398, 36.1699] }
  ],
  "New Hampshire": [
    { name: "Manchester", coordinates: [-71.4548, 42.9956] },
    { name: "Concord", coordinates: [-71.5376, 43.2081] },
    { name: "Dover", coordinates: [-70.8737, 43.1979] },
    { name: "Nashua", coordinates: [-71.4676, 42.7654] }
  ],
  "New Jersey": [
    { name: "Newark", coordinates: [-74.1724, 40.7357] },
    { name: "Trenton", coordinates: [-74.7429, 40.2206] },
    { name: "Atlantic City", coordinates: [-74.4229, 39.3643] }
  ],
  "New Mexico": [
    { name: "Albuquerque", coordinates: [-106.6504, 35.0844] },
    { name: "Santa Fe", coordinates: [-105.9378, 35.6870] },
    { name: "Las Cruces", coordinates: [-106.7637, 32.3199] }
  ],
  "New York": [
    { name: "Albany", coordinates: [-73.7562, 42.6526] },
    { name: "New York City", coordinates: [-74.0060, 40.7128] },
    { name: "Rochester", coordinates: [-77.6109, 43.1566] },
    { name: "Buffalo", coordinates: [-78.8784, 42.8864] },
    { name: "Syracuse", coordinates: [-76.1474, 43.0481] }
  ],
  "North Carolina": [
    { name: "Charlotte", coordinates: [-80.8431, 35.2271] },
    { name: "Greensboro", coordinates: [-79.7920, 36.0726] },
    { name: "Raleigh", coordinates: [-78.6382, 35.7796] },
    { name: "Fayetteville", coordinates: [-78.8784, 35.0527] }
  ],
  "North Dakota": [
    { name: "Bismarck", coordinates: [-100.7837, 46.8083] },
    { name: "Grand Forks", coordinates: [-97.0329, 47.9253] },
    { name: "Fargo", coordinates: [-96.7898, 46.8772] }
  ],
  Ohio: [
    { name: "Toledo", coordinates: [-83.5552, 41.6528] },
    { name: "Cleveland", coordinates: [-81.6944, 41.4993] },
    { name: "Akron", coordinates: [-81.5190, 41.0814] },
    { name: "Dayton", coordinates: [-84.1916, 39.7589] },
    { name: "Columbus", coordinates: [-82.9988, 39.9612] },
    { name: "Cincinnati", coordinates: [-84.5120, 39.1031] }
  ],
  Oklahoma: [
    { name: "Oklahoma City", coordinates: [-97.5164, 35.4676] },
    { name: "Tulsa", coordinates: [-95.9928, 36.1540] }
  ],
  Oregon: [
    { name: "Portland", coordinates: [-122.6765, 45.5152] },
    { name: "Salem", coordinates: [-123.0351, 44.9429] },
    { name: "Eugene", coordinates: [-123.0868, 44.0521] },
    { name: "Bend", coordinates: [-121.3153, 44.0582] },
    { name: "Medford", coordinates: [-122.8756, 42.3265] }
  ],
  Pennsylvania: [
    { name: "Erie", coordinates: [-80.0851, 42.1292] },
    { name: "Pittsburgh", coordinates: [-79.9959, 40.4406] },
    { name: "Allentown", coordinates: [-75.4902, 40.6084] },
    { name: "Philadelphia", coordinates: [-75.1652, 39.9526] }
  ],
  "Rhode Island": [
    { name: "Providence", coordinates: [-71.4128, 41.8240] },
    { name: "Warwick", coordinates: [-71.4162, 41.7001] }
  ],
  "South Carolina": [
    { name: "Greenville", coordinates: [-82.3940, 34.8526] },
    { name: "Rock Hill", coordinates: [-81.0251, 34.9249] },
    { name: "Columbia", coordinates: [-81.0348, 34.0007] },
    { name: "Charleston", coordinates: [-79.9311, 32.7765] }
  ],
  "South Dakota": [
    { name: "Rapid City", coordinates: [-103.2310, 44.0805] },
    { name: "Aberdeen", coordinates: [-98.4865, 45.4647] },
    { name: "Watertown", coordinates: [-97.1151, 44.8994] },
    { name: "Sioux Falls", coordinates: [-96.7311, 43.5460] }
  ],
  Tennessee: [
    { name: "Memphis", coordinates: [-90.0490, 35.1495] },
    { name: "Nashville", coordinates: [-86.7816, 36.1627] },
    { name: "Chattanooga", coordinates: [-85.3097, 35.0456] },
    { name: "Knoxville", coordinates: [-83.9207, 35.9606] }
  ],
  Texas: [
    { name: "Corpus Christi", coordinates: [-97.3964, 27.8006] },
    { name: "El Paso", coordinates: [-106.4850, 31.7619] },
    { name: "Fort Worth", coordinates: [-97.3308, 32.7555] },
    { name: "Dallas", coordinates: [-96.7970, 32.7767] },
    { name: "Austin", coordinates: [-97.7431, 30.2672] },
    { name: "San Antonio", coordinates: [-98.4936, 29.4241] },
    { name: "Houston", coordinates: [-95.3698, 29.7604] }
  ],
  Utah: [
    { name: "Salt Lake City", coordinates: [-111.8910, 40.7608] },
    { name: "Provo", coordinates: [-111.6585, 40.2338] }
  ],
  Vermont: [
    { name: "Burlington", coordinates: [-73.2121, 44.4759] },
    { name: "Montpelier", coordinates: [-72.5754, 44.2601] },
    { name: "Rutland", coordinates: [-72.9726, 43.6106] }
  ],
  Virginia: [
    { name: "Richmond", coordinates: [-77.4360, 37.5407] },
    { name: "Alexandria", coordinates: [-77.0469, 38.8048] },
    { name: "Roanoke", coordinates: [-79.9414, 37.2710] },
    { name: "Norfolk", coordinates: [-76.2859, 36.8508] },
    { name: "Virginia Beach", coordinates: [-75.9780, 36.8529] }
  ],
  Washington: [
    { name: "Bellingham", coordinates: [-122.4787, 48.7519] },
    { name: "Seattle", coordinates: [-122.3321, 47.6062] },
    { name: "Olympia", coordinates: [-122.9007, 47.0379] },
    { name: "Vancouver", coordinates: [-122.6615, 45.6387] },
    { name: "Yakima", coordinates: [-120.5059, 46.6021] },
    { name: "Spokane", coordinates: [-117.4260, 47.6588] }
  ],
  "West Virginia": [
    { name: "Huntington", coordinates: [-82.4452, 38.4192] },
    { name: "Charleston", coordinates: [-81.6326, 38.3498] },
    { name: "Wheeling", coordinates: [-80.7209, 40.0639] }
  ],
  Wisconsin: [
    { name: "Milwaukee", coordinates: [-87.9065, 43.0389] },
    { name: "Kenosha", coordinates: [-87.8212, 42.5847] },
    { name: "Madison", coordinates: [-89.4012, 43.0731] },
    { name: "Eau Claire", coordinates: [-91.4985, 44.8113] },
    { name: "Oshkosh", coordinates: [-88.5426, 44.0247] },
    { name: "Green Bay", coordinates: [-88.0198, 44.5133] }
  ],
  Wyoming: [
    { name: "Cheyenne", coordinates: [-104.8202, 41.1400] },
    { name: "Casper", coordinates: [-106.3131, 42.8501] }
  ]
};
const SENATE_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const SENATE_FALLBACK_FILL = "#2d3138";
const SENATE_COUNTY_REFERENCE_ALIASES = {
  "New York": {
    Brooklyn: "Kings County",
    Manhattan: "New York County",
    "Staten Island": "Richmond County"
  }
};
const SENATE_COUNTY_REFERENCE_OVERRIDES = {
  Connecticut: [
    { county_fips: "09001", county_name: "Fairfield County" },
    { county_fips: "09003", county_name: "Hartford County" },
    { county_fips: "09005", county_name: "Litchfield County" },
    { county_fips: "09007", county_name: "Middlesex County" },
    { county_fips: "09009", county_name: "New Haven County" },
    { county_fips: "09011", county_name: "New London County" },
    { county_fips: "09013", county_name: "Tolland County" },
    { county_fips: "09015", county_name: "Windham County" }
  ]
};

const SENATE_LOCAL_RESULT_CONFIG = {
  Connecticut: {
    geojsonUrl: CONNECTICUT_TOWNS_GEOJSON_URL,
    nameProperty: "TOWN_NAME",
    idProperty: null,
    projection: "identity",
    singular: "Town",
    plural: "towns",
    mapTitle: "Town Map",
    boardTitle: "Town Results"
  },
  Maine: {
    geojsonUrl: MAINE_TOWNS_GEOJSON_URL,
    nameProperty: "county_name",
    idProperty: "county_fips",
    projection: "mercator",
    singular: "Town",
    plural: "towns",
    mapTitle: "Town Map",
    boardTitle: "Town Results"
  },
  Massachusetts: {
    geojsonUrl: MASSACHUSETTS_MUNICIPALITIES_GEOJSON_URL,
    nameProperty: "county_name",
    idProperty: "county_fips",
    projection: "mercator",
    singular: "Municipality",
    plural: "municipalities",
    mapTitle: "Municipality Map",
    boardTitle: "Municipality Results"
  },
  "Rhode Island": {
    geojsonUrl: RHODE_ISLAND_MUNICIPALITIES_GEOJSON_URL,
    nameProperty: "county_name",
    idProperty: "county_fips",
    projection: "mercator",
    singular: "Municipality",
    plural: "municipalities",
    mapTitle: "Municipality Map",
    boardTitle: "Municipality Results"
  },
  Vermont: {
    geojsonUrl: VERMONT_TOWNS_GEOJSON_URL,
    nameProperty: "county_name",
    idProperty: "county_fips",
    projection: "mercator",
    singular: "Town",
    plural: "towns",
    mapTitle: "Town Map",
    boardTitle: "Town Results"
  }
};

const SENATE_LOCAL_MAP_AGGREGATE_ALIASES = {
  Vermont: {
    "Rutland City": "Rutland",
    "Rutland Town": "Rutland",
    "Essex Town": "Essex",
    "Essex Junction City": "Essex Junction",
    "Barre Town": "Barre",
    "Barre City": "Barre",
    "St. Albans Town": "St. Albans",
    "St. Albans City": "St. Albans",
    "Newport City": "Newport",
    "Newport Town": "Newport"
  }
};

const senateCountyResults = window.SENATE_COUNTY_RESULTS || {};
const senateData = window.SENATE_2024_DATA || { races: [] };
const countyReferenceCache = new Map();
const countyBoardState = {
  rows: [],
  sort: "votes",
  limit: String(SENATE_COUNTY_BOARD_PREVIEW_LIMIT),
  activeFips: null,
  regionPlural: "counties"
};

const senateStateFipsByName = {
  Arizona: "04",
  California: "06",
  Connecticut: "09",
  Delaware: "10",
  Florida: "12",
  Hawaii: "15",
  Indiana: "18",
  Maine: "23",
  Maryland: "24",
  Massachusetts: "25",
  Michigan: "26",
  Minnesota: "27",
  Mississippi: "28",
  Missouri: "29",
  Montana: "30",
  Nebraska: "31",
  Nevada: "32",
  "New Jersey": "34",
  "New Mexico": "35",
  "New York": "36",
  "North Dakota": "38",
  Ohio: "39",
  Pennsylvania: "42",
  "Rhode Island": "44",
  Tennessee: "47",
  Texas: "48",
  Utah: "49",
  Vermont: "50",
  Virginia: "51",
  Washington: "53",
  "West Virginia": "54",
  Wisconsin: "55",
  Wyoming: "56"
};

const senateRaceGroups = senateData.races.reduce((acc, race) => {
  const existing = acc.get(race.race) || [];
  existing.push(race);
  acc.set(race.race, existing);
  return acc;
}, new Map());
const SENATE_STATE_NAME_ALIASES = {
  pennslyvania: "Pennsylvania"
};
const senateStateNameLookup = new Map(
  Array.from(senateRaceGroups.keys()).map((name) => [normalizeQueryName(name), name])
);

function normalizeQueryName(value) {
  return String(value || "")
    .trim()
    .replace(/\+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function canonicalizeSenateStateName(value) {
  const normalized = normalizeQueryName(value);
  return SENATE_STATE_NAME_ALIASES[normalized] || senateStateNameLookup.get(normalized) || String(value || "").trim();
}

function senateFormatPartyLabel(party) {
  if (party === "D" || party === "Dem.") return "Democrat";
  if (party === "R" || party === "Rep.") return "Republican";
  if (party === "I" || party === "Ind.") return "Independent";
  if (party === "L" || party === "Lib.") return "Libertarian";
  if (party === "G" || party === "Green") return "Green";
  if (party === "IA" || party === "Ind. Am.") return "Independent American";
  if (party === "N" || party === "None") return "None";
  if (party === "C" || party === "Const." || party === "Constitution") return "Constitution";
  return party || "Independent";
}

function senateFormatPartyShort(party) {
  if (party === "D" || party === "Dem.") return "Dem.";
  if (party === "R" || party === "Rep.") return "Rep.";
  if (party === "I" || party === "Ind.") return "Ind.";
  if (party === "L" || party === "Lib." || party === "Libertarian") return "Lib.";
  if (party === "G" || party === "Green") return "Green";
  if (party === "IA" || party === "Ind. Am." || party === "Independent American") return "Ind. Am.";
  if (party === "N" || party === "None") return "None";
  if (party === "C" || party === "Const." || party === "Constitution") return "Const.";
  return party || "Ind.";
}

function senatePartyCode(party) {
  const label = String(party || "").trim();
  if (label === "D" || label === "Dem." || label === "Democrat") return "D";
  if (label === "R" || label === "Rep." || label === "Republican") return "R";
  if (label === "N" || label === "None") return "N";
  return "I";
}

function senateWinnerTone(party) {
  const code = senatePartyCode(party);
  if (code === "D") return "dem";
  if (code === "R") return "rep";
  if (code === "N") return "none";
  return "ind";
}

function senateParseResultMargin(result) {
  return Number(String(result || "0").split("+")[1] || 0);
}

function senateFormatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function senateInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "S";
}

function getSenateCandidatePortrait(name, imageUrl) {
  if (imageUrl) return imageUrl;
  return "https://placehold.co/120x120/2f3540/2f3540";
}

function getPrimaryRace(name, seatType = "Regular") {
  const races = senateRaceGroups.get(name) || [];
  return races.find((race) => race.seatType === seatType) || races.find((race) => race.seatType === "Regular") || races[0] || null;
}

function getSenateResultRecord(name, seatType = "Regular") {
  const races = senateRaceGroups.get(name) || [];
  const primary = getPrimaryRace(name, seatType);
  if (!primary) return null;
  return {
    name,
    displayName: name,
    primary,
    races
  };
}

function candidateNameSpan(name, party) {
  const tone = senateWinnerTone(party);
  return `<span class="candidate-name-inline ${tone}">${name}</span>`;
}

function getStatewideCandidates(record) {
  const rows = record.primary.tooltipRows;
  if (Array.isArray(rows) && rows.length) {
    return rows.map((row) => ({
      candidate: row.name,
      party: senateFormatPartyLabel(row.party),
      partyShort: senateFormatPartyShort(row.party),
      votes: row.votes,
      pct: `${row.pct}%`,
      imageUrl: row.imageUrl || "",
      tone: senateWinnerTone(row.party[0])
    }));
  }

  return [
    {
      candidate: record.primary.winner,
      party: senateFormatPartyLabel(record.primary.winnerParty),
      partyShort: senateFormatPartyShort(record.primary.winnerParty),
      votes: "—",
      pct: record.primary.result.replace(/^[A-Z]\+/, "") + "%",
      imageUrl: "",
      tone: senateWinnerTone(record.primary.winnerParty)
    },
    {
      candidate: record.primary.opponent,
      party: senateFormatPartyLabel(record.primary.opponentParty),
      partyShort: senateFormatPartyShort(record.primary.opponentParty),
      votes: "—",
      pct: "—",
      imageUrl: "",
      tone: senateWinnerTone(record.primary.opponentParty)
    }
  ];
}

function getCertifiedSenateTotal(record, candidates) {
  if (record.primary.reportedTotal) {
    return Number(record.primary.reportedTotal);
  }

  const countyRows = senateCountyResults[record.name]?.counties || [];
  if (countyRows.length) {
    return countyRows.reduce((sum, county) => sum + Number(county.totalVotes || 0), 0);
  }

  return candidates.reduce((sum, candidate) => sum + Number(String(candidate.votes || 0).replace(/,/g, "")), 0);
}

function buildFactItems(record, candidates) {
  const [winner, runnerUp] = candidates;
  const facts = [
    `<li><strong>${candidateNameSpan(winner.candidate, winner.partyShort[0])}</strong><span>won ${record.displayName}'s ${record.primary.seatType.toLowerCase()} Senate race with ${winner.votes} votes (${winner.pct}).</span></li>`,
    `<li><strong>${candidateNameSpan(runnerUp.candidate, runnerUp.partyShort[0])}</strong><span>finished second with ${runnerUp.votes} votes (${runnerUp.pct}).</span></li>`,
    `<li><strong>Seat</strong><span>This page is showing the ${record.primary.seatType.toLowerCase()} 2024 Senate contest in ${record.displayName}.</span></li>`,
    `<li><strong>Margin</strong><span>${candidateNameSpan(record.primary.winner, record.primary.winnerParty)} carried the race by ${record.primary.result}.</span></li>`
  ];

  if (record.races.length > 1) {
    facts.push(`<li><strong>Additional contest</strong><span>${record.displayName} also held ${record.races.length - 1} additional Senate election${record.races.length - 1 === 1 ? "" : "s"} in 2024.</span></li>`);
  }

  return facts;
}

function normalizeCountyName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/['’]/g, "")
    .replace(/\bsaint\b/g, "st")
    .replace(/\bde\s+kalb\b/g, "dekalb")
    .replace(/\bde\s+baca\b/g, "debaca")
    .replace(/\bde\s+witt\b/g, "dewitt")
    .replace(/\bla\s+vaca\b/g, "lavaca")
    .replace(/\bcounty\b/g, "")
    .replace(/\bparish\b/g, "")
    .replace(/\bborough\b/g, "")
    .replace(/\bcensus area\b/g, "")
    .replace(/\bmunicipality\b/g, "")
    .replace(/\bcity and borough\b/g, "")
    .replace(/\bcity\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatCountyDisplayName(name) {
  const raw = String(name || "").trim();
  if (/ward/i.test(raw) || /district of columbia/i.test(raw)) {
    return raw.replace(/\s+city$/i, "");
  }
  if (/^baltimore\s+city$/i.test(raw)) {
    return "Baltimore City";
  }
  if (/^st\.?\s+louis\s+city$/i.test(raw)) {
    return "St. Louis City";
  }
  if (/^carson\s+city$/i.test(raw)) {
    return "Carson City";
  }
  if (/^kansas\s+city$/i.test(raw)) {
    return "Kansas City";
  }
  if (/\s+city$/i.test(raw)) {
    return raw.replace(/\s+city$/i, "");
  }

  const base = raw
    .replace(/\s+County$/i, "")
    .replace(/\s+Parish$/i, "")
    .replace(/\s+Borough$/i, "")
    .replace(/\s+Census Area$/i, "")
    .replace(/\s+Municipality$/i, "")
    .replace(/\s+city$/i, "");

  return `${base} County`;
}

async function fetchCountyReference(stateName) {
  if (countyReferenceCache.has(stateName)) return countyReferenceCache.get(stateName);

  const rows = SENATE_COUNTY_REFERENCE_OVERRIDES[stateName] || await d3.csv(COUNTY_REFERENCE_URL, (row) => {
    if (row.state_name !== stateName) return null;
    return {
      county_fips: row.county_fips,
      county_name: row.county_name
    };
  });

  const lookup = new Map();
  rows.filter(Boolean).forEach((row) => {
    lookup.set(String(row.county_name || "").trim().toLowerCase(), row);
    lookup.set(formatCountyDisplayName(row.county_name).toLowerCase(), row);
    lookup.set(normalizeCountyName(row.county_name), row);
    lookup.set(normalizeCountyName(formatCountyDisplayName(row.county_name)), row);
  });

  countyReferenceCache.set(stateName, lookup);
  return lookup;
}

function getCountyWinnerParty(row) {
  return row.candidates[0]?.party || "D";
}

function getCountyMarginValue(row) {
  const top = row.candidates[0];
  const runnerUp = row.candidates[1];
  if (!top || !runnerUp) return 0;
  return Math.max(0, Number(top.pct) - Number(runnerUp.pct));
}

function getCountyMarginLabel(row) {
  const top = row.candidates[0];
  const margin = getCountyMarginValue(row);
  const winnerLabel = senatePartyCode(top?.party || "D");
  const formatted = margin < 1 ? margin.toFixed(2) : margin.toFixed(1);
  return `${winnerLabel}+${formatted}`;
}

function aggregateSenateLocalMapRows(stateName, rows) {
  const aliases = SENATE_LOCAL_MAP_AGGREGATE_ALIASES[stateName];
  if (!aliases) return rows;

  const grouped = new Map();
  rows.forEach((row) => {
    const displayName = aliases[row.displayName] || row.displayName;
    const key = normalizeCountyName(displayName);
    if (!grouped.has(key)) {
      grouped.set(key, {
        county_fips: `${stateName}-${key.replace(/\s+/g, "")}`,
        county_name: displayName,
        displayName,
        totalVotes: 0,
        candidateVotes: new Map()
      });
    }

    const group = grouped.get(key);
    group.totalVotes += Number(row.totalVotes || 0);
    row.candidates.forEach((candidate) => {
      const candidateKey = `${candidate.name}|${candidate.party}`;
      const existing = group.candidateVotes.get(candidateKey) || {
        name: candidate.name,
        party: candidate.party,
        votes: 0
      };
      existing.votes += Number(candidate.votes || 0);
      group.candidateVotes.set(candidateKey, existing);
    });
  });

  return Array.from(grouped.values()).map((group) => {
    const candidates = Array.from(group.candidateVotes.values())
      .sort((a, b) => b.votes - a.votes)
      .map((candidate) => ({
        ...candidate,
        pct: group.totalVotes ? Number(((candidate.votes / group.totalVotes) * 100).toFixed(2)) : 0,
        votesFormatted: senateFormatVotes(candidate.votes)
      }));
    const row = {
      county_fips: group.county_fips,
      county_name: group.county_name,
      displayName: group.displayName,
      candidates,
      totalVotes: group.totalVotes
    };
    row.winnerParty = getCountyWinnerParty(row);
    row.marginValue = getCountyMarginValue(row);
    row.marginLabel = getCountyMarginLabel(row);
    return row;
  });
}

function getCountyShade(row) {
  const winnerPct = Number(row.candidates[0]?.pct || 0);
  const party = senatePartyCode(getCountyWinnerParty(row));
  const shades = party === "D" ? SENATE_DEM_SHADES : party === "R" ? SENATE_REP_SHADES : SENATE_IND_SHADES;
  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

async function getStateCountyRows(stateName, seatType = "Regular") {
  const bundle = senateCountyResults[stateName];
  const localConfig = SENATE_LOCAL_RESULT_CONFIG[stateName];
  const counties = seatType === "Special" && Array.isArray(bundle?.specialCounties)
    ? bundle.specialCounties
    : bundle?.counties || [];

  if (localConfig) {
    const localRows = bundle?.municipalities || counties;
    return localRows
      .map((county) => {
        const displayName = county.town || county.county;
        if (!displayName) return null;
        return {
          county_fips: county.county_fips || `${stateName}-${normalizeCountyName(displayName)}`,
          county_name: displayName,
          displayName,
          candidates: county.candidates,
          totalVotes: county.totalVotes,
          winnerParty: getCountyWinnerParty(county),
          marginValue: getCountyMarginValue(county),
          marginLabel: getCountyMarginLabel(county)
        };
      })
      .filter(Boolean);
  }

  if (!counties.length) return [];

  const reference = await fetchCountyReference(stateName);

  return counties
    .map((county) => {
      const countyKey = String(county.county || "").trim().toLowerCase();
      const referenceAlias = SENATE_COUNTY_REFERENCE_ALIASES[stateName]?.[String(county.county || "").trim()];
      const referenceRow = reference.get(countyKey)
        || reference.get(normalizeCountyName(county.county))
        || (referenceAlias ? reference.get(String(referenceAlias).trim().toLowerCase()) : null)
        || (referenceAlias ? reference.get(normalizeCountyName(referenceAlias)) : null)
        || null;
      if (!referenceRow) {
        return {
          county_fips: `${stateName}-${normalizeCountyName(county.county)}`,
          county_name: county.county,
          displayName: county.displayName || formatCountyDisplayName(county.county),
          candidates: county.candidates,
          totalVotes: county.totalVotes,
          winnerParty: getCountyWinnerParty(county),
          marginValue: getCountyMarginValue(county),
          marginLabel: getCountyMarginLabel(county)
        };
      }
      return {
        county_fips: referenceRow.county_fips,
        county_name: referenceRow.county_name,
        displayName: county.displayName || formatCountyDisplayName(referenceRow.county_name),
        candidates: county.candidates,
        totalVotes: county.totalVotes,
        winnerParty: getCountyWinnerParty(county),
        marginValue: getCountyMarginValue(county),
        marginLabel: getCountyMarginLabel(county)
      };
    })
    .filter(Boolean);
}

function setActiveCounty(fips) {
  countyBoardState.activeFips = fips || null;
  document.querySelectorAll(".detail-county-row").forEach((row) => {
    row.classList.toggle("is-active", row.dataset.fips === countyBoardState.activeFips);
  });
  document.querySelectorAll(".detail-county-shape").forEach((shape) => {
    shape.classList.toggle("is-active", shape.dataset.fips === countyBoardState.activeFips);
  });
  document.querySelectorAll(".state-election-lead-bubble").forEach((shape) => {
    shape.classList.toggle("is-active", shape.dataset.fips === countyBoardState.activeFips);
  });
}

function sortCountyRows(rows) {
  const sorted = rows.slice();
  if (countyBoardState.sort === "margin") {
    sorted.sort((a, b) => b.marginValue - a.marginValue || b.totalVotes - a.totalVotes);
  } else if (countyBoardState.sort === "alphabetical") {
    sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
  } else {
    sorted.sort((a, b) => b.totalVotes - a.totalVotes || b.marginValue - a.marginValue);
  }

  if (countyBoardState.limit !== "all") {
    return sorted.slice(0, Number(countyBoardState.limit));
  }

  return sorted;
}

function renderCountyBoardRows() {
  const body = document.getElementById("detail-county-board-body");
  if (!body) return;

  const rows = sortCountyRows(countyBoardState.rows);
  body.innerHTML = rows.map((row) => `
    <tr class="detail-county-row" data-fips="${row.county_fips}">
      <td>${row.displayName}</td>
      <td><span class="detail-county-margin ${senateWinnerTone(row.winnerParty)}">${row.marginLabel}</span></td>
      <td>${senateFormatVotes(row.totalVotes)}</td>
      <td>100%</td>
    </tr>
  `).join("");

  body.querySelectorAll(".detail-county-row").forEach((row) => {
    row.addEventListener("mouseenter", () => setActiveCounty(row.dataset.fips));
    row.addEventListener("mouseleave", () => setActiveCounty(null));
  });

  updateCountyShowAllButton();
}

function updateCountyShowAllButton() {
  const button = document.getElementById("detail-county-show-all");
  if (!button) return;

  const hasOverflow = countyBoardState.rows.length > SENATE_COUNTY_BOARD_PREVIEW_LIMIT;
  button.hidden = !hasOverflow;
  if (!hasOverflow) return;

  const showingAll = countyBoardState.limit === "all";
  button.textContent = showingAll ? "Show fewer" : `Show all ${countyBoardState.rows.length} ${countyBoardState.regionPlural}`;
  button.setAttribute("aria-expanded", String(showingAll));
}

function wireCountyBoardControls() {
  document.querySelectorAll(".detail-county-sort-button").forEach((button) => {
    button.onclick = () => {
      countyBoardState.sort = button.dataset.sort;
      document.querySelectorAll(".detail-county-sort-button").forEach((btn) => btn.classList.toggle("is-active", btn === button));
      renderCountyBoardRows();
    };
  });

  const showAllButton = document.getElementById("detail-county-show-all");
  if (showAllButton) {
    showAllButton.onclick = () => {
      countyBoardState.limit = countyBoardState.limit === "all" ? String(SENATE_COUNTY_BOARD_PREVIEW_LIMIT) : "all";
      renderCountyBoardRows();
    };
  }
}

function getSenateRegionLabels(stateName) {
  const localConfig = SENATE_LOCAL_RESULT_CONFIG[stateName];
  if (localConfig) return localConfig;
  return {
    singular: "County",
    plural: "counties",
    mapTitle: "County Map",
    boardTitle: "County Results"
  };
}

function getCountyTooltipHTML(row, stateName) {
  const rows = row.candidates.slice(0, 3).map((candidate, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="tooltip-candidate">
          <span class="tooltip-candidate-bar ${senateWinnerTone(candidate.party)}"></span>
          <span>${candidate.name}</span>
        </div>
      </td>
      <td>${senateFormatPartyShort(candidate.party)}</td>
      <td>${candidate.votesFormatted || senateFormatVotes(candidate.votes)}</td>
      <td>${candidate.pct}%</td>
    </tr>
  `).join("");

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${row.displayName}</div>
      <div class="tooltip-ev">${stateName} Senate result</div>
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
      <tbody>${rows}</tbody>
    </table>
  `;
}

function positionTooltip(event, tooltip) {
  const node = tooltip.node();
  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let left = event.clientX - width / 2;
  let top = event.clientY + 18;
  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  top = Math.min(top, window.innerHeight - height - 12);
  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

function renderSenateCityLabels(svg, projection, stateName) {
  const cityLabels = SENATE_MAJOR_CITY_LABELS[stateName] || [];
  const placedLabels = placeSenateCityLabels(cityLabels, projection);

  const cityLayer = svg.append("g").attr("class", "state-election-city-labels senate-city-labels");

  cityLayer.selectAll("circle")
    .data(placedLabels)
    .enter()
    .append("circle")
    .attr("cx", (city) => city.point[0])
    .attr("cy", (city) => city.point[1])
    .attr("r", 2.6);

  const texts = cityLayer.selectAll("text")
    .data(placedLabels)
    .enter()
    .append("text")
    .attr("x", (city) => city.labelX)
    .attr("y", (city) => city.labelY)
    .attr("text-anchor", (city) => city.anchor)
    .attr("dominant-baseline", "middle")
    .text((city) => city.name);

  resolveRenderedSenateCityLabels(texts);
}

function placeSenateCityLabels(cityLabels, projection) {
  const svgWidth = 540;
  const edgePadding = 8;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  return cityLabels
    .map((city) => {
      const point = projection(city.coordinates);
      return point ? { ...city, point } : null;
    })
    .filter(Boolean)
    .map((city) => {
      const [x, y] = city.point;
      const labelWidth = Math.max(36, city.name.length * 10.2);
      const shouldPlaceLeft = x + labelWidth + 9 > svgWidth - edgePadding;
      const anchor = shouldPlaceLeft ? "end" : "start";
      const labelX = shouldPlaceLeft
        ? clamp(x - 6, edgePadding + labelWidth, svgWidth - edgePadding)
        : clamp(x + 6, edgePadding, svgWidth - labelWidth - edgePadding);

      return {
        ...city,
        labelX,
        labelY: y,
        anchor
      };
    });
}

function resolveRenderedSenateCityLabels(texts) {
  const svgWidth = 540;
  const edgePadding = 8;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  texts.each(function(city) {
    const text = d3.select(this);
    const bounds = this.getBBox();
    const width = bounds.width;
    const [x, y] = city.point;
    const shouldPlaceLeft = x + width + 9 > svgWidth - edgePadding;
    const anchor = shouldPlaceLeft ? "end" : "start";
    const labelX = shouldPlaceLeft
      ? clamp(x - 6, edgePadding + width, svgWidth - edgePadding)
      : clamp(x + 6, edgePadding, svgWidth - width - edgePadding);

    text
      .attr("x", labelX)
      .attr("y", y)
      .attr("text-anchor", anchor);
  });
}

function updateSenateMapLegend(countyRows) {
  const winningParties = new Set(countyRows.map((row) => senatePartyCode(row.winnerParty)));
  document.querySelectorAll(".detail-map-legend-row[data-party]").forEach((row) => {
    const party = row.dataset.party;
    row.hidden = !winningParties.has(party);
  });
}

function getSenateUnitLead(row) {
  const candidates = (row?.candidates || [])
    .slice()
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
  if (!candidates.length) return 0;
  return Math.max(0, Number(candidates[0].votes || 0) - Number(candidates[1]?.votes || 0));
}

function setupSenateDetailMapMode(record, rows, regionLabels) {
  const modeControl = document.getElementById("senate-detail-map-mode");
  const shareLegend = document.querySelector(".detail-map-legend");
  const leadLegend = document.getElementById("senate-detail-lead-legend");
  const indLegend = document.getElementById("senate-detail-lead-legend-ind");
  const canToggle = rows.length > 1 && rows.some((row) => getSenateUnitLead(row) > 0);
  if (!canToggle) {
    senateDetailMapMode = "share";
  }

  if (modeControl) {
    modeControl.hidden = !canToggle;
    modeControl.querySelectorAll("[data-map-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.mapMode === senateDetailMapMode);
      button.onclick = () => {
        if (senateDetailMapMode === button.dataset.mapMode) return;
        senateDetailMapMode = button.dataset.mapMode;
        renderCountyMap(record);
      };
    });
  }

  const showLead = canToggle && senateDetailMapMode === "lead";
  if (shareLegend) shareLegend.hidden = showLead;
  if (leadLegend) leadLegend.hidden = !showLead;
  if (indLegend) {
    indLegend.hidden = !showLead || !rows.some((row) => {
      const code = senatePartyCode(row.winnerParty);
      return code !== "D" && code !== "R";
    });
  }

  return showLead
    ? `${record.displayName} ${regionLabels.plural} sized by the winning Senate vote lead.`
    : `${record.displayName} ${regionLabels.plural} shaded by the winning Senate margin.`;
}

function renderSenateLeadBubbles(svg, features, path, getRow, tooltip, record) {
  const bubbleRows = features
    .map((feature) => ({ feature, row: getRow(feature) }))
    .filter((item) => item.row);
  const maxLead = d3.max(bubbleRows, (item) => getSenateUnitLead(item.row)) || 1;
  const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5, 40]);

  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "state-election-lead-county-shape")
    .attr("data-fips", (feature) => getRow(feature)?.county_fips || null)
    .attr("d", path);

  svg.append("g")
    .selectAll("circle")
    .data(bubbleRows)
    .enter()
    .append("circle")
    .attr("class", (item) => `state-election-lead-bubble ${senateWinnerTone(item.row.winnerParty)}`)
    .attr("data-fips", (item) => item.row.county_fips)
    .attr("cx", (item) => path.centroid(item.feature)[0])
    .attr("cy", (item) => path.centroid(item.feature)[1])
    .attr("r", (item) => radius(getSenateUnitLead(item.row)))
    .on("mouseover", (event, item) => {
      setActiveCounty(item.row.county_fips);
      tooltip.style("opacity", 1).html(getCountyTooltipHTML(item.row, record.name));
      positionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => positionTooltip(event, tooltip))
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
      setActiveCounty(null);
    });
}

async function renderCountyMap(record) {
  const svg = d3.select("#detail-county-map");
  const tooltip = d3.select("#detail-map-tooltip");
  const mapEmpty = document.getElementById("detail-map-empty");
  const subtitle = document.getElementById("detail-map-subtitle");
  const mapHeading = document.querySelector(".detail-map-head h3");
  const mapLegend = document.querySelector(".detail-map-legend");

  if (svg.empty() || !window.topojson) return;

  svg.selectAll("*").remove();
  const regionLabels = getSenateRegionLabels(record.name);
  if (mapHeading) mapHeading.textContent = regionLabels.mapTitle;
  if (mapLegend) mapLegend.setAttribute("aria-label", `${regionLabels.mapTitle.toLowerCase()} legend`);

  try {
    const localConfig = SENATE_LOCAL_RESULT_CONFIG[record.name];
    if (localConfig) {
      const [countyRows, localGeojson] = await Promise.all([
        getStateCountyRows(record.name, record.primary.seatType),
        d3.json(localConfig.geojsonUrl)
      ]);
      const mapRows = aggregateSenateLocalMapRows(record.name, countyRows);
      const rowByName = new Map(mapRows.map((row) => [normalizeCountyName(row.displayName), row]));
      const rowById = new Map(mapRows.map((row) => [row.county_fips, row]));
      const features = (localGeojson.features || [])
        .map((feature) => ({
          ...feature,
          resultRow: rowById.get(feature.properties?.[localConfig.idProperty]) ||
            rowByName.get(normalizeCountyName(feature.properties?.[localConfig.nameProperty]))
        }))
        .filter((feature) => feature.resultRow);

      if (!countyRows.length || !mapRows.length || !features.length) {
        mapEmpty.hidden = false;
        subtitle.textContent = `${regionLabels.singular} map data is not available for this Senate page yet.`;
        return;
      }

      mapEmpty.hidden = true;
      updateSenateMapLegend(mapRows);
      subtitle.textContent = setupSenateDetailMapMode(record, mapRows, regionLabels);

      const localCollection = { type: "FeatureCollection", features };
      const projection = localConfig.projection === "identity"
        ? d3.geoIdentity().reflectY(true).fitSize([540, 620], localCollection)
        : d3.geoMercator().fitSize([540, 620], localCollection);
      const path = d3.geoPath(projection);
      const showLead = senateDetailMapMode === "lead";

      if (showLead) {
        renderSenateLeadBubbles(svg, features, path, (feature) => feature.resultRow, tooltip, record);

        svg.append("path")
          .datum(localCollection)
          .attr("class", "state-election-lead-state-outline")
          .attr("d", path);

        renderSenateCityLabels(svg, projection, record.name);

        return;
      }

      svg.append("g")
        .selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", "detail-county-shape")
        .attr("data-fips", (feature) => feature.resultRow.county_fips)
        .attr("d", path)
        .attr("fill", (feature) => getCountyShade(feature.resultRow))
        .on("mouseover", (event, feature) => {
          const row = feature.resultRow;
          setActiveCounty(row.county_fips);
          tooltip.style("opacity", 1).html(getCountyTooltipHTML(row, record.name));
          positionTooltip(event, tooltip);
        })
        .on("mousemove", (event) => positionTooltip(event, tooltip))
        .on("mouseout", () => {
          tooltip.style("opacity", 0);
          setActiveCounty(null);
        });

      svg.append("path")
        .datum(localCollection)
        .attr("class", "detail-state-outline")
        .attr("d", path);

      renderSenateCityLabels(svg, projection, record.name);

      return;
    }

    const [countyRows, countiesTopo, statesTopo] = await Promise.all([
      getStateCountyRows(record.name, record.primary.seatType),
      d3.json(COUNTIES_TOPOJSON_URL),
      d3.json(STATES_TOPOJSON_URL)
    ]);

    const rowByFips = new Map(countyRows.map((row) => [row.county_fips, row]));
    const features = topojson.feature(countiesTopo, countiesTopo.objects.counties).features
      .filter((feature) => rowByFips.has(String(feature.id).padStart(5, "0")));
    const stateFeature = topojson.feature(statesTopo, statesTopo.objects.states).features
      .find((feature) => String(feature.id).padStart(2, "0") === senateStateFipsByName[record.name]);

    if (!countyRows.length || !features.length || !stateFeature) {
      mapEmpty.hidden = false;
      subtitle.textContent = "County map data is not available for this Senate page yet.";
      return;
    }

    mapEmpty.hidden = true;
    updateSenateMapLegend(countyRows);
    subtitle.textContent = setupSenateDetailMapMode(record, countyRows, regionLabels);

    const projection = d3.geoMercator().fitSize([540, 620], { type: "FeatureCollection", features });
    const path = d3.geoPath(projection);
    const showLead = senateDetailMapMode === "lead";

    if (showLead) {
      renderSenateLeadBubbles(
        svg,
        features,
        path,
        (feature) => rowByFips.get(String(feature.id).padStart(5, "0")),
        tooltip,
        record
      );

      svg.append("path")
        .datum(stateFeature)
        .attr("class", "state-election-lead-state-outline")
        .attr("d", path);

      renderSenateCityLabels(svg, projection, record.name);
      return;
    }

    svg.append("g")
      .selectAll("path")
      .data(features)
      .enter()
      .append("path")
      .attr("class", "detail-county-shape")
      .attr("data-fips", (feature) => String(feature.id).padStart(5, "0"))
      .attr("d", path)
      .attr("fill", (feature) => getCountyShade(rowByFips.get(String(feature.id).padStart(5, "0"))))
      .on("mouseover", (event, feature) => {
        const row = rowByFips.get(String(feature.id).padStart(5, "0"));
        if (!row) return;
        setActiveCounty(row.county_fips);
        tooltip.style("opacity", 1).html(getCountyTooltipHTML(row, record.name));
        positionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => positionTooltip(event, tooltip))
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
        setActiveCounty(null);
      });

    svg.append("path")
      .datum(stateFeature)
      .attr("class", "detail-state-outline")
      .attr("d", path);

    renderSenateCityLabels(svg, projection, record.name);
  } catch (error) {
    mapEmpty.hidden = false;
    subtitle.textContent = "County map data could not be loaded.";
    console.error(error);
  }
}

async function renderCountyBoard(record) {
  const note = document.getElementById("detail-county-board-note");
  const empty = document.getElementById("detail-county-board-empty");
  const tableWrap = document.getElementById("detail-county-board-table-wrap");
  const heading = document.querySelector("#detail-county-board h2");
  const firstColumn = document.querySelector(".senate-county-board-table thead th:first-child");
  const sortGroup = document.querySelector(".detail-county-sort");
  const regionLabels = getSenateRegionLabels(record.name);

  empty.hidden = true;
  tableWrap.hidden = false;
  countyBoardState.regionPlural = regionLabels.plural;
  if (heading) heading.textContent = regionLabels.boardTitle;
  if (firstColumn) firstColumn.textContent = regionLabels.singular;
  if (sortGroup) sortGroup.setAttribute("aria-label", `Sort ${regionLabels.singular.toLowerCase()} results`);

  const rows = await getStateCountyRows(record.name, record.primary.seatType);
  if (!rows.length) {
    note.textContent = `${regionLabels.singular} board unavailable.`;
    empty.hidden = false;
    empty.textContent = `${regionLabels.singular}-level Senate results are not available for this state page yet.`;
    tableWrap.hidden = true;
    return;
  }

  note.textContent = `${regionLabels.singular} margins in the 2024 Senate race.`;
  countyBoardState.rows = rows;
  countyBoardState.limit = String(SENATE_COUNTY_BOARD_PREVIEW_LIMIT);
  renderCountyBoardRows();
  wireCountyBoardControls();
}

function renderSummary(record) {
  const title = document.getElementById("detail-title");
  const summaryCard = document.getElementById("detail-summary-card");
  const summaryTitle = document.getElementById("detail-summary-title");
  const summaryCallout = document.getElementById("detail-summary-callout");
  const summaryPortrait = document.getElementById("detail-summary-portrait");
  const seat = document.getElementById("detail-ev");
  const margin = document.getElementById("detail-margin");
  const voteBody = document.getElementById("detail-vote-body");
  const certifiedTitle = document.getElementById("detail-certified-title");
  const certifiedDem = document.getElementById("detail-certified-dem");
  const certifiedRep = document.getElementById("detail-certified-rep");
  const certifiedInd = document.getElementById("detail-certified-ind");
  const certifiedOther = document.getElementById("detail-certified-other");
  const certifiedNote = document.getElementById("detail-certified-note");
  const candidates = getStatewideCandidates(record);

  const winnerTone = senateWinnerTone(record.primary.winnerParty);
  const totalVotes = getCertifiedSenateTotal(record, candidates);
  const demPct = candidates.filter((candidate) => candidate.party === "Democrat").reduce((sum, candidate) => sum + Number(candidate.pct.replace("%", "")), 0);
  const repPct = candidates.filter((candidate) => candidate.party === "Republican").reduce((sum, candidate) => sum + Number(candidate.pct.replace("%", "")), 0);
  const indPct = candidates.filter((candidate) => candidate.party === "Independent").reduce((sum, candidate) => sum + Number(candidate.pct.replace("%", "")), 0);

  const pageTitle = record.primary.seatType === "Special"
    ? `${record.displayName} U.S. Senate Special Election Results`
    : `${record.displayName} U.S. Senate Election Results`;
  document.title = pageTitle;
  title.textContent = pageTitle;
  summaryCard.classList.remove("winner-dem", "winner-rep", "winner-ind");
  summaryCard.classList.add(`winner-${winnerTone}`);
  summaryTitle.textContent = `${record.primary.winner} wins ${record.displayName}.`;
  summaryCallout.textContent = record.races.length > 1
    ? `This page highlights the ${record.primary.seatType.toLowerCase()} Senate race. An additional Senate contest was also on the ballot here in 2024.`
    : "Race called with certified statewide Senate vote totals.";
  summaryPortrait.src = getSenateCandidatePortrait(record.primary.winner, candidates[0]?.imageUrl);
  seat.textContent = record.primary.seatType;
  margin.textContent = record.primary.result;

  voteBody.innerHTML = candidates.map((candidate, index) => `
    <tr class="${index === 0 ? "winner-row" : ""}">
      <td>
        <div class="detail-candidate-cell">
          <img class="detail-candidate-photo" src="${getSenateCandidatePortrait(candidate.candidate, candidate.imageUrl)}" alt="${candidate.candidate}" />
          <span>${candidate.candidate}</span>
        </div>
      <td>${candidate.party}</td>
      <td>${candidate.votes}</td>
      <td>${candidate.pct}</td>
    </tr>
  `).join("");

  certifiedTitle.textContent = `The U.S. Senate vote has been certified in ${record.displayName}.`;
  certifiedDem.style.width = `${demPct}%`;
  certifiedRep.style.width = `${repPct}%`;
  certifiedInd.style.width = `${indPct}%`;
  certifiedOther.style.width = `${Math.max(0, 100 - demPct - repPct - indPct)}%`;
  certifiedNote.textContent = `${senateFormatVotes(totalVotes)} total votes reported.`;

  document.querySelector(".detail-map-head h3").textContent = "County Map";
}

async function renderSenateStatePage() {
  const params = new URLSearchParams(window.location.search);
  const rawName = params.get("name");
  const name = canonicalizeSenateStateName(rawName);
  const seatType = params.get("seat") || "Regular";
  const title = document.getElementById("detail-title");

  if (!rawName) {
    title.textContent = "Result not found";
    return;
  }

  const record = getSenateResultRecord(name, seatType);
  if (!record) {
    title.textContent = "Result not found";
    return;
  }

  if (rawName !== name) {
    params.set("name", name);
    window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
  }

  renderSummary(record);
  await Promise.all([
    renderCountyMap(record),
    renderCountyBoard(record)
  ]);
}

renderSenateStatePage();

const STATE_ELECTION_COUNTY_RESULTS_URL = "https://raw.githubusercontent.com/tonmcg/US_County_Level_Election_Results_08-24/master/2024_US_County_Level_Presidential_Results.csv";
const STATE_ELECTION_COUNTIES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json";
const STATE_ELECTION_STATES_TOPOJSON_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";
const STATE_ELECTION_CT_TOWN_RESULTS_URL = "./data/ct-town-results-2024.json";
const STATE_ELECTION_CT_TOWNS_GEOJSON_URL = "./assets/maps/connecticut-towns.geojson";
const stateElectionCountyResultsCache = new Map();
const stateElectionLocalResultsCache = new Map();
let stateElectionConnecticutTownRowsCache = null;
let stateElectionTopoCache = null;
let stateElectionSenateMapMode = "share";

const STATE_ELECTION_LOCAL_GEOJSON_URLS = {
  Maine: "./assets/maps/state-local-results-2024/maine-local-results-2024.geojson?v=20261006-maine-labels",
  Massachusetts: "./assets/maps/state-local-results-2024/massachusetts-local-results-2024.geojson",
  "New Hampshire": "./assets/maps/state-local-results-2024/new-hampshire-local-results-2024.geojson",
  "Rhode Island": "./assets/maps/state-local-results-2024/rhode-island-local-results-2024.geojson",
  Vermont: "./assets/maps/state-local-results-2024/vermont-local-results-2024.geojson"
};

const STATE_ELECTION_SENATE_LOCAL_MAP_AGGREGATE_ALIASES = {
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

const STATE_ELECTION_FIPS_BY_NAME = {
  Alabama: "01", Alaska: "02", Arizona: "04", Arkansas: "05", California: "06",
  Colorado: "08", Connecticut: "09", Delaware: "10", "District of Columbia": "11", Florida: "12",
  Georgia: "13", Hawaii: "15", Idaho: "16", Illinois: "17", Indiana: "18",
  Iowa: "19", Kansas: "20", Kentucky: "21", Louisiana: "22", Maine: "23",
  Maryland: "24", Massachusetts: "25", Michigan: "26", Minnesota: "27", Mississippi: "28",
  Missouri: "29", Montana: "30", Nebraska: "31", Nevada: "32", "New Hampshire": "33",
  "New Jersey": "34", "New Mexico": "35", "New York": "36", "North Carolina": "37", "North Dakota": "38",
  Ohio: "39", Oklahoma: "40", Oregon: "41", Pennsylvania: "42", "Rhode Island": "44",
  "South Carolina": "45", "South Dakota": "46", Tennessee: "47", Texas: "48", Utah: "49",
  Vermont: "50", Virginia: "51", Washington: "53", "West Virginia": "54", Wisconsin: "55",
  Wyoming: "56"
};

const STATE_ELECTION_DEM_SHADES = ["#b8d4ec", "#8eb6d9", "#5a96c8", "#2879b5"];
const STATE_ELECTION_REP_SHADES = ["#f1cfcf", "#e49e9e", "#d86a6a", "#cf2f2f"];
const STATE_ELECTION_IND_SHADES = ["#f0dfab", "#e0c16a", "#c8a24a", "#a97d1c"];
const STATE_ELECTION_HOUSE_PREVIEW_LIMIT = 5;
const stateElectionHouseListState = {
  districts: [],
  limit: STATE_ELECTION_HOUSE_PREVIEW_LIMIT
};
const STATE_ELECTION_CANDIDATE_PORTRAITS = {
  "Kamala Harris": "https://upload.wikimedia.org/wikipedia/commons/4/41/Kamala_Harris_Vice_Presidential_Portrait.jpg",
  "Donald Trump": "https://upload.wikimedia.org/wikipedia/commons/5/56/Donald_Trump_official_portrait.jpg"
};
const STATE_ELECTION_MAJOR_CITY_LABELS = {
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
const STATE_ELECTION_HOUSE_OVERRIDES = {
  "AL-03": { winnerParty: "R", fillKey: "Rep", marginLabel: "Uncontested", totalVotesFormatted: "Vote total unavailable" },
  "AL-04": { winnerParty: "R", fillKey: "Rep", marginLabel: "Uncontested", totalVotesFormatted: "Vote total unavailable" },
  "AL-05": { winnerParty: "R", fillKey: "Rep", marginLabel: "Uncontested", totalVotesFormatted: "Vote total unavailable" }
};

function stateElectionFormatVotes(value) {
  return Number(value || 0).toLocaleString();
}

function stateElectionNumberFromVoteString(value) {
  return Number(String(value || "").replace(/,/g, "")) || 0;
}

function stateElectionNormalizeTownName(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stateElectionGetCountyWinner(row) {
  return Number(row.per_dem) >= Number(row.per_gop) ? "Harris" : "Trump";
}

function stateElectionCountyShade(row) {
  const demPct = Number(row.per_dem) * 100;
  const repPct = Number(row.per_gop) * 100;
  const isDem = demPct >= repPct;
  const winnerPct = isDem ? demPct : repPct;
  const shades = isDem ? STATE_ELECTION_DEM_SHADES : STATE_ELECTION_REP_SHADES;

  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

function stateElectionCountyLead(row) {
  return Math.abs(Number(row.votes_gop || 0) - Number(row.votes_dem || 0));
}

function stateElectionFormatCountyName(name, row = {}) {
  const base = String(name || "")
    .trim()
    .replace(/\s+County$/i, "")
    .replace(/\s+Parish$/i, "")
    .replace(/\s+Borough$/i, "")
    .replace(/\s+Census Area$/i, "")
    .replace(/\s+Municipality$/i, "")
    .replace(/\s+city$/i, "");

  if (row.region_type === "town" || row.region_type === "municipality" || row.region_type === "local" || /Ward\s+\d+/i.test(base) || /District of Columbia/i.test(base)) {
    return base;
  }

  return `${base} County`;
}

function stateElectionUsesLocalResults(stateName) {
  return Boolean(STATE_ELECTION_LOCAL_GEOJSON_URLS[stateName]);
}

function stateElectionRegionLabel(stateName) {
  if (stateName === "District of Columbia") return "Ward";
  if (stateName === "Connecticut") return "Town";
  if (stateName === "Massachusetts" || stateName === "Rhode Island") return "Municipality";
  if (stateElectionUsesLocalResults(stateName)) return "Town";
  return "County";
}

function stateElectionRegionLabelPlural(stateName) {
  if (stateName === "District of Columbia") return "Wards";
  if (stateName === "Connecticut") return "Towns";
  if (stateName === "Massachusetts" || stateName === "Rhode Island") return "Municipalities";
  if (stateElectionUsesLocalResults(stateName)) return "Towns";
  return "Counties";
}

function stateElectionFormatPresidentialMargin(row) {
  const winner = stateElectionGetCountyWinner(row);
  const points = Math.abs(Number(row.per_point_diff) * 100);
  return `${winner === "Harris" ? "D" : "R"}+${points < 1 ? points.toFixed(2) : points.toFixed(1)}`;
}

function stateElectionPositionTooltip(event, tooltip) {
  const node = tooltip.node();
  if (!node) return;

  const width = node.offsetWidth;
  const height = node.offsetHeight;
  let left = event.clientX - width / 2;
  let top = event.clientY + 18;

  left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
  top = Math.min(top, window.innerHeight - height - 12);

  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

function stateElectionCountyTooltipHTML(row, stateName) {
  const winner = stateElectionGetCountyWinner(row);
  const demPct = (Number(row.per_dem) * 100).toFixed(1);
  const repPct = (Number(row.per_gop) * 100).toFixed(1);

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${stateElectionFormatCountyName(row.county_name, row)}</div>
      <div class="tooltip-ev">${stateName} presidential result</div>
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
        <tr class="${winner === "Trump" ? "winner-row" : ""}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar rep"></span>
              <span>Donald J. Trump</span>
            </div>
          </td>
          <td>Rep.</td>
          <td>${stateElectionFormatVotes(row.votes_gop)}</td>
          <td>${repPct}%</td>
        </tr>
        <tr class="${winner === "Harris" ? "winner-row" : ""}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar dem"></span>
              <span>Kamala Harris</span>
            </div>
          </td>
          <td>Dem.</td>
          <td>${stateElectionFormatVotes(row.votes_dem)}</td>
          <td>${demPct}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function stateElectionCandidatePartyLabel(candidate) {
  const labels = {
    D: "Democrat",
    R: "Republican",
    I: "Independent",
    LB: "Libertarian",
    G: "Green"
  };

  return labels[candidate.party] || candidate.partyName || candidate.party || "";
}

function stateElectionCandidatePartyTone(candidate) {
  if (candidate.party === "D") return "dem";
  if (candidate.party === "R") return "rep";
  return "ind";
}

function stateElectionHouseTooltipHTML(district) {
  const rows = (district.candidates || []).map((candidate) => `
    <tr class="${candidate.winner ? "winner-row" : ""}">
      <td>
        <div class="tooltip-candidate">
          <span class="tooltip-candidate-bar ${stateElectionCandidatePartyTone(candidate)}"></span>
          <span>${candidate.name}</span>${candidate.incumbent ? `<span class="tooltip-incumbent">Inc.</span>` : ""}
        </div>
      </td>
      <td>${stateElectionCandidatePartyLabel(candidate)}</td>
      <td>${district.uncontested || Number(candidate.votes) === 0 ? "-" : candidate.votesFormatted}</td>
      <td>${district.uncontested || Number(candidate.votes) === 0 ? "-" : `${candidate.pctFormatted}%`}</td>
    </tr>
  `).join("");

  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${district.title}</div>
      <div class="tooltip-ev">100% in</div>
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

function stateElectionFormatStateMargin(result) {
  const harrisPct = Number(result.dP || 0);
  const trumpPct = Number(result.rP || 0);
  const diff = Math.abs(harrisPct - trumpPct);
  const prefix = harrisPct > trumpPct ? "D" : "R";
  return `${prefix}+${diff < 1 ? diff.toFixed(2) : diff.toFixed(1)}`;
}

function stateElectionWinnerName(result) {
  return result.winner && result.winner.startsWith("Harris") ? "Kamala Harris" : "Donald Trump";
}

function stateElectionHouseFill(fillKey) {
  if (fillKey === "Dem") return "#2879b5";
  if (fillKey === "Rep") return "#cf2f2f";
  return "#c8a24a";
}

function stateElectionHouseDistrictFill(district) {
  if (!district) return "#2d3138";
  const partyClass = stateElectionPartyClass(district.winnerParty);
  if (district.flipped && partyClass === "dem") return "url(#state-election-house-dem-flip-pattern)";
  if (district.flipped && partyClass === "rep") return "url(#state-election-house-rep-flip-pattern)";
  if (district.flipped) return "url(#state-election-house-ind-flip-pattern)";
  return stateElectionHouseFill(district.fillKey);
}

function stateElectionBuildHousePatterns(svg) {
  const defs = svg.append("defs");

  defs.append("pattern")
    .attr("id", "state-election-house-dem-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call((pattern) => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
    });

  defs.append("pattern")
    .attr("id", "state-election-house-rep-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call((pattern) => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
    });

  defs.append("pattern")
    .attr("id", "state-election-house-ind-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call((pattern) => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#e0c16a");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#c8a24a");
    });
}

function stateElectionHouseWinnerIsIncumbent(district) {
  return Boolean((district.candidates || []).find((candidate) => candidate.winner && candidate.incumbent));
}

function stateElectionHousePartyLabel(candidate) {
  const party = candidate?.party || candidate?.partyName || "";
  if (party === "D" || party === "Democrat") return "Dem.";
  if (party === "R" || party === "Republican") return "Rep.";
  if (party === "LB" || party === "Libertarian") return "Lib.";
  if (party === "GR" || party === "Green") return "Green";
  if (party === "I" || party === "Independent") return "Ind.";
  return candidate?.partyName || party || "Other";
}

function stateElectionHouseCandidateClass(candidate) {
  const party = candidate?.party || candidate?.partyName || "";
  if (party === "D" || party === "Democrat") return "dem";
  if (party === "R" || party === "Republican") return "rep";
  return "ind";
}

function stateElectionHouseCandidateSurname(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : "Candidate";
}

function stateElectionPartyClass(party) {
  if (party === "D" || party === "Democrat") return "dem";
  if (party === "R" || party === "Republican") return "rep";
  return "ind";
}

function stateElectionDistrictLink(code) {
  return `./house-district-result.html?code=${encodeURIComponent(code)}`;
}

function stateElectionNormalizeRegionName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s*\((part|pt\.)\)\s*/gi, " ")
    .replace(/\s+(county|parish|borough|census area|municipality|city|town)$/gi, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stateElectionSenatePartyCode(party) {
  const label = String(party || "").trim();
  if (label === "D" || label === "Dem." || label === "Democrat" || label === "Democratic") return "D";
  if (label === "R" || label === "Rep." || label === "Republican") return "R";
  if (label === "N" || label === "None") return "N";
  return "I";
}

function stateElectionSenatePartyTone(party) {
  const code = stateElectionSenatePartyCode(party);
  if (code === "D") return "dem";
  if (code === "R") return "rep";
  if (code === "N") return "none";
  return "ind";
}

function stateElectionSenatePartyLabel(party) {
  const code = stateElectionSenatePartyCode(party);
  if (code === "D") return "Democrat";
  if (code === "R") return "Republican";
  if (code === "N") return "None";
  const label = String(party || "").trim();
  if (label === "Ind." || label === "I" || label === "Independent") return "Independent";
  if (label === "Lib." || label === "L") return "Libertarian";
  if (label === "Green" || label === "G") return "Green";
  if (label === "Const." || label === "C") return "Constitution";
  return label || "Independent";
}

function stateElectionSenatePartyShort(party) {
  const code = stateElectionSenatePartyCode(party);
  if (code === "D") return "Dem.";
  if (code === "R") return "Rep.";
  if (code === "N") return "None";
  const label = String(party || "").trim();
  if (label === "Lib." || label === "L" || label === "Libertarian") return "Lib.";
  if (label === "Green" || label === "G") return "Green";
  if (label === "Const." || label === "C" || label === "Constitution") return "Const.";
  return "Ind.";
}

function stateElectionSenateCandidateRows(race) {
  const rows = Array.isArray(race?.tooltipRows) ? race.tooltipRows : [];
  return rows.map((row) => ({
    name: row.name,
    party: stateElectionSenatePartyLabel(row.party),
    partyShort: stateElectionSenatePartyShort(row.party),
    votes: row.votes,
    voteNumber: Number(String(row.votes || 0).replace(/,/g, "")),
    pct: `${row.pct}%`,
    imageUrl: row.imageUrl || "",
    tone: stateElectionSenatePartyTone(row.party)
  }));
}

function stateElectionGetSenateRaces(stateName) {
  return (window.SENATE_2024_DATA?.races || [])
    .filter((race) => race.race === stateName);
}

function stateElectionGetPrimarySenateRace(stateName) {
  const races = stateElectionGetSenateRaces(stateName);
  return races.find((race) => race.seatType === "Regular") || races[0] || null;
}

function stateElectionSenateDetailLink(stateName, race) {
  const params = new URLSearchParams({ name: stateName });
  if (race?.seatType && race.seatType !== "Regular") {
    params.set("seat", race.seatType);
  }
  return `./senate-state-result.html?${params.toString()}`;
}

function stateElectionSenateUnitLabel(stateName) {
  if (stateName === "Connecticut") return { singular: "Town", plural: "Towns" };
  if (stateName === "Maine" || stateName === "Vermont") return { singular: "Town", plural: "Towns" };
  if (stateName === "Massachusetts" || stateName === "Rhode Island") return { singular: "Municipality", plural: "Municipalities" };
  return { singular: "County", plural: "Counties" };
}

function stateElectionSenateUnitLabelForRows(stateName, rows) {
  if (rows.length && rows.every((row) => row.region_type === "county")) {
    return { singular: "County", plural: "Counties" };
  }
  return stateElectionSenateUnitLabel(stateName);
}

function stateElectionSenateWinnerParty(row) {
  const top = (row?.candidates || [])
    .slice()
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0))[0];
  return stateElectionSenatePartyCode(top?.party);
}

function stateElectionSenateUnitLead(row) {
  const candidates = (row?.candidates || [])
    .slice()
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
  if (!candidates.length) return 0;
  return Math.max(0, Number(candidates[0].votes || 0) - Number(candidates[1]?.votes || 0));
}

function stateElectionSenateUnitShade(row) {
  if (!Number(row?.totalVotes || 0)) return "#2d3138";
  const winner = stateElectionSenateWinnerParty(row);
  const shades = winner === "D"
    ? STATE_ELECTION_DEM_SHADES
    : winner === "R"
      ? STATE_ELECTION_REP_SHADES
      : STATE_ELECTION_IND_SHADES;
  const winnerPct = Math.max(...(row.candidates || []).map((candidate) => Number(candidate.pct || 0)), 0);
  if (winnerPct >= 70) return shades[3];
  if (winnerPct >= 60) return shades[2];
  if (winnerPct >= 50) return shades[1];
  return shades[0];
}

function stateElectionNormalizeSenateUnitRow(row, referenceByName = new Map()) {
  const candidates = (row.candidates || [])
    .map((candidate) => ({
      ...candidate,
      party: candidate.party,
      partyShort: stateElectionSenatePartyShort(candidate.party),
      tone: stateElectionSenatePartyTone(candidate.party),
      votes: Number(candidate.votes || 0),
      votesFormatted: candidate.votesFormatted || stateElectionFormatVotes(candidate.votes),
      pct: Number(candidate.pct || 0)
    }))
    .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
  const top = candidates[0];
  const second = candidates[1];
  const winnerCode = stateElectionSenatePartyCode(top?.party);
  const marginPct = Math.max(0, Number(top?.pct || 0) - Number(second?.pct || 0));
  const cleanName = String(row.county || row.town || "").trim();
  const normalizedName = stateElectionNormalizeRegionName(cleanName);
  const reference = referenceByName.get(normalizedName);
  return {
    county_fips: reference?.county_fips || row.county_fips || `SENATE-${normalizedName}`,
    county_name: cleanName,
    displayName: cleanName,
    region_type: reference?.region_type || (row.town ? "local" : (/county|parish|borough|census area/i.test(cleanName) ? "county" : "town")),
    candidates,
    totalVotes: Number(row.totalVotes || candidates.reduce((sum, candidate) => sum + Number(candidate.votes || 0), 0)),
    winnerParty: winnerCode,
    marginLabel: `${winnerCode === "D" ? "D" : winnerCode === "R" ? "R" : "I"}+${marginPct < 1 ? marginPct.toFixed(2) : marginPct.toFixed(1)}`
  };
}

function stateElectionAggregateSenateLocalMapRows(stateName, rows) {
  const aliases = STATE_ELECTION_SENATE_LOCAL_MAP_AGGREGATE_ALIASES[stateName];
  if (!aliases) return rows;

  const grouped = new Map();
  rows.forEach((row) => {
    const displayName = aliases[row.displayName] || row.displayName;
    const key = stateElectionNormalizeRegionName(displayName);
    if (!grouped.has(key)) {
      grouped.set(key, {
        county_fips: `${stateName}-${key.replace(/\s+/g, "")}`,
        county_name: displayName,
        displayName,
        region_type: row.region_type,
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
        partyShort: candidate.partyShort,
        tone: candidate.tone,
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
        votesFormatted: stateElectionFormatVotes(candidate.votes)
      }));
    const top = candidates[0];
    const second = candidates[1];
    const winnerCode = stateElectionSenatePartyCode(top?.party);
    const marginPct = Math.max(0, Number(top?.pct || 0) - Number(second?.pct || 0));
    return {
      ...group,
      candidates,
      winnerParty: winnerCode,
      marginLabel: `${winnerCode === "D" ? "D" : winnerCode === "R" ? "R" : "I"}+${marginPct < 1 ? marginPct.toFixed(2) : marginPct.toFixed(1)}`
    };
  });
}

function stateElectionSenateTooltipHTML(row, stateName, race) {
  const candidates = (row.candidates || []).slice(0, 3);
  const title = stateElectionFormatCountyName(row.county_name, row);
  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${title}</div>
      <div class="tooltip-ev">${race.seatType === "Special" ? "Special " : ""}${stateName} Senate result</div>
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
        ${candidates.map((candidate, index) => `
          <tr class="${index === 0 ? "winner-row" : ""}">
            <td>
              <div class="tooltip-candidate">
                <span class="tooltip-candidate-bar ${candidate.tone}"></span>
                <span>${candidate.name}</span>
              </div>
            </td>
            <td>${candidate.partyShort}</td>
            <td>${candidate.votesFormatted}</td>
            <td>${Number(candidate.pct).toFixed(2).replace(/\.00$/, ".0")}%</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

async function stateElectionFetchCountyResults(stateName) {
  if (stateElectionCountyResultsCache.has(stateName)) {
    return stateElectionCountyResultsCache.get(stateName);
  }

  const rows = await d3.csv(STATE_ELECTION_COUNTY_RESULTS_URL, (row) => {
    if (row.state_name !== stateName) return null;
    return {
      ...row,
      votes_gop: Number(row.votes_gop),
      votes_dem: Number(row.votes_dem),
      total_votes: Number(row.total_votes),
      per_gop: Number(row.per_gop),
      per_dem: Number(row.per_dem),
      per_point_diff: Number(row.per_point_diff)
    };
  });

  const filtered = rows.filter(Boolean);
  stateElectionCountyResultsCache.set(stateName, filtered);
  return filtered;
}

async function stateElectionFetchConnecticutTownResults() {
  if (stateElectionConnecticutTownRowsCache) return stateElectionConnecticutTownRowsCache;

  const rows = await d3.json(STATE_ELECTION_CT_TOWN_RESULTS_URL);
  stateElectionConnecticutTownRowsCache = rows
    .map((row) => {
      const townName = String(row.town || "").trim();
      const votesDem = Number(row.dem ?? row.harris ?? row.biden ?? 0);
      const votesGop = Number(row.rep ?? row.trump ?? 0);
      const totalVotes = Number(row.total || votesDem + votesGop);
      const perDem = totalVotes ? votesDem / totalVotes : 0;
      const perGop = totalVotes ? votesGop / totalVotes : 0;

      return {
        county_fips: `CT-${stateElectionNormalizeTownName(townName)}`,
        county_name: townName,
        region_type: "town",
        votes_dem: votesDem,
        votes_gop: votesGop,
        total_votes: totalVotes,
        per_dem: perDem,
        per_gop: perGop,
        per_point_diff: Math.abs(perDem - perGop)
      };
    })
    .sort((a, b) => b.total_votes - a.total_votes);

  return stateElectionConnecticutTownRowsCache;
}

async function stateElectionFetchLocalResultGeojson(stateName) {
  if (stateElectionLocalResultsCache.has(stateName)) {
    return stateElectionLocalResultsCache.get(stateName);
  }

  const url = STATE_ELECTION_LOCAL_GEOJSON_URLS[stateName];
  if (!url) return null;

  const collection = await d3.json(url);
  const normalized = {
    type: "FeatureCollection",
    features: (collection.features || [])
      .map((feature) => ({
        ...feature,
        resultRow: feature.properties
      }))
      .filter((feature) => feature.resultRow)
  };

  stateElectionLocalResultsCache.set(stateName, normalized);
  return normalized;
}

async function stateElectionFetchLocalResultRows(stateName) {
  const collection = await stateElectionFetchLocalResultGeojson(stateName);
  return (collection?.features || [])
    .map((feature) => feature.resultRow)
    .sort((a, b) => Number(b.total_votes || 0) - Number(a.total_votes || 0));
}

async function stateElectionFetchPresidentialRegionRows(stateName) {
  if (stateName === "Connecticut") return stateElectionFetchConnecticutTownResults();
  if (stateElectionUsesLocalResults(stateName)) return stateElectionFetchLocalResultRows(stateName);
  return stateElectionFetchCountyResults(stateName);
}

async function stateElectionLoadTopo() {
  if (stateElectionTopoCache) return stateElectionTopoCache;

  const [countiesTopo, statesTopo] = await Promise.all([
    d3.json(STATE_ELECTION_COUNTIES_TOPOJSON_URL),
    d3.json(STATE_ELECTION_STATES_TOPOJSON_URL)
  ]);

  stateElectionTopoCache = { countiesTopo, statesTopo };
  return stateElectionTopoCache;
}

function stateElectionRenderPresidentialSummary(stateName) {
  const result = window.ELECTION_DATA?.[stateName];
  if (!result) return;

  const title = document.getElementById("state-election-presidential-title");
  const ev = document.getElementById("state-election-presidential-ev");
  const margin = document.getElementById("state-election-presidential-margin");
  const total = document.getElementById("state-election-presidential-total");
  const body = document.getElementById("state-election-presidential-candidates");
  const card = document.getElementById("state-election-presidential-card");
  const detailLink = document.getElementById("state-election-presidential-detail-link");

  const winnerName = stateElectionWinnerName(result);
  const totalVotes = stateElectionNumberFromVoteString(result.dV) + stateElectionNumberFromVoteString(result.rV);
  const stateMargin = stateElectionFormatStateMargin(result);
  const winnerTone = winnerName === "Kamala Harris" ? "dem" : "rep";

  if (title) title.textContent = `${winnerName} wins ${stateName}.`;
  if (ev) ev.textContent = result.ev;
  if (margin) margin.textContent = stateMargin;
  if (total) total.textContent = stateElectionFormatVotes(totalVotes);
  if (detailLink) detailLink.href = `./state-result.html?name=${encodeURIComponent(stateName)}`;
  if (card) {
    card.classList.remove("winner-dem", "winner-rep");
    card.classList.add(`winner-${winnerTone}`);
  }
  if (!body) return;

  const rows = [
    { name: "Donald Trump", party: "Rep.", votes: result.rV, pct: `${result.rP}%`, winner: winnerName === "Donald Trump", tone: "rep" },
    { name: "Kamala Harris", party: "Dem.", votes: result.dV, pct: `${result.dP}%`, winner: winnerName === "Kamala Harris", tone: "dem" }
  ].sort((a, b) => stateElectionNumberFromVoteString(b.votes) - stateElectionNumberFromVoteString(a.votes));

  body.innerHTML = rows.map((row) => `
    <tr class="${row.winner ? "winner-row" : ""}">
      <td>
        <div class="detail-candidate-cell">
          <img class="detail-candidate-photo" src="${STATE_ELECTION_CANDIDATE_PORTRAITS[row.name]}" alt="${row.name}" />
          <span class="candidate-name-inline ${row.tone}">${row.name}</span>
        </div>
      </td>
      <td>${row.party}</td>
      <td>${row.votes}</td>
      <td>${row.pct}</td>
    </tr>
  `).join("");
}

function stateElectionRenderSenateSummary(stateName, race) {
  const section = document.getElementById("state-election-senate");
  if (!section || !race) return false;

  const title = document.getElementById("state-election-senate-title");
  const seat = document.getElementById("state-election-senate-seat");
  const margin = document.getElementById("state-election-senate-margin");
  const total = document.getElementById("state-election-senate-total");
  const body = document.getElementById("state-election-senate-candidates");
  const card = document.getElementById("state-election-senate-card");
  const detailLink = document.getElementById("state-election-senate-detail-link");
  const candidates = stateElectionSenateCandidateRows(race);
  const totalVotes = race.reportedTotal || candidates.reduce((sum, candidate) => sum + Number(candidate.voteNumber || 0), 0);
  const winnerTone = stateElectionSenatePartyTone(race.winnerParty);

  section.hidden = false;
  if (title) {
    title.textContent = `${race.winner} wins ${stateName}'s${race.seatType === "Special" ? " special" : ""} Senate race.`;
  }
  if (seat) seat.textContent = race.seatType || "Regular";
  if (margin) margin.textContent = race.result || "-";
  if (total) total.textContent = stateElectionFormatVotes(totalVotes);
  if (detailLink) detailLink.href = stateElectionSenateDetailLink(stateName, race);
  if (card) {
    card.classList.remove("winner-dem", "winner-rep", "winner-ind", "winner-none");
    card.classList.add(`winner-${winnerTone}`);
  }
  if (body) {
    body.innerHTML = candidates.map((candidate, index) => `
      <tr class="${index === 0 ? "winner-row" : ""}">
        <td>
          <div class="detail-candidate-cell">
            <img class="detail-candidate-photo" src="${candidate.imageUrl || "https://placehold.co/120x120/2f3540/2f3540"}" alt="${candidate.name}" />
            <span class="candidate-name-inline ${candidate.tone}">${candidate.name}</span>
          </div>
        </td>
        <td>${candidate.party}</td>
        <td>${candidate.votes}</td>
        <td>${candidate.pct}</td>
      </tr>
    `).join("");
  }

  return true;
}

function stateElectionRenderShareCountyMap({ svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName }) {
  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "detail-county-shape")
    .attr("d", path)
    .attr("fill", (feature) => {
      const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
      return row ? stateElectionCountyShade(row) : "#2d3138";
    })
    .on("mouseover", (event, feature) => {
      const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
      if (!row) return;
      tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(row, stateName));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "detail-state-outline")
    .attr("d", path);

  stateElectionRenderCityLabels(svg, projection, stateName);
}

function stateElectionRenderLeadCountyMap({ svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName }) {
  const maxLead = d3.max(features, (feature) => {
    const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
    return row ? stateElectionCountyLead(row) : 0;
  }) || 1;
  const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5, 40]);

  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "state-election-lead-county-shape")
    .attr("d", path);

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "state-election-lead-state-outline")
    .attr("d", path);

  const bubbleData = features
    .map((feature) => {
      const row = feature.resultRow || rowByFips.get(String(feature.id).padStart(5, "0"));
      const centroid = path.centroid(feature);
      return row ? { feature, row, centroid } : null;
    })
    .filter(Boolean)
    .sort((a, b) => stateElectionCountyLead(b.row) - stateElectionCountyLead(a.row));

  svg.append("g")
    .selectAll("circle")
    .data(bubbleData)
    .enter()
    .append("circle")
    .attr("class", (item) => `state-election-lead-bubble ${stateElectionGetCountyWinner(item.row) === "Harris" ? "dem" : "rep"}`)
    .attr("cx", (item) => item.centroid[0])
    .attr("cy", (item) => item.centroid[1])
    .attr("r", (item) => radius(stateElectionCountyLead(item.row)))
    .on("mouseover", (event, item) => {
      tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(item.row, stateName));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  stateElectionRenderCityLabels(svg, projection, stateName);
}

function stateElectionRenderCityLabels(svg, projection, stateName) {
  const cityLabels = STATE_ELECTION_MAJOR_CITY_LABELS[stateName] || [];
  const placedLabels = stateElectionPlaceCityLabels(cityLabels, projection);
  const cityLayer = svg.append("g").attr("class", "state-election-city-labels");

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
    .text((city) => city.name);

  stateElectionResolveRenderedCityLabels(texts);
}

function stateElectionPlaceCityLabels(cityLabels, projection) {
  const svgWidth = 540;
  const svgHeight = 520;
  const edgePadding = 8;
  const labelHeight = 22;
  const placedBoxes = [];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const overlaps = (box) => placedBoxes.some((placed) => (
    box.x < placed.x + placed.width + 4 &&
    box.x + box.width + 4 > placed.x &&
    box.y < placed.y + placed.height + 4 &&
    box.y + box.height + 4 > placed.y
  ));

  return cityLabels
    .map((city) => {
      const point = projection(city.coordinates);
      return point ? { ...city, point } : null;
    })
    .filter(Boolean)
    .map((city) => {
      const [x, y] = city.point;
      const labelWidth = Math.max(36, city.name.length * 10.2);
      const candidates = [
        { x: x + 7, y: y + 6, anchor: "start" },
        { x: x - 7, y: y + 6, anchor: "end" },
        { x: x + 7, y: y - 9, anchor: "start" },
        { x: x - 7, y: y - 9, anchor: "end" },
        { x, y: y - 13, anchor: "middle" },
        { x, y: y + 18, anchor: "middle" },
        { x: x + 7, y: y + 24, anchor: "start" },
        { x: x - 7, y: y + 24, anchor: "end" }
      ];

      const prepared = candidates.map((candidate) => {
        const boxX = candidate.anchor === "end"
          ? candidate.x - labelWidth
          : candidate.anchor === "middle"
            ? candidate.x - labelWidth / 2
            : candidate.x;
        const box = {
          x: clamp(boxX, edgePadding, svgWidth - labelWidth - edgePadding),
          y: clamp(candidate.y - labelHeight + 5, edgePadding, svgHeight - labelHeight - edgePadding),
          width: labelWidth,
          height: labelHeight
        };
        return {
          ...candidate,
          labelX: candidate.anchor === "end"
            ? box.x + labelWidth
            : candidate.anchor === "middle"
              ? box.x + labelWidth / 2
              : box.x,
          labelY: box.y + labelHeight - 5,
          box
        };
      });

      const chosen = prepared.find((candidate) => !overlaps(candidate.box)) || prepared[0];
      placedBoxes.push(chosen.box);

      return {
        ...city,
        labelX: chosen.labelX,
        labelY: chosen.labelY,
        anchor: chosen.anchor
      };
    });
}

function stateElectionResolveRenderedCityLabels(texts) {
  const svgWidth = 540;
  const svgHeight = 520;
  const edgePadding = 8;
  const collisionGap = 7;
  const placedBoxes = [];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const collides = (box) => placedBoxes.some((placed) => (
    box.x < placed.x + placed.width + collisionGap &&
    box.x + box.width + collisionGap > placed.x &&
    box.y < placed.y + placed.height + collisionGap &&
    box.y + box.height + collisionGap > placed.y
  ));

  texts.each(function(city) {
    const text = d3.select(this);
    const bounds = this.getBBox();
    const width = bounds.width;
    const height = bounds.height;
    const [x, y] = city.point;
    const candidates = [
      { x: x + 7, y: y + 6, anchor: "start" },
      { x: x - 7, y: y + 6, anchor: "end" },
      { x: x + 7, y: y - 15, anchor: "start" },
      { x: x - 7, y: y - 15, anchor: "end" },
      { x, y: y - 18, anchor: "middle" },
      { x, y: y + 25, anchor: "middle" },
      { x: x + 22, y: y + 22, anchor: "start" },
      { x: x - 22, y: y + 22, anchor: "end" },
      { x: x + 22, y: y - 24, anchor: "start" },
      { x: x - 22, y: y - 24, anchor: "end" },
      { x, y: y + 43, anchor: "middle" },
      { x, y: y - 37, anchor: "middle" }
    ];

    const prepared = candidates.map((candidate) => {
      const unclampedX = candidate.anchor === "end"
        ? candidate.x - width
        : candidate.anchor === "middle"
          ? candidate.x - width / 2
          : candidate.x;
      const box = {
        x: clamp(unclampedX, edgePadding, svgWidth - width - edgePadding),
        y: clamp(candidate.y - height + 4, edgePadding, svgHeight - height - edgePadding),
        width,
        height
      };
      return {
        anchor: candidate.anchor,
        labelX: candidate.anchor === "end"
          ? box.x + width
          : candidate.anchor === "middle"
            ? box.x + width / 2
            : box.x,
        labelY: box.y + height - 4,
        box
      };
    });

    const chosen = prepared.find((candidate) => !collides(candidate.box)) || prepared[0];
    placedBoxes.push(chosen.box);

    text
      .attr("x", chosen.labelX)
      .attr("y", chosen.labelY)
      .attr("text-anchor", chosen.anchor);
  });
}

function stateElectionWardKeyFromRow(row) {
  const nameMatch = String(row.county_name || "").match(/Ward\s+([1-8])/i);
  if (nameMatch) return nameMatch[1];

  const fipsMatch = String(row.county_fips || "").match(/([1-8])$/);
  return fipsMatch ? fipsMatch[1] : "";
}

function stateElectionWardKeyFromFeature(feature) {
  const properties = feature.properties || {};
  const ward = properties.WARD_ID || properties.WARD || properties.NAME || feature.id || "";
  const match = String(ward).match(/([1-8])$/);
  return match ? match[1] : "";
}

function stateElectionRenderWardLabels(svg, features, path) {
  svg.append("g")
    .attr("class", "state-election-ward-labels")
    .selectAll("text")
    .data(features)
    .enter()
    .append("text")
    .attr("x", (feature) => path.centroid(feature)[0])
    .attr("y", (feature) => path.centroid(feature)[1] + 4)
    .text((feature) => `Ward ${stateElectionWardKeyFromFeature(feature)}`);
}

function stateElectionRenderDcWardGrid(svg, rows, mode, tooltip, stateName, empty) {
  const wardRows = rows.slice().sort((a, b) => Number(stateElectionWardKeyFromRow(a)) - Number(stateElectionWardKeyFromRow(b)));
  if (!wardRows.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const tileGroup = svg.append("g").attr("transform", "translate(36, 40)");
  const columns = 2;
  const tileWidth = 208;
  const tileHeight = 92;
  const gapX = 28;
  const gapY = 18;
  const maxLead = d3.max(wardRows, stateElectionCountyLead) || 1;
  const radius = d3.scaleSqrt().domain([0, maxLead]).range([10, 34]);

  if (mode === "lead") {
    tileGroup.selectAll("rect")
      .data(wardRows)
      .enter()
      .append("rect")
      .attr("class", "state-election-lead-county-shape")
      .attr("x", (_, index) => (index % columns) * (tileWidth + gapX))
      .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY))
      .attr("rx", 18)
      .attr("ry", 18)
      .attr("width", tileWidth)
      .attr("height", tileHeight);

    tileGroup.selectAll("circle")
      .data(wardRows)
      .enter()
      .append("circle")
      .attr("class", (row) => `state-election-lead-bubble ${stateElectionGetCountyWinner(row) === "Harris" ? "dem" : "rep"}`)
      .attr("cx", (_, index) => (index % columns) * (tileWidth + gapX) + tileWidth / 2)
      .attr("cy", (_, index) => Math.floor(index / columns) * (tileHeight + gapY) + tileHeight / 2)
      .attr("r", (row) => radius(stateElectionCountyLead(row)))
      .on("mouseover", (event, row) => {
        tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(row, stateName));
        d3.select(event.currentTarget).classed("is-active", true);
        stateElectionPositionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        tooltip.style("opacity", 0);
      });
  } else {
    tileGroup.selectAll("rect")
      .data(wardRows)
      .enter()
      .append("rect")
      .attr("class", "detail-county-shape")
      .attr("x", (_, index) => (index % columns) * (tileWidth + gapX))
      .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY))
      .attr("rx", 18)
      .attr("ry", 18)
      .attr("width", tileWidth)
      .attr("height", tileHeight)
      .attr("fill", stateElectionCountyShade)
      .on("mouseover", (event, row) => {
        tooltip.style("opacity", 1).html(stateElectionCountyTooltipHTML(row, stateName));
        d3.select(event.currentTarget).classed("is-active", true);
        stateElectionPositionTooltip(event, tooltip);
      })
      .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
      .on("mouseout", (event) => {
        d3.select(event.currentTarget).classed("is-active", false);
        tooltip.style("opacity", 0);
      });
  }

  tileGroup.selectAll("text")
    .data(wardRows)
    .enter()
    .append("text")
    .attr("class", "detail-ward-label")
    .attr("x", (_, index) => (index % columns) * (tileWidth + gapX) + 18)
    .attr("y", (_, index) => Math.floor(index / columns) * (tileHeight + gapY) + 34)
    .text((row) => stateElectionFormatCountyName(row.county_name, row).replace(" District of Columbia", ""));
}

function stateElectionRenderDcWardMap(svg, rows, mode, tooltip, stateName, empty) {
  const wardsGeojson = window.DC_WARDS_GEOJSON;
  if (!wardsGeojson?.features?.length) {
    stateElectionRenderDcWardGrid(svg, rows, mode, tooltip, stateName, empty);
    return;
  }

  const rowByWard = new Map(rows.map((row) => [stateElectionWardKeyFromRow(row), row]));
  const features = wardsGeojson.features
    .map((feature) => ({
      ...feature,
      resultRow: rowByWard.get(stateElectionWardKeyFromFeature(feature))
    }))
    .filter((feature) => feature.resultRow);

  if (!features.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const collection = { type: "FeatureCollection", features };
  const projection = d3.geoIdentity().reflectY(true).fitSize([540, 520], collection);
  const path = d3.geoPath(projection);
  const context = { svg, features, stateFeature: collection, rowByFips: rowByWard, path, projection, tooltip, stateName };

  if (mode === "lead") {
    stateElectionRenderLeadCountyMap(context);
  } else {
    stateElectionRenderShareCountyMap(context);
  }

  stateElectionRenderWardLabels(svg, features, path);
}

async function stateElectionRenderCountyMap(stateName, rows, mode = "share") {
  const svg = d3.select("#state-election-presidential-county-map");
  const empty = document.getElementById("state-election-county-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();

  if (stateName === "District of Columbia") {
    stateElectionRenderDcWardMap(svg, rows, mode, tooltip, stateName, empty);
    return;
  }

  let features;
  let stateFeature;
  let rowByFips = new Map(rows.map((row) => [row.county_fips, row]));

  if (stateName === "Connecticut") {
    const townRows = rows;
    const townsGeojson = await d3.json(STATE_ELECTION_CT_TOWNS_GEOJSON_URL);
    const rowByTown = new Map(townRows.map((row) => [stateElectionNormalizeTownName(row.county_name), row]));
    features = (townsGeojson.features || [])
      .map((feature) => ({
        ...feature,
        resultRow: rowByTown.get(stateElectionNormalizeTownName(feature.properties?.TOWN_NAME))
      }))
      .filter((feature) => feature.resultRow);
    stateFeature = { type: "FeatureCollection", features };
  } else if (stateElectionUsesLocalResults(stateName)) {
    const localGeojson = await stateElectionFetchLocalResultGeojson(stateName);
    features = localGeojson?.features || [];
    stateFeature = localGeojson;
  } else {
    if (!window.topojson) return;

    const { countiesTopo, statesTopo } = await stateElectionLoadTopo();
    features = topojson
      .feature(countiesTopo, countiesTopo.objects.counties)
      .features
      .map((feature) => ({
        ...feature,
        resultRow: rowByFips.get(String(feature.id).padStart(5, "0"))
      }))
      .filter((feature) => feature.resultRow);

    const stateFips = STATE_ELECTION_FIPS_BY_NAME[stateName];
    stateFeature = topojson
      .feature(statesTopo, statesTopo.objects.states)
      .features
      .find((feature) => String(feature.id).padStart(2, "0") === stateFips);
  }

  if (!features.length || !stateFeature) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const collection = { type: "FeatureCollection", features };
  const projection = stateName === "Connecticut"
    ? d3.geoIdentity().reflectY(true).fitSize([540, 520], collection)
    : d3.geoMercator().fitSize([540, 520], collection);
  const path = d3.geoPath(projection);

  const context = { svg, features, stateFeature, rowByFips, path, projection, tooltip, stateName };
  if (mode === "lead") {
    stateElectionRenderLeadCountyMap(context);
  } else {
    stateElectionRenderShareCountyMap(context);
  }
}

function stateElectionSetupPresidentialMapMode(stateName, rows) {
  const control = document.getElementById("state-election-presidential-map-mode");
  const legend = document.querySelector("#state-election-presidential .detail-map-legend");
  const leadLegend = document.getElementById("state-election-lead-legend");
  if (!control) return;

  const isEnabled = rows.length > 0;
  control.hidden = !isEnabled;
  if (leadLegend) leadLegend.hidden = true;
  if (legend) legend.hidden = false;
  if (!isEnabled) return;

  control.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mapMode === "share");
    button.addEventListener("click", async () => {
      const mode = button.dataset.mapMode || "share";
      control.querySelectorAll("[data-map-mode]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      if (legend) legend.hidden = mode === "lead";
      if (leadLegend) leadLegend.hidden = mode !== "lead";
      await stateElectionRenderCountyMap(stateName, rows, mode);
    });
  });
}

async function stateElectionFetchSenateRegionRows(stateName) {
  const bundle = window.SENATE_COUNTY_RESULTS?.[stateName];
  const rawRows = bundle?.municipalities || bundle?.counties || [];
  if (!rawRows.length) return [];

  let referenceByName = new Map();
  try {
    const countyRows = await stateElectionFetchCountyResults(stateName);
    referenceByName = new Map(countyRows.map((row) => [stateElectionNormalizeRegionName(row.county_name), row]));
  } catch (error) {
    referenceByName = new Map();
  }

  return rawRows
    .map((row) => stateElectionNormalizeSenateUnitRow(row, referenceByName))
    .sort((a, b) => Number(b.totalVotes || 0) - Number(a.totalVotes || 0));
}

function stateElectionSenateMapContextFromFeatures(svg, features, stateFeature, projection, tooltip, stateName, race) {
  const path = d3.geoPath(projection);
  return { svg, features, stateFeature, path, projection, tooltip, stateName, race };
}

function stateElectionRenderSenateShareMap({ svg, features, stateFeature, path, projection, tooltip, stateName, race }) {
  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "detail-county-shape")
    .attr("d", path)
    .attr("fill", (feature) => stateElectionSenateUnitShade(feature.resultRow))
    .on("mouseover", (event, feature) => {
      const row = feature.resultRow;
      if (!row) return;
      tooltip.style("opacity", 1).html(stateElectionSenateTooltipHTML(row, stateName, race));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "detail-state-outline")
    .attr("d", path);

  stateElectionRenderCityLabels(svg, projection, stateName);
}

function stateElectionRenderSenateLeadMap({ svg, features, stateFeature, path, projection, tooltip, stateName, race }) {
  const maxLead = d3.max(features, (feature) => stateElectionSenateUnitLead(feature.resultRow)) || 1;
  const radius = d3.scaleSqrt().domain([0, maxLead]).range([2.5, 40]);

  svg.append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("class", "state-election-lead-county-shape")
    .attr("d", path);

  svg.append("path")
    .datum(stateFeature)
    .attr("class", "state-election-lead-state-outline")
    .attr("d", path);

  svg.append("g")
    .selectAll("circle")
    .data(features
      .map((feature) => ({ feature, row: feature.resultRow, centroid: path.centroid(feature) }))
      .filter((item) => item.row)
      .sort((a, b) => stateElectionSenateUnitLead(b.row) - stateElectionSenateUnitLead(a.row)))
    .enter()
    .append("circle")
    .attr("class", (item) => `state-election-lead-bubble ${stateElectionSenatePartyTone(item.row.winnerParty)}`)
    .attr("cx", (item) => item.centroid[0])
    .attr("cy", (item) => item.centroid[1])
    .attr("r", (item) => radius(stateElectionSenateUnitLead(item.row)))
    .on("mouseover", (event, item) => {
      tooltip.style("opacity", 1).html(stateElectionSenateTooltipHTML(item.row, stateName, race));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  stateElectionRenderCityLabels(svg, projection, stateName);
}

async function stateElectionBuildSenateMapFeatures(stateName, rows) {
  let mapRows = rows;

  if (stateName === "Connecticut") {
    const rowByName = new Map(mapRows.map((row) => [stateElectionNormalizeRegionName(row.county_name), row]));
    const townsGeojson = await d3.json(STATE_ELECTION_CT_TOWNS_GEOJSON_URL);
    const features = (townsGeojson.features || [])
      .map((feature) => ({
        ...feature,
        resultRow: rowByName.get(stateElectionNormalizeRegionName(feature.properties?.TOWN_NAME))
      }))
      .filter((feature) => feature.resultRow);
    if (features.length) {
      const stateFeature = { type: "FeatureCollection", features };
      const projection = d3.geoIdentity().reflectY(true).fitSize([540, 520], stateFeature);
      return { features, stateFeature, projection };
    }
  }

  if (stateElectionUsesLocalResults(stateName)) {
    mapRows = stateElectionAggregateSenateLocalMapRows(stateName, rows);
    const rowByName = new Map(mapRows.map((row) => [stateElectionNormalizeRegionName(row.county_name), row]));
    const rowById = new Map(mapRows.map((row) => [row.county_fips, row]));
    const localGeojson = await d3.json(STATE_ELECTION_LOCAL_GEOJSON_URLS[stateName]);
    const features = (localGeojson?.features || [])
      .map((feature) => {
        const properties = feature.properties || {};
        return {
          ...feature,
          resultRow: rowById.get(properties.county_fips) ||
            rowByName.get(stateElectionNormalizeRegionName(properties.county_name || properties.NAME || properties.BASENAME || ""))
        };
      })
      .filter((feature) => feature.resultRow);
    if (features.length) {
      const stateFeature = { type: "FeatureCollection", features };
      const projection = d3.geoMercator().fitSize([540, 520], stateFeature);
      return { features, stateFeature, projection };
    }
  }

  if (!window.topojson) return null;

  const { countiesTopo, statesTopo } = await stateElectionLoadTopo();
  const rowByFips = new Map(mapRows.map((row) => [row.county_fips, row]));
  const features = topojson
    .feature(countiesTopo, countiesTopo.objects.counties)
    .features
    .map((feature) => ({
      ...feature,
      resultRow: rowByFips.get(String(feature.id).padStart(5, "0"))
    }))
    .filter((feature) => feature.resultRow);
  const stateFips = STATE_ELECTION_FIPS_BY_NAME[stateName];
  const stateFeature = topojson
    .feature(statesTopo, statesTopo.objects.states)
    .features
    .find((feature) => String(feature.id).padStart(2, "0") === stateFips);
  if (!features.length || !stateFeature) return null;
  const projection = d3.geoMercator().fitSize([540, 520], { type: "FeatureCollection", features });
  return { features, stateFeature, projection };
}

async function stateElectionRenderSenateMap(stateName, race, rows, mode = "share") {
  const svg = d3.select("#state-election-senate-county-map");
  const empty = document.getElementById("state-election-senate-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();
  if (!rows.length) {
    if (empty) empty.hidden = false;
    return;
  }

  const built = await stateElectionBuildSenateMapFeatures(stateName, rows);
  if (!built) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  const context = stateElectionSenateMapContextFromFeatures(svg, built.features, built.stateFeature, built.projection, tooltip, stateName, race);
  if (mode === "lead") {
    stateElectionRenderSenateLeadMap(context);
  } else {
    stateElectionRenderSenateShareMap(context);
  }
}

function stateElectionSetupSenateMapMode(stateName, race, rows) {
  const control = document.getElementById("state-election-senate-map-mode");
  const legend = document.getElementById("state-election-senate-map-legend");
  const leadLegend = document.getElementById("state-election-senate-lead-legend");
  const leadIndLegend = document.getElementById("state-election-senate-lead-legend-ind");
  const mapTitle = document.getElementById("state-election-senate-map-title");
  const unit = stateElectionSenateUnitLabelForRows(stateName, rows);
  const winningParties = new Set(rows.map((row) => stateElectionSenateWinnerParty(row)));
  const isEnabled = rows.length > 0;

  if (mapTitle) mapTitle.textContent = `${unit.singular} Map`;
  if (legend) {
    legend.setAttribute("aria-label", `Senate ${unit.singular.toLowerCase()} map legend`);
    legend.querySelectorAll("[data-party]").forEach((row) => {
      row.hidden = !winningParties.has(row.dataset.party);
    });
  }
  if (leadIndLegend) {
    leadIndLegend.hidden = !winningParties.has("I");
  }

  if (!control) return;
  stateElectionSenateMapMode = "share";
  control.hidden = !isEnabled;
  if (legend) legend.hidden = false;
  if (leadLegend) leadLegend.hidden = true;
  if (!isEnabled) return;

  control.querySelectorAll("[data-map-mode]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mapMode === "share");
    button.onclick = async () => {
      const mode = button.dataset.mapMode || "share";
      stateElectionSenateMapMode = mode;
      control.querySelectorAll("[data-map-mode]").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      if (legend) legend.hidden = mode === "lead";
      if (leadLegend) leadLegend.hidden = mode !== "lead";
      if (leadIndLegend) leadIndLegend.hidden = mode !== "lead" || !winningParties.has("I");
      await stateElectionRenderSenateMap(stateName, race, rows, mode);
    };
  });
}

function stateElectionGetHouseDistricts(stateName) {
  return Object.values(window.HOUSE_2024_DATA?.districts || {})
    .filter((district) => district.stateName === stateName)
    .map((district) => ({
      ...district,
      ...(STATE_ELECTION_HOUSE_OVERRIDES[district.code] || {})
    }))
    .sort((a, b) => Number(a.district) - Number(b.district));
}

function stateElectionRenderHouseList(districts) {
  const list = document.getElementById("state-election-house-list");
  const showAllButton = document.getElementById("state-election-house-show-all");
  if (!list) return;

  stateElectionHouseListState.districts = districts;

  if (!districts.length) {
    list.innerHTML = `<p class="state-election-empty-note">No voting House district result is available for this jurisdiction.</p>`;
    if (showAllButton) showAllButton.hidden = true;
    return;
  }

  const visibleDistricts = stateElectionHouseListState.limit === "all"
    ? districts
    : districts.slice(0, STATE_ELECTION_HOUSE_PREVIEW_LIMIT);

  list.innerHTML = `
    <div class="state-election-house-table-wrap">
      <table class="state-election-house-table">
        <thead>
          <tr>
            <th>District</th>
            <th>Margin</th>
            <th colspan="2">Candidates</th>
            <th>% In</th>
            <th aria-label="District details"></th>
          </tr>
        </thead>
        <tbody>
          ${visibleDistricts.map((district) => {
            const candidates = [...(district.candidates || [])]
              .sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0));
            const winner = candidates.find((candidate) => candidate.winner) || candidates[0] || {
              name: district.winnerName,
              party: district.winnerParty
            };
            const runnerUp = candidates.find((candidate) => candidate !== winner) || null;
            const winnerClass = stateElectionPartyClass(district.winnerParty);
            const isUncontested = district.uncontested || candidates.length <= 1 || district.marginLabel === "Uncontested";
            const marginLabel = isUncontested ? "Uncont." : district.marginLabel;
            const winnerCellClass = [
              "state-election-house-candidate",
              "state-election-house-candidate--winner",
              `state-election-house-candidate--${winnerClass}`,
              district.flipped ? "state-election-house-candidate--flip" : ""
            ].filter(Boolean).join(" ");
            const percentIn = "100%";

            return `
              <tr class="state-election-house-row" data-district-link="${stateElectionDistrictLink(district.code)}" tabindex="0">
                <td class="state-election-house-district-cell">${Number(district.district)}</td>
                <td class="state-election-house-margin state-election-house-margin--${winnerClass}${isUncontested ? " state-election-house-margin--uncontested" : ""}">${marginLabel}</td>
                <td class="${winnerCellClass}">
                  <span class="state-election-house-candidate-name">
                    ${stateElectionHouseCandidateSurname(winner.name || district.winnerName)}
                    ${winner.incumbent ? `<span class="state-election-district-incumbent">Incumbent</span>` : ""}
                  </span>
                  <span class="state-election-house-party">${stateElectionHousePartyLabel(winner)}</span>
                </td>
                <td class="state-election-house-candidate state-election-house-candidate--runner state-election-house-candidate--${stateElectionHouseCandidateClass(runnerUp)}">
                  ${runnerUp ? `
                    <span class="state-election-house-candidate-name">
                      ${stateElectionHouseCandidateSurname(runnerUp.name)}
                      ${runnerUp.incumbent ? `<span class="state-election-district-incumbent">Incumbent</span>` : ""}
                    </span>
                    <span class="state-election-house-party">${stateElectionHousePartyLabel(runnerUp)}</span>
                  ` : `<span class="state-election-house-party">Unopposed</span>`}
                </td>
                <td class="state-election-house-percent">${percentIn}</td>
                <td class="state-election-house-arrow" aria-hidden="true">›</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  list.querySelectorAll(".state-election-house-row").forEach((row) => {
    row.addEventListener("click", () => {
      window.location.href = row.dataset.districtLink;
    });
    row.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.location.href = row.dataset.districtLink;
    });
  });

  if (!showAllButton) return;

  const hasOverflow = districts.length > STATE_ELECTION_HOUSE_PREVIEW_LIMIT;
  showAllButton.hidden = !hasOverflow;
  if (!hasOverflow) return;

  const showingAll = stateElectionHouseListState.limit === "all";
  showAllButton.textContent = showingAll ? "Show fewer" : `Show all ${districts.length} districts`;
  showAllButton.setAttribute("aria-expanded", String(showingAll));
  showAllButton.onclick = () => {
    stateElectionHouseListState.limit = showingAll ? STATE_ELECTION_HOUSE_PREVIEW_LIMIT : "all";
    stateElectionRenderHouseList(stateElectionHouseListState.districts);
  };
}

function stateElectionRenderHouseDistrictMap(stateName, districts) {
  const svg = d3.select("#state-election-house-district-map");
  const empty = document.getElementById("state-election-house-empty");
  const tooltip = d3.select("#state-election-map-tooltip");
  if (svg.empty()) return;

  svg.selectAll("*").remove();
  stateElectionBuildHousePatterns(svg);

  if (stateName === "Alaska") {
    if (empty) empty.hidden = true;
    return;
  }

  const districtByCode = new Map(districts.map((district) => [district.code, district]));
  const features = (window.HOUSE_2024_GEOJSON?.features || [])
    .filter((feature) => feature.properties?.stateName === stateName && districtByCode.has(feature.properties.code));

  if (!features.length) {
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;

  const projection = d3.geoMercator().fitSize([540, 520], { type: "FeatureCollection", features });
  const path = d3.geoPath(projection);

  svg.append("g")
    .selectAll("a")
    .data(features)
    .enter()
    .append("a")
    .attr("href", (feature) => stateElectionDistrictLink(feature.properties.code))
    .append("path")
    .attr("class", "state-election-district-shape")
    .attr("d", path)
    .attr("fill", (feature) => stateElectionHouseDistrictFill(districtByCode.get(feature.properties.code)))
    .attr("stroke", "rgba(255,255,255,0.9)")
    .attr("stroke-width", 1.4)
    .on("mouseover", (event, feature) => {
      const district = districtByCode.get(feature.properties.code);
      if (!district) return;
      tooltip.style("opacity", 1).html(stateElectionHouseTooltipHTML(district));
      d3.select(event.currentTarget).classed("is-active", true);
      stateElectionPositionTooltip(event, tooltip);
    })
    .on("mousemove", (event) => stateElectionPositionTooltip(event, tooltip))
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("is-active", false);
      tooltip.style("opacity", 0);
    });

  stateElectionRenderCityLabels(svg, projection, stateName);
}

async function stateElectionInit() {
  const params = new URLSearchParams(window.location.search);
  const stateName = params.get("name") || "Alabama";
  const regionLabel = stateElectionRegionLabel(stateName);
  const regionLabelPlural = stateElectionRegionLabelPlural(stateName);

  document.title = `${stateName} Election Results | Polycivic`;
  document.getElementById("state-election-title").textContent = `${stateName} Election Results`;
  const mapTitle = document.getElementById("state-election-presidential-map-title");
  const presidentialMapCard = document.getElementById("state-election-presidential-map-card");
  const houseMapCard = document.getElementById("state-election-house-map-card");
  const hideMaps = stateName === "Alaska";
  if (mapTitle) mapTitle.textContent = `${regionLabel} Map`;
  if (presidentialMapCard) {
    presidentialMapCard.hidden = hideMaps;
    presidentialMapCard.style.display = hideMaps ? "none" : "";
  }
  if (houseMapCard) {
    houseMapCard.hidden = hideMaps;
    houseMapCard.style.display = hideMaps ? "none" : "";
  }

  stateElectionRenderPresidentialSummary(stateName);

  if (!hideMaps) {
    try {
      const regionRows = await stateElectionFetchPresidentialRegionRows(stateName);
      await stateElectionRenderCountyMap(stateName, regionRows);
      stateElectionSetupPresidentialMapMode(stateName, regionRows);
    } catch (error) {
      const empty = document.getElementById("state-election-county-empty");
      if (empty) empty.hidden = false;
      console.error(error);
    }
  }

  const senateRace = stateElectionGetPrimarySenateRace(stateName);
  const senateSection = document.getElementById("state-election-senate");
  const senateJump = document.getElementById("state-election-senate-jump");
  const senateMapCard = document.getElementById("state-election-senate-map-card");
  if (senateJump) senateJump.hidden = !senateRace;
  if (senateRace) {
    stateElectionRenderSenateSummary(stateName, senateRace);
    if (senateMapCard) {
      senateMapCard.hidden = hideMaps;
      senateMapCard.style.display = hideMaps ? "none" : "";
    }
    if (!hideMaps) {
      try {
        const senateRows = await stateElectionFetchSenateRegionRows(stateName);
        await stateElectionRenderSenateMap(stateName, senateRace, senateRows);
        stateElectionSetupSenateMapMode(stateName, senateRace, senateRows);
      } catch (error) {
        const empty = document.getElementById("state-election-senate-empty");
        if (empty) empty.hidden = false;
        console.error(error);
      }
    }
  } else if (senateSection) {
    senateSection.hidden = true;
  }

  const houseDistricts = stateElectionGetHouseDistricts(stateName);
  stateElectionHouseListState.limit = STATE_ELECTION_HOUSE_PREVIEW_LIMIT;
  stateElectionRenderHouseList(houseDistricts);
  stateElectionRenderHouseDistrictMap(stateName, houseDistricts);
}

stateElectionInit();

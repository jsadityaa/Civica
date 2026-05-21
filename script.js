const electionData = {
  "Alabama": { winner: "Trump", ev: 9, rV: "1,462,616", rP: "64.57", dV: "772,412", dP: "34.10" },
  "Alaska": { winner: "Trump", ev: 3, rV: "184,458", rP: "54.54", dV: "140,026", dP: "41.41" },
  "Arizona": { winner: "TrumpFlip", ev: 11, rV: "1,770,242", rP: "52.22", dV: "1,582,860", dP: "46.69" },
  "Arkansas": { winner: "Trump", ev: 6, rV: "759,241", rP: "64.20", dV: "396,905", dP: "33.56" },
  "California": { winner: "Harris", ev: 54, rV: "6,081,697", rP: "38.33", dV: "9,276,179", dP: "58.47" },
  "Colorado": { winner: "Harris", ev: 10, rV: "1,377,441", rP: "43.14", dV: "1,728,159", dP: "54.13" },
  "Connecticut": { winner: "Harris", ev: 7, rV: "736,918", rP: "41.89", dV: "992,053", dP: "56.40" },
  "Delaware": { winner: "Harris", ev: 3, rV: "214,351", rP: "41.79", dV: "289,758", dP: "56.49" },
  "District of Columbia": { winner: "Harris", ev: 3, rV: "21,076", rP: "6.47", dV: "294,185", dP: "90.28" },
  "Florida": { winner: "Trump", ev: 30, rV: "6,110,125", rP: "56.09", dV: "4,683,038", dP: "42.99" },
  "Georgia": { winner: "TrumpFlip", ev: 16, rV: "2,663,117", rP: "50.72", dV: "2,548,017", dP: "48.53" },
  "Hawaii": { winner: "Harris", ev: 4, rV: "193,661", rP: "37.48", dV: "313,044", dP: "60.59" },
  "Idaho": { winner: "Trump", ev: 4, rV: "605,246", rP: "66.87", dV: "274,972", dP: "30.38" },
  "Illinois": { winner: "Harris", ev: 19, rV: "2,449,079", rP: "43.47", dV: "3,062,863", dP: "54.37" },
  "Indiana": { winner: "Trump", ev: 11, rV: "1,720,347", rP: "58.58", dV: "1,163,603", dP: "39.62" },
  "Iowa": { winner: "Trump", ev: 6, rV: "927,019", rP: "55.73", dV: "707,278", dP: "42.52" },
  "Kansas": { winner: "Trump", ev: 6, rV: "758,802", rP: "57.16", dV: "544,853", dP: "41.04" },
  "Kentucky": { winner: "Trump", ev: 8, rV: "1,337,494", rP: "64.47", dV: "704,043", dP: "33.94" },
  "Louisiana": { winner: "Trump", ev: 8, rV: "1,208,505", rP: "60.22", dV: "766,870", dP: "38.21" },
  "Maine": { winner: "Harris", ev: 2, rV: "377,977", rP: "45.46", dV: "435,652", dP: "52.40" },
  "Maryland": { winner: "Harris", ev: 10, rV: "1,035,550", rP: "34.08", dV: "1,902,577", dP: "62.62" },
  "Massachusetts": { winner: "Harris", ev: 11, rV: "1,251,303", rP: "36.02", dV: "2,126,518", dP: "61.22" },
  "Michigan": { winner: "TrumpFlip", ev: 15, rV: "2,816,636", rP: "49.73", dV: "2,736,533", dP: "48.31" },
  "Minnesota": { winner: "Harris", ev: 10, rV: "1,519,032", rP: "46.68", dV: "1,656,979", dP: "50.92" },
  "Mississippi": { winner: "Trump", ev: 6, rV: "747,744", rP: "60.89", dV: "466,668", dP: "38.00" },
  "Missouri": { winner: "Trump", ev: 10, rV: "1,751,986", rP: "58.49", dV: "1,200,599", dP: "40.08" },
  "Montana": { winner: "Trump", ev: 4, rV: "352,079", rP: "58.39", dV: "231,906", dP: "38.46" },
  "Nebraska": { winner: "Trump", ev: 2, rV: "564,816", rP: "59.32", dV: "369,995", dP: "38.86" },
  "Nevada": { winner: "TrumpFlip", ev: 6, rV: "751,205", rP: "50.59", dV: "705,197", dP: "47.49" },
  "New Hampshire": { winner: "Harris", ev: 4, rV: "395,523", rP: "47.87", dV: "418,488", dP: "50.65" },
  "New Jersey": { winner: "Harris", ev: 14, rV: "1,968,215", rP: "46.06", dV: "2,220,713", dP: "51.97" },
  "New Mexico": { winner: "Harris", ev: 5, rV: "423,391", rP: "45.85", dV: "478,802", dP: "51.85" },
  "New York": { winner: "Harris", ev: 28, rV: "3,578,899", rP: "43.31", dV: "4,619,195", dP: "55.91" },
  "North Carolina": { winner: "Trump", ev: 16, rV: "2,898,423", rP: "50.86", dV: "2,715,375", dP: "47.65" },
  "North Dakota": { winner: "Trump", ev: 3, rV: "246,505", rP: "66.96", dV: "112,327", dP: "30.51" },
  "Ohio": { winner: "Trump", ev: 17, rV: "3,180,116", rP: "55.14", dV: "2,533,699", dP: "43.93" },
  "Oklahoma": { winner: "Trump", ev: 7, rV: "1,036,213", rP: "66.16", dV: "499,599", dP: "31.90" },
  "Oregon": { winner: "Harris", ev: 8, rV: "919,480", rP: "40.97", dV: "1,240,600", dP: "55.27" },
  "Pennsylvania": { winner: "TrumpFlip", ev: 19, rV: "3,543,308", rP: "50.37", dV: "3,423,042", dP: "48.66" },
  "Rhode Island": { winner: "Harris", ev: 4, rV: "214,406", rP: "41.76", dV: "285,156", dP: "55.54" },
  "South Carolina": { winner: "Trump", ev: 9, rV: "1,483,747", rP: "58.23", dV: "1,028,452", dP: "40.36" },
  "South Dakota": { winner: "Trump", ev: 3, rV: "272,081", rP: "63.43", dV: "146,859", dP: "34.24" },
  "Tennessee": { winner: "Trump", ev: 11, rV: "1,966,865", rP: "64.19", dV: "1,056,265", dP: "34.47" },
  "Texas": { winner: "Trump", ev: 40, rV: "6,393,597", rP: "56.14", dV: "4,835,250", dP: "42.46" },
  "Utah": { winner: "Trump", ev: 6, rV: "883,818", rP: "59.38", dV: "562,566", dP: "37.79" },
  "Vermont": { winner: "Harris", ev: 3, rV: "119,395", rP: "32.32", dV: "235,791", dP: "63.83" },
  "Virginia": { winner: "Harris", ev: 13, rV: "2,075,085", rP: "46.05", dV: "2,335,395", dP: "51.83" },
  "Washington": { winner: "Harris", ev: 12, rV: "1,530,923", rP: "39.01", dV: "2,245,849", dP: "57.23" },
  "West Virginia": { winner: "Trump", ev: 4, rV: "533,556", rP: "69.97", dV: "214,309", dP: "28.10" },
  "Wisconsin": { winner: "TrumpFlip", ev: 10, rV: "1,697,626", rP: "49.60", dV: "1,668,229", dP: "48.74" },
  "Wyoming": { winner: "Trump", ev: 3, rV: "192,633", rP: "71.60", dV: "69,527", dP: "25.84" }
};

const districtData = [
  { name: "Maine 1", winner: "Harris", ev: 1, rV: "165,214", rP: "38.09", dV: "258,863", dP: "59.69" },
  { name: "Maine 2", winner: "Trump", ev: 1, rV: "212,763", rP: "53.50", dV: "176,789", dP: "44.46" },
  { name: "Neb. 1", winner: "Trump", ev: 1, rV: "177,666", rP: "55.49", dV: "136,153", dP: "42.52" },
  { name: "Neb. 2", winner: "Harris", ev: 1, rV: "148,905", rP: "46.73", dV: "163,541", dP: "51.32" },
  { name: "Neb. 3", winner: "Trump", ev: 1, rV: "238,245", rP: "76.03", dV: "70,301", dP: "22.44" }
];

const stateAbbreviations = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
  "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
  "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
  "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
  "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
  "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
  "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
};

const manualAdjustments = {
  "Louisiana": [-10, 5],
  "Rhode Island": [10, 5],
  "Hawaii": [-8, 15],
  "Alaska": [2, 0],
  "Arkansas": [0, 2],
  "California": [-2, 2],
  "Connecticut": [0, 4],
  "Delaware": [19, 7],
  "Florida": [14, 4],
  "Idaho": [0, 11],
  "Iowa": [0, 7],
  "Kansas": [0, 5],
  "Kentucky": [2, 5],
  "Maryland": [-10, -4],
  "Massachusetts": [40, 0],
  "Michigan": [12, 12],
  "Minnesota": [-3, 12],
  "Missouri": [0, 2],
  "Montana": [0, 4],
  "Nebraska": [0, 3],
  "New Jersey": [25, 5],
  "New York": [2, 5],
  "North Carolina": [0, 2],
  "North Dakota": [0, 2],
  "Ohio": [0, 3],
  "Oklahoma": [0, 4],
  "Oregon": [0, 2],
  "Pennsylvania": [0, 3],
  "Tennessee": [0, 3],
  "Vermont": [-1, 2],
  "Virginia": [6, 2]
};

const stateResultsConfig = [
  { id: "h-easy", title: "Harris expected to win easily", column: 0 },
  { id: "h-narrow", title: "Harris expected to win narrowly", column: 1 },
  { id: "comp", title: "Most competitive states", column: 2 },
  { id: "t-narrow", title: "Trump expected to win narrowly", column: 1 },
  { id: "t-easy", title: "Trump expected to win easily", column: 2 }
];

const districtDisplayNames = {
  "Maine 1": "ME-1",
  "Maine 2": "ME-2",
  "Neb. 1": "NE-1",
  "Neb. 2": "NE-2",
  "Neb. 3": "NE-3"
};

const nytStateResultsData = [
  { name: "California", displayName: "California", group: "h-easy", party: "D", winner: "Harris", margin: 20, marginLabel: "D+20", percent: "100%" },
  { name: "Colorado", displayName: "Colorado", group: "h-easy", party: "D", winner: "Harris", margin: 11, marginLabel: "D+11", percent: "100%" },
  { name: "Connecticut", displayName: "Connecticut", group: "h-easy", party: "D", winner: "Harris", margin: 15, marginLabel: "D+15", percent: "100%" },
  { name: "Delaware", displayName: "Delaware", group: "h-easy", party: "D", winner: "Harris", margin: 15, marginLabel: "D+15", percent: "100%" },
  { name: "Hawaii", displayName: "Hawaii", group: "h-easy", party: "D", winner: "Harris", margin: 23, marginLabel: "D+23", percent: "100%" },
  { name: "Illinois", displayName: "Illinois", group: "h-easy", party: "D", winner: "Harris", margin: 11, marginLabel: "D+11", percent: "100%" },
  { name: "Maine 1", displayName: "Maine 1", group: "h-easy", party: "D", winner: "Harris", margin: 22, marginLabel: "D+22", percent: "100%" },
  { name: "Maryland", displayName: "Maryland", group: "h-easy", party: "D", winner: "Harris", margin: 29, marginLabel: "D+29", percent: "100%" },
  { name: "Massachusetts", displayName: "Massachusetts", group: "h-easy", party: "D", winner: "Harris", margin: 25, marginLabel: "D+25", percent: "100%" },
  { name: "New Jersey", displayName: "New Jersey", group: "h-easy", party: "D", winner: "Harris", margin: 6, marginLabel: "D+6", percent: "100%" },
  { name: "New York", displayName: "New York", group: "h-easy", party: "D", winner: "Harris", margin: 13, marginLabel: "D+13", percent: "100%" },
  { name: "Oregon", displayName: "Oregon", group: "h-easy", party: "D", winner: "Harris", margin: 14, marginLabel: "D+14", percent: "100%" },
  { name: "Rhode Island", displayName: "Rhode Island", group: "h-easy", party: "D", winner: "Harris", margin: 14, marginLabel: "D+14", percent: "100%" },
  { name: "Vermont", displayName: "Vermont", group: "h-easy", party: "D", winner: "Harris", margin: 32, marginLabel: "D+32", percent: "100%" },
  { name: "Washington", displayName: "Washington", group: "h-easy", party: "D", winner: "Harris", margin: 18, marginLabel: "D+18", percent: "100%" },
  { name: "District of Columbia", displayName: "District of Columbia", group: "h-easy", party: "D", winner: "Harris", margin: 86, marginLabel: "D+86", percent: "100%" },

  { name: "Maine", displayName: "Maine", group: "h-narrow", party: "D", winner: "Harris", margin: 7, marginLabel: "D+7", percent: "100%" },
  { name: "Minnesota", displayName: "Minnesota", group: "h-narrow", party: "D", winner: "Harris", margin: 4, marginLabel: "D+4", percent: "100%" },
  { name: "Neb. 2", displayName: "Nebraska 2", group: "h-narrow", party: "D", winner: "Harris", margin: 5, marginLabel: "D+5", percent: "100%" },
  { name: "New Hampshire", displayName: "New Hampshire", group: "h-narrow", party: "D", winner: "Harris", margin: 3, marginLabel: "D+3", percent: "100%" },
  { name: "New Mexico", displayName: "New Mexico", group: "h-narrow", party: "D", winner: "Harris", margin: 6, marginLabel: "D+6", percent: "100%" },
  { name: "Virginia", displayName: "Virginia", group: "h-narrow", party: "D", winner: "Harris", margin: 6, marginLabel: "D+6", percent: "100%" },

  { name: "Arizona", displayName: "Arizona", group: "comp", party: "R", winner: "TrumpFlip", margin: 6, marginLabel: "R+6", percent: "100%" },
  { name: "Georgia", displayName: "Georgia", group: "comp", party: "R", winner: "TrumpFlip", margin: 2, marginLabel: "R+2", percent: "100%" },
  { name: "Michigan", displayName: "Michigan", group: "comp", party: "R", winner: "TrumpFlip", margin: 1.4, marginLabel: "R+1.4", percent: "100%" },
  { name: "Nevada", displayName: "Nevada", group: "comp", party: "R", winner: "TrumpFlip", margin: 3, marginLabel: "R+3", percent: "100%" },
  { name: "North Carolina", displayName: "North Carolina", group: "comp", party: "R", winner: "Trump", margin: 3, marginLabel: "R+3", percent: "100%" },
  { name: "Pennsylvania", displayName: "Pennsylvania", group: "comp", party: "R", winner: "TrumpFlip", margin: 1.7, marginLabel: "R+1.7", percent: "100%" },
  { name: "Wisconsin", displayName: "Wisconsin", group: "comp", party: "R", winner: "TrumpFlip", margin: 0.86, marginLabel: "R+0.86", percent: "100%" },

  { name: "Florida", displayName: "Florida", group: "t-narrow", party: "R", winner: "Trump", margin: 13, marginLabel: "R+13", percent: "100%" },
  { name: "Iowa", displayName: "Iowa", group: "t-narrow", party: "R", winner: "Trump", margin: 13, marginLabel: "R+13", percent: "100%" },
  { name: "Maine 2", displayName: "Maine 2", group: "t-narrow", party: "R", winner: "Trump", margin: 10, marginLabel: "R+10", percent: "100%" },
  { name: "Texas", displayName: "Texas", group: "t-narrow", party: "R", winner: "Trump", margin: 14, marginLabel: "R+14", percent: "100%" },

  { name: "Alabama", displayName: "Alabama", group: "t-easy", party: "R", winner: "Trump", margin: 31, marginLabel: "R+31", percent: "100%" },
  { name: "Alaska", displayName: "Alaska", group: "t-easy", party: "R", winner: "Trump", margin: 13, marginLabel: "R+13", percent: "100%" },
  { name: "Arkansas", displayName: "Arkansas", group: "t-easy", party: "R", winner: "Trump", margin: 31, marginLabel: "R+31", percent: "100%" },
  { name: "Idaho", displayName: "Idaho", group: "t-easy", party: "R", winner: "Trump", margin: 37, marginLabel: "R+37", percent: "100%" },
  { name: "Indiana", displayName: "Indiana", group: "t-easy", party: "R", winner: "Trump", margin: 19, marginLabel: "R+19", percent: "100%" },
  { name: "Kansas", displayName: "Kansas", group: "t-easy", party: "R", winner: "Trump", margin: 16, marginLabel: "R+16", percent: "100%" },
  { name: "Kentucky", displayName: "Kentucky", group: "t-easy", party: "R", winner: "Trump", margin: 31, marginLabel: "R+31", percent: "100%" },
  { name: "Louisiana", displayName: "Louisiana", group: "t-easy", party: "R", winner: "Trump", margin: 22, marginLabel: "R+22", percent: "100%" },
  { name: "Mississippi", displayName: "Mississippi", group: "t-easy", party: "R", winner: "Trump", margin: 23, marginLabel: "R+23", percent: "100%" },
  { name: "Missouri", displayName: "Missouri", group: "t-easy", party: "R", winner: "Trump", margin: 18, marginLabel: "R+18", percent: "100%" },
  { name: "Montana", displayName: "Montana", group: "t-easy", party: "R", winner: "Trump", margin: 20, marginLabel: "R+20", percent: "100%" },
  { name: "Nebraska", displayName: "Nebraska", group: "t-easy", party: "R", winner: "Trump", margin: 21, marginLabel: "R+21", percent: "100%" },
  { name: "Neb. 1", displayName: "Nebraska 1", group: "t-easy", party: "R", winner: "Trump", margin: 13, marginLabel: "R+13", percent: "100%" },
  { name: "Neb. 3", displayName: "Nebraska 3", group: "t-easy", party: "R", winner: "Trump", margin: 54, marginLabel: "R+54", percent: "100%" },
  { name: "North Dakota", displayName: "North Dakota", group: "t-easy", party: "R", winner: "Trump", margin: 37, marginLabel: "R+37", percent: "100%" },
  { name: "Ohio", displayName: "Ohio", group: "t-easy", party: "R", winner: "Trump", margin: 11, marginLabel: "R+11", percent: "100%" },
  { name: "Oklahoma", displayName: "Oklahoma", group: "t-easy", party: "R", winner: "Trump", margin: 34, marginLabel: "R+34", percent: "100%" },
  { name: "South Carolina", displayName: "South Carolina", group: "t-easy", party: "R", winner: "Trump", margin: 18, marginLabel: "R+18", percent: "100%" },
  { name: "South Dakota", displayName: "South Dakota", group: "t-easy", party: "R", winner: "Trump", margin: 29, marginLabel: "R+29", percent: "100%" },
  { name: "Tennessee", displayName: "Tennessee", group: "t-easy", party: "R", winner: "Trump", margin: 30, marginLabel: "R+30", percent: "100%" },
  { name: "Utah", displayName: "Utah", group: "t-easy", party: "R", winner: "Trump", margin: 22, marginLabel: "R+22", percent: "100%" },
  { name: "West Virginia", displayName: "West Virginia", group: "t-easy", party: "R", winner: "Trump", margin: 42, marginLabel: "R+42", percent: "100%" },
  { name: "Wyoming", displayName: "Wyoming", group: "t-easy", party: "R", winner: "Trump", margin: 46, marginLabel: "R+46", percent: "100%" }
];

let stateResultsSortMode = "margin";
const exitPollDataUrl = "./data/cnn-exit-polls-national-2024.json";
let exitPollCategoryMode = "demographics";

const exitPollCategoryDefinitions = [
  { id: "demographics", label: "Demographics" },
  { id: "economy", label: "Economy & Mood" },
  { id: "issues", label: "Issues & Policy" },
  { id: "democracy", label: "Democracy" },
  { id: "candidates", label: "Candidates" },
  { id: "vote", label: "Vote History" },
  { id: "all", label: "All Questions" }
];

const mapSvg = d3.select("#national-election-map");
const tooltip = d3.select("#map-tooltip");

function fillForWinner(winner) {
  if (winner === "Harris") return "#2879b5";
  if (winner === "Trump") return "#cf2f2f";
  if (winner === "HarrisFlip") return "url(#dem-flip-pattern)";
  if (winner === "TrumpFlip") return "url(#rep-flip-pattern)";
  return "#3a3d42";
}

function getTooltipData(name) {
  const stateInfo = electionData[name];
  if (stateInfo) return { title: name, ...stateInfo };
  const districtInfo = districtData.find(d => d.name === name);
  if (districtInfo) return { title: name, ...districtInfo };
  return { title: name, winner: "None", ev: 0, rV: "0", rP: "0.00", dV: "0", dP: "0.00" };
}

function tooltipHTML(name) {
  const d = getTooltipData(name);
  return `
    <div class="tooltip-header">
      <div class="tooltip-title">${d.title}</div>
      <div class="tooltip-ev">${d.ev} EV</div>
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
        <tr class="${d.winner === "Trump" || d.winner === "TrumpFlip" ? "winner-row" : ""}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar rep"></span>
              <span>Donald J. Trump</span>
            </div>
          </td>
          <td>Rep.</td>
          <td>${d.rV}</td>
          <td>${d.rP}%</td>
        </tr>
        <tr class="${d.winner === "Harris" || d.winner === "HarrisFlip" ? "winner-row" : ""}">
          <td>
            <div class="tooltip-candidate">
              <span class="tooltip-candidate-bar dem"></span>
              <span>Kamala Harris</span>
            </div>
          </td>
          <td>Dem.</td>
          <td>${d.dV}</td>
          <td>${d.dP}%</td>
        </tr>
      </tbody>
    </table>
  `;
}

function positionTooltip(event) {
  const node = tooltip.node();
  const w = node.offsetWidth;
  const h = node.offsetHeight;
  let left = event.clientX - w / 2;
  let top = event.clientY + 18;
  const minLeft = 12;
  const maxLeft = window.innerWidth - w - 12;
  const maxTop = window.innerHeight - h - 12;
  left = Math.max(minLeft, Math.min(left, maxLeft));
  top = Math.min(top, maxTop);
  tooltip.style("left", `${left}px`).style("top", `${top}px`);
}

function formatMargin(value) {
  const numeric = Number(value || 0);
  const rounded = numeric < 1 ? numeric.toFixed(2) : numeric.toFixed(1);
  return rounded;
}

function formatResultMarginLabel(entry) {
  const prefix = entry.party === "D" ? "D" : "R";
  return `${prefix}+${formatMargin(entry.margin)}`;
}

function buildStateResultsData() {
  return nytStateResultsData.map((entry) => {
    const statewide = electionData[entry.name];
    const district = districtData.find((item) => item.name === entry.name);
    const source = statewide || district || null;
    const actualMargin = source
      ? Math.abs(Number(source.dP || 0) - Number(source.rP || 0))
      : Number(entry.margin || 0);

    return {
      ...entry,
      margin: actualMargin,
      marginLabel: formatResultMarginLabel({ ...entry, margin: actualMargin })
    };
  });
}

function marginClassForResult(result) {
  if (result.winner === "Harris") return "dem-win";
  if (result.winner === "HarrisFlip") return "dem-flip";
  if (result.winner === "TrumpFlip") return "rep-flip";
  return "rep-win";
}

function stateResultLinkHref(name) {
  return `./state-result.html?name=${encodeURIComponent(name)}`;
}

function renderStateResults() {
  const board = document.getElementById("state-results-board");
  const closestList = document.getElementById("closest-states-list");
  const districtList = document.getElementById("district-results-list");
  const harrisCount = document.getElementById("states-won-harris");
  const trumpCount = document.getElementById("states-won-trump");
  const flippedCount = document.getElementById("states-flipped-count");
  const sortButtons = document.querySelectorAll(".state-results-sort-button");

  if (!board) return;

  sortButtons.forEach((button) => {
    const isActive = button.dataset.sort === stateResultsSortMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  const results = buildStateResultsData();
  const columns = [[], [], []];

  stateResultsConfig.forEach(section => {
    const list = results
      .filter(result => result.group === section.id)
      .sort((a, b) => {
        if (stateResultsSortMode === "alphabetical") {
          return a.displayName.localeCompare(b.displayName);
        }
        return b.margin - a.margin || a.displayName.localeCompare(b.displayName);
      });
    columns[section.column].push({ ...section, list });
  });

  board.innerHTML = `
    <div class="state-results-grid">
      ${columns.map(column => `
        <div class="state-results-column">
          ${column.map(section => `
            <section class="state-results-group">
              <h3 class="state-results-title">${section.title}</h3>
              <table class="state-results-table">
                <thead>
                  <tr>
                    <th>State</th>
                    <th>Margin</th>
                    <th>% In</th>
                  </tr>
                </thead>
                <tbody>
                  ${section.list.map(result => `
                    <tr>
                      <td><a class="state-link" href="${stateResultLinkHref(result.name)}">${result.displayName}</a></td>
                      <td>
                        <span class="margin-box ${marginClassForResult(result)}">
                          ${result.marginLabel}
                        </span>
                      </td>
                      <td class="state-percent">${result.percent}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </section>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;

  const statewideOnly = results.filter(result => !districtDisplayNames[result.name]);
  const closest = [...statewideOnly]
    .sort((a, b) => a.margin - b.margin)
    .slice(0, 6);

  if (closestList) {
    closestList.innerHTML = closest.map(result => `
      <li>
        <span class="state-side-name">${result.displayName}</span>
        <span class="state-side-value">${result.marginLabel}</span>
      </li>
    `).join("");
  }

  if (districtList) {
    districtList.innerHTML = districtData.map(result => {
      const margin = Math.abs(Number(result.dP) - Number(result.rP));
      const winnerParty = result.winner.startsWith("Harris") ? "D" : "R";
      return `
        <li>
          <span class="state-side-name">${districtDisplayNames[result.name] || result.name}</span>
          <span class="state-side-value">${winnerParty}+${formatMargin(margin)}</span>
        </li>
      `;
    }).join("");
  }

  if (harrisCount) {
    const harrisWins = statewideOnly.filter(result => result.winner.startsWith("Harris")).length;
    harrisCount.textContent = `${harrisWins - 1} + DC`;
  }

  if (trumpCount) {
    const trumpWins = statewideOnly.filter(result => result.winner.startsWith("Trump")).length;
    trumpCount.textContent = `${trumpWins}`;
  }

  if (flippedCount) {
    const flips = statewideOnly.filter(result => result.winner.endsWith("Flip")).length;
    flippedCount.textContent = `${flips}`;
  }
}

function initStateResultsControls() {
  const sortButtons = document.querySelectorAll(".state-results-sort-button");
  if (!sortButtons.length) return;

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextMode = button.dataset.sort;
      if (!nextMode || nextMode === stateResultsSortMode) return;
      stateResultsSortMode = nextMode;
      renderStateResults();
    });
  });
}

function getCandidatePercent(candidateAnswers, lastName) {
  const match = (candidateAnswers || []).find((candidate) => candidate.lastName === lastName);
  return typeof match?.percentage === "number" ? match.percentage : null;
}

function formatPercent(value) {
  return typeof value === "number" ? `${value}%` : "—";
}

function buildIssueSummary(question) {
  const answers = question?.answers || [];
  const harris = answers.find((answer) => (answer.answerShort || answer.answer || "") === "Harris");
  const trump = answers.find((answer) => (answer.answerShort || answer.answer || "") === "Trump");

  const harrisPct = typeof harris?.totalPercentage === "number" ? harris.totalPercentage : null;
  const trumpPct = typeof trump?.totalPercentage === "number" ? trump.totalPercentage : null;

  if (typeof harrisPct !== "number" || typeof trumpPct !== "number") {
    return null;
  }

  if (harrisPct === trumpPct) {
    return `Tie ${harrisPct}-${trumpPct}`;
  }

  return harrisPct > trumpPct
    ? `Harris +${harrisPct - trumpPct} (${harrisPct}-${trumpPct})`
    : `Trump +${trumpPct - harrisPct} (${trumpPct}-${harrisPct})`;
}

function formatQuestionMeta(question, duplicateCount) {
  const parts = [`Question ${question.sequence}`];
  if (duplicateCount > 1) {
    parts.push(`${duplicateCount} variants`);
  }
  if (typeof question.numRows === "number") {
    parts.push(`${question.numRows} rows`);
  }
  return parts.join(" · ");
}

function getExitPollCategory(question) {
  const sequence = question.sequence;

  if (
    (sequence >= 1 && sequence <= 31) ||
    sequence === 76 ||
    sequence === 77 ||
    sequence === 78
  ) {
    return "demographics";
  }

  if (sequence >= 32 && sequence <= 38) {
    return "economy";
  }

  if (
    sequence === 39 ||
    sequence === 41 ||
    sequence === 42 ||
    sequence === 43 ||
    sequence === 44 ||
    sequence === 45 ||
    sequence === 46 ||
    sequence === 47 ||
    sequence === 48 ||
    sequence === 49 ||
    sequence === 55
  ) {
    return "issues";
  }

  if (sequence >= 50 && sequence <= 54) {
    return "democracy";
  }

  if (
    sequence === 40 ||
    (sequence >= 56 && sequence <= 71)
  ) {
    return "candidates";
  }

  if (sequence >= 72 && sequence <= 75) {
    return "vote";
  }

  return "issues";
}

function getExitPollRowOutcome(answer) {
  const harris = getCandidatePercent(answer.candidateAnswers, "Harris");
  const trump = getCandidatePercent(answer.candidateAnswers, "Trump");

  if (typeof harris !== "number" || typeof trump !== "number") {
    return { winner: "none", label: "No call" };
  }

  if (harris === trump) {
    return { winner: "tie", label: "Tie" };
  }

  return harris > trump
    ? { winner: "harris", label: "Harris won" }
    : { winner: "trump", label: "Trump won" };
}

function renderExitPollCards(questions) {
  return questions.map((question) => `
    <section class="exit-poll-card">
      <div class="exit-poll-card-head">
        <div class="exit-poll-kicker">
          <span class="exit-poll-question-number">Q${question.sequence}</span>
        </div>
        <h3>${question.question}</h3>
      </div>
      <table class="exit-poll-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>Share</th>
            <th>Harris</th>
            <th>Trump</th>
          </tr>
        </thead>
        <tbody>
          ${(question.answers || []).map((answer) => {
            const outcome = getExitPollRowOutcome(answer);
            const harris = getCandidatePercent(answer.candidateAnswers, "Harris");
            const trump = getCandidatePercent(answer.candidateAnswers, "Trump");
            return `
            <tr class="exit-poll-row ${outcome.winner !== "none" ? `winner-${outcome.winner}` : ""}">
              <td class="exit-poll-label-cell">
                <div class="exit-poll-label-wrap">
                  <div class="exit-poll-label">${answer.answerShort || answer.answer || "—"}</div>
                  <span class="exit-poll-winner-badge ${outcome.winner}">${outcome.label}</span>
                </div>
              </td>
              <td class="exit-poll-data-cell">
                <span class="exit-poll-stat-chip share">${formatPercent(answer.totalPercentage)}</span>
              </td>
              <td class="exit-poll-data-cell">
                <span class="exit-poll-stat-chip harris ${outcome.winner === "harris" ? "is-winner" : ""}">${formatPercent(harris)}</span>
              </td>
              <td class="exit-poll-data-cell">
                <span class="exit-poll-stat-chip trump ${outcome.winner === "trump" ? "is-winner" : ""}">${formatPercent(trump)}</span>
              </td>
            </tr>
          `;
          }).join("")}
        </tbody>
      </table>
    </section>
  `).join("");
}

async function renderExitPolls() {
  const board = document.getElementById("exit-polls-board");
  const issues = document.getElementById("exit-polls-issues");
  const questionCount = document.getElementById("exit-polls-question-count");
  const respondentCount = document.getElementById("exit-polls-respondent-count");
  if (!board) return;

  try {
    const data = window.CNN_EXIT_POLLS_2024 || await (async () => {
      const response = await fetch(exitPollDataUrl);
      if (!response.ok) {
        throw new Error(`Failed to load exit polls (${response.status})`);
      }
      return response.json();
    })();
    const questions = [...(data.questions || [])].sort((a, b) => a.sequence - b.sequence);
    const duplicateCounts = questions.reduce((acc, question) => {
      acc[question.question] = (acc[question.question] || 0) + 1;
      return acc;
    }, {});
    const groupedQuestions = questions.reduce((acc, question) => {
      const category = getExitPollCategory(question);
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(question);
      return acc;
    }, {});

    if (questionCount) {
      questionCount.textContent = `${questions.length}`;
    }

    if (respondentCount) {
      respondentCount.textContent = Number(data.respondents || 0).toLocaleString();
    }

    const activeQuestions = exitPollCategoryMode === "all"
      ? questions
      : (groupedQuestions[exitPollCategoryMode] || []);

    board.innerHTML = `
      <div class="exit-polls-controls">
        <div class="exit-polls-filter-label">Browse the full dataset</div>
        <div class="exit-polls-filter-buttons" role="tablist" aria-label="Exit poll categories">
          ${exitPollCategoryDefinitions.map((category) => {
            const isActive = category.id === exitPollCategoryMode;
            const count = category.id === "all" ? questions.length : (groupedQuestions[category.id] || []).length;
            return `
              <button
                class="exit-polls-filter-button ${isActive ? "is-active" : ""}"
                type="button"
                data-exit-poll-category="${category.id}"
                role="tab"
                aria-selected="${isActive ? "true" : "false"}"
              >
                <span>${category.label}</span>
                <span class="exit-polls-filter-count">${count}</span>
              </button>
            `;
          }).join("")}
        </div>
        <div class="exit-polls-filter-summary">
          Showing ${activeQuestions.length} question${activeQuestions.length === 1 ? "" : "s"} in ${exitPollCategoryDefinitions.find((category) => category.id === exitPollCategoryMode)?.label || "this category"}.
        </div>
      </div>
      <div class="exit-polls-grid">
        ${renderExitPollCards(activeQuestions)}
      </div>
    `;

    if (issues) {
      const issueQuestions = [
        ["Economy", "Who do you trust more to handle the economy?"],
        ["Abortion", "Who do you trust more to handle abortion?"],
        ["Immigration", "Who do you trust more to handle immigration?"]
      ];

      issues.innerHTML = issueQuestions.map(([label, questionText]) => {
        const question = questions.find((item) => item.question === questionText);
        const summary = question ? buildIssueSummary(question) : null;
        return `
      <li>
        <span class="state-side-name">${label}</span>
        <span class="state-side-value">${summary || "—"}</span>
      </li>
    `;
      }).join("");
    }
  } catch (error) {
    board.innerHTML = `
      <section class="exit-poll-card">
        <div class="exit-poll-card-head">
          <h3>Exit polls unavailable</h3>
          <div class="exit-poll-card-meta">Unable to load the full CNN dataset.</div>
        </div>
      </section>
    `;

    if (questionCount) {
      questionCount.textContent = "Unavailable";
    }

    if (respondentCount) {
      respondentCount.textContent = "Unavailable";
    }

    if (issues) {
      issues.innerHTML = `
      <li>
        <span class="state-side-name">Status</span>
        <span class="state-side-value">Could not load CNN exit polls</span>
      </li>
    `;
    }

    console.error(error);
  }
}

function initExitPollControls() {
  const board = document.getElementById("exit-polls-board");
  if (!board) return;

  board.addEventListener("click", (event) => {
    const button = event.target.closest("[data-exit-poll-category]");
    if (!button) return;

    const nextCategory = button.dataset.exitPollCategory;
    if (!nextCategory || nextCategory === exitPollCategoryMode) return;

    exitPollCategoryMode = nextCategory;
    renderExitPolls();
  });
}

function initNationalMap() {
  if (!window.d3 || !window.topojson || mapSvg.empty()) return;

  const projection = d3.geoAlbersUsa();
  const path = d3.geoPath().projection(projection);

  const defs = mapSvg.append("defs");

  defs.append("pattern")
    .attr("id", "dem-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call(pattern => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#5a96c8");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#2879b5");
    });

  defs.append("pattern")
    .attr("id", "rep-flip-pattern")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 12)
    .attr("height", 12)
    .attr("patternTransform", "rotate(45)")
    .call(pattern => {
      pattern.append("rect").attr("width", 12).attr("height", 12).attr("fill", "#d86a6a");
      pattern.append("rect").attr("width", 6).attr("height", 12).attr("fill", "#cf2f2f");
    });

  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(us => {
    const states = topojson.feature(us, us.objects.states).features;
    const stateCollection = { type: "FeatureCollection", features: states };
    const mapFitArea = [[42, 8], [1392, 892]];
    projection.fitExtent(mapFitArea, stateCollection);

    const initialBounds = path.bounds(stateCollection);
    const currentCenterX = (initialBounds[0][0] + initialBounds[1][0]) / 2;
    const currentCenterY = (initialBounds[0][1] + initialBounds[1][1]) / 2;
    const targetCenterX = (mapFitArea[0][0] + mapFitArea[1][0]) / 2;
    const targetCenterY = (mapFitArea[0][1] + mapFitArea[1][1]) / 2;
    const currentTranslate = projection.translate();
    projection.translate([
      currentTranslate[0] + (targetCenterX - currentCenterX),
      currentTranslate[1] + (targetCenterY - currentCenterY)
    ]);

    const groups = mapSvg.append("g");

    groups.selectAll(".state-group")
      .data(states)
      .enter()
      .append("g")
      .each(function(d) {
        const group = d3.select(this);
        const stateName = d.properties.name;
        const info = electionData[stateName];

        group.append("path")
          .attr("class", "state")
          .attr("d", path)
          .attr("fill", fillForWinner(info?.winner))
          .on("mouseover", (event) => {
            tooltip.style("opacity", 1).html(tooltipHTML(stateName));
            positionTooltip(event);
          })
          .on("mousemove", positionTooltip)
          .on("mouseout", () => tooltip.style("opacity", 0));

        const [cx, cy] = path.centroid(d);
        const adjust = manualAdjustments[stateName] || [0, 0];

        if (Number.isFinite(cx) && Number.isFinite(cy)) {
          group.append("text")
            .attr("class", "map-label")
            .attr("x", cx + adjust[0])
            .attr("y", cy + adjust[1])
            .text(stateAbbreviations[stateName] || "");
        }
      });

    const dc = electionData["District of Columbia"];
    const dcPoint = projection([-77.0369, 38.9072]);
    if (dcPoint) {
      mapSvg.append("circle")
        .attr("cx", dcPoint[0])
        .attr("cy", dcPoint[1])
        .attr("r", 6)
        .attr("fill", fillForWinner(dc.winner))
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", (event) => {
          tooltip.style("opacity", 1).html(tooltipHTML("District of Columbia"));
          positionTooltip(event);
        })
        .on("mousemove", positionTooltip)
        .on("mouseout", () => tooltip.style("opacity", 0));
    }

    const districtX = 1326;
    const districtY = 520;
    const districtGap = 34;

    districtData.forEach((d, i) => {
      const y = districtY + i * districtGap;

      mapSvg.append("rect")
        .attr("class", "district-square")
        .attr("x", districtX)
        .attr("y", y)
        .attr("width", 22)
        .attr("height", 22)
        .attr("fill", fillForWinner(d.winner))
        .on("mouseover", (event) => {
          tooltip.style("opacity", 1).html(tooltipHTML(d.name));
          positionTooltip(event);
        })
        .on("mousemove", positionTooltip)
        .on("mouseout", () => tooltip.style("opacity", 0));

      mapSvg.append("text")
        .attr("class", "district-label")
        .attr("x", districtX + 30)
        .attr("y", y + 11)
        .text(d.name);
    });
  });
}

initNationalMap();
initStateResultsControls();
initExitPollControls();
renderStateResults();
renderExitPolls();

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

function stateElectionRenderCityLabels(svg, projection, stateName) {
  const cityLabels = STATE_ELECTION_MAJOR_CITY_LABELS[stateName] || [];
  const viewBox = svg.node().viewBox.baseVal;
  const width = viewBox.width || 540;
  const height = viewBox.height || 520;
  svg.selectAll(".state-election-city-labels").remove();
  const placedLabels = stateElectionPlaceCityLabels(cityLabels, projection, width, height);
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

  stateElectionResolveRenderedCityLabels(texts, width, height);
}

function stateElectionPlaceCityLabels(cityLabels, projection, svgWidth = 540, svgHeight = 520) {
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
      return point && point.every(Number.isFinite) && point[0] >= 0 && point[0] <= svgWidth && point[1] >= 0 && point[1] <= svgHeight
        ? { ...city, point } : null;
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

function stateElectionResolveRenderedCityLabels(texts, svgWidth = 540, svgHeight = 520) {
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

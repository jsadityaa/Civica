// Final Prediction column from Polycivic's 2026 Midterms Forecast spreadsheet.
// https://docs.google.com/spreadsheets/d/1O4P7yK1TaDzKKB2hZqRFGeRumebjS4UXkEfPxGxVnOM/edit#gid=0
window.POLYCIVIC_FORECASTS_2026 = {
  senate: [
    ["Alabama", "R+19.9"], ["Alaska", "D+2.3"], ["Arkansas", "R+14.2"],
    ["Colorado", "D+21.8"], ["Delaware", "D+25.7"], ["Florida", "R+7.9", "Special election"],
    ["Georgia", "D+10.3"], ["Idaho", "R+13.5"], ["Illinois", "D+17.6"],
    ["Iowa", "R+0.9"], ["Kansas", "D+0.6"], ["Kentucky", "R+17.3"],
    ["Louisiana", "R+8.3"], ["Maine", "D+4.6"], ["Massachusetts", "D+26.0"],
    ["Michigan", "D+4.4"], ["Minnesota", "D+6.5"], ["Mississippi", "R+6.6"],
    ["Montana", "R+12.2"], ["Nebraska", "R+3.2"], ["New Hampshire", "D+9.2"],
    ["New Jersey", "D+24.4"], ["New Mexico", "D+20.0"], ["North Carolina", "D+12.1"],
    ["Ohio", "D+2.9", "Special election"], ["Oklahoma", "R+24.9"], ["Oregon", "D+21.0"],
    ["Rhode Island", "D+28.8"], ["South Carolina", "R+3.1"], ["South Dakota", "R+16.4"],
    ["Tennessee", "R+21.2"], ["Texas", "D+2.3"], ["Virginia", "D+23.2"],
    ["West Virginia", "R+25.3"], ["Wyoming", "R+26.0"]
  ],
  governor: [
    ["Alabama", "R+10.3"], ["Alaska", "D+14.6"], ["Arizona", "D+6.7"],
    ["Arkansas", "R+11.6"], ["California", "D+23.2"], ["Colorado", "D+17.7"],
    ["Connecticut", "D+18.2"], ["Florida", "R+5.2"], ["Georgia", "D+0.1"],
    ["Hawaii", "D+23.4"], ["Idaho", "R+22.6"], ["Illinois", "D+18.8"],
    ["Iowa", "D+6.3"], ["Kansas", "R+6.4"], ["Maine", "D+12.6"],
    ["Maryland", "D+28.8"], ["Massachusetts", "D+23.3"], ["Michigan", "D+9.2"],
    ["Minnesota", "D+12.5"], ["Nebraska", "R+9.7"], ["Nevada", "D+1.5"],
    ["New Hampshire", "R+10.3"], ["New Mexico", "D+12.3"], ["New York", "D+13.4"],
    ["Ohio", "D+3.0"], ["Oklahoma", "R+10.0"], ["Oregon", "D+2.7"],
    ["Pennsylvania", "D+21.1"], ["Rhode Island", "D+19.5"], ["South Carolina", "R+12.2"],
    ["South Dakota", "R+20.0"], ["Tennessee", "R+14.3"], ["Texas", "R+3.7"],
    ["Vermont", "R+11.0"], ["Wisconsin", "D+3.3"], ["Wyoming", "R+49.3"]
  ]
};

// Party holding the specific seat/office before the November 2026 election.
// Senate: https://www.dailypress.senate.gov/on-the-floor/senate-facts/
// Governors: https://ballotpedia.org/Governors
// Verified November 1, 2026. Senate includes the Florida and Ohio special seats.
window.POLYCIVIC_FORECASTS_2026_CURRENT_PARTIES = {
  senate: {
    D: ["Colorado", "Delaware", "Georgia", "Illinois", "Massachusetts", "Michigan", "Minnesota", "New Hampshire", "New Jersey", "New Mexico", "Oregon", "Rhode Island", "Virginia"],
    R: ["Alabama", "Alaska", "Arkansas", "Florida", "Idaho", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Mississippi", "Montana", "Nebraska", "North Carolina", "Ohio", "Oklahoma", "South Carolina", "South Dakota", "Tennessee", "Texas", "West Virginia", "Wyoming"]
  },
  governor: {
    D: ["Arizona", "California", "Colorado", "Connecticut", "Hawaii", "Illinois", "Kansas", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "New Mexico", "New York", "Oregon", "Pennsylvania", "Rhode Island", "Wisconsin"],
    R: ["Alabama", "Alaska", "Arkansas", "Florida", "Georgia", "Idaho", "Iowa", "Nebraska", "Nevada", "New Hampshire", "Ohio", "Oklahoma", "South Carolina", "South Dakota", "Tennessee", "Texas", "Vermont", "Wyoming"]
  }
};

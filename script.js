// 1. Historical Database Data Structures
const TEAM_TIERS = {
    "London Blues": 1, "Liverpool": 1, "Manchester Blue": 1, "London Reds": 1,
    "Manchester Reds": 2, "Aston V": 2, "Newcastle": 2, "Tottenham": 2, "Everton": 2,
    "Leicester": 3, "West Brom": 3, "Wolves": 3, "Palace": 3, "Brighton": 3, "West Ham": 3,
    "Leeds": 4, "Burnley": 4, "Fulham": 4, "Southampton": 4, "Sheffield U": 4
};

const VALID_TEAMS = Object.keys(TEAM_TIERS).sort();

const MATCH_LIBRARY = [
    // WEEK 16
    { h: "Aston V", a: "Tottenham", hg: 1, ag: 1 }, { h: "Burnley", a: "London Reds", hg: 1, ag: 1 },
    { h: "Manchester Blue", a: "Manchester Reds", hg: 0, ag: 0 }, { h: "Liverpool", a: "Newcastle", hg: 0, ag: 0 },
    { h: "Brighton", a: "West Ham", hg: 2, ag: 0 }, { h: "West Brom", a: "Everton", hg: 1, ag: 3 },
    { h: "Wolves", a: "Leicester", hg: 0, ag: 0 }, { h: "Sheffield U", a: "Fulham", hg: 3, ag: 1 },
    { h: "Palace", a: "Southampton", hg: 2, ag: 2 }, { h: "London Blues", a: "Leeds", hg: 1, ag: 1 },
    // WEEK 15
    { h: "West Ham", a: "Liverpool", hg: 0, ag: 2 }, { h: "Everton", a: "London Blues", hg: 2, ag: 1 },
    { h: "Leicester", a: "Aston V", hg: 2, ag: 1 }, { h: "Southampton", a: "Burnley", hg: 0, ag: 0 },
    { h: "Manchester Blue", a: "Brighton", hg: 2, ag: 0 }, { h: "Newcastle", a: "Palace", hg: 1, ag: 1 },
    { h: "Tottenham", a: "West Brom", hg: 1, ag: 0 }, { h: "London Reds", a: "Sheffield U", hg: 1, ag: 2 },
    { h: "Manchester Reds", a: "Wolves", hg: 3, ag: 0 }, { h: "Fulham", a: "Leeds", hg: 4, ag: 0 },
    // WEEK 14
    { h: "Leeds", a: "London Reds", hg: 0, ag: 0 }, { h: "Fulham", a: "Everton", hg: 0, ag: 2 },
    { h: "Aston V", a: "Manchester Reds", hg: 3, ag: 2 }, { h: "Palace", a: "West Ham", hg: 4, ag: 1 },
    { h: "London Blues", a: "Tottenham", hg: 1, ag: 1 }, { h: "Brighton", a: "Liverpool", hg: 1, ag: 2 },
    { h: "Wolves", a: "Manchester Blue", hg: 2, ag: 1 }, { h: "West Brom", a: "Leicester", hg: 2, ag: 0 },
    { h: "Burnley", a: "Newcastle", hg: 0, ag: 1 }, { h: "Sheffield U", a: "Southampton", hg: 2, ag: 0 },
    // WEEK 13
    { h: "Liverpool", a: "Palace", hg: 1, ag: 1 }, { h: "West Ham", a: "Burnley", hg: 3, ag: 2 },
    { h: "Manchester Blue", a: "Aston V", hg: 0, ag: 1 }, { h: "Southampton", a: "Leeds", hg: 1, ag: 2 },
    { h: "Wolves", a: "Brighton", hg: 2, ag: 1 }, { h: "Manchester Reds", a: "West Brom", hg: 1, ag: 3 },
    { h: "London Reds", a: "Everton", hg: 1, ag: 1 }, { h: "Leicester", a: "London Blues", hg: 1, ag: 3 },
    { h: "Tottenham", a: "Fulham", hg: 2, ag: 2 }, { h: "Newcastle", a: "Sheffield U", hg: 2, ag: 0 },
    // WEEK 12
    { h: "West Brom", a: "Manchester Blue", hg: 2, ag: 0 }, { h: "Everton", a: "Southampton", hg: 1, ag: 1 },
    { h: "London Reds", a: "Tottenham", hg: 1, ag: 2 }, { h: "Brighton", a: "Palace", hg: 4, ag: 1 },
    { h: "London Blues", a: "Manchester Reds", hg: 1, ag: 1 }, { h: "Burnley", a: "Liverpool", hg: 2, ag: 1 },
    { h: "Fulham", a: "Leicester", hg: 0, ag: 0 }, { h: "Aston V", a: "Wolves", hg: 2, ag: 1 },
    { h: "Sheffield U", a: "West Ham", hg: 3, ag: 2 }, { h: "Leeds", a: "Newcastle", hg: 1, ag: 1 },
    // WEEK 11
    { h: "Manchester Reds", a: "Fulham", hg: 2, ag: 2 }, { h: "Palace", a: "Burnley", hg: 1, ag: 1 },
    { h: "Aston V", a: "Brighton", hg: 1, ag: 3 }, { h: "Southampton", a: "Tottenham", hg: 0, ag: 3 },
    { h: "Manchester Blue", a: "London Blues", hg: 2, ag: 0 }, { h: "Liverpool", a: "Sheffield U", hg: 1, ag: 1 },
    { h: "Newcastle", a: "Everton", hg: 0, ag: 0 }, { h: "West Ham", a: "Leeds", hg: 2, ag: 1 },
    { h: "Wolves", a: "West Brom", hg: 2, ag: 1 }, { h: "Leicester", a: "London Reds", hg: 1, ag: 0 },
    // WEEK 10
    { h: "Everton", a: "West Ham", hg: 1, ag: 1 }, { h: "Fulham", a: "Manchester Blue", hg: 2, ag: 1 },
    { h: "London Reds", a: "Manchester Reds", hg: 4, ag: 2 }, { h: "Leeds", a: "Liverpool", hg: 1, ag: 4 },
    { h: "Sheffield U", a: "Palace", hg: 2, ag: 2 }, { h: "Southampton", a: "Leicester", hg: 0, ag: 0 },
    { h: "West Brom", a: "Aston V", hg: 0, ag: 0 }, { h: "Tottenham", a: "Newcastle", hg: 1, ag: 1 },
    { h: "Brighton", a: "Burnley", hg: 1, ag: 2 }, { h: "London Blues", a: "Wolves", hg: 0, ag: 1 },
    // WEEK 9
    { h: "Manchester Reds", a: "Southampton", hg: 1, ag: 1 }, { h: "Wolves", a: "Fulham", hg: 0, ag: 0 },
    { h: "West Brom", a: "Brighton", hg: 0, ag: 0 }, { h: "Manchester Blue", a: "London Reds", hg: 3, ag: 0 },
    { h: "Palace", a: "Leeds", hg: 2, ag: 1 }, { h: "West Ham", a: "Tottenham", hg: 0, ag: 1 },
    { h: "Newcastle", a: "Leicester", hg: 1, ag: 1 }, { h: "Liverpool", a: "Everton", hg: 1, ag: 0 },
    { h: "Aston V", a: "London Blues", hg: 0, ag: 0 }, { h: "Burnley", a: "Sheffield U", hg: 2, ag: 2 },
    // WEEK 8
    { h: "Brighton", a: "Sheffield U", hg: 1, ag: 0 }, { h: "Leicester", a: "West Ham", hg: 2, ag: 0 },
    { h: "London Blues", a: "West Brom", hg: 2, ag: 2 }, { h: "Leeds", a: "Burnley", hg: 3, ag: 2 },
    { h: "Fulham", a: "Aston V", hg: 3, ag: 1 }, { h: "Tottenham", a: "Liverpool", hg: 1, ag: 3 },
    { h: "Newcastle", a: "Manchester Reds", hg: 0, ag: 1 }, { h: "Everton", a: "Palace", hg: 1, ag: 3 },
    { h: "Southampton", a: "Manchester Blue", hg: 2, ag: 2 }, { h: "London Reds", a: "Wolves", hg: 2, ag: 0 },
    // WEEK 7
    { h: "Manchester Blue", a: "Newcastle", hg: 0, ag: 2 }, { h: "Wolves", a: "Southampton", hg: 2, ag: 2 },
    { h: "Sheffield U", a: "Leeds", hg: 0, ag: 2 }, { h: "West Ham", a: "Manchester Reds", hg: 4, ag: 1 },
    { h: "Palace", a: "Tottenham", hg: 1, ag: 2 }, { h: "London Blues", a: "Brighton", hg: 3, ag: 0 },
    { h: "Burnley", a: "Everton", hg: 1, ag: 0 }, { h: "Aston V", a: "London Reds", hg: 4, ag: 2 },
    { h: "West Brom", a: "Fulham", hg: 2, ag: 1 }, { h: "Liverpool", a: "Leicester", hg: 1, ag: 1 },
    // WEEK 6
    { h: "Southampton", a: "Aston V", hg: 1, ag: 3 }, { h: "Fulham", a: "London Blues", hg: 0, ag: 3 },
    { h: "Tottenham", a: "Burnley", hg: 0, ag: 0 }, { h: "Leicester", a: "Palace", hg: 0, ag: 1 },
    { h: "West Ham", a: "Manchester Blue", hg: 2, ag: 1 }, { h: "Newcastle", a: "Wolves", hg: 1, ag: 0 },
    { h: "Manchester Reds", a: "Liverpool", hg: 0, ag: 1 }, { h: "London Reds", a: "West Brom", hg: 3, ag: 0 },
    { h: "Brighton", a: "Leeds", hg: 1, ag: 1 }, { h: "Everton", a: "Sheffield U", hg: 3, ag: 2 },
    // WEEK 5
    { h: "Palace", a: "Manchester Reds", hg: 3, ag: 1 }, { h: "West Ham", a: "Southampton", hg: 1, ag: 1 },
    { h: "London Blues", a: "London Reds", hg: 0, ag: 0 }, { h: "Liverpool", a: "Manchester Blue", hg: 1, ag: 0 },
    { h: "Aston V", a: "Newcastle", hg: 1, ag: 1 }, { h: "Fulham", a: "Brighton", hg: 0, ag: 1 },
    { h: "Burnley", a: "Leicester", hg: 0, ag: 1 }, { h: "Sheffield U", a: "Tottenham", hg: 0, ag: 0 },
    { h: "Leeds", a: "Everton", hg: 0, ag: 1 }, { h: "Wolves", a: "West Ham", hg: 1, ag: 1 }
];

// App Tracking State VARIABLES
let selectedHomeTeam = null;
let selectedAwayTeam = null;

// Initializations on Document Ready
document.addEventListener("DOMContentLoaded", () => {
    buildDropdownOptions("home");
    buildDropdownOptions("away");
    setupDropdownInteractions("home");
    setupDropdownInteractions("away");

    // Process analysis engine on button click
    document.getElementById("crack-btn").addEventListener("click", processAnalysis);
});

// Build standard lists inside custom select targets
function buildDropdownOptions(side) {
    const listContainer = document.getElementById(`${side}-list`);
    listContainer.innerHTML = "";
    
    VALID_TEAMS.forEach(team => {
        const option = document.createElement("div");
        option.className = "custom-option";
        option.textContent = team;
        option.dataset.value = team;
        listContainer.appendChild(option);
    });
}

// Attach event tracking rules to the structural components
function setupDropdownInteractions(side) {
    const trigger = document.getElementById(`${side}-trigger`);
    const optionsPanel = document.getElementById(`${side}-options`);
    const searchField = document.getElementById(`${side}-search`);
    const listContainer = document.getElementById(`${side}-list`);

    // Toggle Dropdown viewing modes
    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        closeAllDropdownsExcept(side);
        optionsPanel.classList.toggle("show");
        if (optionsPanel.classList.contains("show")) {
            searchField.focus();
        }
    });

    // Local Search Filtering Algorithm
    searchField.addEventListener("input", (e) => {
        const text = e.target.value.toLowerCase();
        const options = listContainer.querySelectorAll(".custom-option");
        options.forEach(opt => {
            const isMatch = opt.textContent.toLowerCase().includes(text);
            opt.style.display = isMatch ? "block" : "none";
        });
    });

    // Handle interactive item assignment selection rules
    listContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("custom-option")) {
            const chosenValue = e.target.dataset.value;
            
            trigger.textContent = chosenValue;
            optionsPanel.classList.remove("show");
            searchField.value = "";
            resetOptionVisibility(listContainer);

            if (side === "home") {
                selectedHomeTeam = chosenValue;
            } else {
                selectedAwayTeam = chosenValue;
            }
        }
    });
}

function resetOptionVisibility(container) {
    const options = container.querySelectorAll(".custom-option");
    options.forEach(opt => opt.style.display = "block");
}

function closeAllDropdownsExcept(activeSide) {
    ["home", "away"].forEach(side => {
        if (side !== activeSide) {
            document.getElementById(`${side}-options`).classList.remove("show");
        }
    });
}

// Globally capture click windows to shut loose elements safely
document.addEventListener("click", () => {
    document.getElementById("home-options").classList.remove("show");
    document.getElementById("away-options").classList.remove("show");
});

// Looks for an exact historical match in the database, or runs an intuitive prediction
function findHistoricalRelationship(home, away) {
    // Check for an exact matching fixture in history
    let directMatch = MATCH_LIBRARY.find(m => m.h === home && m.a === away);
    if (directMatch) {
Use code with caution.return { type: "DIRECT_HISTORICAL", match: directMatch };}
    // Check for the inverted fixture (Away team hosted Home team previously)
    let reverseMatch = MATCH_LIBRARY.find(m => m.h === away && m.a === home);if (reverseMatch) {return { type: "REVERSE_HISTORICAL", match: reverseMatch };}
    // If no direct data point is available, extract average metrics for each team to run a logical deduction
    let homeStats = calculateTeamMetrics(home);
    let awayStats = calculateTeamMetrics(away);
    return {
        type: "LOGICAL_DEDUCTION",homeExpectedGoals: ((homeStats.avgScoredHome + awayStats.avgConcededAway) / 2 || 1.3),awayExpectedGoals: ((awayStats.avgScoredAway + homeStats.avgConcededHome) / 2 || 1.0) 
    };
   }

function calculateTeamMetrics(team) {
    let stats = { homeGames: 0, awayGames: 0, scoredHome: 0, concededHome: 0, scoredAway: 0, 
    concededAway: 0 };
    MATCH_LIBRARY.forEach(m => {
   
    if (m.h === team) {
        stats.homeGames++;
        stats.scoredHome += m.hg;
        stats.concededHome += m.ag;} 
    
    else if (m.a === team) {
        stats.awayGames++;
        stats.scoredAway += m.ag;
        stats.concededAway += m.hg;
       }
     }                
    );
    return {avgScoredHome: 
        stats.homeGames ? 
        stats.scoredHome / 
        stats.homeGames : 1.4,avgConcededHome: 
        stats.homeGames ? 
        stats.concededHome / 
        stats.homeGames : 1.1,avgScoredAway: 
        stats.awayGames ? 
        stats.scoredAway / 
        stats.awayGames : 1.0,avgConcededAway: 
        stats.awayGames ? 
        stats.concededAway / 
        stats.awayGames : 1.3
       }
    ;}

// Engine Calculation Execution Module
function processAnalysis() {
    // 1. Validation checks
    if (!selectedHomeTeam || !selectedAwayTeam) {
        alert("Selection Error: Please pick distinct home and away teams first.");
        return;
    }
    if (selectedHomeTeam === selectedAwayTeam) {
        alert("Configuration Error: A team cannot play matches against itself.");
        return;
    }

    const hOdds = parseFloat(document.getElementById("home-odds").value);
    const dOdds = parseFloat(document.getElementById("draw-odds").value);
    const aOdds = parseFloat(document.getElementById("away-odds").value);

    if (isNaN(hOdds) || isNaN(dOdds) || isNaN(aOdds) || hOdds <= 1.0 || dOdds <= 1.0 || aOdds <= 1.0) {
        alert("Input Value Error: Please set numerical odds values higher than 1.00");
        return;
    }

    // 2. Algorithm Core Processing Mechanics
    const rawHProb = 1 / hOdds;
    const rawDProb = 1 / dOdds;
    const rawAProb = 1 / aOdds;
    const totalMargin = rawHProb + rawDProb + rawAProb;

    const hProbPercent = ((rawHProb / totalMargin) * 100).toFixed(1);
    const dProbPercent = ((rawDProb / totalMargin) * 100).toFixed(1);
    const aProbPercent = ((rawAProb / totalMargin) * 100).toFixed(1);
    const bookieMarginPercent = ((totalMargin - 1) * 100).toFixed(2);

    const homeTier = TEAM_TIERS[selectedHomeTeam];
    const awayTier = TEAM_TIERS[selectedAwayTeam];
    const tierDifferential = awayTier - homeTier;

    let prediction = "";
    let confidence = "";
    let dangerFlag = "NONE";
    let expectedTemplates = [];

    // --- INTEGRATING LIBRARY LOGIC INTO THE LIVE ODDS CALCULATION ---
    if (relationalNetwork.type === "DIRECT_HISTORICAL") {
        let historicalMatch = relationalNetwork.match;
        dangerFlag = MATCH LIBRARY RECON: These teams met previously. Scoreline was [ ${historicalMatch.hg} - ${historicalMatch.ag} ]. The algorithm          heavily favors mirroring or bouncing score timelines.;
        
        // Adjust baseline probability calculation by 10% to weight past results
        if (historicalMatch.hg > historicalMatch.ag) hProbPercent += 10;
        else if (historicalMatch.hg < historicalMatch.ag) aProbPercent += 10;
        else dProbPercent += 10;
    }
        else if (relationalNetwork.type === "REVERSE_HISTORICAL") {
            let historicalMatch = relationalNetwork.match;
            dangerFlag = REVERSE MATRIX MATCH: Met in opposing ground configuration previously where score was [ ${historicalMatch.hg} - ${historicalMatch.ag} ]. Engine usually applies a home-ground inverse multiplier.;
        }
    // Execute prediction classification using the combined logic matrix
        if (hOdds <= 1.45 || aOdds <= 1.45) {
        const favTeam = hOdds <= 1.45 ? 
            selectedHomeTeam : selectedAwayTeam;
            prediction = DRAW (X) or ${favTeam} Narrow Win;
            confidence = "MEDIUM-LOW (Favorite Trap Detected)";
            expectedTemplates = ["0-0_A (Clean Sheet Anchor)", "1-1_C (Late Equalizer)"];
        }
        else if (hProbPercent > aProbPercent && tierDifferential >= 0.5) {
        if (hOdds <= 1.85) {prediction = HOME WIN (1) - ${selectedHomeTeam};
                            confidence = "HIGH";
                            expectedTemplates = ["2-0_A", "2-1_B"];
        if (tierDifferential >= 2) expectedTemplates.push("4-1_Blowout");
                           } 
        else {prediction = HOME WIN (1) or DRAW (X);
              confidence = "MEDIUM";
              expectedTemplates = ["1-0_B", "1-1_Static"];
             }
        }
        else if (aProbPercent > hProbPercent && tierDifferential <= -0.5) {
            if (aOdds <= 1.85) {prediction = AWAY WIN (2) - ${selectedAwayTeam};
                                confidence = "HIGH";
                                expectedTemplates = ["0-2_A", "1-3_Template"];
                               } 
            else {prediction = AWAY WIN (2) or DRAW (X);
                  confidence = "MEDIUM";
                  expectedTemplates = ["0-1_A", "1-1_Anchor"];
                 }
        }
        else {prediction = "DRAW (X)";
              confidence = "MEDIUM";
              dangerFlag = "HIGH DRAW MATRIX: Even network history profiles triggered an Under-2.5 systemic correction pattern.";expectedTemplates = ["1-1_A", "0-0_Static"];
             }
    // Render calculations back out to UI
    document.getElementById("res-matchup").textContent = ${selectedHomeTeam} (Tier ${homeTier}) vs ${selectedAwayTeam} (Tier ${awayTier});
    document.getElementById("res-true-odds").textContent = Home: ${hProbPercent.toFixed(1)}% | Draw: ${dProbPercent.toFixed(1)}% | Away:                     ${aProbPercent.toFixed(1)}%;
    document.getElementById("res-margin").textContent = ${bookieMarginPercent}% Extra Profit Margin Detected;
    document.getElementById("res-winner").textContent = prediction;
    document.getElementById("res-confidence").textContent = confidence;
    const 
        confEl =  document.getElementById("res-confidence");
        confEl.className = "value";
    if (confidence === "HIGH")
        confEl.classList.add("text-green");
    else if (confidence === "MEDIUM") 
        confEl.classList.add("text-yellow");
    else
        confEl.classList.add("text-red");
    const
        riskEl = document.getElementById("res-risk");
        riskEl.textContent = dangerFlag;
        riskEl.className = "value-text " + (dangerFlag === "NONE" ? "text-green" : "text-red");
    const
        listEl = document.getElementById("res-templates");
        listEl.innerHTML = "";expectedTemplates.forEach(tpl => {
    const item = document.createElement("li");
        item.textContent = -> Template ${tpl};listEl.appendChild(item);
        }
        );
    document.getElementById("results-panel").classList.remove("hidden");}

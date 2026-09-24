// 1. Historical Database Data Structures (Kept strictly for dropdown lists)
const TEAM_TIERS = {
    "London Blues": 1, "Liverpool": 1, "Manchester Blue": 1, "London Reds": 1,
    "Manchester Reds": 2, "Aston V": 2, "Newcastle": 2, "Tottenham": 2, "Everton": 2,
    "Leicester": 3, "West Brom": 3, "Wolves": 3, "Palace": 3, "Brighton": 3, "West Ham": 3,
    "Leeds": 4, "Burnley": 4, "Fulham": 4, "Southampton": 4, "Sheffield U": 4
};

const VALID_TEAMS = Object.keys(TEAM_TIERS).sort();

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
    if (!listContainer) return;
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

    if (!trigger || !optionsPanel || !searchField || !listContainer) return;

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
        const panel = document.getElementById(`${side}-options`);
        if (side !== activeSide && panel) {
            panel.classList.remove("show");
        }
    });
}

// Globally capture click windows to shut loose elements safely
document.addEventListener("click", () => {
    const homeOpts = document.getElementById("home-options");
    const awayOpts = document.getElementById("away-options");
    if (homeOpts) homeOpts.classList.remove("show");
    if (awayOpts) awayOpts.classList.remove("show");
});

// UPGRADED Engine Calculation Execution Module
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

    // Dynamic footprint variables hooked to new quick inputs
    const matchday = parseInt(document.getElementById("input-matchday").value) || 20; 
    const homeRank = parseInt(document.getElementById("home-table-rank").value) || 10;

    if (isNaN(hOdds) || isNaN(dOdds) || isNaN(aOdds) || hOdds <= 1.0 || dOdds <= 1.0 || aOdds <= 1.0) {
        alert("Input Value Error: Please set numerical odds values higher than 1.00");
        return;
    }

    // 2. Pure Market Probability Math (Ignoring historical Tiers entirely)
    const rawHProb = 1 / hOdds;
    const rawDProb = 1 / dOdds;
    const rawAProb = 1 / aOdds;
    const totalMargin = rawHProb + rawDProb + rawAProb;

    // True mathematical probabilities (scaled to equal exactly 100% profile balance)
    const trueHProb = rawHProb / totalMargin;
    const trueDProb = rawDProb / totalMargin;
    const trueAProb = rawAProb / totalMargin;

    const hProbPercent = (trueHProb * 100).toFixed(1);
    const dProbPercent = (trueDProb * 100).toFixed(1);
    const aProbPercent = (trueAProb * 100).toFixed(1);
    const bookieMarginPercent = ((totalMargin - 1) * 100).toFixed(2);

    let prediction = "";
    let confidence = "";
    let dangerFlag = "NONE";
    let expectedTemplates = [];

    // 3. Automated Footprint Matching Matrix
    
    // Footprint Flag A: High-Overround Market Trap
    if (parseFloat(bookieMarginPercent) > 8.5) {
        prediction = "SKIP MATCH (Market Over-Inflated)";
        confidence = "VERY LOW";
        dangerFlag = `CRITICAL: Bookie margin is at ${bookieMarginPercent}%. High-variance RNG algorithm trap setup.`;
        expectedTemplates = ["RNG Spike Threat", "Market Cleansing Timeline"];
    }
    // Footprint Flag B: Early Season Chaos Loop (Matchdays 1-10)
    else if (matchday <= 10) {
        dangerFlag = "EARLY SEASON CHAOS: Fresh RNG sequence initializing. High underdog variance.";
        expectedTemplates = ["1-1_C (Late Equalizer)", "2-2_Chaos_Template"];
        if (trueHProb >= 0.58) {
            prediction = `HOME WIN (1) or DRAW (X) [Double Chance Mandatory]`;
            confidence = "MEDIUM-LOW";
        } else if (trueAProb >= 0.58) {
            prediction = `AWAY WIN (2) or DRAW (X) [Double Chance Mandatory]`;
            confidence = "MEDIUM-LOW";
        } else {
            prediction = "OVER 1.5 GOALS (Bypass 1X2 market profiles)";
            confidence = "MEDIUM";
        }
    }
    // Footprint Flag C: Late Season Stabilization / Forced Correction (Matchdays 25-38)
    else if (matchday >= 25 && homeRank <= 4 && trueHProb >= 0.52) {
        prediction = `STRAIGHT HOME WIN (1) - ${selectedHomeTeam}`;
        confidence = "MAXIMUM (High Regression Weights)";
        dangerFlag = "STABILIZATION WINDOW: The engine is forcing table normalization profiles.";
        expectedTemplates = ["2-0_Standard (14', 61')", "3-0_Clean_Sheet"];
    }
    // Standard Probability Fallback Matrix
    else {
        if (trueHProb >= 0.55) {
            prediction = `HOME WIN (1) - ${selectedHomeTeam}`;
            confidence = trueHProb >= 0.65 ? "HIGH" : "MEDIUM-HIGH";
            expectedTemplates = ["2-0_A (Standard)", "2-1_Late_Winner"];
            if (hOdds <= 1.45) dangerFlag = "FAVORITE RISK: High favorite cycle suppression threshold active.";
        } 
        else if (trueAProb >= 0.55) {
            prediction = `AWAY WIN (2) - ${selectedAwayTeam}`;
            confidence = trueAProb >= 0.65 ? "HIGH" : "MEDIUM-HIGH";
            expectedTemplates = ["0-2_Clinical", "1-3_Counter"];
            if (aOdds <= 1.45) dangerFlag = "FAVORITE RISK: High favorite cycle suppression threshold active.";
        }
        else {
            // Balanced lines trigger double chance recommendations
            if (Math.abs(trueHProb - trueAProb) <= 0.08) {
                prediction = "DRAW (X) or LOW SCORING SLIGHT EDGE";
                confidence = "MEDIUM";
                dangerFlag = "BALANCED MARKET: High under-2.5 goal defense engine signature detected.";
                expectedTemplates = ["1-1_Anchor", "0-0_Static"];
            } else if (trueHProb > trueAProb) {
                prediction = `HOME WIN (1) or DRAW (X) [Double Chance]`;
                confidence = "MEDIUM";
                expectedTemplates = ["1-0_Tight", "2-1_Late_Winner"];
            } else {
                prediction = `AWAY WIN (2) or DRAW (X) [Double Chance]`;
                confidence = "MEDIUM";
                expectedTemplates = ["0-1_Tight", "1-2_Late_Winner"];
            }
        }
    }

    // 4. Render calculations to UI interface
    document.getElementById("res-matchup").textContent = `${selectedHomeTeam} vs ${selectedAwayTeam} (MD: ${matchday})`;
    document.getElementById("res-true-odds").textContent = `Home: ${hProbPercent}% | Draw: ${dProbPercent}% | Away: ${aProbPercent}%`;
    document.getElementById("res-margin").textContent = `${bookieMarginPercent}% Extra Profit Margin Detected`;
    
    document.getElementById("res-winner").textContent = prediction;
    document.getElementById("res-confidence").textContent = confidence;
    
    // Confidence Class Modifier Setup
    const confEl = document.getElementById("res-confidence");
    confEl.className = "value"; 
    if (confidence.includes("HIGH") || confidence.includes("MAXIMUM")) confEl.classList.add("text-green");

    else if (confidence.includes("MEDIUM")) confEl.classList.add("text-yellow");
    else confEl.classList.add("text-red");
    const riskEl = document.getElementById("res-risk");riskEl.textContent = dangerFlag;riskEl.className = "value-text " + (dangerFlag === "NONE" ? "text-green" : "text-red");
    // Output parsing for template list items
    const listEl = document.getElementById("res-templates");
    if (listEl) {
    listEl.innerHTML = "";
    expectedTemplates.forEach(tpl => {
        const item = document.createElement("li");
        item.textContent = `Dynamic Weight: ${tpl}`;
        listEl.appendChild(item);
    });
}
    // Reveal Output panel element smoothly
    document.getElementById("results-panel").classList.remove("hidden");}

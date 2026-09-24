// 1. Historical Database Data Structures
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

    // Rule Base Matrix implementation mirroring python configurations
    if (hOdds <= 1.45 || aOdds <= 1.45) {
        const favTeam = hOdds <= 1.45 ? selectedHomeTeam : selectedAwayTeam;
        prediction = `DRAW (X) or ${favTeam} Narrow Win`;
        confidence = "MEDIUM-LOW (High Upset Probability)";
        dangerFlag = "CRITICAL: Engine heavily suppresses heavy favorites back-to-back. High probability of a 0-0/1-1 timeline stall.";
        expectedTemplates = ["0-0_A (Clean Sheet Anchor)", "1-1_C (Late Equalizer)", "1-0_B (71st Minute Lock)"];
    } 
    else if (hOdds < dOdds && hOdds < aOdds && tierDifferential >= 1) {
        if (hOdds <= 1.85) {
            prediction = `HOME WIN (1) - ${selectedHomeTeam}`;
            confidence = "HIGH";
            expectedTemplates = ["2-0_A (14', 29')", "3-1_A (39', 55', 85')"];
            if (tierDifferential >= 2) {
                expectedTemplates.push("5-0_Blowout (3', 17', 45', 47', 74')");
            }
        } else {
            prediction = `HOME WIN (1) or DRAW (X)`;
            confidence = "MEDIUM";
            expectedTemplates = ["1-0_B (68')", "2-1_A (35', 78', 2')"];
        }
    } 
    else if (aOdds < dOdds && aOdds < hOdds && tierDifferential <= -1) {
        if (aOdds <= 1.85) {
            prediction = `AWAY WIN (2) - ${selectedAwayTeam}`;
            confidence = "HIGH";
            expectedTemplates = ["1-2_A (12', 48')", "1-3_B (8', 18', 80')"];
            if (tierDifferential <= -2) {
                expectedTemplates.push("1-5_Extreme (16' | 13', 41', 52', 69', 76')");
            }
        } else {
            prediction = `AWAY WIN (2) or DRAW (X)`;
            confidence = "MEDIUM";
            expectedTemplates = ["0-1_A (13')", "2-2_Template"];
        }
    } 
    else {
        prediction = "DRAW (X)";
        confidence = "MEDIUM";
        dangerFlag = "HIGH DRAW MATRIX: Highly balanced market profiles trigger the engine's under-2.5 goal defense script.";
        expectedTemplates = ["1-1_A (69' Anchor)", "0-0_A (Static Clean Sheet)"];
    }

    // 3. Render calculations to UI interface
    document.getElementById("res-matchup").textContent = `${selectedHomeTeam} (Tier ${homeTier}) vs ${selectedAwayTeam} (Tier ${awayTier})`;
    document.getElementById("res-true-odds").textContent = `Home: ${hProbPercent}% | Draw: ${dProbPercent}% | Away: ${aProbPercent}%`;
    document.getElementById("res-margin").textContent = `${bookieMarginPercent}% Extra Profit Margin Detected`;
    
    document.getElementById("res-winner").textContent = prediction;
    document.getElementById("res-confidence").textContent = confidence;
    
    // Confidence Class Modifier Setup
    const confEl = document.getElementById("res-confidence");
    confEl.className = "value"; 
    if (confidence === "HIGH") confEl.classList.add("text-green");
    else if (confidence === "MEDIUM") confEl.classList.add("text-yellow");
    else confEl.classList.add("text-red");

    const riskEl = document.getElementById("res-risk");
    riskEl.textContent = dangerFlag;
    riskEl.className = "value-text " + (dangerFlag === "NONE" ? "text-green" : "text-red");

    // Output parsing for template list items
    const listEl = document.getElementById("res-templates");
    listEl.innerHTML = "";
    expectedTemplates.forEach(tpl => {
        const item = document.createElement("li");
        item.textContent = `-> Template ${tpl}`;
        listEl.appendChild(item);
    });

    // Reveal Output panel element smoothly
    document.getElementById("results-panel").classList.remove("hidden");
}

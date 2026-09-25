const TEAM_TIERS = {
    "London Blues": 1, "Liverpool": 1, "Manchester Blue": 1, "London Reds": 1,
    "Manchester Reds": 2, "Aston V": 2, "Newcastle": 2, "Tottenham": 2, "Everton": 2,
    "Leicester": 3, "West Brom": 3, "Wolves": 3, "Palace": 3, "Brighton": 3, "West Ham": 3,
    "Leeds": 4, "Burnley": 4, "Fulham": 4, "Southampton": 4, "Sheffield U": 4
};

const VALID_TEAMS = Object.keys(TEAM_TIERS).sort();
const SEASON_LENGTH = 38;
let selectedHomeTeam = null;
let selectedAwayTeam = null;

document.addEventListener("DOMContentLoaded", () => {
    buildDropdownOptions("home");
    buildDropdownOptions("away");
    setupDropdownInteractions("home");
    setupDropdownInteractions("away");
    document.getElementById("crack-btn").addEventListener("click", processAnalysis);
});

function buildDropdownOptions(side) {
    const listContainer = document.getElementById(`${side}-list`);
    if (!listContainer) return;

    listContainer.replaceChildren();
    VALID_TEAMS.forEach(team => {
        const option = document.createElement("div");
        option.className = "custom-option";
        option.textContent = team;
        option.dataset.value = team;
        option.setAttribute("role", "option");
        listContainer.appendChild(option);
    });
}

function setupDropdownInteractions(side) {
    const trigger = document.getElementById(`${side}-trigger`);
    const optionsPanel = document.getElementById(`${side}-options`);
    const searchField = document.getElementById(`${side}-search`);
    const listContainer = document.getElementById(`${side}-list`);
    if (!trigger || !optionsPanel || !searchField || !listContainer) return;

    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-expanded", "false");

    const toggle = event => {
        event.stopPropagation();
        closeAllDropdownsExcept(side);
        const isOpen = optionsPanel.classList.toggle("show");
        trigger.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) searchField.focus();
    };

    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(event);
        }
    });

    searchField.addEventListener("input", event => {
        const query = event.target.value.trim().toLocaleLowerCase();
        listContainer.querySelectorAll(".custom-option").forEach(option => {
            option.hidden = !option.textContent.toLocaleLowerCase().includes(query);
        });
    });

    listContainer.addEventListener("click", event => {
        const option = event.target.closest(".custom-option");
        if (!option) return;

        const chosenValue = option.dataset.value;
        trigger.textContent = chosenValue;
        optionsPanel.classList.remove("show");
        trigger.setAttribute("aria-expanded", "false");
        searchField.value = "";
        resetOptionVisibility(listContainer);

        if (side === "home") selectedHomeTeam = chosenValue;
        else selectedAwayTeam = chosenValue;
    });
}

function resetOptionVisibility(container) {
    container.querySelectorAll(".custom-option").forEach(option => {
        option.hidden = false;
    });
}

function closeAllDropdownsExcept(activeSide) {
    ["home", "away"].forEach(side => {
        if (side === activeSide) return;
        const panel = document.getElementById(`${side}-options`);
        const trigger = document.getElementById(`${side}-trigger`);
        if (panel) panel.classList.remove("show");
        if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
}

document.addEventListener("click", () => closeAllDropdownsExcept(null));

function getPositiveNumber(id) {
    const value = Number.parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(value) && value > 1 ? value : null;
}

function getIntegerInRange(id, fallback, min, max) {
    const raw = document.getElementById(id)?.value;
    if (raw === "" || raw == null) return fallback;
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

function normalizeProbabilities(values) {
    const total = values.reduce((sum, value) => sum + value, 0);
    return values.map(value => value / total);
}

function softmax(values) {
    const max = Math.max(...values);
    const exponentials = values.map(value => Math.exp(value - max));
    const total = exponentials.reduce((sum, value) => sum + value, 0);
    return exponentials.map(value => value / total);
}

function blendProbabilities(base, adjustment, weight) {
    return normalizeProbabilities(base.map((value, index) => (1 - weight) * value + weight * adjustment[index]));
}

function probabilityLabel(probability) {
    if (probability >= 0.65) return "HIGH";
    if (probability >= 0.52) return "MEDIUM-HIGH";
    if (probability >= 0.42) return "MEDIUM";
    return "LOW";
}

function processAnalysis() {
    if (!selectedHomeTeam || !selectedAwayTeam) {
        alert("Selection Error: Please select both teams.");
        return;
    }
    if (selectedHomeTeam === selectedAwayTeam) {
        alert("Configuration Error: A team cannot play against itself.");
        return;
    }

    const odds = [getPositiveNumber("home-odds"), getPositiveNumber("draw-odds"), getPositiveNumber("away-odds")];
    if (odds.some(value => value === null)) {
        alert("Input Value Error: Enter odds greater than 1.00 for all three outcomes.");
        return;
    }

    const matchday = getIntegerInRange("input-matchday", 20, 1, SEASON_LENGTH);
    const homeRank = getIntegerInRange("home-table-rank", null, 1, 20);
    const awayRank = getIntegerInRange("away-table-rank", null, 1, 20);
    if (matchday === null || homeRank === null || awayRank === null) {
        alert("Input Value Error: Matchday and both league ranks must be valid whole numbers (matchday 1-38, rank 1-20).");
        return;
    }

    // Start with the market consensus, removing the bookmaker's overround.
    // This is a stronger baseline than treating raw implied probabilities as calibrated.
    const rawProbabilities = odds.map(odd => 1 / odd);
    const overround = rawProbabilities.reduce((sum, value) => sum + value, 0);
    const market = normalizeProbabilities(rawProbabilities);

    // Add only small, explainable signals. The market remains dominant because no
    // match-history dataset is bundled with this client-side application.
    const tierStrength = team => (5 - TEAM_TIERS[team]) * 0.055;
    const rankSignal = homeRank !== null && awayRank !== null ? (awayRank - homeRank) * 0.012 : 0;
    const homeAdvantage = 0.035;
    const seasonWeight = 0.10 + 0.10 * Math.min(1, (matchday - 1) / (SEASON_LENGTH - 1));
    const strengthLogits = [
        tierStrength(selectedHomeTeam) - tierStrength(selectedAwayTeam) + homeAdvantage + rankSignal,
        -0.015,
        tierStrength(selectedAwayTeam) - tierStrength(selectedHomeTeam) - rankSignal
    ];
    const model = softmax(strengthLogits);
    const probabilities = blendProbabilities(market, model, seasonWeight);

    const [homeProbability, drawProbability, awayProbability] = probabilities;
    const marginPercent = (overround - 1) * 100;
    const percentages = probabilities.map(value => `${(value * 100).toFixed(1)}%`);
    const strongestIndex = probabilities.indexOf(Math.max(...probabilities));
    const strongestProbability = probabilities[strongestIndex];
    const edge = Math.abs(homeProbability - awayProbability);
    const expectedTemplates = [];
    let prediction;
    let dangerFlag = "NONE";

    if (marginPercent > 8.5) {
        prediction = "NO BET (High bookmaker margin)";
        dangerFlag = `HIGH UNCERTAINTY: The bookmaker margin is ${marginPercent.toFixed(2)}%; probability estimates are less reliable.`;
        expectedTemplates.push("Avoid overround-heavy market");
    } else if (strongestIndex === 1 || edge < 0.06) {
        prediction = "DRAW (X) / NO CLEAR WINNER";
        dangerFlag = "CLOSE MARKET: Home and away win probabilities are too close for a strong 1X2 pick.";
        expectedTemplates.push("Balanced outcome", "Low-confidence 1X2");
    } else if (strongestIndex === 0) {
        prediction = `HOME WIN (1) - ${selectedHomeTeam}`;
        expectedTemplates.push(homeProbability >= 0.55 ? "Home edge" : "Narrow home edge");
    } else {
        prediction = `AWAY WIN (2) - ${selectedAwayTeam}`;
        expectedTemplates.push(awayProbability >= 0.55 ? "Away edge" : "Narrow away edge");
    }

    const confidence = probabilityLabel(strongestProbability);
    if (strongestProbability < 0.42) {
        dangerFlag = dangerFlag === "NONE" ? "LOW CONFIDENCE: No outcome reaches a useful probability threshold." : dangerFlag;
    }

    document.getElementById("res-matchup").textContent = `${selectedHomeTeam} vs ${selectedAwayTeam} (MD: ${matchday})`;
    document.getElementById("res-true-odds").textContent = `Home: ${percentages[0]} | Draw: ${percentages[1]} | Away: ${percentages[2]}`;
    document.getElementById("res-margin").textContent = `${marginPercent.toFixed(2)}% bookmaker margin`;
    document.getElementById("res-winner").textContent = prediction;
    document.getElementById("res-confidence").textContent = confidence;

    const confidenceElement = document.getElementById("res-confidence");
    confidenceElement.className = `value ${confidence.includes("HIGH") ? "text-green" : confidence.includes("MEDIUM") ? "text-yellow" : "text-red"}`;
    const riskElement = document.getElementById("res-risk");
    riskElement.textContent = dangerFlag;
    riskElement.className = `value-text ${dangerFlag === "NONE" ? "text-green" : "text-red"}`;

    const listElement = document.getElementById("res-templates");
    listElement.replaceChildren();
    expectedTemplates.forEach(template => {
        const item = document.createElement("li");
        item.textContent = template;
        listElement.appendChild(item);
    });

    document.getElementById("results-panel").classList.remove("hidden");
}

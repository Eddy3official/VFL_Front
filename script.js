const TEAM_TIERS = {
    "London Blues": 1, "Liverpool": 1, "Manchester Blue": 1, "London Reds": 1,
    "Manchester Reds": 2, "Aston V": 2, "Newcastle": 2, "Tottenham": 2, "Everton": 2,
    "Leicester": 3, "West Brom": 3, "Wolves": 3, "Palace": 3, "Brighton": 3, "West Ham": 3,
    "Leeds": 4, "Burnley": 4, "Fulham": 4, "Southampton": 4, "Sheffield U": 4
};

const VALID_TEAMS = Object.keys(TEAM_TIERS).sort();
let selectedHomeTeam = null;
let selectedAwayTeam = null;

document.addEventListener("DOMContentLoaded", () => {
    ["home", "away"].forEach(side => {
        buildDropdownOptions(side);
        setupDropdownInteractions(side);
    });

    const button = document.getElementById("crack-btn");
    if (button) {
        button.addEventListener("click", processAnalysis);
    }
});

function buildDropdownOptions(side) {
    const list = document.getElementById(`${side}-list`);
    if (!list) return;

    list.replaceChildren();
    VALID_TEAMS.forEach(team => {
        const option = document.createElement("div");
        option.className = "custom-option";
        option.textContent = team;
        option.dataset.value = team;
        option.setAttribute("role", "option");
        list.appendChild(option);
    });
}

function setupDropdownInteractions(side) {
    const trigger = document.getElementById(`${side}-trigger`);
    const panel = document.getElementById(`${side}-options`);
    const search = document.getElementById(`${side}-search`);
    const list = document.getElementById(`${side}-list`);

    if (!trigger || !panel || !search || !list) return;

    trigger.setAttribute("aria-expanded", "false");

    const toggle = (event) => {
        event.stopPropagation();
        closeAllDropdownsExcept(side);
        const isOpen = panel.classList.toggle("show");
        trigger.setAttribute("aria-expanded", String(isOpen));
        if (isOpen) {
            search.focus();
        }
    };

    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(event);
        }
    });

    search.addEventListener("input", (event) => {
        const query = event.target.value.trim().toLocaleLowerCase();
        list.querySelectorAll(".custom-option").forEach(option => {
            const isMatch = option.textContent.toLocaleLowerCase().includes(query);
            option.hidden = !isMatch;
        });
    });

    list.addEventListener("click", (event) => {
        const option = event.target.closest(".custom-option");
        if (!option) return;

        const value = option.dataset.value;
        trigger.textContent = value;
        panel.classList.remove("show");
        trigger.setAttribute("aria-expanded", "false");
        search.value = "";
        list.querySelectorAll(".custom-option").forEach(item => {
            item.hidden = false;
        });

        if (side === "home") selectedHomeTeam = value;
        else selectedAwayTeam = value;
    });
}

function closeAllDropdownsExcept(activeSide) {
    ["home", "away"].forEach(side => {
        const panel = document.getElementById(`${side}-options`);
        const trigger = document.getElementById(`${side}-trigger`);

        if (side !== activeSide && panel) {
            panel.classList.remove("show");
        }

        if (trigger) {
            trigger.setAttribute("aria-expanded", "false");
        }
    });
}

document.addEventListener("click", () => {
    closeAllDropdownsExcept(null);
});

function parseNumber(id) {
    const value = Number.parseFloat(document.getElementById(id)?.value);
    return Number.isFinite(value) ? value : null;
}

function parseInteger(id, fallback, min, max) {
    const raw = document.getElementById(id)?.value;
    if (raw === "" || raw == null) return fallback;

    const value = Number.parseInt(raw, 10);
    if (Number.isInteger(value) && value >= min && value <= max) {
        return value;
    }

    return null;
}

function showError(message) {
    window.alert(message);
}

function analyzeFixture(home, away, hOdds, dOdds, aOdds) {
    // Python logic equivalent: bookmaker-implied probabilities and tier differential logic
    const rawHProb = 1 / hOdds;
    const rawDProb = 1 / dOdds;
    const rawAProb = 1 / aOdds;
    const totalMargin = rawHProb + rawDProb + rawAProb;

    const hProb = rawHProb / totalMargin;
    const dProb = rawDProb / totalMargin;
    const aProb = rawAProb / totalMargin;

    const homeTier = TEAM_TIERS[home];
    const awayTier = TEAM_TIERS[away];
    const tierDifferential = awayTier - homeTier;

    let prediction = "";
    let confidence = "";
    let dangerFlag = "NONE";
    const expectedTemplates = [];

    if (hOdds <= 1.45 || aOdds <= 1.45) {
        const favTeam = hOdds <= 1.45 ? home : away;
        prediction = `DRAW (X) or ${favTeam} Narrow Win`;
        confidence = "MEDIUM-LOW (High Upset Probability)";
        dangerFlag = "CRITICAL: Engine heavily suppresses heavy favorites back-to-back. High probability of a 0-0/1-1 timeline stall.";
        expectedTemplates.push("0-0_A (Clean Sheet Anchor)", "1-1_C (Late Equalizer)", "1-0_B (71st Minute Lock)");
    } else if (hOdds < dOdds && hOdds < aOdds && tierDifferential >= 1) {
        if (hOdds <= 1.85) {
            prediction = `HOME WIN (1) - ${home}`;
            confidence = "HIGH";
            expectedTemplates.push("2-0_A (14', 29')", "3-1_A (39', 55', 85')");
            if (tierDifferential >= 2) {
                expectedTemplates.push("5-0_Blowout (3', 17', 45', 47', 74')");
            }
        } else {
            prediction = "HOME WIN (1) or DRAW (X)";
            confidence = "MEDIUM";
            expectedTemplates.push("1-0_B (68')", "2-1_A (35', 78', 2')");
        }
    } else if (aOdds < dOdds && aOdds < hOdds && tierDifferential <= -1) {
        if (aOdds <= 1.85) {
            prediction = `AWAY WIN (2) - ${away}`;
            confidence = "HIGH";
            expectedTemplates.push("1-2_A (12', 48')", "1-3_B (8', 18', 80')");
            if (tierDifferential <= -2) {
                expectedTemplates.push("1-5_Extreme (16' | 13', 41', 52', 69', 76')");
            }
        } else {
            prediction = "AWAY WIN (2) or DRAW (X)";
            confidence = "MEDIUM";
            expectedTemplates.push("0-1_A (13')", "2-2_Template");
        }
    } else {
        prediction = "DRAW (X)";
        confidence = "MEDIUM";
        dangerFlag = "HIGH DRAW MATRIX: Highly balanced market profiles trigger the engine's under-2.5 goal defense script.";
        expectedTemplates.push("1-1_A (69' Anchor)", "0-0_A (Static Clean Sheet)");
    }

    return {
        hProb,
        dProb,
        aProb,
        totalMargin,
        prediction,
        confidence,
        dangerFlag,
        expectedTemplates
    };
}

function renderAnalysis(result, home, away, matchday) {
    const hProbPercent = (result.hProb * 100).toFixed(1);
    const dProbPercent = (result.dProb * 100).toFixed(1);
    const aProbPercent = (result.aProb * 100).toFixed(1);
    const bookieMarginPercent = ((result.totalMargin - 1) * 100).toFixed(2);

    document.getElementById("res-matchup").textContent = `${home} vs ${away} · Matchday ${matchday}`;
    document.getElementById("res-home-prob").textContent = `${hProbPercent}%`;
    document.getElementById("res-draw-prob").textContent = `${dProbPercent}%`;
    document.getElementById("res-away-prob").textContent = `${aProbPercent}%`;

    document.getElementById("res-winner").textContent = result.prediction;
    document.getElementById("res-confidence").textContent = result.confidence;
    document.getElementById("res-margin").textContent = `${bookieMarginPercent}% Extra Profit Margin Detected`;
    document.getElementById("res-risk").textContent = result.dangerFlag;

    const confEl = document.getElementById("res-confidence");
    confEl.className = "confidence";
    if (result.confidence.includes("HIGH")) {
        confEl.classList.add("confidence-high");
    } else if (result.confidence.includes("MEDIUM")) {
        confEl.classList.add("confidence-medium");
    } else {
        confEl.classList.add("confidence-low");
    }

    const riskEl = document.getElementById("res-risk");
    riskEl.className = "value-text";
    if (result.dangerFlag === "NONE") {
        riskEl.classList.add("text-green");
    } else {
        riskEl.classList.add("text-red");
    }

    const listEl = document.getElementById("res-templates");
    if (listEl) {
        listEl.replaceChildren();
        result.expectedTemplates.forEach(template => {
            const item = document.createElement("li");
            item.textContent = template;
            listEl.appendChild(item);
        });
    }

    const panel = document.getElementById("results-panel");
    if (panel) {
        panel.classList.remove("hidden");
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function processAnalysis() {
    if (!selectedHomeTeam || !selectedAwayTeam) {
        showError("Selection Error: Please pick distinct home and away teams first.");
        return;
    }

    if (selectedHomeTeam === selectedAwayTeam) {
        showError("Configuration Error: A team cannot play matches against itself.");
        return;
    }

    const hOdds = parseNumber("home-odds");
    const dOdds = parseNumber("draw-odds");
    const aOdds = parseNumber("away-odds");
    const matchday = parseInteger("input-matchday", 20, 1, 38);

    if (hOdds === null || dOdds === null || aOdds === null || hOdds <= 1.0 || dOdds <= 1.0 || aOdds <= 1.0) {
        showError("Input Value Error: Please set numerical odds values higher than 1.00");
        return;
    }

    if (matchday === null) {
        showError("Input Value Error: Matchday must be a whole number between 1 and 38.");
        return;
    }

    const result = analyzeFixture(selectedHomeTeam, selectedAwayTeam, hOdds, dOdds, aOdds);
    renderAnalysis(result, selectedHomeTeam, selectedAwayTeam, matchday);
}

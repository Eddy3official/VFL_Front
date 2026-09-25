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
    ["home", "away"].forEach(side => { buildDropdownOptions(side); setupDropdownInteractions(side); });
    document.getElementById("crack-btn").addEventListener("click", processAnalysis);
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
    const toggle = event => {
        event.stopPropagation(); closeAllDropdownsExcept(side);
        const open = panel.classList.toggle("show");
        trigger.setAttribute("aria-expanded", String(open));
        if (open) search.focus();
    };
    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(event); }
    });
    search.addEventListener("input", event => {
        const query = event.target.value.trim().toLocaleLowerCase();
        list.querySelectorAll(".custom-option").forEach(option => { option.hidden = !option.textContent.toLocaleLowerCase().includes(query); });
    });
    list.addEventListener("click", event => {
        const option = event.target.closest(".custom-option");
        if (!option) return;
        const value = option.dataset.value;
        trigger.textContent = value; panel.classList.remove("show"); trigger.setAttribute("aria-expanded", "false"); search.value = "";
        list.querySelectorAll(".custom-option").forEach(item => { item.hidden = false; });
        if (side === "home") selectedHomeTeam = value; else selectedAwayTeam = value;
    });
}
function closeAllDropdownsExcept(active) { ["home", "away"].forEach(side => { if (side === active) return; document.getElementById(`${side}-options`)?.classList.remove("show"); document.getElementById(`${side}-trigger`)?.setAttribute("aria-expanded", "false"); }); }
document.addEventListener("click", () => closeAllDropdownsExcept(null));
function numberInput(id) { const value = Number.parseFloat(document.getElementById(id)?.value); return Number.isFinite(value) ? value : null; }
function boundedInteger(id, fallback, min, max) { const raw = document.getElementById(id)?.value; if (raw === "" || raw == null) return fallback; const value = Number.parseInt(raw, 10); return Number.isInteger(value) && value >= min && value <= max ? value : null; }
function normalize(values) { const total = values.reduce((sum, value) => sum + value, 0); return values.map(value => value / total); }
function softmax(values) { const max = Math.max(...values); const exp = values.map(value => Math.exp(value - max)); return normalize(exp); }
function blended(market, model, weight) { return normalize(market.map((value, index) => value * (1 - weight) + model[index] * weight)); }
function confidence(value) { return value >= .65 ? "HIGH" : value >= .52 ? "MEDIUM-HIGH" : value >= .42 ? "MEDIUM" : "LOW"; }
function showError(message) { window.alert(message); }

function processAnalysis() {
    if (!selectedHomeTeam || !selectedAwayTeam) return showError("Please select both teams before running the analysis.");
    if (selectedHomeTeam === selectedAwayTeam) return showError("A team cannot play against itself.");
    const odds = [numberInput("home-odds"), numberInput("draw-odds"), numberInput("away-odds")];
    if (odds.some(value => value === null || value <= 1)) return showError("Enter valid odds greater than 1.00 for all three outcomes.");
    const matchday = boundedInteger("input-matchday", 20, 1, 38);
    const homeRank = boundedInteger("home-table-rank", 10, 1, 20);
    const awayRank = boundedInteger("away-table-rank", 10, 1, 20);
    if ([matchday, homeRank, awayRank].some(value => value === null)) return showError("Matchday must be 1–38 and both league ranks must be whole numbers from 1–20.");

    const raw = odds.map(odd => 1 / odd);
    const overround = raw.reduce((sum, value) => sum + value, 0);
    const market = normalize(raw);
    const tier = team => (5 - TEAM_TIERS[team]) * .055;
    const rankSignal = (awayRank - homeRank) * .012;
    const model = softmax([tier(selectedHomeTeam) - tier(selectedAwayTeam) + .035 + rankSignal, -.015, tier(selectedAwayTeam) - tier(selectedHomeTeam) - rankSignal]);
    const probabilities = blended(market, model, .10 + .10 * ((matchday - 1) / 37));
    const [home, draw, away] = probabilities;
    const strongestIndex = probabilities.indexOf(Math.max(...probabilities));
    const strongest = probabilities[strongestIndex];
    const close = Math.abs(home - away) < .06;
    let prediction = strongestIndex === 0 ? `HOME WIN (1) — ${selectedHomeTeam}` : strongestIndex === 2 ? `AWAY WIN (2) — ${selectedAwayTeam}` : "DRAW (X) / NO CLEAR WINNER";
    let risk = "NONE";
    const signals = [];
    if (overround > 1.085) { prediction = "NO BET — HIGH MARKET MARGIN"; risk = `High uncertainty: bookmaker margin is ${((overround - 1) * 100).toFixed(2)}%.`; signals.push("Overround warning"); }
    if (close || strongestIndex === 1) { risk = risk === "NONE" ? "Close probabilities make a strong 1X2 selection unreliable." : risk; signals.push("Balanced outcome"); }
    if (strongest < .42) { risk = "No outcome reaches a strong probability threshold."; signals.push("Low-confidence market"); }
    if (!signals.length) signals.push(strongestIndex === 0 ? "Home edge" : "Away edge");

    document.getElementById("res-matchup").textContent = `${selectedHomeTeam} vs ${selectedAwayTeam} · Matchday ${matchday}`;
    ["home", "draw", "away"].forEach((name, index) => { document.getElementById(`res-${name}-prob`).textContent = `${(probabilities[index] * 100).toFixed(1)}%`; document.querySelector(`.probability-card:nth-child(${index + 1}) i`).style.transform = `scaleX(${probabilities[index]})`; });
    document.getElementById("res-winner").textContent = prediction;
    document.getElementById("res-confidence").textContent = confidence(strongest);
    document.getElementById("res-margin").textContent = `${((overround - 1) * 100).toFixed(2)}%`;
    document.getElementById("res-risk").textContent = risk;
    const list = document.getElementById("res-templates"); list.replaceChildren(); signals.forEach(signal => { const item = document.createElement("li"); item.textContent = signal; list.appendChild(item); });
    document.getElementById("results-panel").classList.remove("hidden");
    document.getElementById("results-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}

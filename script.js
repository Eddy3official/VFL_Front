const TEAM_TIERS = {
    "London Blues": 1, "Liverpool": 1, "Manchester Blue": 1, "London Reds": 1,
    "Manchester Reds": 2, "Aston V": 2, "Newcastle": 2, "Tottenham": 2, "Everton": 2,
    "Leicester": 3, "West Brom": 3, "Wolves": 3, "Palace": 3, "Brighton": 3, "West Ham": 3,
    "Leeds": 4, "Burnley": 4, "Fulham": 4, "Southampton": 4, "Sheffield U": 4
};

const VALID_TEAMS = Object.keys(TEAM_TIERS).sort();
const STORAGE_KEY = "odileague.match-history.v1";
const MAX_HISTORY = 1000;
let selectedHomeTeam = null;
let selectedAwayTeam = null;
let lastAnalysis = null;

const $ = id => document.getElementById(id);

window.addEventListener("DOMContentLoaded", () => {
    ["home", "away"].forEach(side => {
        buildDropdownOptions(side);
        setupDropdownInteractions(side);
    });
    $("crack-btn")?.addEventListener("click", processAnalysis);
    setupDataTools();
    restoreDraft();
    registerServiceWorker();
});

function buildDropdownOptions(side) {
    const list = $(`${side}-list`);
    if (!list) return;
    list.replaceChildren();
    VALID_TEAMS.forEach(team => {
        const option = document.createElement("div");
        option.className = "custom-option";
        option.textContent = team;
        option.dataset.value = team;
        option.setAttribute("role", "option");
        option.tabIndex = 0;
        list.appendChild(option);
    });
}

function setupDropdownInteractions(side) {
    const trigger = $(`${side}-trigger`), panel = $(`${side}-options`);
    const search = $(`${side}-search`), list = $(`${side}-list`);
    if (!trigger || !panel || !search || !list) return;
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const toggle = event => {
        event.stopPropagation();
        const opening = !panel.classList.contains("show");
        closeAllDropdownsExcept(side);
        panel.classList.toggle("show", opening);
        trigger.setAttribute("aria-expanded", String(opening));
        if (opening) search.focus();
    };
    trigger.addEventListener("click", toggle);
    trigger.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(event); }
        if (event.key === "Escape") closeAllDropdownsExcept(null);
    });
    search.addEventListener("input", event => {
        const query = event.target.value.trim().toLocaleLowerCase();
        list.querySelectorAll(".custom-option").forEach(option => {
            option.hidden = !option.textContent.toLocaleLowerCase().includes(query);
        });
    });
    list.addEventListener("click", event => selectOption(event.target.closest(".custom-option"), side));
    list.addEventListener("keydown", event => {
        if ((event.key === "Enter" || event.key === " ") && event.target.matches(".custom-option")) {
            event.preventDefault(); selectOption(event.target, side);
        }
    });
}

function selectOption(option, side) {
    if (!option) return;
    const value = option.dataset.value;
    $(`${side}-trigger`).textContent = value;
    $(`${side}-options`).classList.remove("show");
    $(`${side}-trigger`).setAttribute("aria-expanded", "false");
    $(`${side}-search`).value = "";
    $(`${side}-list`).querySelectorAll(".custom-option").forEach(item => item.hidden = false);
    if (side === "home") selectedHomeTeam = value; else selectedAwayTeam = value;
    saveDraft();
}

function closeAllDropdownsExcept(activeSide) {
    ["home", "away"].forEach(side => {
        const panel = $(`${side}-options`), trigger = $(`${side}-trigger`);
        if (side !== activeSide) panel?.classList.remove("show");
        trigger?.setAttribute("aria-expanded", "false");
    });
}
document.addEventListener("click", () => closeAllDropdownsExcept(null));

function parseNumber(id) {
    const value = Number.parseFloat($(id)?.value);
    return Number.isFinite(value) ? value : null;
}
function parseInteger(id, fallback, min, max) {
    const raw = $(id)?.value;
    if (raw === "" || raw == null) return fallback;
    const value = Number.parseInt(raw, 10);
    return Number.isInteger(value) && value >= min && value <= max ? value : null;
}
function showError(message) { window.alert(message); }

function analyzeFixture(home, away, hOdds, dOdds, aOdds) {
    const rawHProb = 1 / hOdds, rawDProb = 1 / dOdds, rawAProb = 1 / aOdds;
    const totalMargin = rawHProb + rawDProb + rawAProb;
    const hProb = rawHProb / totalMargin, dProb = rawDProb / totalMargin, aProb = rawAProb / totalMargin;
    const homeTier = TEAM_TIERS[home], awayTier = TEAM_TIERS[away];
    const tierDifferential = awayTier - homeTier;
    let prediction = "", confidence = "", dangerFlag = "NONE";
    const expectedTemplates = [];

    // These branches intentionally mirror the supplied Python base logic.
    if (hOdds <= 1.45 || aOdds <= 1.45) {
        const favTeam = hOdds <= 1.45 ? home : away;
        prediction = `DRAW (X) or ${favTeam} Narrow Win`;
        confidence = "MEDIUM-LOW (High Upset Probability)";
        dangerFlag = "CRITICAL: Engine heavily suppresses heavy favorites back-to-back. High probability of a 0-0/1-1 timeline stall.";
        expectedTemplates.push("0-0_A (Clean Sheet Anchor)", "1-1_C (Late Equalizer)", "1-0_B (71st Minute Lock)");
    } else if (hOdds < dOdds && hOdds < aOdds && tierDifferential >= 1) {
        if (hOdds <= 1.85) { prediction = `HOME WIN (1) - ${home}`; confidence = "HIGH"; expectedTemplates.push("2-0_A (14', 29')", "3-1_A (39', 55', 85')"); if (tierDifferential >= 2) expectedTemplates.push("5-0_Blowout (3', 17', 45', 47', 74')"); }
        else { prediction = "HOME WIN (1) or DRAW (X)"; confidence = "MEDIUM"; expectedTemplates.push("1-0_B (68')", "2-1_A (35', 78', 2')"); }
    } else if (aOdds < dOdds && aOdds < hOdds && tierDifferential <= -1) {
        if (aOdds <= 1.85) { prediction = `AWAY WIN (2) - ${away}`; confidence = "HIGH"; expectedTemplates.push("1-2_A (12', 48')", "1-3_B (8', 18', 80')"); if (tierDifferential <= -2) expectedTemplates.push("1-5_Extreme (16' | 13', 41', 52', 69', 76')"); }
        else { prediction = "AWAY WIN (2) or DRAW (X)"; confidence = "MEDIUM"; expectedTemplates.push("0-1_A (13')", "2-2_Template"); }
    } else {
        prediction = "DRAW (X)"; confidence = "MEDIUM";
        dangerFlag = "HIGH DRAW MATRIX: Highly balanced market profiles trigger the engine's under-2.5 goal defense script.";
        expectedTemplates.push("1-1_A (69' Anchor)", "0-0_A (Static Clean Sheet)");
    }
    return { hProb, dProb, aProb, totalMargin, prediction, confidence, dangerFlag, expectedTemplates };
}

function renderAnalysis(result, home, away, matchday, historical) {
    $("res-matchup").textContent = `${home} vs ${away} · Matchday ${matchday}`;
    $("res-home-prob").textContent = `${(result.hProb * 100).toFixed(1)}%`;
    $("res-draw-prob").textContent = `${(result.dProb * 100).toFixed(1)}%`;
    $("res-away-prob").textContent = `${(result.aProb * 100).toFixed(1)}%`;
    $("res-winner").textContent = result.prediction;
    $("res-confidence").textContent = result.confidence;
    $("res-margin").textContent = `${((result.totalMargin - 1) * 100).toFixed(2)}% Extra Profit Margin Detected`;
    $("res-risk").textContent = result.dangerFlag;
    const confEl = $("res-confidence"); confEl.className = "confidence";
    confEl.classList.add(result.confidence.includes("HIGH") ? "confidence-high" : result.confidence.includes("MEDIUM") ? "confidence-medium" : "confidence-low");
    const riskEl = $("res-risk"); riskEl.className = "value-text"; riskEl.classList.add(result.dangerFlag === "NONE" ? "text-green" : "text-red");
    const listEl = $("res-templates");
    if (listEl) { listEl.replaceChildren(); result.expectedTemplates.forEach(template => { const item = document.createElement("li"); item.textContent = template; listEl.appendChild(item); }); }
    renderHistoricalContext(historical);
    $("results-panel")?.classList.remove("hidden");
    $("results-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadHistory() {
    try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(data) ? data : []; }
    catch { return []; }
}
function saveHistory(history) { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); }
function saveDraft() {
    const draft = { home: selectedHomeTeam, away: selectedAwayTeam, homeOdds: $("home-odds")?.value || "", drawOdds: $("draw-odds")?.value || "", awayOdds: $("away-odds")?.value || "", matchday: $("input-matchday")?.value || "" };
    localStorage.setItem(`${STORAGE_KEY}.draft`, JSON.stringify(draft));
}
function restoreDraft() {
    try {
        const draft = JSON.parse(localStorage.getItem(`${STORAGE_KEY}.draft`) || "null");
        if (!draft) return;
        if (VALID_TEAMS.includes(draft.home)) selectOption($(`${"home-list"}`)?.querySelector(`[data-value="${CSS.escape(draft.home)}"]`), "home");
        if (VALID_TEAMS.includes(draft.away)) selectOption($(`${"away-list"}`)?.querySelector(`[data-value="${CSS.escape(draft.away)}"]`), "away");
        [["home-odds", draft.homeOdds], ["draw-odds", draft.drawOdds], ["away-odds", draft.awayOdds], ["input-matchday", draft.matchday]].forEach(([id, value]) => { if ($(id) && value !== "") $(id).value = value; });
    } catch { /* Ignore a damaged draft and keep the form usable. */ }
}
function renderHistoricalContext(history) {
    const element = $("historical-context"); if (!element) return;
    const relevant = history.filter(item => item.home === selectedHomeTeam && item.away === selectedAwayTeam);
    const outcomes = relevant.filter(item => item.actualOutcome);
    element.textContent = relevant.length ? `Stored context: ${relevant.length} prior analysis record(s), ${outcomes.length} with a recorded outcome. Base rules remain unchanged.` : "Stored context: no previous record for this exact fixture. Base rules remain unchanged.";
}

function processAnalysis() {
    if (!selectedHomeTeam || !selectedAwayTeam) return showError("Selection Error: Please pick distinct home and away teams first.");
    if (selectedHomeTeam === selectedAwayTeam) return showError("Configuration Error: A team cannot play against itself.");
    const hOdds = parseNumber("home-odds"), dOdds = parseNumber("draw-odds"), aOdds = parseNumber("away-odds");
    const matchday = parseInteger("input-matchday", 20, 1, 38);
    if ([hOdds, dOdds, aOdds].some(value => value === null || value <= 1.0)) return showError("Input Value Error: Please set numerical odds values higher than 1.00");
    if (matchday === null) return showError("Input Value Error: Matchday must be a whole number between 1 and 38.");
    const result = analyzeFixture(selectedHomeTeam, selectedAwayTeam, hOdds, dOdds, aOdds);
    lastAnalysis = { id: crypto.randomUUID?.() || String(Date.now()), timestamp: new Date().toISOString(), home: selectedHomeTeam, away: selectedAwayTeam, hOdds, dOdds, aOdds, matchday, prediction: result.prediction };
    const history = loadHistory(); history.push(lastAnalysis); saveHistory(history); saveDraft();
    renderAnalysis(result, selectedHomeTeam, selectedAwayTeam, matchday, history);
}

function setupDataTools() {
    const panel = document.createElement("section"); panel.className = "data-tools"; panel.innerHTML = `<div><strong>League data</strong><small id="historical-context">Stored context is used as transparent reference only.</small></div><div class="data-actions"><button type="button" id="export-copy">Copy JSON</button><button type="button" id="export-download">Download LEAGUE.json</button><button type="button" id="import-data">Import JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden></div><div class="outcome-actions"><label for="actual-outcome">Record result (optional)</label><select id="actual-outcome"><option value="">Not recorded</option><option value="HOME">Home win</option><option value="DRAW">Draw</option><option value="AWAY">Away win</option></select><button type="button" id="save-outcome">Save result</button></div>`;
    $("crack-btn")?.parentElement?.insertAdjacentElement("afterend", panel);
    $("export-copy")?.addEventListener("click", async () => { await navigator.clipboard.writeText(JSON.stringify(loadHistory(), null, 2)); showError("League data copied as JSON."); });
    $("export-download")?.addEventListener("click", () => { const blob = new Blob([JSON.stringify(loadHistory(), null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "LEAGUE.json"; link.click(); URL.revokeObjectURL(link.href); });
    $("import-data")?.addEventListener("click", () => $("import-file")?.click());
    $("import-file")?.addEventListener("change", event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const data = JSON.parse(reader.result); if (!Array.isArray(data)) throw new Error(); saveHistory(data.filter(item => item && item.home && item.away)); showError("League data imported successfully."); renderHistoricalContext(loadHistory()); } catch { showError("Import failed: choose a valid LEAGUE.json file."); } }; reader.readAsText(file); });
    $("save-outcome")?.addEventListener("click", () => { if (!lastAnalysis) return showError("Run an analysis before recording its result."); const outcome = $("actual-outcome").value; if (!outcome) return showError("Choose an outcome first."); const history = loadHistory(); const record = [...history].reverse().find(item => item.id === lastAnalysis.id); if (record) record.actualOutcome = outcome; saveHistory(history); renderHistoricalContext(history); showError("Outcome saved to local league data."); });
}

async function registerServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
        try { await navigator.serviceWorker.register("sw.js"); } catch (error) { console.warn("Offline cache unavailable", error); }
    }
}

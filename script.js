const TEAM_TIERS = {
  "London Blues": 1,
  "Liverpool": 1,
  "Manchester Blue": 1,
  "London Reds": 1,
  "Manchester Reds": 2,
  "Aston V": 2,
  "Newcastle": 2,
  "Tottenham": 2,
  "Everton": 2,
  "Leicester": 3,
  "West Brom": 3,
  "Wolves": 3,
  "Palace": 3,
  "Brighton": 3,
  "West Ham": 3,
  "Leeds": 4,
  "Burnley": 4,
  "Fulham": 4,
  "Southampton": 4,
  "Sheffield U": 4,
};

const VALID_TEAMS = Object.keys(TEAM_TIERS).sort();
const STORAGE_KEY = "odileague.match-history.v1";
const DRAFT_KEY = "odileague.draft.v1";
const MAX_HISTORY = 1000;

let selectedHomeTeam = null;
let selectedAwayTeam = null;

const $ = (id) => document.getElementById(id);

function showError(message) {
  const panel = $("results-panel");
  if (!panel) return;

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="match-banner" style="border-color: rgba(255,113,133,.25); color: #ffb5c0;">
      <span>⚠</span>
      <span>${message}</span>
    </div>
  `;
}

function addOption(list, value, label) {
  const option = document.createElement("div");
  option.className = "custom-option";
  option.dataset.value = value;
  option.textContent = label;
  option.setAttribute("role", "option");
  option.addEventListener("click", () => {
    const targetId = list.id.replace("-list", "-trigger");
    const trigger = $(targetId);
    if (!trigger) return;

    const normalized = value.trim();
    const side = targetId.replace("-trigger", "");

    if (side === "home") {
      selectedHomeTeam = normalized;
      trigger.textContent = normalized;
      $("home-options")?.classList.remove("show");
      $("home-trigger").setAttribute("aria-expanded", "false");
      return;
    }

    if (side === "away") {
      selectedAwayTeam = normalized;
      trigger.textContent = normalized;
      $("away-options")?.classList.remove("show");
      $("away-trigger").setAttribute("aria-expanded", "false");
      return;
    }

    trigger.textContent = normalized;
    const hidden = $(side === "matchday" ? "input-matchday" : `${side}-table-rank`);
    if (hidden) hidden.value = normalized;
    $("matchday-options")?.classList.remove("show");
    $("home-rank-options")?.classList.remove("show");
    $("away-rank-options")?.classList.remove("show");
    if ($("matchday-trigger")) $("matchday-trigger").setAttribute("aria-expanded", "false");
    if ($("home-rank-trigger")) $("home-rank-trigger").setAttribute("aria-expanded", "false");
    if ($("away-rank-trigger")) $("away-rank-trigger").setAttribute("aria-expanded", "false");
  });
  list.appendChild(option);
}

function buildTeamOptions(side) {
  const list = $(`${side}-list`);
  if (!list) return;
  list.replaceChildren();
  VALID_TEAMS.forEach((team) => addOption(list, team, team));
}

function buildNumberOptions(name, min, max) {
  const list = $(`${name}-list`);
  if (!list) return;
  list.replaceChildren();
  for (let value = min; value <= max; value += 1) {
    addOption(list, String(value), String(value));
  }
}

function filterOptions(list, query) {
  const term = query.trim().toLowerCase();
  list.querySelectorAll(".custom-option").forEach((option) => {
    const text = option.textContent.toLowerCase();
    option.hidden = term.length > 0 && !text.includes(term);
  });
}

function setupDropdown(side) {
  const trigger = $(`${side}-trigger`);
  const panel = $(`${side}-options`);
  const search = $(`${side}-search`);
  const list = $(`${side}-list`);

  if (!trigger || !panel || !search || !list) return;

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = panel.classList.contains("show");
    closeDropdowns(side);
    if (!isOpen) {
      panel.classList.add("show");
      trigger.setAttribute("aria-expanded", "true");
      search.focus();
    }
  });

  search.addEventListener("input", () => filterOptions(list, search.value));

  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && !trigger.contains(event.target)) {
      panel.classList.remove("show");
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

function setupNumberDropdown(name) {
  const trigger = $(`${name}-trigger`);
  const panel = $(`${name}-options`);
  const list = $(`${name}-list`);

  if (!trigger || !panel || !list) return;

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = panel.classList.contains("show");
    closeDropdowns(name);
    if (!isOpen) {
      panel.classList.add("show");
      trigger.setAttribute("aria-expanded", "true");
    }
  });

  document.addEventListener("click", (event) => {
    if (!panel.contains(event.target) && !trigger.contains(event.target)) {
      panel.classList.remove("show");
      trigger.setAttribute("aria-expanded", "false");
    }
  });
}

function closeDropdowns(activeName = null) {
  ["home", "away", "matchday", "home-rank", "away-rank"].forEach((name) => {
    if (activeName && name === activeName) return;
    const panel = $(`${name}-options`);
    const trigger = $(`${name}-trigger`);
    panel?.classList.remove("show");
    trigger?.setAttribute("aria-expanded", "false");
  });
}

function parseNumber(id) {
  const element = $(id);
  if (!element) return null;
  const value = Number.parseFloat(element.value);
  return Number.isFinite(value) ? value : null;
}

function parseInteger(id, fallback, min, max) {
  const rawValue = $(id)?.value;
  if (rawValue === "" || rawValue === null || rawValue === undefined) {
    return fallback;
  }

  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value)) return fallback;
  if (value < min || value > max) return fallback;
  return value;
}

function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

function saveDraft() {
  const draft = {
    home: selectedHomeTeam,
    away: selectedAwayTeam,
    homeOdds: $("home-odds")?.value || "",
    drawOdds: $("draw-odds")?.value || "",
    awayOdds: $("away-odds")?.value || "",
    matchday: parseInteger("input-matchday", 1, 1, 38),
    homeRank: parseInteger("home-rank-table-rank", 1, 1, 20),
    awayRank: parseInteger("away-rank-table-rank", 1, 1, 20),
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function restoreDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    if (!draft) return;

    if (VALID_TEAMS.includes(draft.home)) {
      selectedHomeTeam = draft.home;
      const homeTrigger = $("home-trigger");
      if (homeTrigger) homeTrigger.textContent = draft.home;
    }

    if (VALID_TEAMS.includes(draft.away)) {
      selectedAwayTeam = draft.away;
      const awayTrigger = $("away-trigger");
      if (awayTrigger) awayTrigger.textContent = draft.away;
    }

    if ($("home-odds") && typeof draft.homeOdds === "string") $("home-odds").value = draft.homeOdds;
    if ($("draw-odds") && typeof draft.drawOdds === "string") $("draw-odds").value = draft.drawOdds;
    if ($("away-odds") && typeof draft.awayOdds === "string") $("away-odds").value = draft.awayOdds;

    const matchday = parseInteger("input-matchday", 1, 1, 38);
    if (matchday >= 1 && matchday <= 38 && $("matchday-trigger")) $("matchday-trigger").textContent = String(matchday);
    const homeRank = parseInteger("home-rank-table-rank", 1, 1, 20);
    if (homeRank >= 1 && homeRank <= 20 && $("home-rank-trigger")) $("home-rank-trigger").textContent = String(homeRank);
    const awayRank = parseInteger("away-rank-table-rank", 1, 1, 20);
    if (awayRank >= 1 && awayRank <= 20 && $("away-rank-trigger")) $("away-rank-trigger").textContent = String(awayRank);
  } catch (error) {
    localStorage.removeItem(DRAFT_KEY);
  }
}

function analyzeFixture(home, away, hOdds, dOdds, aOdds) {
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
  let expectedTemplates = [];

  if (hOdds <= 1.45 || aOdds <= 1.45) {
    const favOdds = hOdds <= 1.45 ? hOdds : aOdds;
    const favTeam = hOdds <= 1.45 ? home : away;
    const dogTeam = hOdds <= 1.45 ? away : home;

    prediction = `DRAW (X) or ${favTeam} Narrow Win`;
    confidence = "MEDIUM-LOW (High Upset Probability)";
    dangerFlag = "CRITICAL: Engine heavily suppresses heavy favorites back-to-back. High probability of a 0-0/1-1 timeline stall.";
    expectedTemplates = ["0-0_A (Clean Sheet Anchor)", "1-1_C (Late Equalizer)", "1-0_B (71st Minute Lock)"];
  } else if (hOdds < dOdds && hOdds < aOdds && tierDifferential >= 1) {
    if (hOdds <= 1.85) {
      prediction = `HOME WIN (1) - ${home}`;
      confidence = "HIGH";
      expectedTemplates = ["2-0_A (14', 29')", "3-1_A (39', 55', 85')"];
      if (tierDifferential >= 2) {
        expectedTemplates.push("5-0_Blowout (3', 17', 45', 47', 74')");
      }
    } else {
      prediction = "HOME WIN (1) or DRAW (X)";
      confidence = "MEDIUM";
      expectedTemplates = ["1-0_B (68')", "2-1_A (35', 78', 2')"];
    }
  } else if (aOdds < dOdds && aOdds < hOdds && tierDifferential <= -1) {
    if (aOdds <= 1.85) {
      prediction = `AWAY WIN (2) - ${away}`;
      confidence = "HIGH";
      expectedTemplates = ["1-2_A (12', 48')", "1-3_B (8', 18', 80')"];
      if (tierDifferential <= -2) {
        expectedTemplates.push("1-5_Extreme (16' | 13', 41', 52', 69', 76')");
      }
    } else {
      prediction = "AWAY WIN (2) or DRAW (X)";
      confidence = "MEDIUM";
      expectedTemplates = ["0-1_A (13')", "2-2_Template"];
    }
  } else {
    prediction = "DRAW (X)";
    confidence = "MEDIUM";
    dangerFlag = "HIGH DRAW MATRIX: Highly balanced market profiles trigger the engine's under-2.5 goal defense script.";
    expectedTemplates = ["1-1_A (69' Anchor)", "0-0_A (Static Clean Sheet)"];
  }

  return {
    home,
    away,
    homeTier,
    awayTier,
    hProb,
    dProb,
    aProb,
    totalMargin,
    prediction,
    confidence,
    dangerFlag,
    expectedTemplates,
    tierDifferential,
  };
}

function renderAnalysis(result, home, away, matchday) {
  const panel = $("results-panel");
  if (!panel) return;

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">02 / OUTPUT</p>
        <h2>Analysis report</h2>
      </div>
      <span class="status-pill">LIVE</span>
    </div>
    <div class="match-banner">
      <span>◎</span>
      <span>${home} vs ${away} · Matchday ${matchday}</span>
    </div>
    <div class="probability-grid">
      <div class="probability-card">
        <label>Home</label>
        <strong>${(result.hProb * 100).toFixed(1)}%</strong>
      </div>
      <div class="probability-card">
        <label>Draw</label>
        <strong>${(result.dProb * 100).toFixed(1)}%</strong>
      </div>
      <div class="probability-card">
        <label>Away</label>
        <strong>${(result.aProb * 100).toFixed(1)}%</strong>
      </div>
    </div>
    <div class="result-block">
      <p class="label">Probability math</p>
      <div class="metric-row"><span>True Math Odds</span><strong>${(result.hProb * 100).toFixed(1)}% / ${(result.dProb * 100).toFixed(1)}% / ${(result.aProb * 100).toFixed(1)}%</strong></div>
      <div class="metric-row"><span>Bookie Margin</span><strong>${((result.totalMargin - 1) * 100).toFixed(2)}% Extra Profit Margin Detected</strong></div>
    </div>
    <div class="result-block result-lead">
      <p class="label">Probable winner</p>
      <h3>${result.prediction}</h3>
      <p class="confidence">Algo Confidence: ${result.confidence}</p>
    </div>
    <div class="result-block">
      <p class="label">Risk assessment</p>
      <p>${result.dangerFlag}</p>
    </div>
    <div class="result-block">
      <p class="label">Match timeline templates</p>
      <ul>
        ${result.expectedTemplates.map((template) => `<li>${template}</li>`).join("")}
      </ul>
    </div>
  `;
}

function processAnalysis() {
  if (!selectedHomeTeam || !selectedAwayTeam) {
    showError("Selection Error: Please pick distinct home and away teams first.");
    return;
  }

  if (selectedHomeTeam === selectedAwayTeam) {
    showError("Selection Error: Home and away teams cannot be the same.");
    return;
  }

  const homeOdds = parseNumber("home-odds");
  const drawOdds = parseNumber("draw-odds");
  const awayOdds = parseNumber("away-odds");

  if (homeOdds === null || drawOdds === null || awayOdds === null) {
    showError("Input Error: Please enter valid decimal odds for home, draw and away.");
    return;
  }

  if (homeOdds <= 1 || drawOdds <= 1 || awayOdds <= 1) {
    showError("Input Error: Odds must be greater than 1.00.");
    return;
  }

  const matchday = parseInteger("input-matchday", 1, 1, 38);
  const analysis = analyzeFixture(selectedHomeTeam, selectedAwayTeam, homeOdds, drawOdds, awayOdds);
  renderAnalysis(analysis, selectedHomeTeam, selectedAwayTeam, matchday);

  const history = loadHistory();
  history.unshift({
    home: selectedHomeTeam,
    away: selectedAwayTeam,
    homeOdds,
    drawOdds,
    awayOdds,
    matchday,
    prediction: analysis.prediction,
    confidence: analysis.confidence,
    timestamp: new Date().toISOString(),
  });
  saveHistory(history);
  saveDraft();
}

function setupDataTools() {
  const panel = document.createElement("section");
  panel.className = "data-tools";
  panel.innerHTML = `
    <div>
      <strong>League data</strong>
      <small>Stored context is used as transparent probability signals.</small>
    </div>
    <div>
      <strong>Model notes</strong>
      <small>Historical pattern logic is driven by tier pressure, market overround and upset suppression.</small>
    </div>
  `;

  const resultsPanel = $("results-panel");
  if (resultsPanel) {
    resultsPanel.appendChild(panel);
  }
}

async function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    try {
      await navigator.serviceWorker.register("sw.js");
    } catch (error) {
      console.warn("Offline cache unavailable:", error);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ["home", "away"].forEach((side) => {
    buildTeamOptions(side);
    setupDropdown(side);
  });

  buildNumberOptions("matchday", 1, 38);
  buildNumberOptions("home-rank", 1, 20);
  buildNumberOptions("away-rank", 1, 20);

  setupNumberDropdown("matchday");
  setupNumberDropdown("home-rank");
  setupNumberDropdown("away-rank");

  const crackButton = $("crack-btn");
  if (crackButton) {
    crackButton.addEventListener("click", processAnalysis);
  }

  restoreDraft();
  setupDataTools();
  registerServiceWorker();
});

window.addEventListener("beforeunload", saveDraft);

window.addEventListener("storage", (event) => {
  if (event.key === DRAFT_KEY && event.newValue) {
    restoreDraft();
  }
});

function selectTeamFromButton(side, value) {
  if (!value) return;
  if (side === "home") {
    selectedHomeTeam = value;
    const trigger = $("home-trigger");
    if (trigger) trigger.textContent = value;
  } else if (side === "away") {
    selectedAwayTeam = value;
    const trigger = $("away-trigger");
    if (trigger) trigger.textContent = value;
  }
}

function selectMatchday(value) {
  const trigger = $("matchday-trigger");
  const hidden = $("input-matchday");
  if (trigger) trigger.textContent = String(value);
  if (hidden) hidden.value = String(value);
}

function selectRank(name, value) {
  const trigger = $(`${name}-trigger`);
  const hidden = $(`${name}-table-rank`);
  if (trigger) trigger.textContent = String(value);
  if (hidden) hidden.value = String(value);
}

if (typeof window !== "undefined") {
  window.selectTeamFromButton = selectTeamFromButton;
  window.selectMatchday = selectMatchday;
  window.selectRank = selectRank;
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const option = event.target.closest(".custom-option");
    if (!option) return;

    const list = option.parentElement;
    const id = list.id;
    const value = option.dataset.value;

    if (!value) return;

    if (id === "home-list") {
      selectTeamFromButton("home", value);
      $("home-options")?.classList.remove("show");
      $("home-trigger")?.setAttribute("aria-expanded", "false");
    } else if (id === "away-list") {
      selectTeamFromButton("away", value);
      $("away-options")?.classList.remove("show");
      $("away-trigger")?.setAttribute("aria-expanded", "false");
    } else if (id === "matchday-list") {
      selectMatchday(value);
      $("matchday-options")?.classList.remove("show");
      $("matchday-trigger")?.setAttribute("aria-expanded", "false");
    } else if (id === "home-rank-list") {
      selectRank("home-rank", value);
      $("home-rank-options")?.classList.remove("show");
      $("home-rank-trigger")?.setAttribute("aria-expanded", "false");
    } else if (id === "away-rank-list") {
      selectRank("away-rank", value);
      $("away-rank-options")?.classList.remove("show");
      $("away-rank-trigger")?.setAttribute("aria-expanded", "false");
    }
  });
}










































































































































a
















































































































































































































































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
const $ = (id) => document.getElementById(id);

/**
 * Smart parser for betting data
 * Intelligently extracts matches, teams, and odds regardless of formatting
 */
function parseGameweekData(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('No data provided');
  }

  // Normalize text: trim, remove excessive whitespace
  const lines = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) {
    throw new Error('Empty data');
  }

  const matches = [];
  let i = 0;

  while (i < lines.length) {
    // Try to find two consecutive team names
    const potentialHome = lines[i];
    const potentialAway = lines[i + 1];

    if (!potentialHome || !potentialAway) {
      i++;
      continue;
    }

    // Check if both are valid teams (fuzzy match)
    const homeTeam = findTeamMatch(potentialHome);
    const awayTeam = findTeamMatch(potentialAway);

    if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
      i++;
      continue;
    }

    // Move past team names
    i += 2;

    // Now look for 6 odds values (1, X, 2, 1, X, 2)
    // Sometimes they're on separate lines, sometimes grouped
    const oddsArray = [];
    let j = i;
    let linesConsumed = 0;

    while (oddsArray.length < 6 && j < lines.length) {
      const line = lines[j];
      
      // Try to parse as odds or as team marker (1, X, 2)
      if (line === '1' || line === 'X' || line === '2') {
        // This is a result indicator, skip for odds parsing
        j++;
        linesConsumed++;
        continue;
      }

      const num = parseFloat(line);
      if (!isNaN(num) && num > 1 && num < 1000) {
        oddsArray.push(num);
        j++;
        linesConsumed++;
        if (oddsArray.length === 6) break;
      } else {
        j++;
        linesConsumed++;
      }
    }

    if (oddsArray.length === 6) {
      const [homeOdds, drawOdds, awayOdds] = [
        oddsArray[0],
        oddsArray[1],
        oddsArray[2]
      ];

      matches.push({
        home: homeTeam,
        away: awayTeam,
        homeOdds,
        drawOdds,
        awayOdds,
      });

      i = j;
    } else {
      i++;
    }
  }

  if (matches.length === 0) {
    throw new Error('No valid matches found. Please check your data format.');
  }

  return matches;
}

/**
 * Fuzzy team matching to handle variations
 */
function findTeamMatch(input) {
  const normalized = input.toLowerCase().trim();

  // Exact match first
  for (const team of VALID_TEAMS) {
    if (team.toLowerCase() === normalized) {
      return team;
    }
  }

  // Partial match
  for (const team of VALID_TEAMS) {
    const teamLower = team.toLowerCase();
    if (teamLower.includes(normalized) || normalized.includes(teamLower)) {
      return team;
    }
  }

  // Levenshtein distance fallback
  let closestTeam = null;
  let closestDistance = Infinity;

  for (const team of VALID_TEAMS) {
    const distance = levenshteinDistance(normalized, team.toLowerCase());
    if (distance < closestDistance && distance <= 3) {
      closestDistance = distance;
      closestTeam = team;
    }
  }

  return closestTeam;
}

/**
 * Calculate Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Analyze a single fixture
 */
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

  if (hOdds <= 1.45 || aOdds <= 1.45) {
    const favOdds = hOdds <= 1.45 ? hOdds : aOdds;
    const favTeam = hOdds <= 1.45 ? home : away;

    prediction = hOdds <= 1.45 ? "1" : "2";
    confidence = "MEDIUM-LOW (High Upset Probability)";
    dangerFlag = "CRITICAL: Heavy favorite detected. High probability of upset or stalemate.";
  } else if (hOdds < dOdds && hOdds < aOdds && tierDifferential >= 1) {
    if (hOdds <= 1.85) {
      prediction = "1";
      confidence = "HIGH";
    } else {
      prediction = "1";
      confidence = "MEDIUM";
    }
  } else if (aOdds < dOdds && aOdds < hOdds && tierDifferential <= -1) {
    if (aOdds <= 1.85) {
      prediction = "2";
      confidence = "HIGH";
    } else {
      prediction = "2";
      confidence = "MEDIUM";
    }
  } else {
    prediction = "X";
    confidence = "MEDIUM";
    dangerFlag = "BALANCED MARKET: Draw profile detected.";
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
    tierDifferential,
  };
}

/**
 * Render match cards
 */
function renderMatches(analyses) {
  const resultsPanel = $("results-panel");
  const resultsContent = $("results-content");

  if (!resultsPanel || !resultsContent) return;

  // Count predictions
  const predictionCounts = { 1: 0, X: 0, 2: 0 };
  analyses.forEach(a => predictionCounts[a.prediction]++);

  // Summary banner
  let html = `
    <div class="match-banner success-banner">
      <span>✓</span>
      <span>Successfully parsed ${analyses.length} matches. Predictions: ${predictionCounts[1]} Home Wins | ${predictionCounts.X} Draws | ${predictionCounts[2]} Away Wins</span>
    </div>

    <div class="match-grid">
  `;

  // Match cards
  analyses.forEach((analysis, idx) => {
    const predBadgeClass = analysis.prediction === "1" ? "" : analysis.prediction === "X" ? "draw" : "away";
    const predLabel = analysis.prediction === "1" ? "HOME WIN" : analysis.prediction === "X" ? "DRAW" : "AWAY WIN";

    html += `
      <div class="match-card">
        <div class="match-header">
          <span class="match-title">${analysis.home} vs ${analysis.away}</span>
          <span class="prediction-badge ${predBadgeClass}">${predLabel}</span>
        </div>

        <div class="odds-row">
          <div class="odds-cell">
            <span class="odds-label">Home Win</span>
            <span class="odds-value">${(analysis.hProb * 100).toFixed(1)}%</span>
          </div>
          <div class="odds-cell">
            <span class="odds-label">Draw</span>
            <span class="odds-value">${(analysis.dProb * 100).toFixed(1)}%</span>
          </div>
          <div class="odds-cell">
            <span class="odds-label">Away Win</span>
            <span class="odds-value">${(analysis.aProb * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div class="confidence-text">
          <strong>Confidence:</strong> ${analysis.confidence}
          ${analysis.dangerFlag !== "NONE" ? `<br><strong style="color: #fca5a5;">⚠ ${analysis.dangerFlag}</strong>` : ""}
        </div>
      </div>
    `;
  });

  html += `</div>`;

  // Summary stats
  const totalMarginAvg = (analyses.reduce((sum, a) => sum + (a.totalMargin - 1), 0) / analyses.length * 100).toFixed(2);

  html += `
    <div class="summary-stats">
      <div class="stat-row">
        <span class="stat-label">Total Matches</span>
        <span class="stat-value">${analyses.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Home Win Predictions</span>
        <span class="stat-value">${predictionCounts[1]}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Draw Predictions</span>
        <span class="stat-value">${predictionCounts.X}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Away Win Predictions</span>
        <span class="stat-value">${predictionCounts[2]}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Avg Bookie Margin</span>
        <span class="stat-value">${totalMarginAvg}%</span>
      </div>
    </div>
  `;

  resultsContent.innerHTML = html;
  resultsPanel.classList.remove("hidden");
}

/**
 * Show error banner
 */
function showError(message) {
  const resultsPanel = $("results-panel");
  const resultsContent = $("results-content");

  if (!resultsPanel || !resultsContent) return;

  resultsContent.innerHTML = `
    <div class="match-banner error-banner">
      <span>⚠</span>
      <span>${message}</span>
    </div>
  `;

  resultsPanel.classList.remove("hidden");
}

/**
 * Main parse and analyze function
 */
function processInput() {
  const input = $("data-input");
  if (!input) return;

  const rawData = input.value;

  try {
    const matches = parseGameweekData(rawData);
    const analyses = matches.map(m =>
      analyzeFixture(m.home, m.away, m.homeOdds, m.drawOdds, m.awayOdds)
    );
    renderMatches(analyses);
  } catch (error) {
    showError(error.message);
  }
}

/**
 * Initialize event listeners
 */
window.addEventListener("DOMContentLoaded", () => {
  const parseBtn = $("parse-btn");
  const clearBtn = $("clear-btn");
  const dataInput = $("data-input");

  if (parseBtn) {
    parseBtn.addEventListener("click", processInput);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (dataInput) dataInput.value = "";
      const resultsPanel = $("results-panel");
      if (resultsPanel) resultsPanel.classList.add("hidden");
    });
  }

  // Allow Enter+Ctrl to parse
  if (dataInput) {
    dataInput.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        processInput();
      }
    });
  }
});

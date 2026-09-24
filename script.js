// Quick-Input Footprint Analysis Engine
function processAnalysis() {
    // 1. Core input captures
    const hOdds = parseFloat(document.getElementById("home-odds").value);
    const dOdds = parseFloat(document.getElementById("draw-odds").value);
    const aOdds = parseFloat(document.getElementById("away-odds").value);

    // Two quick additions to your UI HTML text inputs to read seasonal footprints
    const matchday = parseInt(document.getElementById("input-matchday").value) || 20; 
    const homeRank = parseInt(document.getElementById("home-table-rank").value) || 10;

    if (isNaN(hOdds) || isNaN(dOdds) || isNaN(aOdds) || hOdds <= 1.0) {
        alert("Input Error: Please fill in valid numerical odds.");
        return;
    }

    // 2. Clear out market overround margin footprints
    const rawHProb = 1 / hOdds;
    const rawDProb = 1 / dOdds;
    const rawAProb = 1 / aOdds;
    const totalMargin = rawHProb + rawDProb + rawAProb;

    const trueHProb = rawHProb / totalMargin;
    const trueAProb = rawAProb / totalMargin;
    const bookieMarginPercent = ((totalMargin - 1) * 100).toFixed(2);

    let prediction = "";
    let confidence = "";
    let dangerFlag = "NONE";

    // 3. Automated Footprint Matching Matrix
    
    // Footprint Flag A: The High-Overround Market Trap
    if (parseFloat(bookieMarginPercent) > 8.5) {
        prediction = "SKIP MATCH (Market Over-Inflated)";
        confidence = "VERY LOW";
        dangerFlag = `CRITICAL: Bookie margin is at ${bookieMarginPercent}%. The pool is heavily imbalanced. Expect a high-variance RNG trap score.`;
    }
    // Footprint Flag B: Early Season Chaos Loop (Matchdays 1-10)
    else if (matchday <= 10) {
        dangerFlag = "EARLY SEASON CHAOS: High variance detected. RNG normalization phase.";
        if (trueHProb >= 0.58) {
            prediction = `HOME WIN (1) or DRAW (X) [Double Chance Mandatory]`;
            confidence = "MEDIUM-LOW";
        } else if (trueAProb >= 0.58) {
            prediction = `AWAY WIN (2) or DRAW (X) [Double Chance Mandatory]`;
            confidence = "MEDIUM-LOW";
        } else {
            prediction = "OVER 1.5 GOALS (Ignore 1X2 market profiles)";
            confidence = "MEDIUM";
        }
    }
    // Footprint Flag C: Late Season Regression / Stabilization (Matchdays 25-38)
    else if (matchday >= 25 && homeRank <= 4 && trueHProb >= 0.52) {
        // A top team at home late in the season is heavily pushed by the engine to clear table deficits
        prediction = `STRAIGHT HOME WIN (1) - ${selectedHomeTeam}`;
        confidence = "MAXIMUM (High Regression Probability)";
        dangerFlag = "STABILIZATION WINDOW: The engine is actively forcing top-tier table corrections.";
    }
    // Standard Probability Fallback
    else {
        if (trueHProb >= 0.55) {
            prediction = `HOME WIN (1)`;
            confidence = trueHProb >= 0.65 ? "HIGH" : "MEDIUM";
        } else if (trueAProb >= 0.55) {
            prediction = `AWAY WIN (2)`;
            confidence = trueAProb >= 0.65 ? "HIGH" : "MEDIUM";
        } else {
            prediction = trueHProb > trueAProb ? "HOME WIN (1) or DRAW (X)" : "AWAY WIN (2) or DRAW (X)";
            confidence = "MEDIUM";
        }
    }

    // 4. Send directly to your existing UI elements
    document.getElementById("res-matchup").textContent = `${selectedHomeTeam} vs ${selectedAwayTeam} (MD: ${matchday})`;
    document.getElementById("res-true-odds").textContent = `Home: ${(trueHProb*100).toFixed(1)}% | Away: ${(trueAProb*100).toFixed(1)}%`;
    document.getElementById("res-margin").textContent = `${bookieMarginPercent}% Bookie Profit Margin`;
    document.getElementById("res-winner").textContent = prediction;
    document.getElementById("res-confidence").textContent = confidence;
    document.getElementById("res-risk").textContent = dangerFlag;
    
    // Set risk color
    const riskEl = document.getElementById("res-risk");
    riskEl.className = "value-text " + (dangerFlag === "NONE" ? "text-green" : "text-red");
    
    document.getElementById("results-panel").classList.remove("hidden");
}

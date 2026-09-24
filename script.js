// script.js - Core Logic Engine for Virtual Football Algorithm Cracker

// 1. Core Endpoints Configuration
const PYTHON_WORKER_URL = "https://workers.dev";

// 2. Fetch Teams Array from Cloudflare Python Worker during System Handshake
window.addEventListener('DOMContentLoaded', async () => {
    const hSelect = document.getElementById('homeTeam');
    const aSelect = document.getElementById('awayTeam');

    try {
        const response = await fetch(`${PYTHON_WORKER_URL}`);
        if (!response.ok) throw new Error("Server payload rejected");
        
        const teams = await response.json();
        
        // Clear old options if any
        hSelect.innerHTML = "";
        aSelect.innerHTML = "";

        // Populate dropdown lists dynamically
        teams.forEach(team => {
            hSelect.options.add(new Option(team, team));
            aSelect.options.add(new Option(team, team));
        });

        // Set default separate selections so they don't match initially
        hSelect.selectedIndex = 0;
        aSelect.selectedIndex = 1;

    } catch (error) {
        console.error("API Connection Error during handshake:", error);
        alert("System Handshake Offline: Could not sync team data layers from vfl.gikunju.workers.dev");
    }
});

// 3. Process Live Match Analytics Pipeline
async def sendToPythonWorker() {
    const hOddsEl = document.getElementById('hOdds');
    const dOddsEl = document.getElementById('dOdds');
    const aOddsEl = document.getElementById('aOdds');
    const homeTeam = document.getElementById('homeTeam').value;
    const awayTeam = document.getElementById('awayTeam').value;
    const outputBlock = document.getElementById('outputBlock');

    // Structural validation check rules
    if (!hOddsEl.value || !dOddsEl.value || !aOddsEl.value) {
        alert("Missing Data: Please fill out all match decimal odds boxes before running analytics.");
        return;
    }

    if (homeTeam === awayTeam) {
        alert("Configuration Error: A team cannot play a virtual fixture against itself.");
        return;
    }

    const payload = {
        home: homeTeam,
        away: awayTeam,
        h_odds: parseFloat(hOddsEl.value),
        d_odds: parseFloat(dOddsEl.value),
        a_odds: parseFloat(aOddsEl.value)
    };

    try {
        // Send JSON data stream directly to Cloudflare Python Worker environment
        const response = await fetch(`${https://vfl.gikunju.workers.dev}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Prediction processing failed");
        
        const result = await response.json();

        // Inject data results cleanly into DOM node fields
        document.getElementById('trueProbabilities').innerText = `H: ${result.probabilities.home} | X: ${result.probabilities.draw} | A: ${result.probabilities.away}`;
        document.getElementById('overround').innerText = `Bookie Cushion Inflation: +${result.overround}`;
        document.getElementById('predictionOutput').innerText = result.prediction;
        
        // Handle custom formatting alerts for conditional high-risk flags
        const dangerBox = document.getElementById('dangerBlock');
        if (result.danger_flag !== "NONE") {
            document.getElementById('dangerOutput').innerText = result.danger_flag;
            dangerBox.classList.remove('hidden');
        } else { 
            dangerBox.classList.add('hidden'); 
        }

        // Render matching timeline array list nodes dynamically
        const tList = document.getElementById('templatesList');
        tList.innerHTML = "";
        
        result.templates.forEach(template => {
            let li = document.createElement('li');
            li.className = "flex items-center gap-2 border-b border-slate-900/50 pb-1 last:border-0 text-slate-300 font-mono";
            li.innerHTML = `<span class="text-amber-500/70 font-bold">→</span> <span>${template}</span>`;
            tList.appendChild(li);
        });

        // Display results block smoothly
        outputBlock.classList.remove('hidden');
        outputBlock.classList.add('animate-fade-in');

    } catch (err) {
        console.error("Processing API stream network fault:", err);
        alert("Cloudflare Sync Failure: Check that your backend worker script rules remain active at vfl.gikunju.workers.dev");
    }
}

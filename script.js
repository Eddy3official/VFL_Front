// script.js - Core API Communications Pipeline for Virtual Football Cracker

// Live deployed Cloudflare Worker endpoint url route
const PYTHON_WORKER_URL = "https://vfl.gikunju.workers.dev";

// 1. Initial Handshake to load active database teams on startup
window.addEventListener('DOMContentLoaded', async () => {
    const hSelect = document.getElementById('homeTeam');
    const aSelect = document.getElementById('awayTeam');

    try {
        const res = await fetch(PYTHON_WORKER_URL);
        if (!res.ok) throw new Error("Worker network stream returned bad status signature");
        
        const teams = await res.json();
        
        // Wipe fallback elements clean
        hSelect.innerHTML = "";
        aSelect.innerHTML = "";
        
        // Map lists into selection drop-down components
        teams.forEach(team => {
            hSelect.options.add(new Option(team, team));
            aSelect.options.add(new Option(team, team));
        });
        
        // Ensure home and away default states don't match on system load
        hSelect.selectedIndex = 0;
        aSelect.selectedIndex = 1;
        
    } catch(error) { 
        console.error("Connection link configuration sync initialization block fault:", error); 
        hSelect.innerHTML = '<option value="">Failed to sync data layers</option>';
        aSelect.innerHTML = '<option value="">Failed to sync data layers</option>';
    }
});

// 2. Analytical execution processing loop triggered by user clicks
async function sendToPythonWorker() {
    const hOddsEl = document.getElementById('hOdds');
    const dOddsEl = document.getElementById('dOdds');
    const aOddsEl = document.getElementById('aOdds');
    const outputBlock = document.getElementById('outputBlock');

    const payload = {
        home: document.getElementById('homeTeam').value,
        away: document.getElementById('awayTeam').value,
        h_odds: hOddsEl.value,
        d_odds: dOddsEl.value,
        a_odds: aOddsEl.value
    };

    // System threshold rules validations
    if (!payload.h_odds || !payload.d_odds || !payload.a_odds) {
        alert("Please fill out all match decimal odds boxes before running analytics.");
        return;
    }

    if (payload.home === payload.away) {
        alert("Error: A team cannot play a virtual fixture against itself.");
        return;
    }

    try {
        // Forward data matrices straight to serverless wrapper layer
        const response = await fetch(PYTHON_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("Worker mathematical parsing pipeline failure");
        const result = await response.json();

        // Map probability projections values
        document.getElementById('trueProbabilities').innerText = `Home Win: ${result.probabilities.home} | Draw: ${result.probabilities.draw} | Away Win: ${result.probabilities.away}`;
        document.getElementById('overround').innerText = `Bookie Cushion Inflation: +${result.overround}`;
        document.getElementById('predictionOutput').innerText = result.prediction;
        
        // Toggle risk container blocks based on model return states
        const dangerBox = document.getElementById('dangerBlock');
        if (result.danger_flag !== "NONE") {
            document.getElementById('dangerOutput').innerText = result.danger_flag;
            dangerBox.classList.remove('hidden');
        } else { 
            dangerBox.classList.add('hidden'); 
        }

        // Render matched timeline array strings templates into views
        const tList = document.getElementById('templatesList');
        tList.innerHTML = "";
        
        result.templates.forEach(template => {
            let li = document.createElement('li');
            li.className = "flex items-center gap-2 border-b border-slate-900/60 pb-1.5 last:border-0 text-slate-300";
            li.innerHTML = `<span class="text-amber-500 font-bold">→</span> <span>${template}</span>`;
            tList.appendChild(li);
        });

        // Trigger presentation container cards into visible layers
        outputBlock.classList.remove('hidden');
        
    } catch (err) {
        alert("Cloudflare Connection Error: Make sure your Python Worker script at vfl.gikunju.workers.dev is compiled and deployed correctly.");
        console.error(err);
    }
}

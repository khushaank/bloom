// ============================================
// BLOOM — Onboarding / Sample Data Tour
// ============================================

const SAMPLE_TX = [
    { name: 'Monthly Salary', amount: 4200, category: 'Salary', type: 'income' },
    { name: 'Apartment Rent', amount: 1400, category: 'Housing', type: 'expense' },
    { name: 'Whole Foods Market', amount: 142.50, category: 'Food & Drink', type: 'expense' },
    { name: 'Netflix', amount: 15, category: 'Entertainment', type: 'expense' },
    { name: 'Metro Pass', amount: 90, category: 'Transport', type: 'expense' }
];

const SAMPLE_GOALS = [
    { name: 'Rainy Day Fund', target: 5000, current: 1500, deadline: '2026-12-31' },
    { name: 'Euro Trip', target: 3000, current: 600, deadline: '2027-06-30' }
];

async function checkAndApplySamples() {
    const samplesRemoved = localStorage.getItem(`bloom_samples_removed_${currentUserId}`);
    if (samplesRemoved === 'true') return;

    // Check if the user is truly new
    if (transactions.length === 0 && goals.length === 0) {
        // Show floating tour button
        showTourButton();
    }
}

function showTourButton() {
    const btnHtml = `
      <div id="tourFloatingBtn" style="position:fixed;bottom:24px;right:24px;z-index:999;display:flex;flex-direction:column;gap:12px;animation: fadeInUp 0.5s ease;">
         <button onclick="loadSampleData()" class="btn-primary" style="box-shadow: 0 4px 16px rgba(77,122,82,0.4);padding:14px 20px;">
           ✨ View Sample Data Tour
         </button>
         <button onclick="removeSampleDataPrompt()" class="btn-secondary" style="background:#fff;">
           Clear Demo & Stop Tour
         </button>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', btnHtml);
}

async function loadSampleData() {
    const btn = document.getElementById('tourFloatingBtn');
    if (btn) btn.innerHTML = '<span style="background:var(--card-bg);padding:12px;border-radius:8px;font-size:13px;box-shadow:var(--shadow);">Generatating...</span>';

    // Insert locally only! Temporary samples.
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have samples loaded
    if(transactions.some(t => t.id && t.id.toString().startsWith('sample_'))) return;

    SAMPLE_TX.forEach((tx, idx) => {
        transactions.push({
            ...tx,
            id: `sample_tx_${idx}`,
            date: today
        });
    });

    SAMPLE_GOALS.forEach((g, idx) => {
        goals.push({
            ...g,
            id: `sample_goal_${idx}`
        });
    });
    
    update();
    showToast('Demo data loaded successfully!');
    
    if (btn) {
        btn.innerHTML = `
          <button onclick="removeSampleDataPrompt()" class="btn-secondary" style="background:#fff;border-color:var(--coral);color:var(--coral);">
            Clear Demo Data
          </button>
        `;
    }
}

async function removeSampleDataPrompt() {
    localStorage.setItem(`bloom_samples_removed_${currentUserId}`, 'true');
    const btn = document.getElementById('tourFloatingBtn');
    if (btn) btn.remove();
    
    // Strip sample items only!
    transactions = transactions.filter(t => !(t.id && t.id.toString().startsWith('sample_')));
    goals = goals.filter(g => !(g.id && g.id.toString().startsWith('sample_')));
    
    update();
    showToast('Tour disabled. You have full control!');
}

// Hook into existing init
setTimeout(() => {
    if (currentUserId) {
        checkAndApplySamples();
    }
}, 2000); // give time for script.js to load data

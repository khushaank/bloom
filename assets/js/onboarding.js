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
    const privacyModeOn = localStorage.getItem('bloom_privacy_mode') === 'true';
    const samplesRemoved = localStorage.getItem(`bloom_samples_removed_${currentUserId}`);
    if (samplesRemoved === 'true') return;
    if (privacyModeOn) {
        return;
    }

    // For regular users, show tour button once on an empty account
    if (!privacyModeOn && transactions.length === 0 && goals.length === 0) {
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
    if (transactions.some(t => t.id && t.id.toString().startsWith('sample_'))) return;

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

// Onboarding overlays
function createOverlayTooltip() {
    const existing = document.getElementById('tourOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'tourOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(0, 0, 0, 0.55)';
    overlay.style.zIndex = '10050';
    overlay.style.pointerEvents = 'auto';

    const card = document.createElement('div');
    card.id = 'tourOverlayCard';
    card.style.position = 'absolute';
    card.style.maxWidth = '320px';
    card.style.background = 'white';
    card.style.borderRadius = '12px';
    card.style.padding = '16px';
    card.style.boxShadow = '0 20px 45px rgba(0, 0, 0, 0.30)';
    card.style.color = '#1f3121';
    card.style.fontFamily = 'Inter, sans-serif';
    card.style.lineHeight = '1.4';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    return { overlay, card };
}

let currentTourTarget = null;

function removeOverlayTooltip() {
    const existing = document.getElementById('tourOverlay');
    if (existing) existing.remove();
    const existingControls = document.getElementById('tourControls');
    if (existingControls) existingControls.remove();
    if (currentTourTarget) {
        currentTourTarget.classList.remove('tour-highlight');
        currentTourTarget = null;
    }
}

function createTourControls() {
    const existing = document.getElementById('tourControls');
    if (existing) existing.remove();

    const controls = document.createElement('div');
    controls.id = 'tourControls';
    controls.className = 'tour-controls';
    controls.innerHTML = `
        <button id="tourSkipBtn" style="background:#f3f4f6;color:#485058;">Skip Tour</button>
    `;

    document.body.appendChild(controls);
    return controls;
}

const PRIVACY_TOUR_STEPS = [
    {
        selector: '.greeting-actions .btn-primary',
        title: 'Add Transaction',
        text: 'Click here to record new income or expense entries quickly.',
    },
    {
        selector: '#spendingHeatmap',
        title: 'Spending Heatmap',
        text: 'Monitor your daily spending intensity with this heatmap view.',
    }
];

let privacyTourIndex = 0;

function showPrivacyTourStep(index) {
    const step = PRIVACY_TOUR_STEPS[index];
    if (!step) {
        removeOverlayTooltip();
        localStorage.setItem(`bloom_privacy_tour_completed_${currentUserId}`, 'true');
        return;
    }

    // Auto-switch pages if declared in step (optional)
    if (step.section && typeof switchSection === 'function') {
        switchSection(step.section, document.querySelector(`.sidebar-nav .nav-item[data-section="${step.section}"]`));
    }

    // Ensure the section exists before selecting target element
    const target = document.querySelector(step.selector) || document.querySelector(`.sidebar-nav .nav-item[data-section="${step.section}"]`);

    if (target && typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }

    const { overlay, card } = createOverlayTooltip();
    const rect = target ? target.getBoundingClientRect() : { x: 40, y: 80, width: 240, height: 42 };

    if (currentTourTarget) {
        currentTourTarget.classList.remove('tour-highlight');
    }
    if (target) {
        target.classList.add('tour-highlight');
        currentTourTarget = target;
    }

    const isLastStep = index === PRIVACY_TOUR_STEPS.length - 1;

    card.innerHTML = `
      <h3 style="margin:0 0 8px; font-size:16px; font-weight:700; color:#2a472a;">${step.title}</h3>
      <p style="margin:0 0 12px; font-size:14px; color:#314033;">${step.text}</p>
      <button id="tourNextBtn" style="border:none;background:#4a7a55;color:white;cursor:pointer;padding:8px 10px;border-radius:8px;">${isLastStep ? 'End Tour' : 'Next'}</button>
    `;

    const top = Math.max(16, rect.top + window.scrollY + rect.height + 12);
    const left = Math.max(16, rect.left + window.scrollX);
    card.style.top = `${top}px`;
    card.style.left = `${left}px`;

    createTourControls();
    const skip = document.getElementById('tourSkipBtn');
    const next = document.getElementById('tourNextBtn');

    skip.addEventListener('click', () => {
        removeOverlayTooltip();
        localStorage.setItem(`bloom_privacy_tour_completed_${currentUserId}`, 'true');
    });
    next.addEventListener('click', () => {
        if (isLastStep) {
            removeOverlayTooltip();
            localStorage.setItem(`bloom_privacy_tour_completed_${currentUserId}`, 'true');
            return;
        }
        privacyTourIndex = index + 1;
        showPrivacyTourStep(privacyTourIndex);
    });
}

function startPrivacyTour() {
    if (localStorage.getItem(`bloom_privacy_tour_completed_${currentUserId}`) === 'true') return;
    setTimeout(() => {
        showPrivacyTourStep(0);
    }, 800);
}

function removeDemoDataForever() {
    localStorage.setItem(`bloom_samples_removed_${currentUserId}`, 'true');
    localStorage.removeItem(`bloom_samples_auto_loaded_${currentUserId}`);
    transactions = transactions.filter(t => !(t.id && t.id.toString().startsWith('sample_')));
    goals = goals.filter(g => !(g.id && g.id.toString().startsWith('sample_')));
    saveOfflineData();
    update();
}

// Hook into existing init and run after the initial data load finish.
setTimeout(() => {
    if (currentUserId) {
        checkAndApplySamples();
        if (localStorage.getItem('bloom_privacy_mode') === 'true') {
            startPrivacyTour();
        }
    }
}, 2000); // give time for script.js to load data

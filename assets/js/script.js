// ============================================
// BLOOM — Personal Finance Tracker
// ============================================

// STATE
let transactions = [];
let monthlyBudget = 2000;
let goals = [];
let userName = '';
let userEmail = '';
let currentUserId = null;
let currentType = 'income';
let filter = 'all';
let viewDate = new Date();
let calendarDate = new Date();
let chartPeriod = 12;
let searchQuery = '';
let profileDropdownOpen = false;
let avatarMenuOpen = false;
let currencySymbol = '₹';
let currencyCode = 'INR';
let numberFormat = 'en-IN';
let userAvatar = null;
let subscriptions = []; // New state for recurring transactions

let appReady = false;
let pageLoaded = false;

function hideGlobalLoader() {
    const loader = document.getElementById('globalLoader');
    if (!loader) return;
    document.body.classList.remove('loading-state');
    loader.classList.add('hidden');
    setTimeout(() => {
        if (loader.parentElement) loader.remove();
    }, 500);
}

window.addEventListener('load', () => {
    pageLoaded = true;
    if (appReady) {
        hideGlobalLoader();
    }
});

const CATEGORY_COLORS = {
    'Food & Drink': '#e8a87c', 'Transport': '#7ab8c4', 'Housing': '#a09cc8',
    'Health': '#e8b4a0', 'Entertainment': '#f0c84a', 'Shopping': '#d4a0c8',
    'Education': '#80b8a0', 'Salary': '#7a9e7e', 'Freelance': '#a8c5ac', 'Other': '#c0b8a8'
};

const CATEGORY_LABELS = {
    'Food & Drink': 'FD', 'Transport': 'TR', 'Housing': 'HO',
    'Health': 'HE', 'Entertainment': 'EN', 'Shopping': 'SH',
    'Education': 'ED', 'Salary': 'SA', 'Freelance': 'FR', 'Other': 'OT'
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const FINANCIAL_TIPS = [
    "Cultivate your savings like a garden -- patience is the greatest fertilizer.",
    "Pay yourself first. Automate savings before spending on wants.",
    "Track every dollar. Awareness is the foundation of financial growth.",
    "An emergency fund is your financial safety net. Aim for 3-6 months of expenses.",
    "Avoid lifestyle inflation -- save raises and bonuses instead of spending them.",
    "The best time to start investing was yesterday. The second best is today.",
    "Compound interest is the eighth wonder of the world. Let time work for you.",
    "Budget like a CEO -- every dollar should have a purpose.",
    "Financial freedom isn't about how much you earn, but how much you keep.",
    "Small consistent savings beats sporadic large deposits every time."
];

// Transaction name suggestions
const INCOME_SUGGESTIONS = [
    'Salary', 'Bonus', 'Freelance', 'Side Hustle', 'Investment', 'Dividend',
    'Rental Income', 'Business Income', 'Commission', 'Tips', 'Gift', 'Refund'
];

const EXPENSE_SUGGESTIONS = [
    'Coffee', 'Lunch', 'Dinner', 'Groceries', 'Transport', 'Gas', 'Parking',
    'Shopping', 'Entertainment', 'Movie', 'Concert', 'Gym', 'Health', 'Doctor',
    'Medicine', 'Rent', 'Utilities', 'Internet', 'Phone', 'Insurance', 'Education',
    'Books', 'Subscription', 'Software', 'Travel', 'Hotel', 'Flight', 'Taxi'
];

// Subscription name suggestions
const SUBSCRIPTION_INCOME_SUGGESTIONS = [
    'Salary', 'Freelance Income', 'Rental Income', 'Business Income', 'Investment Returns', 'Pension'
];

const SUBSCRIPTION_EXPENSE_SUGGESTIONS = [
    'Netflix', 'Spotify', 'Amazon Prime', 'Gym Membership', 'Phone Bill', 'Internet', 'Rent',
    'Insurance', 'Loan Payment', 'Credit Card', 'Car Payment', 'Utilities', 'Software Subscription'
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
function setLoading(btn, loading) {
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    if (loading) {
        if (text) text.style.display = 'none';
        if (spinner) spinner.style.display = 'inline-flex';
        btn.disabled = true;
    } else {
        if (text) text.style.display = 'inline';
        if (spinner) spinner.style.display = 'none';
        btn.disabled = false;
    }
}

// ============================================
// NAME UTILITIES
// ============================================
function extractNameFromEmail(email) {
    if (!email) return '';
    // Extract the part before @
    const namePart = email.split('@')[0];
    // Replace dots, dashes, underscores with spaces
    let name = namePart.replace(/[._-]/g, ' ');
    // Capitalize each word
    name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    return name;
}

// ============================================
// SUPABASE DATA LAYER
// ============================================
async function loadProfile() {
    try {
        // Load profile with currency and profile image from database
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('display_name,monthly_budget,currency,profile_picture')
            .eq('id', currentUserId)
            .maybeSingle();

        if (error) {

            // Set defaults and continue
            userName = extractNameFromEmail(userEmail) || 'User';
            return;
        }

        if (!data) {
            // No profile exists yet - this is normal for new users

            userName = extractNameFromEmail(userEmail) || 'User';
            return;
        }

        // Profile exists - use the data
        userName = data.display_name || extractNameFromEmail(userEmail) || 'User';
        monthlyBudget = parseFloat(data.monthly_budget) || 2000;

        // Handle currency from database
        let currency = data.currency || 'INR';
        const currencyMap = {
            'INR': { symbol: '₹', code: 'INR', locale: 'en-IN' },
            'USD': { symbol: '$', code: 'USD', locale: 'en-US' },
            'EUR': { symbol: '€', code: 'EUR', locale: 'en-DE' },
            'GBP': { symbol: '£', code: 'GBP', locale: 'en-GB' },
            '₹': { symbol: '₹', code: 'INR', locale: 'en-IN' },
            '$': { symbol: '$', code: 'USD', locale: 'en-US' },
            '€': { symbol: '€', code: 'EUR', locale: 'en-DE' },
            '£': { symbol: '£', code: 'GBP', locale: 'en-GB' }
        };

        const currData = currencyMap[currency] || currencyMap['INR'];
        currencySymbol = currData.symbol;
        currencyCode = currData.code;
        numberFormat = currData.locale;

        // Load profile picture if available (profile_picture is the column currently in schema)
        userAvatar = data.profile_picture || null;
    } catch (err) {

        // Ensure app still works with defaults
        userName = extractNameFromEmail(userEmail) || 'User';
    }
}

async function loadTransactions() {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', currentUserId)
            .order('transaction_date', { ascending: false });

        if (error) {

            transactions = [];
            return;
        }

        if (data) {
            transactions = data.map(t => ({
                id: t.id,
                name: t.name,
                amount: parseFloat(t.amount),
                category: t.category,
                type: t.type,
                date: t.transaction_date,
                is_recurring: t.is_recurring || false,
                recurring_frequency: t.recurring_frequency || null
            }));
        }
    } catch (err) {

        transactions = [];
    }
}

async function loadSubscriptions() {
    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .select('*')
            .eq('user_id', currentUserId)
            .eq('is_recurring', true)
            .order('transaction_date', { ascending: false });

        if (error) {

            subscriptions = [];
            return;
        }

        if (data) {
            subscriptions = data.map(t => ({
                id: t.id,
                name: t.name,
                amount: parseFloat(t.amount),
                category: t.category,
                type: t.type,
                date: t.transaction_date,
                recurring_frequency: t.recurring_frequency || 'monthly'
            }));
        }
    } catch (err) {

        subscriptions = [];
    }
}

async function loadGoals() {
    try {
        const { data, error } = await supabaseClient
            .from('goals')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

        if (error) {

            goals = [];
            return;
        }

        if (data) {
            goals = data.map(g => ({
                id: g.id,
                name: g.name,
                targetAmount: parseFloat(g.target_amount),
                currentAmount: parseFloat(g.current_amount || 0),
                deadline: g.deadline,
                createdAt: g.created_at
            }));
        }
    } catch (err) {

        goals = [];
    }
}

async function processRecurringTransactions() {
    const today = new Date();
    const processed = [];

    for (const sub of subscriptions) {
        const lastTxDate = new Date(sub.date);
        let nextDate = new Date(lastTxDate);

        // Calculate next occurrence
        switch (sub.recurring_frequency) {
            case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
            case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
            case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
            default: nextDate.setMonth(nextDate.getMonth() + 1);
        }

        // If due, create the transaction AND update the subscription date in DB
        if (nextDate <= today) {
            const newTx = {
                name: sub.name,
                amount: sub.amount,
                category: sub.category,
                type: sub.type,
                date: nextDate.toISOString().split('T')[0],
                is_recurring: false // The instance is just a regular transaction
            };

            const inserted = await insertTransaction(newTx);
            if (inserted) {
                processed.push(inserted);

                // CRITICAL FIX: Update the parent subscription date in Supabase 
                // so it doesn't trigger again until the next period.
                await supabaseClient
                    .from('transactions')
                    .update({ transaction_date: newTx.date })
                    .eq('id', sub.id);

                sub.date = newTx.date; // Update local state
            }
        }
    }

    if (processed.length > 0) {
        await loadTransactions();
        showToast(`Processed ${processed.length} recurring items`);
    }
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================
function exportCSV() {
    const filteredTx = getFilteredTransactions();
    if (filteredTx.length === 0) {
        showToast('No transactions to export');
        return;
    }

    const csvContent = [
        ['Date', 'Name', 'Category', 'Type', 'Amount', 'Recurring'],
        ...filteredTx.map(tx => [
            tx.date,
            tx.name,
            tx.category,
            tx.type,
            tx.amount.toFixed(2),
            tx.is_recurring ? 'Yes' : 'No'
        ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bloom-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV exported successfully');
}

async function exportPDF() {
    const { jsPDF } = window.jspdf;
    const filteredTx = getFilteredTransactions();

    if (filteredTx.length === 0) {
        showToast('No transactions to export');
        return;
    }

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Bloom - Transaction Report', 20, 30);
    doc.setFontSize(12);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 40);

    let yPosition = 60;
    doc.setFontSize(10);
    doc.text('Date', 20, yPosition);
    doc.text('Name', 60, yPosition);
    doc.text('Category', 120, yPosition);
    doc.text('Type', 160, yPosition);
    doc.text('Amount', 180, yPosition);

    yPosition += 10;

    filteredTx.forEach(tx => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 30;
        }

        doc.text(tx.date, 20, yPosition);
        doc.text(tx.name.substring(0, 25), 60, yPosition);
        doc.text(tx.category, 120, yPosition);
        doc.text(tx.type, 160, yPosition);
        doc.text(`${currencySymbol}${tx.amount.toFixed(2)}`, 180, yPosition);
        yPosition += 8;
    });

    doc.save(`bloom-transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('PDF exported successfully');
}

function getFilteredTransactions() {
    let filtered = transactions;

    // Apply date filter
    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const endOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    filtered = filtered.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startOfMonth && txDate <= endOfMonth;
    });

    // Apply type filter
    if (filter !== 'all') {
        filtered = filtered.filter(tx => tx.type === filter);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ============================================
// SPENDING HEATMAP FUNCTIONALITY
// ============================================
function getHeatmapIntensityClass(intensity) {
    if (intensity === 0) return 'intensity-0';
    if (intensity < 0.25) return 'intensity-1';
    if (intensity < 0.5) return 'intensity-2';
    if (intensity < 0.75) return 'intensity-3';
    return 'intensity-4';
}

function generateSpendingHeatmap() {
    const currentMonth = viewDate;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get all days in the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Calculate spending per day
    const dailySpending = {};
    transactions.filter(tx => tx.type === 'expense').forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === year && txDate.getMonth() === month) {
            const day = txDate.getDate();
            dailySpending[day] = (dailySpending[day] || 0) + tx.amount;
        }
    });

    // Find max spending for color scaling
    const maxSpending = Math.max(...Object.values(dailySpending), 0);

    // Generate calendar HTML
    let calendarHTML = '<div class="heatmap-calendar">';
    calendarHTML += `<h3 class="heatmap-title">${MONTHS[month]} ${year} Spending Heatmap</h3>`;
    calendarHTML += '<div class="heatmap-grid">';

    // Day labels
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayLabels.forEach(day => {
        calendarHTML += `<div class="heatmap-day-label">${day}</div>`;
    });

    // Empty cells for days before the first day of the month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarHTML += '<div class="heatmap-cell empty"></div>';
    }

    // Calendar cells
    for (let day = 1; day <= daysInMonth; day++) {
        const spending = dailySpending[day] || 0;
        const intensity = maxSpending > 0 ? spending / maxSpending : 0;
        const intensityClass = getHeatmapIntensityClass(intensity);

        calendarHTML += `
            <div class="heatmap-cell ${intensityClass}" title="${day}: ${currencySymbol}${spending.toFixed(2)}">
                <span class="heatmap-day">${day}</span>
                <span class="heatmap-amount">${spending > 0 ? currencySymbol + spending.toFixed(0) : ''}</span>
            </div>
        `;
    }

    calendarHTML += '</div>';
    calendarHTML += '<div class="heatmap-legend">';
    calendarHTML += '<span class="legend-label">Less</span>';
    calendarHTML += '<div class="legend-colors">';
    calendarHTML += '<div class="legend-color intensity-0"></div>';
    calendarHTML += '<div class="legend-color intensity-1"></div>';
    calendarHTML += '<div class="legend-color intensity-2"></div>';
    calendarHTML += '<div class="legend-color intensity-3"></div>';
    calendarHTML += '<div class="legend-color intensity-4"></div>';
    calendarHTML += '</div>';
    calendarHTML += '<span class="legend-label">More</span>';
    calendarHTML += '</div>';
    calendarHTML += '</div>';

    return calendarHTML;
}

function renderSpendingHeatmap() {
    const heatmapContainer = document.getElementById('spendingHeatmap');
    if (!heatmapContainer) return;

    const heatmapHTML = generateSpendingHeatmap();
    heatmapContainer.innerHTML = heatmapHTML;
}

// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================
let currentSubType = 'expense';

function openSubscriptionModal() {


    resetSubscriptionForm();

    openModal('subscriptionModal');
}

async function addSubscription() {
    const name = document.getElementById('subName').value.trim();
    const amount = parseFloat(document.getElementById('subAmount').value);
    const category = document.getElementById('subCategory').value;
    const frequency = document.getElementById('subFrequency').value;
    const startDate = document.getElementById('subStartDate').value;
    const btn = document.getElementById('addSubBtn');

    if (!name || isNaN(amount) || !startDate) {
        showToast('Please fill in all fields correctly');
        return;
    }

    const newSub = {
        user_id: currentUserId,
        name: name,
        amount: amount,
        category: category,
        type: currentSubType, // Uses the toggle state (income/expense)
        transaction_date: startDate,
        is_recurring: true,
        recurring_frequency: frequency
    };


    setLoading(btn, true);

    try {
        const { data, error } = await supabaseClient
            .from('transactions')
            .insert([newSub]);



        setLoading(btn, false);

        if (error) {

            showToast('Error saving subscription: ' + error.message);
        } else {
            showToast('Subscription added!');
            closeModal(true);
            resetSubscriptionForm();
            await loadSubscriptions();
            renderSubscriptions();
        }
    } catch (err) {

        setLoading(btn, false);
        showToast('Error: ' + err.message);
    }
}

function resetSubscriptionForm() {
    document.getElementById('subName').value = '';
    document.getElementById('subAmount').value = '';
    document.getElementById('subCategory').value = 'Food & Drink';
    document.getElementById('subFrequency').value = 'monthly';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('subStartDate').value = today;
    setSubscriptionType('expense');
}

function setSubscriptionType(type) {
    currentSubType = type;
    document.getElementById('subBtnIncome').classList.toggle('active-income', type === 'income');
    document.getElementById('subBtnExpense').classList.toggle('active-expense', type === 'expense');
    document.getElementById('subAmountLabel').textContent = `Amount (${currencySymbol})`;

    // Hide suggestions when type changes
    const suggestionsDiv = document.getElementById('subNameSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

function renderSubscriptions() {
    const container = document.getElementById('subscriptionsGrid');
    if (!container) return;

    if (subscriptions.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>No active subscriptions.</p></div>`;
        return;
    }

    container.innerHTML = subscriptions.map(sub => `
        <div class="subscription-card">
            <div class="subscription-header">
                <div class="subscription-icon" style="background: ${CATEGORY_COLORS[sub.category] || '#c0b8a8'};">
                    ${CATEGORY_LABELS[sub.category] || (sub.category || 'OT').substring(0, 2)}
                </div>
                <div class="subscription-info">
                    <h4 class="subscription-name">${sub.name}</h4>
                    <div class="subscription-category">${sub.category}</div>
                    <div class="subscription-frequency">${sub.recurring_frequency}</div>
                </div>
            </div>
            <div class="subscription-amount ${sub.type === 'income' ? 'text-success' : ''}">${fmt(sub.amount)}</div>
            <div class="subscription-actions">
                <button class="subscription-delete" onclick="deleteSubscription('${sub.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteSubscription(id) {
    if (!confirm('Are you sure you want to remove this subscription?')) return;

    const { error } = await supabaseClient
        .from('transactions')
        .delete()
        .eq('id', id);

    if (error) {
        showToast('Error deleting subscription');
    } else {
        showToast('Subscription removed');
        await loadSubscriptions();
        renderSubscriptions();
    }
}

async function saveProfile() {
    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    if (privacyMode) {
        await saveOfflineData();
        return;
    }

    // Map currency symbol to code for database
    const currencyMap = {
        '₹': 'INR',
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP'
    };
    const currencyToSave = currencyMap[currencySymbol] || 'INR';

    try {
        // Upsert gives safe behavior for new users and existing rows.
        const { data, error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: currentUserId,
                display_name: userName,
                monthly_budget: monthlyBudget,
                currency: currencyToSave,
                profile_picture: userAvatar || null
            }, { onConflict: 'id' })
            .select();

        if (error) {

            showToast('Error saving profile');
        } else {

        }
    } catch (err) {

        showToast('Error saving profile');
    }
}

async function insertTransaction(tx) {
    const { data, error } = await supabaseClient
        .from('transactions')
        .insert({
            user_id: currentUserId,
            name: tx.name,
            amount: tx.amount,
            category: tx.category,
            type: tx.type,
            transaction_date: tx.date,
            is_recurring: tx.is_recurring || false,
            recurring_frequency: tx.recurring_frequency || null
        })
        .select()
        .single();
    if (error) { showToast('Failed to save transaction'); return null; }
    return data;
}

async function removeTransaction(id) {
    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    if (privacyMode) {
        await saveOfflineData();
        return;
    }
    const { error } = await supabaseClient
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);
    if (error) { showToast('Failed to delete transaction'); }
}

async function insertGoal(goal) {
    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    if (privacyMode) {
        const data = {
            id: 'privacy_' + Date.now(),
            name: goal.name,
            target_amount: goal.target,
            current_amount: 0,
            deadline: goal.deadline || null
        };
        return data;
    }
    const { data, error } = await supabaseClient
        .from('goals')
        .insert({
            user_id: currentUserId,
            name: goal.name,
            target_amount: goal.target,
            current_amount: 0,
            deadline: goal.deadline || null
        })
        .select()
        .single();
    if (error) { showToast('Failed to save goal'); return null; }
    return data;
}

async function updateGoalAmount(id, amount) {
    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    if (privacyMode) {
        await saveOfflineData();
        return;
    }
    const { error } = await supabaseClient
        .from('goals')
        .update({ current_amount: amount })
        .eq('id', id)
        .eq('user_id', currentUserId);
    if (error) { showToast('Failed to update goal'); }
}

async function removeGoal(id) {
    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    if (privacyMode) {
        await saveOfflineData();
        return;
    }
    const { error } = await supabaseClient
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUserId);
    if (error) { showToast('Failed to delete goal'); }
}

// ============================================
// HELPERS
// ============================================
function getMonthTx(date = viewDate) {
    return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
    });
}

function fmt(n) {
    return currencySymbol + Math.abs(n).toLocaleString(numberFormat, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n) {
    if (Math.abs(n) >= 1000) return currencySymbol + (Math.abs(n) / 1000).toFixed(1) + 'k';
    return currencySymbol + Math.abs(n).toLocaleString(numberFormat, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function updateCurrencyLabels() {
    const labels = ['amountLabel', 'budgetAmountLabel', 'budgetAmountLabelModal', 'targetAmountLabel'];
    labels.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const text = el.textContent.replace(/\(.*\)/, `(${currencySymbol})`);
            el.textContent = text;
        }
    });
}

function setupSettingsSaveButtons() {
    const nameInput = document.getElementById('settingsName');
    const currencySelect = document.getElementById('currencySelect');

    if (nameInput) {
        nameInput.addEventListener('input', () => {
            const saveNameBtn = document.getElementById('saveNameBtn');
            if (saveNameBtn) {
                saveNameBtn.style.display = nameInput.value.trim() && nameInput.value.trim() !== userName ? 'inline-flex' : 'none';
            }
        });
    }

    if (currencySelect) {
        currencySelect.addEventListener('change', () => {
            const saveCurrencyBtn = document.getElementById('saveCurrencyBtn');
            if (saveCurrencyBtn) {
                saveCurrencyBtn.style.display = currencySelect.value !== currencyCode ? 'inline-flex' : 'none';
            }
        });
    }

    const editPhotoBtnTop = document.getElementById('editPhotoBtnTop');
    const avatarMenu = document.getElementById('avatarMenu');
    const profileInput = document.getElementById('profilePictureInput');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarDeleteBtn = document.getElementById('avatarDeleteBtn');

    if (editPhotoBtnTop && avatarMenu) {
        editPhotoBtnTop.addEventListener('click', (e) => {
            e.preventDefault();
            avatarMenu.style.display = avatarMenu.style.display === 'flex' ? 'none' : 'flex';
            if (!userAvatar) {
                // Take user directly to upload when no avatar exists
                avatarUploadBtn.click();
            }
        });
    }

    if (avatarUploadBtn && profileInput) {
        avatarUploadBtn.addEventListener('click', () => {
            avatarMenu.style.display = 'none';
            profileInput.click();
        });
    }

    const avatarEditBtn = document.getElementById('avatarEditBtn');
    if (avatarEditBtn) {
        avatarEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            avatarMenu.style.display = 'none';
            if (userAvatar) {
                openPhotoEditOverlay(userAvatar);
            } else {
                showToast('Please upload an image before editing.');
            }
        });
    }

    if (avatarDeleteBtn) {
        avatarDeleteBtn.addEventListener('click', () => {
            avatarMenu.style.display = 'none';
            removeProfilePicture();
        });
    }

    document.addEventListener('click', (e) => {
        if (avatarMenu && editPhotoBtnTop && !editPhotoBtnTop.contains(e.target) && !avatarMenu.contains(e.target)) {
            avatarMenu.style.display = 'none';
        }
    });

    // Ensure correct visibility for edit button state
    updateAvatarEditControlVisibility();
}


async function saveOfflineData() {
    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    if (privacyMode) {
        const data = {
            transactions,
            goals,
            monthlyBudget,
            currencySymbol,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem('bloom_privacy_data', JSON.stringify(data));
    }
}

// ============================================
// SECTIONS / NAVIGATION
// ============================================
function switchSection(section, el) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');

    document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('section-' + section);
    if (target) target.classList.add('active');

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');

    if (section === 'transactions') renderFullTxList();
    if (section === 'goals') renderGoalsFull();
    if (section === 'budgeting') updateBudgetSection();
    if (section === 'subscriptions') renderSubscriptions();
    if (section === 'settings') {
        document.getElementById('settingsName').value = userName;
        const selectedCurrency = currencyCode || 'INR';
        document.getElementById('currencySelect').value = selectedCurrency;
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = localStorage.getItem('bloom_theme') || 'dark';
        }

        // Update Save button visibility
        document.getElementById('saveNameBtn').style.display = 'none';
        document.getElementById('saveCurrencyBtn').style.display = 'none';

        // Update account name display
        const accountNameDisplay = document.getElementById('accountNameDisplay');
        if (accountNameDisplay) {
            accountNameDisplay.textContent = userName || 'User';
        }

        // Show mode indicator in settings
        const settingsEmail = document.getElementById('settingsEmail');
        const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
        if (settingsEmail) {
            if (privacyMode) {
                settingsEmail.parentElement.innerHTML = '<p style="color:var(--sage);font-size:14px;margin-bottom:16px;"><strong>Privacy Mode</strong> - All data local only</p>';
            } else {
                settingsEmail.textContent = userEmail;
            }
        }
    }

    // Keep URL hash in sync with the current section
    try {
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', '#' + section);
        } else {
            window.location.hash = section;
        }
    } catch (e) {
        // Silently fail if file:// security prevents hash changes in some environments
        // This is a common issue with 'file://' origins and history API
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

function toggleSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.contains('collapsed');
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('bloom_sidebar_collapsed', !isCollapsed);
}

// ============================================
// PROFILE DROPDOWN (Top-right)
// ============================================
function toggleProfileDropdown() {
    profileDropdownOpen = !profileDropdownOpen;
    const dd = document.getElementById('profileDropdown');
    dd.classList.toggle('open', profileDropdownOpen);
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown-wrapper')) {
        profileDropdownOpen = false;
        const dd = document.getElementById('profileDropdown');
        if (dd) dd.classList.remove('open');
    }
});

async function handleLogout() {
    await supabaseClient.auth.signOut();

    // clear privacy mode flags when regular user logs out
    localStorage.removeItem('bloom_privacy_mode');
    localStorage.removeItem('bloom_session_id');
    localStorage.removeItem('bloom_privacy_data');

    window.location.href = 'login.html';
}

// ============================================
// SET TYPE / FILTER
// ============================================
function setType(t) {
    currentType = t;
    document.getElementById('btnIncome').className = 'type-btn' + (t === 'income' ? ' active-income' : '');
    document.getElementById('btnExpense').className = 'type-btn' + (t === 'expense' ? ' active-expense' : '');
    const sel = document.getElementById('txCategory');
    if (t === 'income') sel.value = 'Salary';
    else sel.value = 'Food & Drink';

    // Hide suggestions when type changes
    const suggestionsDiv = document.getElementById('txNameSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

function setFilter(f, el) {
    filter = f;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    renderTx();
    renderFullTxList();
}

function filterTransactions(query) {
    searchQuery = query.toLowerCase().trim();
    renderTx();
    renderFullTxList();
}

// ============================================
// ADD TRANSACTION
// ============================================
async function addTransaction() {
    const name = document.getElementById('txName').value.trim();
    const amount = parseFloat(document.getElementById('txAmount').value);
    const category = document.getElementById('txCategory').value;
    const dateInput = document.getElementById('txDate');
    if (!name) { showToast('Please enter a description'); return; }
    if (!amount || amount <= 0) { showToast('Please enter a valid amount'); return; }

    let txDate;
    if (dateInput && dateInput.value) {
        txDate = dateInput.value;
    } else {
        const now = new Date();
        if (now.getMonth() !== viewDate.getMonth() || now.getFullYear() !== viewDate.getFullYear()) {
            txDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-15`;
        } else {
            txDate = now.toISOString().split('T')[0];
        }
    }

    const btn = document.getElementById('addTxBtn');
    if (btn) btn.disabled = true;

    const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
    let result = null;

    if (privacyMode) {
        // For privacy mode, create a fake ID and add directly
        result = { id: 'privacy_' + Date.now(), transaction_date: txDate };
    } else {
        result = await insertTransaction({ name, amount, category, type: currentType, date: txDate });
    }

    if (result) {
        transactions.unshift({
            id: result.id, name, amount, category, type: currentType, date: result.transaction_date
        });
        document.getElementById('txName').value = '';
        document.getElementById('txAmount').value = '';
        if (dateInput) dateInput.value = '';
        update();
        closeModal(true);
        await saveOfflineData();
        showToast(currentType === 'income' ? 'Income added successfully' : 'Expense recorded successfully');
    }
    if (btn) btn.disabled = false;
}

async function deleteTransaction(id) {
    await removeTransaction(id);
    transactions = transactions.filter(t => t.id !== id);
    update();
    await saveOfflineData();
    showToast('Transaction removed');
}

// ============================================
// UPDATE DASHBOARD
// ============================================
function update() {
    const txs = getMonthTx();
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;
    const savRate = income > 0 ? Math.round((balance / income) * 100) : 0;
    const incCount = txs.filter(t => t.type === 'income').length;
    const expCount = txs.filter(t => t.type === 'expense').length;

    document.getElementById('totalIncome').textContent = fmt(income);
    document.getElementById('totalExpenses').textContent = fmt(expenses);
    document.getElementById('netBalance').textContent = fmt(balance);
    document.getElementById('savingsRate').textContent = Math.max(0, savRate) + '%';
    document.getElementById('incomeCount').textContent = `${incCount} transaction${incCount !== 1 ? 's' : ''}`;
    document.getElementById('expenseCount').textContent = `${expCount} transaction${expCount !== 1 ? 's' : ''}`;
    document.getElementById('savingsGoalText').textContent = 'Goal: 45%';

    // Balance trend
    const prevMonth = new Date(viewDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevTxs = getMonthTx(prevMonth);
    const prevIncome = prevTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpenses = prevTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const prevBalance = prevIncome - prevExpenses;
    let trendPct = prevBalance !== 0 ? ((balance - prevBalance) / Math.abs(prevBalance) * 100).toFixed(1) : 0;
    const trendText = document.getElementById('balanceTrendText');
    if (trendPct > 0) {
        trendText.textContent = `+${trendPct}% from last month`;
        trendText.parentElement.style.color = 'var(--sage-dark)';
    } else if (trendPct < 0) {
        trendText.textContent = `${trendPct}% from last month`;
        trendText.parentElement.style.color = 'var(--coral)';
    } else {
        trendText.textContent = 'No change from last month';
        trendText.parentElement.style.color = 'var(--ink-faint)';
    }

    // Budget
    const budgetPct = monthlyBudget > 0 ? (expenses / monthlyBudget) * 100 : 0;
    const barPct = Math.min(100, budgetPct);
    const budgetBar = document.getElementById('budgetBar');
    const budgetText = document.getElementById('budgetText');

    budgetBar.style.width = barPct + '%';
    if (budgetPct > 100) {
        budgetBar.style.background = 'var(--coral)';
        budgetText.textContent = `${Math.round(budgetPct - 100)}% over budget`;
        budgetText.style.color = 'var(--coral)';
    } else {
        budgetBar.style.background = 'linear-gradient(90deg, var(--sage-light), var(--sage))';
        budgetText.textContent = `${fmt(monthlyBudget - expenses)} left`;
        budgetText.style.color = 'var(--ink-faint)';
    }

    renderChart(txs);
    renderTx();
    renderNav();
    renderAreaChart();
    renderGoalsPreview();
    renderSpendingHeatmap();
    renderSubscriptions();
    updateGreeting();
}

// ============================================
// USER AVATAR HANDLING
// ============================================
function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Simple hash function for Gravatar URL generation
function simpleHash(str) {
    let hash = 0;
    str = str.trim().toLowerCase();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

function getGoogleAvatarUrl(email) {
    if (!email) return null;
    // Use Gravatar service with initials as fallback
    const hash = simpleHash(email);
    return `https://www.gravatar.com/avatar/${hash}?d=blank&s=200`;
}

function setUserAvatar(element, email, name) {
    if (!element) return;

    try {
        const savedAvatar = userAvatar;
        if (savedAvatar) {
            // Use saved custom avatar if exists
            if (savedAvatar.startsWith('data:') || savedAvatar.startsWith('http')) {
                element.style.backgroundImage = `url('${savedAvatar}')`;
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
                element.style.color = 'transparent';
                element.textContent = '';
            } else {
                // It's initials
                element.style.backgroundImage = 'none';
                element.textContent = savedAvatar;
                element.style.color = 'inherit';
            }
            return;
        }

        // Fallback to initials if no saved avatar
        const initials = getInitials(name);
        element.textContent = initials;
        element.style.color = 'inherit';
        element.style.backgroundImage = 'none';
    } catch (error) {

        element.textContent = getInitials(name);
    }
}

function updateAvatarEditControlVisibility() {
    const editPhotoBtnTop = document.getElementById('editPhotoBtnTop');
    const avatarUploadBtn = document.getElementById('avatarUploadBtn');
    const avatarEditBtn = document.getElementById('avatarEditBtn');
    const avatarDeleteBtn = document.getElementById('avatarDeleteBtn');
    const hasAvatar = !!userAvatar;

    // Keep pen icon always available (user can still upload when there is no photo)
    if (editPhotoBtnTop) {
        editPhotoBtnTop.style.display = 'block';
    }

    if (avatarUploadBtn) {
        avatarUploadBtn.style.display = 'block';
    }
    if (avatarEditBtn) {
        avatarEditBtn.style.display = hasAvatar ? 'block' : 'none';
    }
    if (avatarDeleteBtn) {
        avatarDeleteBtn.style.display = hasAvatar ? 'block' : 'none';
    }
}

function updateUserAvatar() {
    try {
        const userInitialsEl = document.getElementById('userInitials');
        const profileInitials = document.getElementById('profileInitials');
        const settingsProfilePicture = document.getElementById('settingsProfilePicture');

        if (userInitialsEl) {
            setUserAvatar(userInitialsEl, userEmail, userName);
        }
        if (profileInitials) {
            setUserAvatar(profileInitials, userEmail, userName);
        }
        if (settingsProfilePicture) {
            setUserAvatar(settingsProfilePicture, userEmail, userName);
        }

        updateAvatarEditControlVisibility();
    } catch (error) {

    }
}

function updateGreeting() {
    try {
        const hour = new Date().getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
        else if (hour >= 17) greeting = 'Good Evening';
        const displayName = userName || 'there';
        const initials = getInitials(userName);

        // Safe element updates with null checks
        const greetingLabel = document.getElementById('greetingLabel');
        if (greetingLabel) {
            greetingLabel.textContent = `${greeting}, ${displayName}`;
        }

        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = userName || 'User';
        }

        // Profile dropdown
        const ddName = document.getElementById('profileDropdownName');
        if (ddName) {
            ddName.textContent = userName || 'User';
        }
        const ddEmail = document.getElementById('profileDropdownEmail');
        if (ddEmail) {
            ddEmail.textContent = userEmail || '';
        }

        // Update avatar
        updateUserAvatar();
    } catch (error) {

    }
}

// ============================================
// NAVIGATION
// ============================================
function renderNav() {
    const monthSel = document.getElementById('monthSelect');
    const yearSel = document.getElementById('yearSelect');

    if (monthSel.options.length === 0) {
        MONTHS.forEach((m, i) => monthSel.add(new Option(m, i)));
        let currentY = new Date().getFullYear();
        for (let y = currentY - 5; y <= currentY + 5; y++) yearSel.add(new Option(y, y));
        monthSel.onchange = (e) => { viewDate.setMonth(parseInt(e.target.value)); update(); };
        yearSel.onchange = (e) => { viewDate.setFullYear(parseInt(e.target.value)); update(); };
    }

    monthSel.value = viewDate.getMonth();
    yearSel.value = viewDate.getFullYear();
}

document.getElementById('prevMonth').onclick = () => {
    viewDate.setMonth(viewDate.getMonth() - 1);
    update();
    renderFullTxList();
};

document.getElementById('nextMonth').onclick = () => {
    viewDate.setMonth(viewDate.getMonth() + 1);
    update();
    renderFullTxList();
};

function prevM() { viewDate.setMonth(viewDate.getMonth() - 1); update(); renderFullTxList(); }
function nextM() { viewDate.setMonth(viewDate.getMonth() + 1); update(); renderFullTxList(); }
function jumpToCurrent() { viewDate = new Date(); update(); renderFullTxList(); }

// ============================================
// RENDER TRANSACTIONS
// ============================================
function renderTx() {
    const txs = getMonthTx();
    let filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter);
    if (searchQuery) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(searchQuery) ||
            t.category.toLowerCase().includes(searchQuery)
        );
    }

    const list = document.getElementById('txList');
    if (!list) return;

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No ' + (filter === 'all' ? '' : filter + ' ') + 'transactions this month.</p></div>';
        return;
    }

    const recent = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    list.innerHTML = recent.map(t => buildTxItem(t)).join('');
}

function renderFullTxList() {
    const txs = getMonthTx();
    let filtered = filter === 'all' ? txs : txs.filter(t => t.type === filter);
    if (searchQuery) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(searchQuery) ||
            t.category.toLowerCase().includes(searchQuery)
        );
    }

    const list = document.getElementById('txListFull');
    const label = document.getElementById('txMonthLabel');
    if (!list) return;
    if (label) label.textContent = `${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No transactions found.</p></div>';
        return;
    }

    list.innerHTML = filtered.sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => buildTxItem(t)).join('');
}

function buildTxItem(t) {
    const d = new Date(t.date);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const col = CATEGORY_COLORS[t.category] || '#c0b8a8';
    const label = CATEGORY_LABELS[t.category] || 'OT';
    return `<div class="tx-item">
      <div class="tx-icon" style="background:${col}18;color:${col};font-weight:700;font-size:11px;letter-spacing:0.04em;">${label}</div>
      <div class="tx-info">
        <div class="tx-name">${t.name}</div>
        <div class="tx-meta">${dateStr} - ${t.category}</div>
      </div>
      <div class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</div>
      <button class="tx-delete" onclick="deleteTransaction('${t.id}')" title="Remove">x</button>
    </div>`;
}

// ============================================
// DONUT CHART
// ============================================
function renderChart(txs) {
    try {
        const donutTotal = document.getElementById('donutTotal');
        if (!donutTotal) return; // Exit if chart elements don't exist (privacy mode)

        const expenses = txs.filter(t => t.type === 'expense');
        const total = expenses.reduce((s, t) => s + t.amount, 0);
        donutTotal.textContent = fmt(total);

        const groups = {};
        expenses.forEach(t => { groups[t.category] = (groups[t.category] || 0) + t.amount; });
        const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

        const seg = document.getElementById('donutSegments');
        const legend = document.getElementById('chartLegend');

        if (!seg || !legend) return; // Exit if elements don't exist

        if (sorted.length === 0) {
            seg.innerHTML = '';
            legend.innerHTML = '<div class="empty-state" style="padding:10px 0;"><p style="font-size:13px">No expenses yet</p></div>';
            return;
        }

        const r = 70, cx = 90, cy = 90, circ = 2 * Math.PI * r;
        let offset = 0;
        seg.innerHTML = sorted.map(([cat, amt]) => {
            const pct = total > 0 ? amt / total : 0;
            const dash = pct * circ, gap = circ - dash;
            const color = CATEGORY_COLORS[cat] || '#c0b8a8';
            const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="28" stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${-offset}" stroke-linecap="butt"/>`;
            offset += dash; return el;
        }).join('');

        legend.innerHTML = sorted.slice(0, 5).map(([cat, amt]) => {
            const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
            const color = CATEGORY_COLORS[cat] || '#c0b8a8';
            return `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div><span class="legend-name">${cat}</span><span class="legend-pct">${pct}%</span></div>`;
        }).join('');
    } catch (error) {

    }
}

// ============================================
// AREA CHART
// ============================================
function setChartPeriod(months, el) {
    chartPeriod = months;
    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    renderAreaChart();
}

function renderAreaChart() {
    const canvas = document.getElementById('spendingCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width || 540;
    const h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    const now = new Date(viewDate);
    const months = [];
    const values = [];

    for (let i = chartPeriod - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(MONTHS[d.getMonth()].substring(0, 3).toUpperCase());
        const monthTx = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && t.type === 'expense';
        });
        values.push(monthTx.reduce((s, t) => s + t.amount, 0));
    }

    const maxVal = Math.max(...values, 100);
    const padding = { top: 20, right: 20, bottom: 40, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const gridLines = 4;
    ctx.strokeStyle = '#f0ebe3';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartH / gridLines) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
    }

    const points = values.map((v, i) => ({
        x: padding.left + (i / (values.length - 1 || 1)) * chartW,
        y: padding.top + chartH - (v / maxVal) * chartH
    }));

    if (points.length < 2) return;

    const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
    gradient.addColorStop(0, 'rgba(77, 122, 82, 0.2)');
    gradient.addColorStop(1, 'rgba(77, 122, 82, 0.01)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1], curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.lineTo(points[0].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1], curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = '#4d7a52';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#b8ad9e';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    const step = values.length > 8 ? Math.ceil(values.length / 7) : 1;
    months.forEach((m, i) => {
        if (i % step === 0 || i === months.length - 1) {
            ctx.fillText(m, points[i].x, h - padding.bottom + 20);
        }
    });

    points.forEach((p, i) => {
        if (values[i] > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#4d7a52';
            ctx.fill();
        }
    });

    const peakVal = Math.max(...values);
    const peakIdx = values.indexOf(peakVal);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    document.getElementById('peakSpending').textContent = fmt(peakVal);
    document.getElementById('peakMonth').textContent = peakVal > 0 ? months[peakIdx] : '--';
    document.getElementById('avgSpending').textContent = fmt(avg);
}

// ============================================
// GOALS
// ============================================
function renderGoalsPreview() {
    const container = document.getElementById('goalsPreview');
    if (!container) return;
    if (goals.length === 0) {
        container.innerHTML = '<p style="color:var(--ink-faint);text-align:center;padding:20px 0;font-size:13px;">No savings goals yet.</p>';
        return;
    }
    container.innerHTML = goals.slice(0, 3).map(g => {
        const progress = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        return `<div class="goal-preview-item">
          <div class="goal-preview-header">
            <span class="goal-preview-name">${g.name}</span>
            <span class="goal-preview-amount">${fmtShort(g.current)} / ${fmtShort(g.target)}</span>
          </div>
          <span class="goal-preview-pct">${progress}% COMPLETE</span>
          <div class="goal-progress"><div class="goal-bar" style="width:${progress}%"></div></div>
        </div>`;
    }).join('');
}

function renderGoalsFull() {
    const container = document.getElementById('goalsFullList');
    if (!container) return;
    if (goals.length === 0) {
        container.innerHTML = '<p style="color:var(--ink-faint);text-align:center;padding:60px 0;">No goals yet. Create your first financial goal!</p>';
        return;
    }
    container.innerHTML = goals.map(g => {
        const progress = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        const deadline = g.deadline ? new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline';
        return `<div class="goal-item">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${g.name}</strong>
            <span style="font-size:13px;color:var(--ink-light);">${fmt(g.current)} / ${fmt(g.target)}</span>
          </div>
          <div class="goal-progress" style="margin:10px 0;"><div class="goal-bar" style="width:${progress}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-faint);">
            <span>${progress}% complete</span>
            <span>by ${deadline}</span>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
            <label for="contrib-full-${g.id}" style="display:none;">Add contribution amount for ${g.name}</label>
            <input type="number" id="contrib-full-${g.id}" placeholder="Add amount" class="modal-input" style="flex:1;margin-bottom:0;" aria-label="Add contribution amount for ${g.name}">
            <button onclick="addGoalContribution('${g.id}', 'full')" class="btn-primary" style="padding:10px 16px;">Add</button>
            <button onclick="deleteGoal('${g.id}')" style="background:none;border:none;color:var(--coral);font-size:18px;cursor:pointer;" aria-label="Delete goal ${g.name}">x</button>
          </div>
        </div>`;
    }).join('');
}

function renderGoals() {
    const container = document.getElementById('goalsList');
    if (goals.length === 0) {
        container.innerHTML = '<p style="color:var(--ink-faint);text-align:center;padding:40px 0;">No goals yet. Create your first financial goal above.</p>';
        return;
    }
    container.innerHTML = goals.map(g => {
        const progress = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        const deadline = g.deadline ? new Date(g.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline';
        return `<div class="goal-item">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${g.name}</strong>
            <span style="font-size:13px;color:var(--ink-light);">${fmt(g.current)} / ${fmt(g.target)}</span>
          </div>
          <div class="goal-progress" style="margin:10px 0;"><div class="goal-bar" style="width:${progress}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ink-faint);">
            <span>${progress}% complete</span>
            <span>by ${deadline}</span>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
            <label for="contrib-${g.id}" style="display:none;">Add contribution amount for ${g.name}</label>
            <input type="number" id="contrib-${g.id}" placeholder="Add amount" class="modal-input" style="flex:1;margin-bottom:0;" aria-label="Add contribution amount for ${g.name}">
            <button onclick="addGoalContribution('${g.id}')" class="btn-primary" style="padding:10px 16px;">Add</button>
            <button onclick="deleteGoal('${g.id}')" style="background:none;border:none;color:var(--coral);font-size:18px;cursor:pointer;" aria-label="Delete goal ${g.name}">x</button>
          </div>
        </div>`;
    }).join('');
}

function showAddGoalForm() { document.getElementById('addGoalForm').style.display = 'block'; }
function hideAddGoalForm() { document.getElementById('addGoalForm').style.display = 'none'; }

async function addNewGoal() {
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const deadline = document.getElementById('goalDeadline').value;
    if (!name || !target) { showToast('Please fill goal name and target'); return; }

    const result = await insertGoal({ name, target, deadline });
    if (result) {
        goals.unshift({ id: result.id, name, target, current: 0, deadline: result.deadline });
        document.getElementById('goalName').value = '';
        document.getElementById('goalTarget').value = '';
        document.getElementById('goalDeadline').value = '';
        hideAddGoalForm(); renderGoals(); renderGoalsPreview(); renderGoalsFull();
        await saveOfflineData();
        showToast('Goal created successfully');
    }
}

async function addGoalContribution(id, prefix = '') {
    const inputId = prefix ? `contrib-${prefix}-${id}` : `contrib-${id}`;
    const input = document.getElementById(inputId);
    const amount = parseFloat(input.value);
    if (!amount || amount <= 0) return;
    const goal = goals.find(g => g.id === id);
    if (goal) {
        goal.current += amount;
        await updateGoalAmount(id, goal.current);
        renderGoals(); renderGoalsPreview(); renderGoalsFull();
        input.value = '';
        await saveOfflineData();
        showToast('Contribution added');
    }
}

async function deleteGoal(id) {
    if (confirm('Delete this goal?')) {
        await removeGoal(id);
        goals = goals.filter(g => g.id !== id);
        renderGoals(); renderGoalsPreview(); renderGoalsFull();
        await saveOfflineData();
        showToast('Goal deleted');
    }
}

// ============================================
// BUDGET
// ============================================
function updateBudgetSection() {
    const txs = getMonthTx();
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const remaining = monthlyBudget - expenses;
    const pct = monthlyBudget > 0 ? Math.min(100, Math.round((expenses / monthlyBudget) * 100)) : 0;

    document.getElementById('budgetInputInline').value = monthlyBudget;
    document.getElementById('budgetAmountText').textContent = fmt(monthlyBudget);
    document.getElementById('budgetSpentText').textContent = fmt(expenses);
    document.getElementById('budgetRemainText').textContent = fmt(Math.max(0, remaining));
    document.getElementById('budgetPctText').textContent = pct + '%';

    const ring = document.getElementById('budgetRing');
    const circ = 2 * Math.PI * 50;
    const dash = (pct / 100) * circ;
    ring.style.strokeDasharray = `${dash} ${circ}`;
    ring.style.stroke = pct > 100 ? 'var(--coral)' : 'var(--sage)';
}

async function saveBudgetInline() {
    const val = parseFloat(document.getElementById('budgetInputInline').value);
    if (!isNaN(val) && val >= 0) {
        monthlyBudget = val;
        await saveProfile();
        update();
        updateBudgetSection();
        await saveOfflineData();
        showToast('Budget updated');
    }
}

async function saveCurrency() {
    const selected = document.getElementById('currencySelect').value;
    const currencyMap = {
        'INR': { symbol: '₹', code: 'INR', locale: 'en-IN' },
        'USD': { symbol: '$', code: 'USD', locale: 'en-US' },
        'EUR': { symbol: '€', code: 'EUR', locale: 'en-DE' },
        'GBP': { symbol: '£', code: 'GBP', locale: 'en-GB' }
    };

    const currData = currencyMap[selected];
    if (!currData) return;
    currencySymbol = currData.symbol;
    currencyCode = currData.code;
    numberFormat = currData.locale;

    await saveProfile();
    updateCurrencyLabels();
    update();
    await saveOfflineData();
    document.getElementById('saveCurrencyBtn').style.display = 'none';
    if (document.getElementById('addGoalForm')) document.getElementById('addGoalForm').style.display = 'none';
}

async function saveTheme() {
    const theme = document.getElementById('themeSelect')?.value || 'dark';

    // Apply theme immediately
    applyTheme(theme);

    // Save to localStorage for persistence (Supabase theme column will be added later)
    localStorage.setItem('bloom_theme', theme);

    showToast(`Theme set to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = localStorage.getItem('bloom_theme') || 'system';
    let newTheme;

    if (currentTheme === 'system') {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    } else if (currentTheme === 'dark') {
        newTheme = 'light';
    } else {
        newTheme = 'system';
    }

    localStorage.setItem('bloom_theme', newTheme);
    applyTheme(newTheme);
    updateThemeButton();
    showToast(`Theme: ${newTheme === 'system' ? 'System' : newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
}

function applyTheme(theme) {
    const html = document.documentElement;
    const isDark = theme === 'dark';

    if (isDark) {
        html.style.colorScheme = 'dark';
        html.classList.add('dark-mode');
        html.classList.remove('light-mode');
    } else {
        html.style.colorScheme = 'light';
        html.classList.add('light-mode');
        html.classList.remove('dark-mode');
    }
}

function updateThemeButton() {
    const theme = localStorage.getItem('bloom_theme') || 'system';
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) themeSelect.value = theme;
}

// ============================================
// REPORT
// ============================================
function generateReport() {
    const txs = getMonthTx();
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expenses;
    const savRate = income > 0 ? Math.round((balance / income) * 100) : 0;

    const groups = {};
    txs.filter(t => t.type === 'expense').forEach(t => groups[t.category] = (groups[t.category] || 0) + t.amount);
    const top5 = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 5);

    document.getElementById('repMonthLabel').textContent = `Summary for ${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    document.getElementById('repTotalInc').textContent = fmt(income);
    document.getElementById('repTotalExp').textContent = fmt(expenses);
    document.getElementById('repNetBal').textContent = fmt(balance);
    document.getElementById('repSavRate').textContent = savRate + '%';
    document.getElementById('repTxCount').textContent = txs.length;

    let topHtml = top5.map(([c, a]) => `<div class="modal-stat-row"><span>${c}</span><strong>${fmt(a)}</strong></div>`).join('');
    document.getElementById('repTop5').innerHTML = topHtml || '<p style="color:var(--ink-faint); font-size:13px">No expenses recorded.</p>';
    openModal('reportModal');
}

// ============================================
// YEAR VIEW
// ============================================
function generateYearView() {
    const year = viewDate.getFullYear();
    let yearInc = 0, yearExp = 0;
    let mData = Array(12).fill().map(() => ({ inc: 0, exp: 0 }));

    transactions.forEach(t => {
        let d = new Date(t.date);
        if (d.getFullYear() === year) {
            let m = d.getMonth();
            if (t.type === 'income') { yearInc += t.amount; mData[m].inc += t.amount; }
            else { yearExp += t.amount; mData[m].exp += t.amount; }
        }
    });

    document.getElementById('yearViewTitle').textContent = year;
    document.getElementById('yvInc').textContent = fmt(yearInc);
    document.getElementById('yvExp').textContent = fmt(yearExp);
    document.getElementById('yvSav').textContent = fmt(yearInc - yearExp);

    const maxVal = Math.max(...mData.map(d => Math.max(d.inc, d.exp))) || 1;
    document.getElementById('yearChart').innerHTML = mData.map((d, i) => {
        const hInc = (d.inc / maxVal) * 100;
        const hExp = (d.exp / maxVal) * 100;
        return `<div class="year-bar-group">
          <div class="year-bars">
            <div class="y-bar inc" style="height:${hInc}%" title="Income: ${fmt(d.inc)}"></div>
            <div class="y-bar exp" style="height:${hExp}%" title="Expense: ${fmt(d.exp)}"></div>
          </div>
          <div class="y-label">${MONTHS[i].substring(0, 3)}</div>
        </div>`;
    }).join('');
    openModal('yearModal');
}

// ============================================
// CALENDAR
// ============================================
function generateCalendar() {
    calendarDate = new Date(viewDate);
    renderCalendar();
    openModal('calendarModal');
}

function renderCalendar() {
    document.getElementById('calendarTitle').textContent = `${MONTHS[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day other-month';
        grid.appendChild(dayEl);
    }

    const monthTx = getMonthTx(calendarDate);
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        const dayTx = monthTx.filter(t => new Date(t.date).getDate() === day);
        if (dayTx.length > 0) dayEl.classList.add('has-tx');
        if (calendarDate.getFullYear() === today.getFullYear() &&
            calendarDate.getMonth() === today.getMonth() && day === today.getDate()) {
            dayEl.classList.add('today');
        }
        dayEl.onclick = () => {
            if (dayTx.length > 0) {
                const listHTML = dayTx.map(t => `${t.name} -- ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}`).join('<br>');
                showToast(`Day ${day}:<br>${listHTML}`);
            } else {
                showToast(`No transactions on day ${day}`);
            }
        };
        grid.appendChild(dayEl);
    }
}

function prevCalendarMonth() { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); }
function nextCalendarMonth() { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); }

// ============================================
// EXPORT
// ============================================

function backupData() {
    downloadFile(JSON.stringify({ transactions, goals, monthlyBudget, userName }, null, 2), 'application/json', `bloom_backup_${Date.now()}.json`);
    showToast('Backup created');
}

function downloadFile(content, type, filename) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
        try {
            const data = JSON.parse(evt.target.result);
            if (data.transactions && Array.isArray(data.transactions)) {
                // Import each transaction to Supabase
                for (const t of data.transactions) {
                    await insertTransaction({
                        name: t.name,
                        amount: t.amount,
                        category: t.category,
                        type: t.type,
                        date: t.date.split('T')[0] || t.date
                    });
                }
                await loadTransactions();
                update();
                showToast('Data imported successfully');
            }
        } catch (err) { showToast('Invalid backup file'); }
        e.target.value = '';
    };
    reader.readAsText(file);
}

function exportHTMLReport() {
    const txs = getMonthTx();
    let html = `<html><head><title>Bloom Report</title><style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #2c2416; padding: 20px; }
        h2 { border-bottom: 2px solid #7a9e7e; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { border-bottom: 1px solid #e0d8cc; padding: 10px; text-align: left; }
        th { background: #f5f0e8; }
        .inc { color: #4d7a52; } .exp { color: #d4735a; }
      </style></head><body>
      <h2>Bloom Monthly Report - ${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}</h2>
      <table>
        <tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th style="text-align:right">Amount</th></tr>
        ${txs.map(t => `<tr>
          <td>${new Date(t.date).toLocaleDateString()}</td>
          <td style="text-transform:capitalize">${t.type}</td>
          <td>${t.category}</td>
          <td>${t.name}</td>
          <td class="${t.type === 'income' ? 'inc' : 'exp'}" style="text-align:right">${t.type === 'income' ? '+' : '-'}${fmt(t.amount)}</td>
        </tr>`).join('')}
      </table>`;
    const win = window.open('', '', 'width=800,height=600');
    win.document.write(html); win.document.close();
}

// ============================================
// TOAST
// ============================================
function showToast(msg) {
    if (!msg) return;

    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastClose = document.getElementById('toastClose');

    if (!toast || !toastMessage) return;

    // Set message
    toastMessage.textContent = msg;

    // Show toast
    toast.classList.add('show');

    // Clear any existing timeout
    if (toast._timer) clearTimeout(toast._timer);

    // Auto close after 5 seconds
    toast._timer = setTimeout(() => {
        if (toast.classList.contains('show')) {
            toast.classList.remove('show');
        }
    }, 5000);
}

function closeToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('show');
        if (toast._timer) clearTimeout(toast._timer);
    }
}

// ============================================
// MODAL MANAGEMENT
// ============================================
function openModal(modalId) {

    const overlay = document.getElementById('modalOverlay');
    const modal = document.getElementById(modalId);




    if (!overlay || !modal) {

        return;
    }

    // Ensure the modal is inside overlay so it centers correctly.
    if (modal.parentElement !== overlay) {
        overlay.appendChild(modal);
    }

    // Hide other modals, show this one.
    document.querySelectorAll('#modalOverlay .modal').forEach(m => m.classList.remove('active'));

    modal.classList.add('active');
    overlay.classList.add('active');

    // Keep CSS centering logic from style rules; only force if needed
    modal.style.opacity = '1';
    modal.style.pointerEvents = 'auto';
    modal.style.transform = 'translate(-50%, -50%)';

    // prevent clicks inside the modal from closing overlay
    modal.addEventListener('click', e => e.stopPropagation());

    // Initialize modal fields if it's the add transaction modal
    if (modalId === 'addTxModal') {
        initializeTransactionModal();
    } else if (modalId === 'subscriptionModal') {
        initializeSubscriptionModal();
    }
}

function closeModal(force) {
    const overlay = document.getElementById('modalOverlay');

    // Hide suggestions when closing modal
    const txSuggestionsDiv = document.getElementById('txNameSuggestions');
    if (txSuggestionsDiv) {
        txSuggestionsDiv.style.display = 'none';
    }
    const subSuggestionsDiv = document.getElementById('subNameSuggestions');
    if (subSuggestionsDiv) {
        subSuggestionsDiv.style.display = 'none';
    }

    // Handle different ways to close:
    // 1. force === true: Close from close button (always close)
    // 2. force is Event: Close only if clicking on overlay itself, not modal
    const shouldClose = (force === true) || (force instanceof Event && force.target === overlay);

    if (shouldClose && overlay) {
        overlay.classList.remove('active');
        document.querySelectorAll('.modal').forEach(m => {
            m.classList.remove('active');
            // RESET INLINE STYLES added by openModal
            m.style.opacity = '';
            m.style.pointerEvents = '';
            m.style.transform = '';
        });
    }
}

// ============================================
// FINANCIAL TIP
// ============================================
function setFinancialTip() {
    const tipEl = document.getElementById('financialTip');
    if (tipEl) {
        const idx = Math.floor(Math.random() * FINANCIAL_TIPS.length);
        tipEl.textContent = FINANCIAL_TIPS[idx];
    }
}

function exitPrivacyMode() {
    if (confirm('Exit Privacy Mode? Your local data will be preserved. You can return to Privacy Mode anytime.')) {
        localStorage.removeItem('bloom_privacy_mode');
        localStorage.removeItem('bloom_session_id');
        window.location.href = 'login.html';
    }
}

// ============================================
// KEYBOARD
// ============================================
document.addEventListener('keydown', e => {
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;

    if (e.key === 'Enter' && (document.activeElement.id === 'txName' || document.activeElement.id === 'txAmount'))
        addTransaction();

    if ((e.key === 'Escape') || ((e.key === ' ' || e.code === 'Space') && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(activeTag))) {
        closeModal(true);
        closePhotoEditOverlay();
        e.preventDefault();
    }

    // Arrow key shortcut for collapsing/expanding sidebar
    if (e.key === 'ArrowLeft') {
        toggleSidebarCollapse();
    }
    if (e.key === 'ArrowRight') {
        toggleSidebarCollapse();
    }
});

// ============================================
// RESIZE HANDLER
// ============================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => renderAreaChart(), 200);
});

// ============================================
// INIT (Auth-gated or Privacy Mode)
// ============================================
(async function init() {
    try {
        // Apply theme immediately on load
        const theme = localStorage.getItem('bloom_theme') || 'system';
        applyTheme(theme);
        updateThemeButton();

        // Check for Privacy Mode first (completely separate from auth)
        const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';
        if (privacyMode) {
            // Load from localStorage (Privacy Mode - no Supabase)
            const privacyData = JSON.parse(localStorage.getItem('bloom_privacy_data') || '{}');
            transactions = privacyData.transactions || [];
            goals = privacyData.goals || [];
            userName = 'You (Private)';
            monthlyBudget = privacyData.monthlyBudget || 2000;
            currencySymbol = privacyData.currencySymbol || '₹';
            const currencyMap = {
                '₹': { code: 'INR', locale: 'en-IN' },
                '$': { code: 'USD', locale: 'en-US' },
                '€': { code: 'EUR', locale: 'en-DE' },
                '£': { code: 'GBP', locale: 'en-GB' }
            };
            const currData = currencyMap[currencySymbol] || { code: 'INR', locale: 'en-IN' };
            currencyCode = currData.code;
            numberFormat = currData.locale;
            currentUserId = localStorage.getItem('bloom_session_id');
            userEmail = '';

            updateGreeting();
            updateCurrencyLabels();
            update();

            showToast('Running in Privacy Mode - no data synced');

            // Hide loader
            setTimeout(() => {
                const loader = document.getElementById('globalLoader');
                if (loader) {
                    document.body.classList.remove('loading-state');
                    loader.classList.add('hidden');
                    setTimeout(() => loader.remove(), 500);
                }
            }, 300);
            return;
        }

        // Regular Authentication Flow (Supabase)
        const user = await requireAuth();
        if (!user) {

            return;
        }

        currentUserId = user.id;
        userEmail = user.email || '';

        // Load all data from Supabase with error handling
        try {
            await Promise.all([loadProfile(), loadTransactions(), loadGoals(), loadSubscriptions()]);
        } catch (dataError) {

            // Continue with empty state if data loading fails
        }

        // Set email display in settings
        const settingsEmail = document.getElementById('settingsEmail');
        if (settingsEmail) {
            settingsEmail.textContent = userEmail;
        }

        // Populate settings fields
        initializeSettingsFields();
        setupSettingsSaveButtons();

        // UI init
        updateGreeting();
        setFinancialTip();
        updateCurrencyLabels();
        update();
        renderSpendingHeatmap();
        renderSubscriptions();

        // Mark app ready, then hide loader when page has fully loaded
        appReady = true;
        if (pageLoaded) {
            hideGlobalLoader();
        }

        // Fallback, if page load has already happened or takes long
        setTimeout(() => {
            if (pageLoaded) hideGlobalLoader();
        }, 400);
    } catch (error) {

        showToast('Error loading app. Please refresh the page.');
        // Hide loader on error (safe fallback)
        appReady = true;
        if (pageLoaded) {
            hideGlobalLoader();
        } else {
            // degrade gracefully after timeout
            setTimeout(hideGlobalLoader, 2000);
        }
    }
})();

// Sync section from URL hash on load
(function setupHashNavigation() {
    function openHashSection() {
        const section = (window.location.hash || '#dashboard').replace('#', '');
        const navEl = document.querySelector(`.nav-item[data-section="${section}"]`);
        if (section && document.getElementById('section-' + section)) {
            switchSection(section, navEl);
        }
    }

    window.addEventListener('hashchange', openHashSection);
    openHashSection();
})();

// ============================================
// PROFILE PICTURE HANDLING
// ============================================
function handleProfilePictureUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showToast('Image must be less than 5MB');
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showToast('Please upload a valid image file (JPG, PNG, GIF, WebP)');
        return;
    }

    // Read image and open photo editor
    const reader = new FileReader();
    reader.onload = function (e) {
        const imageData = e.target.result;
        // Open photo editor with the selected image
        openPhotoEditOverlay(imageData);
    };
    reader.onerror = function () {
        showToast('Error reading image file');
    };
    reader.readAsDataURL(file);
}

function initProfilePictureUI() {
    try {
        // Update settings profile picture preview
        const settingsProfilePicture = document.getElementById('settingsProfilePicture');
        if (settingsProfilePicture) {
            setUserAvatar(settingsProfilePicture, userEmail, userName);
        }

        // Set up file input click handler for "Choose Photo" button
        const profilePictureInput = document.getElementById('profilePictureInput');
        const choosePhotoBtn = document.getElementById('choosePhotoBtn');
        if (choosePhotoBtn && profilePictureInput) {
            choosePhotoBtn.addEventListener('click', function (e) {
                e.preventDefault();
                // Open the photo editor overlay
                openPhotoEditOverlay();
            });
        }

        // Set up remove photo button
        const removePhotoBtn = document.getElementById('removePhotoBtn');
        if (removePhotoBtn) {
            removePhotoBtn.addEventListener('click', function (e) {
                e.preventDefault();
                removeProfilePicture();
            });
        }

        // Set up edit photo button hover effect
        const photoPreviewContainer = document.getElementById('photoPreviewContainer');
        if (photoPreviewContainer) {
            const overlay = photoPreviewContainer.querySelector('.photo-overlay');
            if (overlay) {
                photoPreviewContainer.addEventListener('mouseenter', () => {
                    overlay.style.opacity = '1';
                });
                photoPreviewContainer.addEventListener('mouseleave', () => {
                    overlay.style.opacity = '0';
                });
            }
        }
    } catch (error) {

    }
}

// ============================================
// TRANSACTION AUTOCOMPLETE
// ============================================
function initializeTransactionModal() {
    // Set date to current dashboard month/year
    // - If current month/year in dashboard: use today
    // - Otherwise: use first day of selected month
    const dateInput = document.getElementById('txDate');
    if (dateInput) {
        const today = new Date();
        const targetDate = new Date(viewDate || today);

        if (targetDate.getMonth() === today.getMonth() && targetDate.getFullYear() === today.getFullYear()) {
            targetDate.setDate(today.getDate());
        } else {
            targetDate.setDate(1);
        }

        dateInput.value = targetDate.toISOString().split('T')[0];
    }

    // Clear other fields
    const txName = document.getElementById('txName');
    const txAmount = document.getElementById('txAmount');
    if (txName) txName.value = '';
    if (txAmount) txAmount.value = '';

    // Hide suggestions
    const suggestionsDiv = document.getElementById('txNameSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}

function initializeSubscriptionModal() {
    // Set today's date in the start date input
    const startDateInput = document.getElementById('subStartDate');
    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.value = today;
    }

    // Clear other fields
    document.getElementById('subName').value = '';
    document.getElementById('subAmount').value = '';

    // Hide suggestions
    const suggestionsDiv = document.getElementById('subNameSuggestions');
    if (suggestionsDiv) {
        suggestionsDiv.style.display = 'none';
    }
}
function initTransactionAutocomplete() {
    const txNameInput = document.getElementById('txName');
    const suggestionsDiv = document.getElementById('txNameSuggestions');

    if (!txNameInput || !suggestionsDiv) return;

    let currentSuggestions = [];
    let selectedIndex = -1;

    txNameInput.addEventListener('input', function (e) {
        const value = e.target.value.toLowerCase().trim();
        if (value.length < 1) {
            hideSuggestions();
            return;
        }

        const suggestions = currentType === 'income' ? INCOME_SUGGESTIONS : EXPENSE_SUGGESTIONS;
        currentSuggestions = suggestions.filter(s => s.toLowerCase().includes(value));

        if (currentSuggestions.length > 0) {
            showSuggestions(currentSuggestions);
        } else {
            hideSuggestions();
        }
        selectedIndex = -1;
    });

    txNameInput.addEventListener('keydown', function (e) {
        if (!suggestionsDiv.style.display || suggestionsDiv.style.display === 'none') return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
            highlightSuggestion(selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            highlightSuggestion(selectedIndex);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            selectSuggestion(currentSuggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            hideSuggestions();
        }
    });

    txNameInput.addEventListener('blur', function () {
        // Delay hiding to allow click on suggestions
        setTimeout(() => {
            hideSuggestions();
        }, 150);
    });

    function showSuggestions(suggestions) {
        suggestionsDiv.innerHTML = suggestions.map((s, index) =>
            `<div class="suggestion-item" data-index="${index}">${s}</div>`
        ).join('');

        suggestionsDiv.style.display = 'block';

        // Add click handlers
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => selectSuggestion(suggestions[index]));
            item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                highlightSuggestion(index);
            });
        });
    }

    function hideSuggestions() {
        suggestionsDiv.style.display = 'none';
        selectedIndex = -1;
    }

    function highlightSuggestion(index) {
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });
    }

    function selectSuggestion(suggestion) {
        txNameInput.value = suggestion;
        hideSuggestions();
        // Focus next input (amount)
        document.getElementById('txAmount').focus();
    }
}

// ============================================
// SUBSCRIPTION AUTOCOMPLETE
// ============================================
function initSubscriptionAutocomplete() {
    const subNameInput = document.getElementById('subName');
    const suggestionsDiv = document.getElementById('subNameSuggestions');

    if (!subNameInput || !suggestionsDiv) return;

    let currentSuggestions = [];
    let selectedIndex = -1;

    subNameInput.addEventListener('input', function (e) {
        const value = e.target.value.toLowerCase().trim();
        if (value.length < 1) {
            hideSubscriptionSuggestions();
            return;
        }

        const suggestions = currentSubType === 'income' ? SUBSCRIPTION_INCOME_SUGGESTIONS : SUBSCRIPTION_EXPENSE_SUGGESTIONS;
        currentSuggestions = suggestions.filter(s => s.toLowerCase().includes(value));

        if (currentSuggestions.length > 0) {
            showSubscriptionSuggestions(currentSuggestions);
        } else {
            hideSubscriptionSuggestions();
        }
        selectedIndex = -1;
    });

    subNameInput.addEventListener('keydown', function (e) {
        if (!suggestionsDiv.style.display || suggestionsDiv.style.display === 'none') return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
            highlightSubscriptionSuggestion(selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            highlightSubscriptionSuggestion(selectedIndex);
        } else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            selectSubscriptionSuggestion(currentSuggestions[selectedIndex]);
        } else if (e.key === 'Escape') {
            hideSubscriptionSuggestions();
        }
    });

    subNameInput.addEventListener('blur', function () {
        // Delay hiding to allow click on suggestions
        setTimeout(() => {
            hideSubscriptionSuggestions();
        }, 150);
    });

    function showSubscriptionSuggestions(suggestions) {
        suggestionsDiv.innerHTML = suggestions.map((s, index) =>
            `<div class="suggestion-item" data-index="${index}">${s}</div>`
        ).join('');

        suggestionsDiv.style.display = 'block';

        // Add click handlers
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach((item, index) => {
            item.addEventListener('click', () => selectSubscriptionSuggestion(suggestions[index]));
            item.addEventListener('mouseenter', () => {
                selectedIndex = index;
                highlightSubscriptionSuggestion(index);
            });
        });
    }

    function hideSubscriptionSuggestions() {
        suggestionsDiv.style.display = 'none';
        selectedIndex = -1;
    }

    function highlightSubscriptionSuggestion(index) {
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach((item, i) => {
            item.classList.toggle('highlighted', i === index);
        });
    }

    function selectSubscriptionSuggestion(suggestion) {
        subNameInput.value = suggestion;
        hideSubscriptionSuggestions();
        // Focus next input (amount)
        document.getElementById('subAmount').focus();
    }
}

// Call on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    // Restore sidebar collapsed state
    const isSidebarCollapsed = localStorage.getItem('bloom_sidebar_collapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    if (sidebar && isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }

    setTimeout(initProfilePictureUI, 500);

    // Setup toast close button
    const toastClose = document.getElementById('toastClose');
    if (toastClose) {
        toastClose.addEventListener('click', closeToast);
    }

    // Initialize transaction name autocomplete
    initTransactionAutocomplete();

    // Initialize subscription name autocomplete
    initSubscriptionAutocomplete();
});

async function removeProfilePicture() {
    if (!confirm('Remove your profile picture?')) return;

    try {
        userAvatar = null;
        await supabaseClient
            .from('profiles')
            .update({ profile_picture: null })
            .eq('id', currentUserId);
        updateUserAvatar();

        const settingsProfilePicture = document.getElementById('settingsProfilePicture');
        if (settingsProfilePicture) {
            settingsProfilePicture.style.backgroundImage = 'none';
            settingsProfilePicture.textContent = getInitials(userName);
        }

        showToast('Profile picture removed');
    } catch (error) {

        showToast('Error removing profile picture');
    }
}

// ============================================
// SETTINGS MANAGEMENT
// ============================================
function initializeSettingsFields() {
    try {
        // Populate user name field
        const settingsName = document.getElementById('settingsName');
        if (settingsName) {
            settingsName.value = userName || '';
        }

        // Update account name display
        const accountNameDisplay = document.getElementById('accountNameDisplay');
        if (accountNameDisplay) {
            accountNameDisplay.textContent = userName || 'User';
        }

        // Populate currency select
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = currencySymbol || '₹';
        }

        // Populate monthly budget
        const settingsBudget = document.getElementById('settingsBudget');
        if (settingsBudget) {
            settingsBudget.value = monthlyBudget || 2000;
        }
    } catch (error) {

    }
}

async function saveUserName() {
    try {
        const settingsName = document.getElementById('settingsName');
        const newName = settingsName ? settingsName.value.trim() : '';

        if (!newName) {
            showToast('Please enter a name');
            return;
        }

        if (newName.length > 30) {
            showToast('Name must be less than 30 characters');
            return;
        }

        // Update global state
        userName = newName;

        // Check if privacy mode
        const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';

        if (!privacyMode) {
            // Save to Supabase
            const { error } = await supabaseClient
                .from('profiles')
                .update({ display_name: userName })
                .eq('id', currentUserId);

            if (error) {

                showToast('Error saving name. Please try again.');
                return;
            }
        }

        // Update all avatars and UI
        updateUserAvatar();
        updateGreeting();

        // Update the account name display
        const accountNameDisplay = document.getElementById('accountNameDisplay');
        if (accountNameDisplay) {
            accountNameDisplay.textContent = userName;
        }

        showToast('Name saved successfully! 👤');
    } catch (error) {

        showToast('Error saving name');
    }
}

async function saveBudget() {
    try {
        const settingsBudget = document.getElementById('settingsBudget');
        const newBudget = settingsBudget ? parseFloat(settingsBudget.value) : 0;

        if (!newBudget || newBudget <= 0) {
            showToast('Please enter a valid budget amount');
            return;
        }

        if (newBudget > 999999) {
            showToast('Budget must be less than 999,999');
            return;
        }

        // Update global state
        monthlyBudget = newBudget;

        // Check if privacy mode
        const privacyMode = localStorage.getItem('bloom_privacy_mode') === 'true';

        if (!privacyMode) {
            // Save to Supabase
            const { error } = await supabaseClient
                .from('profiles')
                .update({ monthly_budget: monthlyBudget })
                .eq('id', currentUserId);

            if (error) {

                showToast('Error saving budget. Please try again.');
                return;
            }
        }

        // Update UI
        update();
        updateCurrencyLabels();
        showToast('Budget saved successfully! 💰');
    } catch (error) {

        showToast('Error saving budget');
    }
}

// ============================================
// PHOTO EDITOR FUNCTIONALITY
// ============================================
let photoEditorState = {
    originalImage: null,
    currentImage: null,
    brightness: 100,
    contrast: 100,
    scale: 1,
    baseScale: 1,
    translateX: 0,
    translateY: 0,
    isModified: false,
    isDragging: false,
    dragStart: { x: 0, y: 0 }
};

function openPhotoEditOverlay(imageData = null) {
    const overlay = document.getElementById('photoEditOverlay');

    // If no explicit image is supplied, use the current saved avatar
    if (!imageData && userAvatar) {
        imageData = userAvatar;
    }

    if (!imageData) {
        showToast('Upload a photo first to edit.');
        return;
    }

    if (overlay) {
        overlay.classList.add('active');
        resetPhotoEditor();
        initializePhotoEditorWithImage(imageData);
    }
}

function initializePhotoEditorWithImage(imageData) {
    // Reset state for new edit
    photoEditorState.originalImage = imageData;
    photoEditorState.currentImage = imageData;
    photoEditorState.scale = 1;
    photoEditorState.translateX = 0;
    photoEditorState.translateY = 0;
    photoEditorState.brightness = 100;
    photoEditorState.contrast = 100;

    // Update UI
    const previewImg = document.getElementById('photoPreviewImage');
    if (previewImg) {
        previewImg.src = imageData;
    }

    // Reset UI controls
    if (document.getElementById('zoomSlider')) document.getElementById('zoomSlider').value = 1;
    if (document.getElementById('brightnessSlider')) document.getElementById('brightnessSlider').value = 100;
    if (document.getElementById('contrastSlider')) document.getElementById('contrastSlider').value = 100;

    // Show sections
    const pSec = document.getElementById('previewSection');
    const cSec = document.getElementById('controlsSection');
    const aSec = document.getElementById('actionButtons');
    if (pSec) pSec.style.display = 'block';
    if (cSec) cSec.style.display = 'block';
    if (aSec) aSec.style.display = 'flex';

    updatePhotoPreviewDisplay();
}

// Delete Photo Modal Controllers
function openDeletePhotoModal() {
    const modal = document.getElementById('deletePhotoOverlay');
    if (modal) modal.classList.add('active');
}

function closeDeletePhotoModal() {
    const modal = document.getElementById('deletePhotoOverlay');
    if (modal) modal.classList.remove('active');
}

async function confirmDeletePhoto() {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                profile_picture: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId);

        if (error) throw error;

        userAvatar = null;
        updateUserAvatar();

        // Hide settings picture and show initials
        const settingsProfilePicture = document.getElementById('settingsProfilePicture');
        if (settingsProfilePicture) {
            settingsProfilePicture.style.backgroundImage = 'none';
            // Initials are already updated by updateUserAvatar usually
        }

        closeDeletePhotoModal();
        showToast('Profile photo removed.');
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Could not remove photo.');
    }
}

function closePhotoEditOverlay() {
    const overlay = document.getElementById('photoEditOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
    resetPhotoEditor();
}

function resetPhotoEditor() {
    photoEditorState = {
        originalImage: null,
        currentImage: null,
        brightness: 100,
        contrast: 100,
        scale: 1,
        baseScale: 1,
        translateX: 0,
        translateY: 0,
        isModified: false,
        isDragging: false,
        dragStart: { x: 0, y: 0 }
    };

    // Hide sections
    const previewSection = document.getElementById('previewSection');
    const controlsSection = document.getElementById('controlsSection');
    const actionButtons = document.getElementById('actionButtons');
    if (previewSection) previewSection.style.display = 'none';
    if (controlsSection) controlsSection.style.display = 'none';
    if (actionButtons) actionButtons.style.display = 'none';

    // Reset UI
    const bSlider = document.getElementById('brightnessSlider');
    const cSlider = document.getElementById('contrastSlider');
    const zSlider = document.getElementById('zoomSlider');
    if (bSlider) bSlider.value = 100;
    if (cSlider) cSlider.value = 100;
    if (zSlider) zSlider.value = 1;

    const bLabel = document.getElementById('brightnessValue');
    const cLabel = document.getElementById('contrastValue');
    if (bLabel) bLabel.textContent = '100%';
    if (cLabel) cLabel.textContent = '100%';

    // Hide states
    const loadingState = document.getElementById('loadingState');
    const successState = document.getElementById('successState');
    const errorState = document.getElementById('errorState');
    if (loadingState) loadingState.classList.remove('active');
    if (successState) successState.classList.remove('active');
    if (errorState) errorState.classList.remove('active');
}

function switchPhotoEditTab(tabName) {
    document.querySelectorAll('.photo-edit-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.photo-edit-tab-content').forEach(content => content.classList.remove('active'));

    const tabBtn = document.querySelector(`[onclick="switchPhotoEditTab('${tabName}')"]`);
    if (tabBtn) tabBtn.classList.add('active');

    const content = document.getElementById(tabName + 'Tab');
    if (content) content.classList.add('active');
}

function updateZoom(value) {
    photoEditorState.scale = parseFloat(value);
    updatePhotoPreviewDisplay();
    photoEditorState.isModified = true;
}

function repositionImage(dx, dy) {
    photoEditorState.translateX += dx;
    photoEditorState.translateY += dy;
    updatePhotoPreviewDisplay();
    photoEditorState.isModified = true;
}

function centerImage() {
    photoEditorState.translateX = 0;
    photoEditorState.translateY = 0;
    photoEditorState.scale = 1;
    const zSlider = document.getElementById('zoomSlider');
    if (zSlider) zSlider.value = 1;
    updatePhotoPreviewDisplay();
}

function updatePhotoPreviewDisplay() {
    const previewImg = document.getElementById('photoPreviewImage');
    if (!previewImg) return;

    // Preserve the -50%, -50% centering and apply user transforms
    previewImg.style.transform = `translate(-50%, -50%) scale(${photoEditorState.scale}) translate(${photoEditorState.translateX}px, ${photoEditorState.translateY}px)`;
    previewImg.style.filter = `brightness(${photoEditorState.brightness}%) contrast(${photoEditorState.contrast}%)`;
}

function updateBrightness(value) {
    photoEditorState.brightness = value;
    const label = document.getElementById('brightnessValue');
    if (label) label.textContent = value + '%';
    updatePhotoPreviewDisplay();
}

function updateContrast(value) {
    photoEditorState.contrast = value;
    const label = document.getElementById('contrastValue');
    if (label) label.textContent = value + '%';
    updatePhotoPreviewDisplay();
}

async function savePhotoEdit() {
    const btn = document.getElementById('savePhotoBtn');
    if (btn) btn.disabled = true;

    document.getElementById('loadingState').classList.add('active');
    hidePhotoError();

    try {
        // 1. Render visible portion to canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = document.getElementById('photoPreviewImage');
        const container = document.querySelector('.photo-preview-container');

        // Final size for avatar
        canvas.width = 400;
        canvas.height = 400;

        // We need to draw the original image onto the canvas based on current scale/transform
        const sourceImg = new Image();
        sourceImg.crossOrigin = "anonymous";
        sourceImg.src = photoEditorState.originalImage;

        await new Promise((resolve) => sourceImg.onload = resolve);

        // Apply filters to canvas
        ctx.filter = `brightness(${photoEditorState.brightness}%) contrast(${photoEditorState.contrast}%)`;

        // Use natural dimensions for output drawing accuracy
        const nw = sourceImg.naturalWidth || sourceImg.width;
        const nh = sourceImg.naturalHeight || sourceImg.height;

        // Calculate cover scale (to cover the 400x400 canvas area)
        const coverScale = Math.max(400 / nw, 400 / nh);

        const finalDrawScale = coverScale * photoEditorState.scale;
        const drawWidth = nw * finalDrawScale;
        const drawHeight = nh * finalDrawScale;

        // Offset translataion based on the canvas (400x400) vs editor (200x200) ratio
        const editorToCanvasRatio = 400 / 200;
        const centerX = 200 + (photoEditorState.translateX * editorToCanvasRatio);
        const centerY = 200 + (photoEditorState.translateY * editorToCanvasRatio);

        ctx.drawImage(sourceImg, centerX - (drawWidth / 2), centerY - (drawHeight / 2), drawWidth, drawHeight);

        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.9);

        // 2. Upload to Supabase Storage
        const base64Data = finalDataUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        const fileName = `avatar_${Date.now()}.jpg`;
        const filePath = `${currentUserId}/${fileName}`;

        // Attempt upload
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from('avatars')
            .upload(filePath, blob, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabaseClient
            .storage
            .from('avatars')
            .getPublicUrl(filePath);

        // 3. Update Database Profile
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({
                profile_picture: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUserId);

        if (profileError) throw profileError;

        // 4. Update UI
        userAvatar = publicUrl;
        updateUserAvatar();

        const settingsProfilePicture = document.getElementById('settingsProfilePicture');
        if (settingsProfilePicture) {
            settingsProfilePicture.style.backgroundImage = `url('${publicUrl}')`;
            settingsProfilePicture.textContent = '';
        }

        document.getElementById('loadingState').classList.remove('active');
        document.getElementById('successState').classList.add('active');

        setTimeout(() => {
            closePhotoEditOverlay();
            showToast('Profile photo saved! ✨');
        }, 1500);

    } catch (error) {
        document.getElementById('loadingState').classList.remove('active');
        showPhotoError('Failed to save photo. ' + (error.message || 'Please try again.'));
    } finally {
        if (btn) btn.disabled = false;
    }
}

function showPhotoError(message) {
    const errorState = document.getElementById('errorState');
    const msgEl = document.getElementById('errorMessage');
    if (msgEl) msgEl.textContent = message;
    if (errorState) errorState.classList.add('active');
}

function hidePhotoError() {
    const errorState = document.getElementById('errorState');
    if (errorState) errorState.classList.remove('active');
}

// Drag & Drop logic for the image
document.addEventListener('DOMContentLoaded', function () {
    const wrapper = document.getElementById('photoPreviewWrapper');

    if (wrapper) {
        wrapper.addEventListener('mousedown', function (e) {
            if (document.getElementById('repositionTab').classList.contains('active')) {
                photoEditorState.isDragging = true;
                photoEditorState.dragStart = { x: e.clientX, y: e.clientY };
                e.preventDefault();
                wrapper.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', function (e) {
            if (!photoEditorState.isDragging) return;

            const deltaX = e.clientX - photoEditorState.dragStart.x;
            const deltaY = e.clientY - photoEditorState.dragStart.y;

            photoEditorState.translateX += deltaX;
            photoEditorState.translateY += deltaY;

            photoEditorState.dragStart = { x: e.clientX, y: e.clientY };
            updatePhotoPreviewDisplay();
        });

        document.addEventListener('mouseup', function () {
            photoEditorState.isDragging = false;
            if (wrapper) wrapper.style.cursor = 'move';
        });
    }

    // Close overlay on background click
    const overlay = document.getElementById('photoEditOverlay');
    if (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closePhotoEditOverlay();
        });
    }
});

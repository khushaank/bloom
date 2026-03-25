// ============================================
// BLOOM — Login Page JavaScript
// ============================================

// Redirect if already logged in
(async function () {
    const loggedIn = await redirectIfLoggedIn();
    if (!loggedIn) {
        document.querySelector('.login-page').style.opacity = '1';
    }
})();

function togglePassword(id) {
    const input = document.getElementById(id);
    const btn = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        btn.classList.add('visible');
    } else {
        input.type = 'password';
        btn.classList.remove('visible');
    }
}

function showSignup() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'block';
    document.getElementById('confirmView').style.display = 'none';
    clearErrors();
}

function showLogin() {
    document.getElementById('loginView').style.display = 'block';
    document.getElementById('signupView').style.display = 'none';
    document.getElementById('confirmView').style.display = 'none';
    clearErrors();
}

function clearErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
}

function setLoading(btn, loading) {
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-loading');
    if (loading) {
        text.style.display = 'none';
        spinner.style.display = 'inline-flex';
        btn.disabled = true;
    } else {
        text.style.display = 'inline';
        spinner.style.display = 'none';
        btn.disabled = false;
    }
}

function enterOfflineMode(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    try {
        // Set offline flag in localStorage
        localStorage.setItem('bloom_offline_mode', 'true');
        localStorage.setItem('bloom_user_id', 'offline_' + Date.now());
        // Initialize empty data if not exists
        if (!localStorage.getItem('bloom_offline_data')) {
            localStorage.setItem('bloom_offline_data', JSON.stringify({
                transactions: [],
                goals: [],
                userName: 'Guest (Offline)',
                monthlyBudget: 2000,
                currencySymbol: '₹'
            }));
        }
        // Ensure localStorage is synced before redirect
        setTimeout(() => {
            window.location.href = 'finance-tool.html';
        }, 100);
    } catch (error) {
        console.error('Error entering offline mode:', error);
        alert('Unable to enter offline mode. Please check your browser storage.');
    }
    return false;
}

async function handleGoogleLogin() {
    clearErrors();
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/finance-tool.html'
        }
    });

    if (error) {
        document.getElementById('loginError').textContent = error.message;
        document.getElementById('signupError').textContent = error.message;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        document.getElementById('loginError').textContent = 'Please fill in all fields.';
        return;
    }

    setLoading(btn, true);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    setLoading(btn, false);

    if (error) {
        document.getElementById('loginError').textContent = error.message;
        return;
    }

    window.location.href = 'finance-tool.html';
}

async function handleSignup(e) {
    e.preventDefault();
    clearErrors();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const btn = document.getElementById('signupBtn');

    if (!email || !password) {
        document.getElementById('signupError').textContent = 'Email and password are required.';
        return;
    }

    if (password.length < 6) {
        document.getElementById('signupError').textContent = 'Password must be at least 6 characters.';
        return;
    }

    setLoading(btn, true);

    // Name is optional - provide placeholder if empty
    const displayName = name || `User_${Date.now()}`;

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: displayName
            }
        }
    });

    setLoading(btn, false);

    if (error) {
        document.getElementById('signupError').textContent = error.message;
        return;
    }

    // Check if email confirmation is required
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        document.getElementById('signupError').textContent = 'An account with this email already exists.';
        return;
    }

    // Show confirmation message
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('signupView').style.display = 'none';
    document.getElementById('confirmView').style.display = 'block';
}

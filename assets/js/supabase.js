// ============================================
// BLOOM — Supabase Configuration
// Shared across all pages
// ============================================

const SUPABASE_URL = 'https://qcwhhhmksatiwltsfjth.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjd2hoaG1rc2F0aXdsdHNmanRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNDY4NzksImV4cCI6MjA4OTkyMjg3OX0.qVP17s_0KAALU6LwwDjGKaZQcxo4Sz__Chuklk1rEZs';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth helper: get current user or redirect to login
async function requireAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    return session.user;
}

// Auth helper: redirect to dashboard if already logged in
async function redirectIfLoggedIn() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        window.location.href = 'finance-tool.html';
        return true;
    }
    return false;
}

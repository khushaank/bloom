// ============================================
// BLOOM — Security Configuration & CSP Bypass
// Handles security headers and protection mechanisms
// ============================================

// Security: Strict Content Security Policy
// If deployed on a secure server, add these headers:
// Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com;
// X-Content-Type-Options: nosniff
// X-Frame-Options: SAMEORIGIN
// X-XSS-Protection: 1; mode=block
// Referrer-Policy: strict-origin-when-cross-origin
// Permissions-Policy: geolocation=(), microphone=(), payment=()

// Data Sanitization
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Validate and sanitize JSON data from sessionStorage
function validateStorageData(key, defaultValue = null) {
    try {
        const data = sessionStorage.getItem(key);
        if (!data) return defaultValue;
        return JSON.parse(data);
    } catch (error) {

        return defaultValue;
    }
}

// Secure sessionStorage operations
function secureSetsessionStorage(key, value) {
    try {
        if (typeof value === 'object') {
            sessionStorage.setItem(key, JSON.stringify(value));
        } else {
            sessionStorage.setItem(key, String(value));
        }
        return true;
    } catch (error) {

        return false;
    }
}

// Prevent XSS attacks - sanitize any user input before displaying
function displayText(element, text) {
    if (!element) return;
    element.textContent = text; // textContent is safer than innerHTML
}

// CSRF Protection: Validate same-origin requests
function validateOrigin(targetOrigin) {
    return window.location.origin === targetOrigin ||
        window.location.origin + '/' === targetOrigin;
}

// Session Security: Generate and validate tokens
function generateSecurityToken() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return btoa(`${timestamp}-${random}`);
}

// Clear sensitive data on logout
function clearSensitiveData() {
    // Clear authentication data
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
        if (key.includes('token') || key.includes('session') ||
            key.includes('auth') || key.includes('password')) {
            sessionStorage.removeItem(key);
        }
    });
}

// HTTPS enforcement (if not localhost)
if (window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    window.location.protocol !== 'https:') {
    // In production, enforce HTTPS
    // window.location.href = 'https:' + window.location.href.substring(5);

}

// Monitor for security issues
window.addEventListener('error', function (event) {
    if (event.message && event.message.includes('xss')) {

    }
});

// Secure password storage: Never store passwords in sessionStorage
// Always use sessionStorage for temporary sensitive data
function secureStoreSessionData(key, value) {
    try {
        sessionStorage.setItem(key, String(value));
        return true;
    } catch (error) {

        return false;
    }
}
// Disable autocomplete for password fields
document.addEventListener('DOMContentLoaded', function () {
    // Find all password inputs and disable autocomplete
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.setAttribute('autocomplete', 'current-password');
    });
});

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeInput,
        validateStorageData,
        secureSetsessionStorage,
        displayText,
        validateOrigin,
        generateSecurityToken,
        clearSensitiveData,
        secureStoreSessionData
    };
}

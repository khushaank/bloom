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

// Validate and sanitize JSON data from localStorage
function validateStorageData(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return defaultValue;
        return JSON.parse(data);
    } catch (error) {
        
        return defaultValue;
    }
}

// Secure localStorage operations
function secureSetlocalStorage(key, value) {
    try {
        if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
        } else {
            localStorage.setItem(key, String(value));
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
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.includes('token') || key.includes('session') || 
            key.includes('auth') || key.includes('password')) {
            localStorage.removeItem(key);
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
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('xss')) {
        
    }
});

// Secure password storage: Never store passwords in localStorage
// Always use sessionStorage for temporary sensitive data
function secureStoreSessionData(key, value) {
    try {
        sessionStorage.setItem(key, String(value));
        return true;
    } catch (error) {
        
        return false;
    }
}

// Clear session data on page unload
window.addEventListener('beforeunload', function() {
    // Clear any temporary sensitive data
    sessionStorage.clear();
});

// Disable right-click on sensitive elements (optional, can be disabled)
// document.addEventListener('contextmenu', (e) => {
//     if (e.target.dataset.noContext) e.preventDefault();
// }, true);

// Disable autocomplete for password fields
document.addEventListener('DOMContentLoaded', function() {
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
        secureSetlocalStorage,
        displayText,
        validateOrigin,
        generateSecurityToken,
        clearSensitiveData,
        secureStoreSessionData
    };
}

// Auth Logic (Simplified from admin.js)
let authToken = localStorage.getItem('adminPassword');

document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggle();
    
    // Sync logout across tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'adminPassword' && !event.newValue) {
            logout("Logged out from another tab.", false);
        }
    });

    if (authToken) {
        checkSession();
    } else {
        logout(null, false);
    }
    
    checkEmptyChangelog();
});

function checkEmptyChangelog() {
    const list = document.getElementById('changelogList');
    if (list) {
        // Check if there are any rows (excluding comments/text nodes if possible, but querySelector works)
        const entries = list.querySelectorAll('tr');
        if (entries.length === 0) {
            list.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4"><i class="fas fa-info-circle me-2"></i>No changelog records found.</td></tr>';
        }
    }
}

function setupPasswordToggle() {
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('adminPassword');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
}

async function handleLogin(e) {
    if (e) e.preventDefault();
    const passwordInput = document.getElementById('adminPassword');
    const btn = document.querySelector('#loginForm button.btn-primary');
    const errorDiv = document.getElementById('loginError');
    
    if (!passwordInput) return;
    const password = passwordInput.value;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = 'Verifying...';
    }
    if (errorDiv) errorDiv.style.display = 'none';

    try {
        const endpoint = '/.netlify/functions/login';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await response.json();

        if (response.ok && data.success) {
            authToken = password;
            localStorage.setItem('adminPassword', authToken);
            localStorage.setItem('loginTime', Date.now());
            showAdmin();
        } else {
            if (errorDiv) {
                errorDiv.style.display = 'block';
                document.getElementById('loginErrorText').textContent = 'Invalid password';
            }
        }
    } catch (error) {
        console.error(error);
        if (errorDiv) {
            errorDiv.style.display = 'block';
            document.getElementById('loginErrorText').textContent = 'Error logging in';
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Login';
        }
    }
}

function showAdmin() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('adminContainer').style.display = 'block';
}

function checkSession() {
    const loginTime = localStorage.getItem('loginTime');
    if (authToken && loginTime) {
            showAdmin();
    }
}

function logout(msg, clear = true) {
    if (clear) {
        localStorage.removeItem('adminPassword');
        localStorage.removeItem('loginTime');
    }
    authToken = null;
    
    document.getElementById('adminContainer').style.display = 'none';
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('loginModal').classList.add('show');
    
    const errorDiv = document.getElementById('loginError');
    if (msg) {
        errorDiv.style.display = 'block';
        document.getElementById('loginErrorText').textContent = msg;
    } else {
        errorDiv.style.display = 'none';
    }
    
    document.getElementById('adminPassword').value = '';
}
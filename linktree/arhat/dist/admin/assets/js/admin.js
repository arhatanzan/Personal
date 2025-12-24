// State
let originalData = null;
let currentData = null;
let activePageId = null; // null = home, string = page key
let authToken = localStorage.getItem('adminPassword');
let sessionTimeout = 30 * 60 * 1000; // 30 mins default
let sessionTimer = null;
let openSections = new Set();

const staticSections = {
    profile: { title: 'Profile', render: renderProfileFields },
    socialLinks: { title: 'Social Links', render: (key) => renderListFields(key) },
    workLinks: { title: 'Work Links', render: (key) => renderListFields(key) },
    publications: { title: 'Publications', render: (key) => renderListFields(key) },
    connectLinks: { title: 'Connect Icons', render: (key) => renderListFields(key) },
    footer: { title: 'Footer', render: renderFooterFields }
};

function getActiveData() {
    if (!activePageId) return currentData;
    if (!currentData.pages) currentData.pages = {};
    if (!currentData.pages[activePageId]) {
        // Should not happen if logic is correct, but safe fallback
        currentData.pages[activePageId] = createNewPageStructure();
    }
    return currentData.pages[activePageId];
}

function createNewPageStructure() {
    return {
        // profile: { name: "New Page", subtitle: "", image: "" }, // Inherit by default
        sectionOrder: ['profile', 'footer'],
        // footer: "© 2025", // Inherit by default (useGlobalFooter is undefined -> true)
        // theme: JSON.parse(JSON.stringify(currentData.theme || {})) // Inherit by default
    };
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    
    if (typeof siteData !== 'undefined') {
        initData();
    } else {
        console.error("siteData is missing.");
    }

    setupPasswordToggle();
    
    // Sync logout across tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'adminPassword' && !event.newValue) {
            logout("Logged out from another tab.", false);
        }
    });
    
    if (authToken) {
        checkSession();
        showAdmin();
    } else {
        logout(null, false);
    }
});

// Config & Session
async function loadConfig() {
    const endpoint = window.location.port === '8000' ? '/config' : '/.netlify/functions/config';
    try {
        const res = await fetch(endpoint);
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
            const config = await res.json();
            if (config?.sessionTimeout) {
                sessionTimeout = config.sessionTimeout * 60 * 1000;
            }
        }
    } catch (e) { /* Ignore */ }
}

function checkSession() {
    const loginTime = localStorage.getItem('loginTime');
    if (authToken && loginTime) {
        const elapsed = Date.now() - parseInt(loginTime);
        if (elapsed > sessionTimeout) {
            logout("Session expired.");
        } else {
            startSessionTimer(sessionTimeout - elapsed);
        }
    } else {
        // Invalid state or no login time, force logout
        if (authToken) logout("Session invalid.");
    }
}

function startSessionTimer(duration) {
    if (sessionTimer) clearTimeout(sessionTimer);
    sessionTimer = setTimeout(() => logout("Session expired due to inactivity."), duration);
}

// Auth
window.handleLogin = async function(e) {
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
        const endpoint = window.location.port === '8000' ? '/.netlify/functions/login' : '/.netlify/functions/login';
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
            startSessionTimer(sessionTimeout);
            showAdmin();
            passwordInput.value = '';
        } else {
            throw new Error(data.message || 'Invalid password');
        }
    } catch (error) {
        if (errorDiv) {
            document.getElementById('loginErrorText').textContent = error.message || 'Login failed.';
            errorDiv.style.display = 'block';
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = 'Login';
        }
    }
};

window.logout = function(msg, clear = true) {
    if (clear) {
        localStorage.removeItem('adminPassword');
        localStorage.removeItem('loginTime');
    }
    authToken = null;
    if (sessionTimer) clearTimeout(sessionTimer);
    
    document.getElementById('adminContainer').style.display = 'none';
    const loginModal = document.getElementById('loginModal');
    loginModal.style.display = 'block';
    loginModal.classList.add('show');
    
    document.getElementById('adminPassword').value = '';
    const errorDiv = document.getElementById('loginError');
    
    if (msg) {
        document.getElementById('loginErrorText').textContent = msg;
        errorDiv.style.display = 'block';
    } else {
        errorDiv.style.display = 'none';
    }
};

function setupPasswordToggle() {
    const btn = document.getElementById('togglePassword');
    if (btn) {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function() {
            const input = document.getElementById('adminPassword');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }
}

function showAdmin() {
    if (!initData()) return;
    document.getElementById('loginModal').classList.remove('show');
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'flex'; // Flex to fix layout
    renderForm();
}

// Data Logic
function initData() {
    if (typeof siteData === 'undefined') return false;
    if (!originalData) {
        originalData = JSON.parse(JSON.stringify(siteData));
        currentData = JSON.parse(JSON.stringify(siteData));
        
        // Defaults
        if (!currentData.sectionOrder) {
            currentData.sectionOrder = ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
        }
        if (!currentData.sectionSettings) currentData.sectionSettings = {};
        if (!currentData.theme) currentData.theme = { buttonColors: ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'] };
        if (!currentData.pages) currentData.pages = {};
    }
    return true;
}

// Page Management
window.switchPage = function(pageId) {
    activePageId = pageId === 'home' ? null : pageId;
    openSections.clear();
    renderForm();
};

window.addNewPage = function() {
    const modal = new bootstrap.Modal(document.getElementById('newPageModal'));
    document.getElementById('newPageId').value = '';
    document.getElementById('newPageError').style.display = 'none';
    modal.show();
};

window.handleCreatePage = function() {
    const input = document.getElementById('newPageId');
    const errorDiv = document.getElementById('newPageError');
    const title = input.value.trim();
    
    if (!title) {
        errorDiv.textContent = "Page ID cannot be empty.";
        errorDiv.style.display = 'block';
        return;
    }
    
    const id = title.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    if (id === 'home' || id === 'admin' || id === 'assets') {
        errorDiv.textContent = "This Page ID is reserved.";
        errorDiv.style.display = 'block';
        return;
    }

    if (currentData.pages && currentData.pages[id]) {
        errorDiv.textContent = "Page ID already exists!";
        errorDiv.style.display = 'block';
        return;
    }
    
    if (!currentData.pages) currentData.pages = {};
    currentData.pages[id] = createNewPageStructure();
    
    // Close modal
    const modalEl = document.getElementById('newPageModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    activePageId = id;
    openSections.clear();
    renderForm();
    checkChanges();
};

window.deletePage = function() {
    if (!activePageId) return;
    if (confirm(`Are you sure you want to delete page '${activePageId}'? This cannot be undone.`)) {
        delete currentData.pages[activePageId];
        activePageId = null;
        renderForm();
        checkChanges();
    }
};

window.updatePageId = function(newId) {
    if (!activePageId || newId === activePageId) return;
    if (!newId) return;
    
    const sanitizedId = newId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (currentData.pages[sanitizedId]) {
        alert("Page ID already exists!");
        return;
    }
    
    currentData.pages[sanitizedId] = currentData.pages[activePageId];
    delete currentData.pages[activePageId];
    activePageId = sanitizedId;
    renderForm();
    checkChanges();
};

function renderPageSelector() {
    const selector = document.getElementById('pageSelector');
    if (!selector) return;
    
    const pages = currentData.pages ? Object.keys(currentData.pages) : [];
    
    let html = `<option value="home" ${activePageId === null ? 'selected' : ''}>Home Page</option>`;
    pages.forEach(pageId => {
        html += `<option value="${pageId}" ${activePageId === pageId ? 'selected' : ''}>${pageId}</option>`;
    });
    
    selector.innerHTML = html;
}

// Rendering
function renderForm() {
    renderPageSelector();
    const container = document.getElementById('formContainer');
    container.innerHTML = '';
    
    if (typeof checkChanges === 'function') checkChanges();

    const data = getActiveData();

    // Global Defaults (Home Page Only)
    if (!activePageId) {
        container.insertAdjacentHTML('beforeend', `
            <div class="card mb-4 border-info">
                <div class="card-header bg-info text-white">
                    <h5 class="m-0"><i class="fas fa-globe me-2"></i>Global Defaults</h5>
                </div>
                <div class="card-body">
                    <p class="text-muted small mb-3">These settings apply to all pages unless specifically overridden.</p>
                    
                    <div class="mb-3">
                        <label class="form-label fw-bold">Global Footer</label>
                        <input type="text" class="form-control" value="${data.footer || ''}" onchange="updateFooter(this.value)">
                        <div class="form-text">Sub-pages can inherit this footer text.</div>
                    </div>
                    
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="p-3 bg-light rounded border h-100">
                                <strong><i class="fas fa-palette me-2"></i>Global Theme</strong>
                                <p class="small text-muted mb-0 mt-1">Managed in "Theme Settings" below.</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="p-3 bg-light rounded border h-100">
                                <strong><i class="fas fa-user me-2"></i>Global Profile</strong>
                                <p class="small text-muted mb-0 mt-1">Managed in "Profile" section below.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    // Page Settings (ID and Delete) for sub-pages
    if (activePageId) {
        const useGlobalFooter = data.useGlobalFooter !== false;
        const useGlobalTheme = !data.theme;
        const useGlobalProfile = !data.profile;
        
        container.insertAdjacentHTML('beforeend', `
            <div class="card mb-4 border-warning">
                <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                    <h5 class="m-0"><i class="fas fa-cog me-2"></i>Page Configuration: ${activePageId}</h5>
                </div>
                <div class="card-body">
                    <h6 class="border-bottom pb-2 mb-3">General Settings</h6>
                    <div class="row g-3 align-items-end mb-4">
                        <div class="col-md-8">
                            <label class="form-label">Page ID (URL slug)</label>
                            <div class="input-group">
                                <span class="input-group-text">?page=</span>
                                <input type="text" class="form-control" value="${activePageId}" onchange="updatePageId(this.value)">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-danger w-100" onclick="deletePage()"><i class="fas fa-trash me-2"></i>Delete Page</button>
                        </div>
                    </div>

                    <h6 class="border-bottom pb-2 mb-3">Global Inheritance</h6>
                    <div class="row g-3">
                        <div class="col-12">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="useGlobalTheme" ${useGlobalTheme ? 'checked' : ''} onchange="updateThemeGlobal(this.checked)">
                                <label class="form-check-label" for="useGlobalTheme"><strong>Inherit Global Theme</strong></label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="useGlobalProfile" ${useGlobalProfile ? 'checked' : ''} onchange="updateProfileGlobal(this.checked)">
                                <label class="form-check-label" for="useGlobalProfile"><strong>Inherit Global Profile</strong></label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="useGlobalFooter" ${useGlobalFooter ? 'checked' : ''} onchange="updateFooterGlobal(this.checked)">
                                <label class="form-check-label" for="useGlobalFooter"><strong>Inherit Global Footer</strong></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    if (!activePageId || data.theme) {
        container.insertAdjacentHTML('beforeend', renderThemeSettings());
    } else {
        container.insertAdjacentHTML('beforeend', `
            <div class="card mb-4 border-secondary opacity-75">
                <div class="card-header bg-light">
                    <h5 class="m-0 text-muted"><i class="fas fa-palette me-2"></i>Theme Settings (Inherited)</h5>
                </div>
                <div class="card-body text-center text-muted">
                    <p>This page is using the Global Theme.</p>
                    <button class="btn btn-sm btn-outline-primary" onclick="updateThemeGlobal(false)">Customize Theme</button>
                </div>
            </div>
        `);
    }

    (data.sectionOrder || []).forEach((key, index) => {
        let title = '', renderFn = null, isCustom = false;

        if (staticSections[key]) {
            title = staticSections[key].title;
            renderFn = staticSections[key].render;
        } else if (data[key]) {
            title = data[key].title || 'Custom Section';
            renderFn = (k) => renderCustomSectionFields(k);
            isCustom = true;
        } else {
            return;
        }

        const sectionId = `section-${key}`;
        const isOpen = openSections.has(sectionId);
        const settings = (data.sectionSettings && data.sectionSettings[key]) || {};
        const showDividerTop = settings.dividerTop ?? (index > 0 && key !== 'footer');
        const showDividerBottom = settings.dividerBottom ?? false;

        const sectionHtml = `
            <div class="section-card" id="${sectionId}">
                <div class="section-header ${isOpen ? 'active' : ''}" onclick="toggleSection('${sectionId}')">
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <h2 class="m-0 fs-5">${title} <span class="badge bg-secondary ms-2" style="font-size: 0.6em">${isCustom ? 'Custom' : 'Static'}</span></h2>
                        <div class="d-flex gap-1 ms-auto me-3" onclick="event.stopPropagation()">
                            <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="moveSection(${index}, -1)" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
                            <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="moveSection(${index}, 1)" ${index === (data.sectionOrder.length - 1) ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content ${isOpen ? 'active' : ''}">
                    <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <div class="d-flex gap-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="divider-top-${key}" ${showDividerTop ? 'checked' : ''} onchange="updateDivider('${key}', 'top', this.checked)">
                                <label class="form-check-label" for="divider-top-${key}">Divider Top</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="divider-bottom-${key}" ${showDividerBottom ? 'checked' : ''} onchange="updateDivider('${key}', 'bottom', this.checked)">
                                <label class="form-check-label" for="divider-bottom-${key}">Divider Bottom</label>
                            </div>
                        </div>
                        ${isCustom ? `<button class="btn btn-danger btn-sm" onclick="deleteCustomSection('${key}')">Delete Section</button>` : ''}
                    </div>
                    ${renderFn(key)}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', sectionHtml);
    });

    container.insertAdjacentHTML('beforeend', `
        <div class="text-center my-4">
            <button class="btn btn-primary btn-lg" onclick="addNewCustomSection()"><i class="fas fa-plus-circle me-2"></i>Add New Custom Section</button>
        </div>
    `);
}

function renderThemeSettings() {
    const data = getActiveData();
    const theme = data.theme || {};
    const colors = theme.buttonColors || [];
    const isOpen = openSections.has('theme-settings');
    const currentFont = theme.fontFamily || "'Montserrat', sans-serif";
    const knownFonts = ["'Montserrat', sans-serif", "'Open Sans', sans-serif", "'Lato', sans-serif", "'Poppins', sans-serif", "'Roboto', sans-serif", "'Merriweather', serif", "'Playfair Display', serif", "'Lora', serif", "'Georgia', serif", "'Courier New', monospace"];
    const isCustom = !knownFonts.includes(currentFont);

    return `
        <div class="section-card border-info mb-4">
            <div class="section-header bg-info text-white ${isOpen ? 'active' : ''}" onclick="toggleSection('theme-settings')">
                <h2 class="m-0 fs-5"><i class="fas fa-palette me-2"></i>Theme Settings</h2>
                <i class="fas fa-chevron-down toggle-icon"></i>
            </div>
            <div class="section-content ${isOpen ? 'active' : ''}">
                <div class="row g-3 mb-3">
                    <div class="col-md-4">
                        <label class="form-label">Background Color</label>
                        <input type="color" class="form-control form-control-color w-100" value="${theme.backgroundColor || '#ffffff'}" onchange="updateThemeSetting('backgroundColor', this.value)">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Text Color</label>
                        <input type="color" class="form-control form-control-color w-100" value="${theme.textColor || '#023e62'}" onchange="updateThemeSetting('textColor', this.value)">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Font Family</label>
                        <select class="form-select" onchange="handleFontSelection(this.value)">
                            <optgroup label="Sans-Serif (Modern)">
                                <option value="'Montserrat', sans-serif" ${currentFont === "'Montserrat', sans-serif" ? 'selected' : ''}>Montserrat (Default)</option>
                                <option value="'Open Sans', sans-serif" ${currentFont === "'Open Sans', sans-serif" ? 'selected' : ''}>Open Sans</option>
                                <option value="'Lato', sans-serif" ${currentFont === "'Lato', sans-serif" ? 'selected' : ''}>Lato</option>
                                <option value="'Poppins', sans-serif" ${currentFont === "'Poppins', sans-serif" ? 'selected' : ''}>Poppins</option>
                                <option value="'Roboto', sans-serif" ${currentFont === "'Roboto', sans-serif" ? 'selected' : ''}>Roboto</option>
                            </optgroup>
                            <optgroup label="Serif (Classic)">
                                <option value="'Merriweather', serif" ${currentFont === "'Merriweather', serif" ? 'selected' : ''}>Merriweather</option>
                                <option value="'Playfair Display', serif" ${currentFont === "'Playfair Display', serif" ? 'selected' : ''}>Playfair Display</option>
                                <option value="'Lora', serif" ${currentFont === "'Lora', serif" ? 'selected' : ''}>Lora</option>
                                <option value="'Georgia', serif" ${currentFont === "'Georgia', serif" ? 'selected' : ''}>Georgia (System)</option>
                            </optgroup>
                            <optgroup label="Monospace (Code)">
                                <option value="'Courier New', monospace" ${currentFont === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
                            </optgroup>
                            <option value="custom" ${isCustom ? 'selected' : ''}>Custom Font...</option>
                        </select>
                    </div>
                    <div id="customFontInputs" class="col-12 ${isCustom ? '' : 'd-none'}">
                        <div class="card card-body bg-light">
                            <div class="row g-2">
                                <div class="col-md-6">
                                    <label class="form-label small">Custom Font Family (CSS)</label>
                                    <input type="text" class="form-control form-control-sm" placeholder="e.g. 'My Font', sans-serif" value="${isCustom ? currentFont : ''}" onchange="updateThemeSetting('fontFamily', this.value)">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small">Custom Font URL (Google Fonts)</label>
                                    <input type="text" class="form-control form-control-sm" placeholder="https://fonts.googleapis.com/css2?family=My+Font&display=swap" value="${theme.customFontUrl || ''}" onchange="updateThemeSetting('customFontUrl', this.value)">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12">
                        <label class="form-label">Background Image URL (Optional)</label>
                        <input type="text" class="form-control" value="${theme.backgroundImage || ''}" placeholder="https://example.com/image.jpg" onchange="updateThemeSetting('backgroundImage', this.value)">
                    </div>
                </div>
                <h6 class="border-bottom pb-2 mb-3">Sizing & Spacing</h6>
                <div class="row g-3 mb-3">
                    <div class="col-md-3"><label class="form-label">Base Font Size (px)</label><input type="number" class="form-control" value="${theme.fontSize || 16}" onchange="updateThemeSetting('fontSize', this.value)"></div>
                    <div class="col-md-3"><label class="form-label">Section Spacing (px)</label><input type="number" class="form-control" value="${theme.sectionSpacing || 30}" onchange="updateThemeSetting('sectionSpacing', this.value)"></div>
                    <div class="col-md-3"><label class="form-label">Text Spacing (px)</label><input type="number" class="form-control" value="${theme.textSpacing || 15}" onchange="updateThemeSetting('textSpacing', this.value)"></div>
                    <div class="col-md-3"><label class="form-label">Button Spacing (px)</label><input type="number" class="form-control" value="${theme.btnSpacing || 15}" onchange="updateThemeSetting('btnSpacing', this.value)"></div>
                </div>
                <h6 class="border-bottom pb-2 mb-3">Button Colors</h6>
                <div class="d-flex flex-wrap gap-2 mb-2">
                    ${colors.map((color, index) => `
                        <div class="input-group input-group-sm" style="width: 150px;">
                            <input type="color" class="form-control form-control-color" value="${color}" onchange="updateThemeColor(${index}, this.value)">
                            <button class="btn btn-outline-secondary" type="button" onclick="removeThemeColor(${index})">×</button>
                        </div>
                    `).join('')}
                    <button class="btn btn-outline-success btn-sm" onclick="addThemeColor()">+</button>
                </div>
            </div>
        </div>
    `;
}

function renderProfileFields() {
    const data = getActiveData();
    const isSubPage = !!activePageId;
    const useGlobalProfile = isSubPage && !data.profile;

    if (useGlobalProfile) {
        return `
            <div class="alert alert-info mb-0">
                <i class="fas fa-info-circle me-2"></i>Using Global Profile. 
                <button class="btn btn-sm btn-link p-0 align-baseline" onclick="updateProfileGlobal(false)">Customize for this page</button>
            </div>
        `;
    }

    const profile = data.profile || {};
    return `
        <div class="row">
            <div class="col-md-6 mb-3"><label>Name</label><input type="text" class="form-control" value="${profile.name || ''}" onchange="updateProfile('name', this.value)"></div>
            <div class="col-md-6 mb-3"><label>Subtitle</label><input type="text" class="form-control" value="${profile.subtitle || ''}" onchange="updateProfile('subtitle', this.value)"></div>
            <div class="col-12 mb-3"><label>Image Path</label><input type="text" class="form-control" value="${profile.image || ''}" onchange="updateProfile('image', this.value)"></div>
        </div>
    `;
}

function renderFooterFields() {
    const data = getActiveData();
    const isSubPage = !!activePageId;
    const useGlobal = isSubPage ? (data.useGlobalFooter !== false) : false; 
    
    let html = '';
    
    // Checkbox moved to Page Configuration section
    
    const value = useGlobal ? (currentData.footer || '') : (data.footer || '');
    const disabled = useGlobal ? 'disabled' : '';
    
    html += `<label>Footer Text</label><input type="text" class="form-control" value="${value}" ${disabled} onchange="updateFooter(this.value)">`;
    
    if (useGlobal) {
        html += `<small class="text-muted">Global value: "${currentData.footer || ''}"</small>`;
    }
    
    return html;
}

function renderListFields(key) {
    const data = getActiveData();
    const items = data[key] || [];
    return `<div id="${key}List">${items.map((item, index) => renderItemForm(item, index, key)).join('')}</div>
        <button type="button" class="btn btn-success btn-sm" onclick="addItem('${key}')">+ Add Item</button>`;
}

function renderCustomSectionFields(key) {
    const data = getActiveData();
    const section = data[key];
    return `
        <div class="mb-3"><label>Section Title</label><input type="text" class="form-control" value="${section.title}" onchange="updateCustomSectionTitle('${key}', this.value)"></div>
        <div id="${key}List">${(section.links || []).map((item, index) => renderItemForm(item, index, key)).join('')}</div>
        <button type="button" class="btn btn-success btn-sm mt-2" onclick="addItem('${key}')">+ Add Item to Section</button>
    `;
}

function renderItemForm(item, index, parentKey) {
    const title = item.title || '';
    const subtitle = item.subtitle || '';
    const description = item.description || '';
    const text = item.text || '';
    const url = item.url || '';
    const icon = item.icon || '';
    const customColor = item.customColor || '';
    
    // Calculate default color for preview
    const data = getActiveData();
    const theme = data.theme || currentData.theme || {};
    const colors = theme.buttonColors || ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];
    const defaultColor = colors[index % colors.length];
    const previewColor = customColor || defaultColor;

    const updateFn = `updateItem('${parentKey}', ${index},`;
    const removeFn = `removeItem('${parentKey}', ${index})`;

    if (parentKey === 'connectLinks') {
        return `
            <div class="item-card">
                <div class="item-header"><span class="item-title">Icon #${index + 1}</span><button type="button" class="btn btn-danger btn-sm" onclick="${removeFn}">Remove</button></div>
                <div class="row g-3">
                    <div class="col-md-6"><label>Icon Class</label><input type="text" class="form-control" value="${icon}" onchange="${updateFn} 'icon', this.value)"></div>
                    <div class="col-md-6"><label>URL</label><input type="text" class="form-control" value="${url}" onchange="${updateFn} 'url', this.value)"></div>
                </div>
            </div>
        `;
    }

    return `
        <div class="item-card" style="border-left: 5px solid ${previewColor}">
            <div class="item-header">
                <span class="item-title">Item #${index + 1}</span>
                <div class="d-flex align-items-center gap-2">
                    <div class="input-group input-group-sm" style="width: 140px;" title="Override Button Color">
                        <span class="input-group-text p-1"><div style="width: 15px; height: 15px; background-color: ${previewColor}; border-radius: 50%;"></div></span>
                        <input type="color" class="form-control form-control-color" value="${previewColor}" onchange="${updateFn} 'customColor', this.value)">
                        ${customColor ? `<button class="btn btn-outline-secondary" onclick="${updateFn} 'customColor', '')" title="Reset to Default">×</button>` : ''}
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" onclick="${removeFn}">Remove</button>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-6"><label>Title</label><input type="text" class="form-control" value="${title}" placeholder="e.g. Project Name" onchange="${updateFn} 'title', this.value)"></div>
                <div class="col-md-6"><label>Subtitle</label><input type="text" class="form-control" value="${subtitle}" placeholder="e.g. Hindi translation" onchange="${updateFn} 'subtitle', this.value)"></div>
                <div class="col-12"><label>Description</label><textarea class="form-control" rows="2" onchange="${updateFn} 'description', this.value)">${description}</textarea></div>
                <div class="col-md-6"><label>Button Text</label><input type="text" class="form-control" value="${text}" onchange="${updateFn} 'text', this.value)"></div>
                <div class="col-md-6"><label>Button URL</label><input type="text" class="form-control" value="${url}" onchange="${updateFn} 'url', this.value)"></div>
            </div>
        </div>
    `;
}

// Actions
window.toggleSection = function(id) {
    openSections.has(id) ? openSections.delete(id) : openSections.add(id);
    renderForm();
};

window.toggleAll = function(expand) {
    const data = getActiveData();
    if (expand) {
        (data.sectionOrder || []).forEach(key => openSections.add(`section-${key}`));
        openSections.add('theme-settings');
    } else {
        openSections.clear();
    }
    renderForm();
};

window.moveSection = function(index, direction) {
    const data = getActiveData();
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < data.sectionOrder.length) {
        [data.sectionOrder[index], data.sectionOrder[newIndex]] = [data.sectionOrder[newIndex], data.sectionOrder[index]];
        renderForm();
        checkChanges();
    }
};

window.addNewCustomSection = function() {
    const data = getActiveData();
    const id = `custom_${Date.now()}`;
    data[id] = { title: "New Section", links: [] };
    if (!data.sectionOrder) data.sectionOrder = [];
    const footerIndex = data.sectionOrder.indexOf('footer');
    footerIndex !== -1 ? data.sectionOrder.splice(footerIndex, 0, id) : data.sectionOrder.push(id);
    openSections.add(`section-${id}`);
    renderForm();
    checkChanges();
};

window.deleteCustomSection = function(key) {
    const data = getActiveData();
    if(confirm('Delete this section?')) {
        delete data[key];
        data.sectionOrder = data.sectionOrder.filter(k => k !== key);
        renderForm();
        checkChanges();
    }
};

window.resetData = function() {
    if(confirm('Discard changes?')) {
        currentData = JSON.parse(JSON.stringify(originalData));
        openSections.clear();
        renderForm();
        checkChanges();
    }
};

// Updates
window.updateProfile = (key, value) => { getActiveData().profile[key] = value; checkChanges(); };
window.updateFooter = (value) => { getActiveData().footer = value; checkChanges(); };
window.updateThemeGlobal = (useGlobal) => {
    const data = getActiveData();
    if (useGlobal) {
        delete data.theme;
    } else {
        data.theme = JSON.parse(JSON.stringify(currentData.theme || {}));
    }
    renderForm();
    checkChanges();
};
window.updateProfileGlobal = (useGlobal) => {
    const data = getActiveData();
    if (useGlobal) {
        delete data.profile;
    } else {
        data.profile = JSON.parse(JSON.stringify(currentData.profile || {}));
    }
    renderForm();
    checkChanges();
};
window.updateFooterGlobal = (useGlobal) => { 
    const data = getActiveData();
    data.useGlobalFooter = useGlobal;
    renderForm();
    checkChanges(); 
};
window.updateCustomSectionTitle = (key, value) => { getActiveData()[key].title = value; checkChanges(); };
window.updateDivider = (key, pos, val) => {
    const data = getActiveData();
    if (!data.sectionSettings) data.sectionSettings = {};
    if (!data.sectionSettings[key]) data.sectionSettings[key] = {};
    pos === 'top' ? data.sectionSettings[key].dividerTop = val : data.sectionSettings[key].dividerBottom = val;
    checkChanges();
};

window.updateItem = function(parentKey, index, field, value) {
    const data = getActiveData();
    let items = (staticSections[parentKey] || parentKey === 'connectLinks') ? data[parentKey] : data[parentKey].links;
    items[index][field] = value;
    checkChanges();
};

window.addItem = function(parentKey) {
    const data = getActiveData();
    let newItem = parentKey === 'connectLinks' ? { icon: "fab fa-star", url: "#" } : { text: "New Item", url: "#" };
    (staticSections[parentKey] || parentKey === 'connectLinks') ? data[parentKey].push(newItem) : data[parentKey].links.push(newItem);
    openSections.add(`section-${parentKey}`);
    renderForm();
    checkChanges();
};

window.removeItem = function(parentKey, index) {
    const data = getActiveData();
    if(confirm('Remove item?')) {
        (staticSections[parentKey] || parentKey === 'connectLinks') ? data[parentKey].splice(index, 1) : data[parentKey].links.splice(index, 1);
        renderForm();
        checkChanges();
    }
};

window.updateThemeSetting = (key, value) => { 
    const data = getActiveData();
    if (!data.theme) data.theme = {}; 
    data.theme[key] = value; 
    checkChanges(); 
};
window.handleFontSelection = (value) => {
    const customInputs = document.getElementById('customFontInputs');
    if (value === 'custom') {
        customInputs.classList.remove('d-none');
    } else {
        customInputs.classList.add('d-none');
        updateThemeSetting('fontFamily', value);
        updateThemeSetting('customFontUrl', ''); 
    }
};
window.updateThemeColor = (index, value) => { getActiveData().theme.buttonColors[index] = value; checkChanges(); };
window.addThemeColor = () => { getActiveData().theme.buttonColors.push('#000000'); openSections.add('theme-settings'); renderForm(); checkChanges(); };
window.removeThemeColor = (index) => { getActiveData().theme.buttonColors.splice(index, 1); renderForm(); checkChanges(); };

// Save & Download
window.previewData = function() {
    const outputArea = document.getElementById('outputArea');
    if (outputArea.style.display === 'block') {
        outputArea.style.display = 'none';
        return;
    }

    const output = `const siteData = ${JSON.stringify(currentData, null, 4)};`;
    outputArea.style.display = 'block';
    outputArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="m-0">Preview Data</h3>
            <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('outputArea').style.display='none'">Close</button>
        </div>
        <pre class="bg-light p-3 border rounded"><code>${output}</code></pre>
    `;
    outputArea.scrollIntoView({ behavior: 'smooth' });
};

window.openSaveModal = function() {
    const modal = new bootstrap.Modal(document.getElementById('saveModal'));
    modal.show();
};

window.confirmSave = function() {
    const message = document.getElementById('commitMessage').value || "Update site data";
    const modalEl = document.getElementById('saveModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
    
    saveDataDirectly(message);
};

window.saveDataDirectly = async function(commitMessage = "Update site data") {
    const btn = document.getElementById('saveBtn');
    if (btn.disabled) return;
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';

    let endpoint = '/.netlify/functions/save-data';
    let isLocalNode = false;

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
            endpoint = 'http://localhost:8000/save-data';
            isLocalNode = true;
        } catch (e) {
            endpoint = '/.netlify/functions/save-data';
            isLocalNode = false;
        }
    }

    try {
        let response;
        const payload = { password: authToken, data: currentData, message: commitMessage };

        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            if (isLocalNode) {
                endpoint = '/.netlify/functions/save-data';
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                throw err;
            }
        }

        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Saved successfully!');
            originalData = JSON.parse(JSON.stringify(currentData));
        } else {
            if (response.status === 401) {
                alert("Unauthorized: Invalid Password.");
            } else if ([404, 405, 501].includes(response.status)) {
                downloadData();
                alert("Server save not available. Downloading file instead.");
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        }
    } catch (error) {
        alert('Error saving data: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

window.downloadData = function() {
    const output = `const siteData = ${JSON.stringify(currentData, null, 4)};`;
    const blob = new Blob([output], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.js';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};

window.checkChanges = function() {
    const btn = document.getElementById('saveBtn');
    const resetBtn = document.getElementById('resetBtn');
    if (!btn) return;
    
    const hasChanges = JSON.stringify(originalData) !== JSON.stringify(currentData);
    btn.disabled = !hasChanges;
    if (resetBtn) resetBtn.disabled = !hasChanges;
    
    if (hasChanges) {
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-success');
        btn.innerHTML = 'Save Directly';
    } else {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-secondary');
        btn.innerHTML = 'No Changes';
    }
};

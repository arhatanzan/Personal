// State management
let currentData = JSON.parse(JSON.stringify(siteData)); // Deep copy

// Initialize defaults if missing
if (!currentData.sectionOrder) {
    currentData.sectionOrder = ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
}
if (!currentData.sectionSettings) currentData.sectionSettings = {};
if (!currentData.theme) currentData.theme = { buttonColors: ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'] };

// Track open sections
let openSections = new Set();

const staticSections = {
    profile: { title: 'Profile', render: renderProfileFields },
    socialLinks: { title: 'Social Links', render: (key) => renderListFields(key) },
    workLinks: { title: 'Work Links', render: (key) => renderListFields(key) },
    publications: { title: 'Publications', render: (key) => renderListFields(key) },
    connectLinks: { title: 'Connect Icons', render: (key) => renderListFields(key) },
    footer: { title: 'Footer', render: renderFooterFields }
};

function initForm() {
    renderForm();
}

function renderForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = '';

    // 1. Theme Settings
    container.insertAdjacentHTML('beforeend', renderThemeSettings());

    // 2. Sections
    currentData.sectionOrder.forEach((key, index) => {
        // Determine title and render function
        let title = '';
        let renderFn = null;
        let isCustom = false;

        if (staticSections[key]) {
            title = staticSections[key].title;
            renderFn = staticSections[key].render;
        } else if (currentData[key]) {
            // Custom Section
            title = currentData[key].title || 'Custom Section';
            renderFn = (k) => renderCustomSectionFields(k);
            isCustom = true;
        } else {
            // Unknown or deleted section in order? Skip.
            return;
        }

        const sectionId = `section-${key}`;
        const isOpen = openSections.has(sectionId);
        
        // Divider Toggle State
        // Default: Top divider for all except first section and footer
        // Bottom divider: Default false
        const settings = currentData.sectionSettings[key] || {};
        const showDividerTop = settings.dividerTop ?? (index > 0 && key !== 'footer');
        const showDividerBottom = settings.dividerBottom ?? false;

        const sectionHtml = `
            <div class="section-card" id="${sectionId}">
                <div class="section-header ${isOpen ? 'active' : ''}" onclick="toggleSection('${sectionId}')">
                    <div class="d-flex align-items-center gap-3 flex-grow-1">
                        <h2 class="m-0 fs-5">${title} <span class="badge bg-secondary ms-2" style="font-size: 0.6em">${isCustom ? 'Custom' : 'Static'}</span></h2>
                        
                        <div class="d-flex gap-1 ms-auto me-3" onclick="event.stopPropagation()">
                            <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="moveSection(${index}, -1)" ${index === 0 ? 'disabled' : ''}>
                                <i class="fas fa-arrow-up"></i>
                            </button>
                            <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="moveSection(${index}, 1)" ${index === currentData.sectionOrder.length - 1 ? 'disabled' : ''}>
                                <i class="fas fa-arrow-down"></i>
                            </button>
                        </div>
                    </div>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content ${isOpen ? 'active' : ''}">
                    <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                        <div class="d-flex gap-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="divider-top-${key}" 
                                    ${showDividerTop ? 'checked' : ''} 
                                    onchange="updateDivider('${key}', 'top', this.checked)">
                                <label class="form-check-label" for="divider-top-${key}">Divider Top</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="divider-bottom-${key}" 
                                    ${showDividerBottom ? 'checked' : ''} 
                                    onchange="updateDivider('${key}', 'bottom', this.checked)">
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

    // Add New Section Button
    container.insertAdjacentHTML('beforeend', `
        <div class="text-center my-4">
            <button class="btn btn-primary btn-lg" onclick="addNewCustomSection()">
                <i class="fas fa-plus-circle me-2"></i>Add New Custom Section
            </button>
        </div>
    `);
}

// --- Render Helpers ---

function renderThemeSettings() {
    const colors = currentData.theme.buttonColors || [];
    const isOpen = openSections.has('theme-settings');
    
    return `
        <div class="section-card border-info mb-4">
            <div class="section-header bg-info text-white ${isOpen ? 'active' : ''}" onclick="toggleSection('theme-settings')">
                <h2 class="m-0 fs-5"><i class="fas fa-palette me-2"></i>Theme Settings</h2>
                <i class="fas fa-chevron-down toggle-icon"></i>
            </div>
            <div class="section-content ${isOpen ? 'active' : ''}">
                <label class="form-label">Button Colors (cycled)</label>
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
    return `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label>Name</label>
                <input type="text" class="form-control" value="${currentData.profile.name || ''}" onchange="updateProfile('name', this.value)">
            </div>
            <div class="col-md-6 mb-3">
                <label>Subtitle</label>
                <input type="text" class="form-control" value="${currentData.profile.subtitle || ''}" onchange="updateProfile('subtitle', this.value)">
            </div>
            <div class="col-12 mb-3">
                <label>Image Path</label>
                <input type="text" class="form-control" value="${currentData.profile.image || ''}" onchange="updateProfile('image', this.value)">
            </div>
        </div>
    `;
}

function renderFooterFields() {
    return `
        <label>Footer Text</label>
        <input type="text" class="form-control" value="${currentData.footer || ''}" onchange="updateFooter(this.value)">
    `;
}

function renderListFields(key) {
    const items = currentData[key] || [];
    let html = `<div id="${key}List">`;
    
    html += items.map((item, index) => renderItemForm(item, index, key)).join('');
    
    html += `</div>
        <button type="button" class="btn btn-success btn-sm" onclick="addItem('${key}')">+ Add Item</button>
    `;
    return html;
}

function renderCustomSectionFields(key) {
    const section = currentData[key];
    let html = `
        <div class="mb-3">
            <label>Section Title</label>
            <input type="text" class="form-control" value="${section.title}" onchange="updateCustomSectionTitle('${key}', this.value)">
        </div>
        <div id="${key}List">
    `;
    
    html += (section.links || []).map((item, index) => renderItemForm(item, index, key)).join('');
    
    html += `</div>
        <button type="button" class="btn btn-success btn-sm mt-2" onclick="addItem('${key}')">+ Add Item to Section</button>
    `;
    return html;
}

function renderItemForm(item, index, parentKey) {
    const title = item.title || item.boldTitle || '';
    const subtitle = item.subtitle || item.hindiTitle || '';
    const description = item.description || '';
    const text = item.text || item.linkText || '';
    const url = item.url || item.linkUrl || '';
    const icon = item.icon || '';

    const updateFn = `updateItem('${parentKey}', ${index},`;
    const removeFn = `removeItem('${parentKey}', ${index})`;

    if (parentKey === 'connectLinks') {
        return `
            <div class="item-card">
                <div class="item-header">
                    <span class="item-title">Icon #${index + 1}</span>
                    <button type="button" class="btn btn-danger btn-sm" onclick="${removeFn}">Remove</button>
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label>Icon Class (e.g. fab fa-facebook)</label>
                        <input type="text" class="form-control" value="${icon}" onchange="${updateFn} 'icon', this.value)">
                    </div>
                    <div class="col-md-6">
                        <label>URL</label>
                        <input type="text" class="form-control" value="${url}" onchange="${updateFn} 'url', this.value)">
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="item-card">
            <div class="item-header">
                <span class="item-title">Item #${index + 1}</span>
                <button type="button" class="btn btn-danger btn-sm" onclick="${removeFn}">Remove</button>
            </div>
            <div class="row g-3">
                <div class="col-md-6">
                    <label>Title (Optional)</label>
                    <input type="text" class="form-control" value="${title}" placeholder="e.g. Project Name" onchange="${updateFn} 'title', this.value)">
                </div>
                <div class="col-md-6">
                    <label>Subtitle (Optional)</label>
                    <input type="text" class="form-control" value="${subtitle}" placeholder="e.g. Hindi translation" onchange="${updateFn} 'subtitle', this.value)">
                </div>
                <div class="col-12">
                    <label>Description (Optional)</label>
                    <textarea class="form-control" rows="2" placeholder="Description text..." onchange="${updateFn} 'description', this.value)">${description}</textarea>
                </div>
                <div class="col-md-6">
                    <label>Button Text</label>
                    <input type="text" class="form-control" value="${text}" onchange="${updateFn} 'text', this.value)">
                </div>
                <div class="col-md-6">
                    <label>Button URL</label>
                    <input type="text" class="form-control" value="${url}" onchange="${updateFn} 'url', this.value)">
                </div>
            </div>
        </div>
    `;
}

// --- Actions ---

window.toggleSection = function(id) {
    if (openSections.has(id)) {
        openSections.delete(id);
    } else {
        openSections.add(id);
    }
    renderForm();
};

window.toggleAll = function(expand) {
    if (expand) {
        // Add all sections in order
        currentData.sectionOrder.forEach(key => openSections.add(`section-${key}`));
        // Add theme settings
        openSections.add('theme-settings');
    } else {
        openSections.clear();
    }
    renderForm();
};

window.moveSection = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < currentData.sectionOrder.length) {
        const temp = currentData.sectionOrder[index];
        currentData.sectionOrder[index] = currentData.sectionOrder[newIndex];
        currentData.sectionOrder[newIndex] = temp;
        renderForm();
    }
};

window.addNewCustomSection = function() {
    const id = `custom_${Date.now()}`;
    currentData[id] = {
        title: "New Section",
        links: []
    };
    // Insert before footer if possible, else append
    const footerIndex = currentData.sectionOrder.indexOf('footer');
    if (footerIndex !== -1) {
        currentData.sectionOrder.splice(footerIndex, 0, id);
    } else {
        currentData.sectionOrder.push(id);
    }
    
    openSections.add(`section-${id}`);
    renderForm();
};

window.deleteCustomSection = function(key) {
    if(confirm('Are you sure you want to delete this entire section?')) {
        delete currentData[key];
        currentData.sectionOrder = currentData.sectionOrder.filter(k => k !== key);
        renderForm();
    }
};

window.resetData = function() {
    if(confirm('Are you sure you want to discard all changes and reset to the last saved state?')) {
        currentData = JSON.parse(JSON.stringify(siteData));
        // Re-apply defaults if needed
        if (!currentData.sectionOrder) {
            currentData.sectionOrder = ['profile', 'socialLinks', 'workLinks', 'publications', 'connectLinks', 'footer'];
        }
        if (!currentData.sectionSettings) currentData.sectionSettings = {};
        if (!currentData.theme) currentData.theme = { buttonColors: ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'] };
        
        openSections.clear();
        renderForm();
    }
};

// --- Data Updates ---

window.updateProfile = function(key, value) {
    currentData.profile[key] = value;
};

window.updateFooter = function(value) {
    currentData.footer = value;
};

window.updateCustomSectionTitle = function(key, value) {
    currentData[key].title = value;
};

window.updateDivider = function(key, position, value) {
    if (!currentData.sectionSettings) currentData.sectionSettings = {};
    if (!currentData.sectionSettings[key]) currentData.sectionSettings[key] = {};
    
    if (position === 'top') {
        currentData.sectionSettings[key].dividerTop = value;
    } else {
        currentData.sectionSettings[key].dividerBottom = value;
    }
};

// Generic item updater for both static lists and custom sections
window.updateItem = function(parentKey, index, field, value) {
    let items;
    if (staticSections[parentKey] || parentKey === 'connectLinks') {
        items = currentData[parentKey];
    } else {
        // Custom section
        items = currentData[parentKey].links;
    }

    // Handle legacy field mapping if needed (for publications)
    if (parentKey === 'publications') {
        if (field === 'text') field = 'linkText';
        if (field === 'url') field = 'linkUrl';
        if (field === 'subtitle') field = 'hindiTitle';
    }

    items[index][field] = value;
};

window.addItem = function(parentKey) {
    let newItem = { text: "New Item", url: "#" };
    if (parentKey === 'connectLinks') newItem = { icon: "fab fa-star", url: "#" };
    
    if (staticSections[parentKey] || parentKey === 'connectLinks') {
        currentData[parentKey].push(newItem);
    } else {
        currentData[parentKey].links.push(newItem);
    }
    
    openSections.add(`section-${parentKey}`);
    renderForm();
};

window.removeItem = function(parentKey, index) {
    if(confirm('Are you sure?')) {
        if (staticSections[parentKey] || parentKey === 'connectLinks') {
            currentData[parentKey].splice(index, 1);
        } else {
            currentData[parentKey].links.splice(index, 1);
        }
        renderForm();
    }
};

// --- Theme Updates ---

window.updateThemeColor = function(index, value) {
    currentData.theme.buttonColors[index] = value;
};

window.addThemeColor = function() {
    currentData.theme.buttonColors.push('#000000');
    openSections.add('theme-settings');
    renderForm();
};

window.removeThemeColor = function(index) {
    currentData.theme.buttonColors.splice(index, 1);
    renderForm();
};

// --- Preview & Download ---

window.previewData = function() {
    const output = `const siteData = ${JSON.stringify(currentData, null, 4)};`;
    const outputArea = document.getElementById('outputArea');
    
    outputArea.style.display = 'block';
    outputArea.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3 class="m-0">Preview Data</h3>
            <button type="button" class="btn btn-danger btn-sm" onclick="document.getElementById('outputArea').style.display='none'">Close Preview</button>
        </div>
        <p>This is how the data file looks:</p>
        <pre class="bg-light p-3 border rounded"><code>${output}</code></pre>
    `;
    
    outputArea.scrollIntoView({ behavior: 'smooth' });
};

window.saveDataDirectly = async function() {
    const btn = document.getElementById('saveBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';

    // Determine endpoint: Localhost server or Netlify Function
    // If we are on localhost, try the local node server first, or fallback to netlify dev function if configured
    // For simplicity, we'll try the Netlify function path first if we are NOT on port 3000 (which is the node server)
    // But since the user might be running the site on Live Server (port 5500), we need a strategy.
    
    // Strategy:
    // 1. If hostname is localhost, try http://localhost:3000/save-data (The Node Script)
    // 2. If that fails or we are on production, try /.netlify/functions/save-data
    
    let endpoint = '/.netlify/functions/save-data';
    let isLocalNode = false;

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Check if we should try the local python server
        // We can try to fetch it, if it fails, we assume we are on Netlify Dev or just static
        try {
            // Quick check or just attempt the save
            endpoint = 'http://localhost:8000/save-data';
            isLocalNode = true;
        } catch (e) {
            endpoint = '/.netlify/functions/save-data';
            isLocalNode = false;
        }
    }

    try {
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentData)
            });
        } catch (err) {
            // If local node server failed (e.g. not running), try Netlify function path
            if (isLocalNode) {
                console.log("Local server not found, trying Netlify function...");
                endpoint = '/.netlify/functions/save-data';
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(currentData)
                });
            } else {
                throw err;
            }
        }

        if (response.ok) {
            const result = await response.json();
            alert(result.message || 'Changes saved successfully! The site will rebuild shortly.');
            // Update the "original" data so Reset works correctly relative to this save
            siteData = JSON.parse(JSON.stringify(currentData));
        } else {
            // Handle standard python server (501/405) or missing endpoint (404)
            if (response.status === 501 || response.status === 405 || response.status === 404) {
                throw new Error("Current server is Read-Only (standard python/live-server).");
            }
            
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Server responded with ' + response.status);
        }
    } catch (error) {
        console.warn(error);
        const isReadOnly = error.message.includes("Read-Only");
        const msg = isReadOnly 
            ? "You are running a standard Read-Only server.\nSwitching to manual download..."
            : `Could not save directly.\nError: ${error.message}\n\nFalling back to download...`;
            
        alert(msg);
        downloadData();
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

    const outputArea = document.getElementById('outputArea');
    outputArea.style.display = 'block';
    outputArea.innerHTML = `
        <div class="alert alert-success d-flex justify-content-between align-items-center">
            <span><strong>Success!</strong> The data.js file has been downloaded.</span>
            <button type="button" class="btn-close" onclick="document.getElementById('outputArea').style.display='none'"></button>
        </div>
    `;
    outputArea.scrollIntoView({ behavior: 'smooth' });
};

// Initialize
initForm();

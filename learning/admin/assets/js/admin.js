// State management
let currentData = JSON.parse(JSON.stringify(siteData)); // Deep copy

// Initialize sectionOrder if not present
if (!currentData.sectionOrder) {
    currentData.sectionOrder = ['profile', 'socialLinks', 'workLinks', 'publications', 'customSections', 'connectLinks', 'footer'];
}

// Ensure customSections exists
if (!currentData.customSections) currentData.customSections = [];

// Track open sections to prevent collapsing on re-render
// Store IDs like 'section-profile', 'section-custom-0'
let openSections = new Set();

const sectionConfig = {
    profile: { title: 'Profile', render: renderProfileFields },
    socialLinks: { title: 'Social Links', render: (key) => renderListFields(key) },
    workLinks: { title: 'Work Links', render: (key) => renderListFields(key) },
    publications: { title: 'Publications', render: (key) => renderListFields(key) },
    customSections: { title: 'Custom Sections', render: renderCustomSectionsFields },
    connectLinks: { title: 'Connect Icons', render: (key) => renderListFields(key) },
    footer: { title: 'Footer', render: renderFooterFields }
};

function initForm() {
    renderForm();
}

function renderForm() {
    const container = document.getElementById('formContainer');
    container.innerHTML = '';

    currentData.sectionOrder.forEach((key, index) => {
        const config = sectionConfig[key];
        if (!config) return;

        const sectionId = `section-${key}`;
        const isOpen = openSections.has(sectionId);
        
        const sectionHtml = `
            <div class="section-card" id="${sectionId}">
                <div class="section-header ${isOpen ? 'active' : ''}" onclick="toggleSection('${sectionId}')">
                    <div class="d-flex align-items-center gap-3">
                        <h2 class="m-0">${config.title}</h2>
                        <div class="d-flex gap-1" onclick="event.stopPropagation()">
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
                    ${config.render(key)}
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', sectionHtml);
    });
}

// --- Render Helpers ---

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

function renderListFields(arrayName) {
    const items = currentData[arrayName] || [];
    let html = `<div id="${arrayName}List">`;
    
    html += items.map((item, index) => renderItemForm(item, index, arrayName)).join('');
    
    html += `</div>
        <button type="button" class="btn btn-success btn-sm" onclick="addItem('${arrayName}')">+ Add Item</button>
    `;
    return html;
}

function renderCustomSectionsFields() {
    let html = `<p class="text-muted small">Add new sections like "Projects", "Events", etc.</p>
                <div id="customSectionsList">`;
    
    html += currentData.customSections.map((section, sIndex) => {
        const sectionId = `section-custom-${sIndex}`;
        const isOpen = openSections.has(sectionId);

        return `
        <div class="section-card border-primary mb-3" id="${sectionId}">
            <div class="section-header bg-light ${isOpen ? 'active' : ''}" onclick="toggleSection('${sectionId}')">
                <div class="d-flex align-items-center gap-3">
                    <h4 class="m-0 text-primary">${section.title || 'New Section'}</h4>
                    <div class="d-flex gap-1" onclick="event.stopPropagation()">
                        <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="moveCustomSection(${sIndex}, -1)" ${sIndex === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button type="button" class="btn btn-outline-secondary btn-sm py-0 px-2" onclick="moveCustomSection(${sIndex}, 1)" ${sIndex === currentData.customSections.length - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                </div>
                <i class="fas fa-chevron-down toggle-icon"></i>
            </div>
            <div class="section-content ${isOpen ? 'active' : ''}">
                <div class="d-flex justify-content-between align-items-end mb-4">
                    <div class="flex-grow-1 me-3">
                        <label>Section Title</label>
                        <input type="text" class="form-control" value="${section.title}" onchange="updateCustomSectionTitle(${sIndex}, this.value)">
                    </div>
                    <button type="button" class="btn btn-danger" onclick="removeCustomSection(${sIndex})">Delete Section</button>
                </div>
                
                <h5 class="border-bottom pb-2 mb-3">Items in this section</h5>
                <div>
                    ${section.links.map((link, lIndex) => renderItemForm(link, lIndex, null, sIndex)).join('')}
                </div>
                <button type="button" class="btn btn-success btn-sm mt-2" onclick="addCustomSectionLink(${sIndex})">+ Add Item to Section</button>
            </div>
        </div>
    `}).join('');

    html += `</div>
        <button type="button" class="btn btn-success btn-sm" onclick="addCustomSection()">+ Add New Section</button>
    `;
    return html;
}

function renderItemForm(item, index, arrayName, sectionIndex = null) {
    const title = item.title || item.boldTitle || '';
    const subtitle = item.subtitle || item.hindiTitle || '';
    const description = item.description || '';
    const text = item.text || item.linkText || '';
    const url = item.url || item.linkUrl || '';
    const icon = item.icon || '';

    const updateFn = sectionIndex !== null 
        ? `updateCustomSectionLink(${sectionIndex}, ${index},` 
        : `updateData('${arrayName}', ${index},`;

    const removeFn = sectionIndex !== null
        ? `removeCustomSectionLink(${sectionIndex}, ${index})`
        : `removeItem('${arrayName}', ${index})`;

    if (arrayName === 'connectLinks') {
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
        // Add all main sections
        currentData.sectionOrder.forEach(key => openSections.add(`section-${key}`));
        // Add all custom sections
        currentData.customSections.forEach((_, i) => openSections.add(`section-custom-${i}`));
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

window.moveCustomSection = function(index, direction) {
    const newIndex = index + direction;
    if (newIndex >= 0 && newIndex < currentData.customSections.length) {
        const temp = currentData.customSections[index];
        currentData.customSections[index] = currentData.customSections[newIndex];
        currentData.customSections[newIndex] = temp;
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

window.updateData = function(arrayName, index, key, value) {
    if (arrayName === 'publications') {
        if (key === 'text') key = 'linkText';
        if (key === 'url') key = 'linkUrl';
        if (key === 'subtitle') key = 'hindiTitle';
    }
    currentData[arrayName][index][key] = value;
};

window.addItem = function(arrayName) {
    let newItem = { text: "New Item", url: "#" };
    if (arrayName === 'connectLinks') newItem = { icon: "fab fa-star", url: "#" };
    currentData[arrayName].push(newItem);
    
    // Auto-expand the section we just added to
    openSections.add(`section-${arrayName}`);
    renderForm();
};

window.removeItem = function(arrayName, index) {
    if(confirm('Are you sure?')) {
        currentData[arrayName].splice(index, 1);
        renderForm();
    }
};

window.addCustomSection = function() {
    currentData.customSections.push({
        title: "New Section",
        links: []
    });
    // Auto expand the custom sections block
    openSections.add('section-customSections');
    // Auto expand the new section
    openSections.add(`section-custom-${currentData.customSections.length - 1}`);
    renderForm();
};

window.removeCustomSection = function(index) {
    if(confirm('Delete this entire section?')) {
        currentData.customSections.splice(index, 1);
        renderForm();
    }
};

window.updateCustomSectionTitle = function(index, value) {
    currentData.customSections[index].title = value;
};

window.addCustomSectionLink = function(sectionIndex) {
    currentData.customSections[sectionIndex].links.push({ text: "New Link", url: "#" });
    openSections.add(`section-custom-${sectionIndex}`);
    renderForm();
};

window.removeCustomSectionLink = function(sectionIndex, linkIndex) {
    currentData.customSections[sectionIndex].links.splice(linkIndex, 1);
    renderForm();
};

window.updateCustomSectionLink = function(sectionIndex, linkIndex, key, value) {
    currentData.customSections[sectionIndex].links[linkIndex][key] = value;
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

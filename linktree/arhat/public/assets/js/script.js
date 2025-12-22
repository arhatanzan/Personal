class ColoredDivider extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
            <div class="hr-container">
                <div class="box">
                    <div class="box-sm red"></div>
                    <div class="box-sm orange"></div>
                    <div class="box-sm yellow-bar"></div>
                    <div class="box-sm green-bar"></div>
                    <div class="box-sm blue-bar"></div>
                    <div class="box-sm purple"></div>
                </div>
            </div>
        `;
    }
}

customElements.define('colored-divider', ColoredDivider);

function renderSite() {
    // Apply Theme Settings
    const root = document.documentElement;
    const theme = siteData.theme || {};

    // Handle Custom Font Loading
    if (theme.customFontUrl) {
        let link = document.getElementById('custom-font-link');
        if (!link) {
            link = document.createElement('link');
            link.id = 'custom-font-link';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = theme.customFontUrl;
    }
    
    if (theme.backgroundColor) root.style.setProperty('--bg-color', theme.backgroundColor);
    if (theme.backgroundImage) root.style.setProperty('--bg-image', `url('${theme.backgroundImage}')`);
    if (theme.textColor) root.style.setProperty('--text-color', theme.textColor);
    if (theme.fontFamily) root.style.setProperty('--font-family', theme.fontFamily);
    if (theme.fontSize) root.style.setProperty('--font-size-base', theme.fontSize + 'px');
    if (theme.sectionSpacing) root.style.setProperty('--section-spacing', theme.sectionSpacing + 'px');
    if (theme.textSpacing) root.style.setProperty('--text-spacing', theme.textSpacing + 'px');
    if (theme.btnSpacing) root.style.setProperty('--btn-spacing', theme.btnSpacing + 'px');
    
    // Adjust header background opacity based on theme
    if (theme.backgroundColor) {
        // Simple hex to rgba conversion for header transparency
        // Or just use the bg color with some opacity if it's hex
        root.style.setProperty('--header-bg', theme.backgroundColor); 
        // Ideally we'd add opacity, but for now solid or user-provided is fine
    }

    // Render Fixed Header (Name & Subtitle)
    const header = document.getElementById('site-header');
    if (header) {
        header.innerHTML = `
            <h1 class="brand-name">${siteData.profile.name}</h1>
            <p class="subtitle">${siteData.profile.subtitle}</p>
        `;
    }

    const container = document.getElementById('site-container');
    if (!container) return;
    
    container.innerHTML = '';

    // Default order if not present
    const order = siteData.sectionOrder || ['profile', 'socialLinks', 'workLinks', 'publications', 'customSections', 'connectLinks', 'footer'];

    order.forEach((key, index) => {
        let sectionHtml = '';
        let sectionId = '';
        let isProfile = key === 'profile';
        let isFooter = key === 'footer';

        // Check if it's a known static section or a dynamic one
        if (['profile', 'socialLinks', 'workLinks', 'publications', 'customSections', 'connectLinks', 'footer'].includes(key)) {
            switch(key) {
                case 'profile':
                    sectionHtml = renderProfile();
                    break;
                case 'socialLinks':
                    sectionHtml = renderLinkSection('Social Links', siteData.socialLinks);
                    sectionId = 'social-links-container';
                    break;
                case 'workLinks':
                    sectionHtml = renderLinkSection('Work', siteData.workLinks);
                    sectionId = 'work-links-container';
                    break;
                case 'publications':
                    sectionHtml = renderLinkSection('Publications', siteData.publications);
                    sectionId = 'publications-container';
                    break;
                case 'customSections':
                    sectionHtml = renderCustomSections();
                    sectionId = 'dynamic-sections-container';
                    break;
                case 'connectLinks':
                    sectionHtml = renderLinkSection(null, siteData.connectLinks, true);
                    sectionId = 'connect-container';
                    break;
                case 'footer':
                    sectionHtml = renderFooter();
                    break;
            }
        } else if (siteData[key]) {
            // Handle promoted custom sections
            // They are stored as { title: "...", links: [...] }
            sectionHtml = renderLinkSection(siteData[key].title, siteData[key].links);
            sectionId = `section-${key}`;
        }

        if (sectionHtml) {
            // Divider Logic
            const settings = (siteData.sectionSettings && siteData.sectionSettings[key]) || {};
            
            // Default Logic if not set
            // Top: True for all except first section (profile) and footer
            // Bottom: False by default
            let showTop = settings.dividerTop;
            let showBottom = settings.dividerBottom;

            if (typeof showTop === 'undefined') {
                showTop = index > 0 && !isFooter;
                // Special case: No divider immediately after Profile (preserves original design)
                const prevKey = index > 0 ? order[index - 1] : null;
                if (prevKey === 'profile') showTop = false;
            }

            if (typeof showBottom === 'undefined') {
                showBottom = false;
            }

            // Render Top Divider
            if (showTop) {
                container.insertAdjacentHTML('beforeend', '<colored-divider></colored-divider>');
            }

            // Render Content
            if (sectionId) {
                container.insertAdjacentHTML('beforeend', `<div id="${sectionId}">${sectionHtml}</div>`);
            } else {
                container.insertAdjacentHTML('beforeend', sectionHtml);
            }

            // Render Bottom Divider
            if (showBottom) {
                container.insertAdjacentHTML('beforeend', '<colored-divider></colored-divider>');
            }
        }
    });

    applyButtonColors();
}

function renderProfile() {
    // Only render the image here, as name/subtitle are in the fixed header
    return `
        <div class="profile-container">
            <img src="${siteData.profile.image}" alt="Profile" class="profile-img">
        </div>
    `;
}

function renderFooter() {
    return `<footer>${siteData.footer}</footer>`;
}

function renderLinkSection(title, items, isConnect = false) {
    if (!items || items.length === 0) return '';
    
    let html = '';
    if (title) {
        html += `<h2 class="section-title">${title}</h2>`;
    }
    
    html += generateItemsHtml(items, isConnect);
    return html;
}

function renderCustomSections() {
    if (!siteData.customSections || siteData.customSections.length === 0) return '';
    
    // Join multiple custom sections with dividers
    return siteData.customSections.map((section, index) => {
        const content = generateItemsHtml(section.links);
        const divider = index > 0 ? '<colored-divider></colored-divider>' : '';
        return `
            ${divider}
            <div class="custom-section">
                <h2 class="section-title">${section.title}</h2>
                ${content}
            </div>
        `;
    }).join('');
}

function generateItemsHtml(items, isConnect = false) {
    if (!items || items.length === 0) return '';

    let html = '';
    let linksBuffer = [];

    items.forEach(item => {
        const title = item.title || item.boldTitle;
        const subtitle = item.subtitle || item.hindiTitle;
        const description = item.description;
        const text = item.text || item.linkText;
        const url = item.url || item.linkUrl;
        const icon = item.icon;

        const hasContent = title || subtitle || description;
        
        if (hasContent) {
            // Flush buffer
            if (linksBuffer.length > 0) {
                const wrapperClass = isConnect ? 'social-icons' : 'links';
                html += `<div class="${wrapperClass}">${linksBuffer.join('')}</div>`;
                linksBuffer = [];
            }
            
            html += `
                <p class="text-content">
                    ${title ? `<strong>${title}</strong>` : ''} 
                    ${subtitle ? `| <span class="hindi-text">${subtitle}</span>` : ''}
                    ${(title || subtitle) ? '<br>' : ''}
                    ${description || ''}
                </p>
                ${(text && url) ? `
                <div class="links">
                    <a href="${url}" class="link-btn">${text}</a>
                </div>` : ''}
            `;
        } else {
            // Simple link/icon
            if (icon) {
                 linksBuffer.push(`<a href="${url}" target="_blank"><i class="${icon}"></i></a>`);
            } else if (text && url) {
                 linksBuffer.push(`<a href="${url}" class="link-btn" target="_blank">${text}</a>`);
            }
        }
    });

    // Flush remaining
    if (linksBuffer.length > 0) {
        const wrapperClass = isConnect ? 'social-icons' : 'links';
        html += `<div class="${wrapperClass}">${linksBuffer.join('')}</div>`;
    }

    return html;
}

function applyButtonColors() {
    const buttons = document.querySelectorAll('.link-btn');
    
    // Default colors if not provided in siteData
    const colors = (siteData.theme && siteData.theme.buttonColors) 
        ? siteData.theme.buttonColors 
        : ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852']; // Blue, Green, Yellow, Red/Pinkish

    buttons.forEach((btn, index) => {
        const color = colors[index % colors.length];
        
        // Set CSS Variable for dynamic coloring
        btn.style.setProperty('--btn-color', color);
        
        // Clean up any direct styles from previous versions
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.borderBottom = '';
        btn.style.boxShadow = '';
        
        // Ensure class is correct
        btn.className = 'link-btn'; 
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof siteData !== 'undefined') {
        renderSite();
    } else {
        // Fallback or wait for data if loaded async
        console.warn('siteData not found');
    }
});
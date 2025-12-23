class ColoredDivider extends HTMLElement {
    constructor() { super(); }
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

document.addEventListener('DOMContentLoaded', () => {
    if (typeof siteData !== 'undefined') {
        renderSite();
    } else {
        console.warn('siteData not found');
    }
});

function renderSite() {
    const theme = siteData.theme || {};
    applyTheme(theme);
    renderHeader(siteData.profile);
    renderSections(siteData.sectionOrder || getDefaultOrder());
    applyButtonColors(theme);
}

function getDefaultOrder() {
    return ['profile', 'socialLinks', 'workLinks', 'publications', 'customSections', 'connectLinks', 'footer'];
}

function applyTheme(theme) {
    const root = document.documentElement;
    
    // Custom Font
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
    
    // CSS Variables
    const props = {
        '--bg-color': theme.backgroundColor,
        '--bg-image': theme.backgroundImage ? `url('${theme.backgroundImage}')` : null,
        '--text-color': theme.textColor,
        '--font-family': theme.fontFamily,
        '--font-size-base': theme.fontSize ? theme.fontSize + 'px' : null,
        '--section-spacing': theme.sectionSpacing ? theme.sectionSpacing + 'px' : null,
        '--text-spacing': theme.textSpacing ? theme.textSpacing + 'px' : null,
        '--btn-spacing': theme.btnSpacing ? theme.btnSpacing + 'px' : null,
        '--header-bg': theme.backgroundColor
    };

    for (const [key, value] of Object.entries(props)) {
        if (value) root.style.setProperty(key, value);
    }
}

function renderHeader(profile) {
    const header = document.getElementById('site-header');
    if (header && profile) {
        header.innerHTML = `
            <h1 class="brand-name">${profile.name || ''}</h1>
            <p class="subtitle">${profile.subtitle || ''}</p>
        `;
    }
}

function renderSections(order) {
    const container = document.getElementById('site-container');
    if (!container) return;
    container.innerHTML = '';

    order.forEach((key, index) => {
        const sectionData = getSectionData(key);
        if (!sectionData.html) return;

        // Divider Logic
        const settings = (siteData.sectionSettings && siteData.sectionSettings[key]) || {};
        let showTop = settings.dividerTop;
        let showBottom = settings.dividerBottom;

        // Default divider logic
        if (typeof showTop === 'undefined') {
            showTop = index > 0 && key !== 'footer';
            // No divider immediately after Profile
            if (index > 0 && order[index - 1] === 'profile') showTop = false;
        }
        if (typeof showBottom === 'undefined') showBottom = false;

        if (showTop) container.insertAdjacentHTML('beforeend', '<colored-divider></colored-divider>');
        
        if (sectionData.id) {
            container.insertAdjacentHTML('beforeend', `<div id="${sectionData.id}">${sectionData.html}</div>`);
        } else {
            container.insertAdjacentHTML('beforeend', sectionData.html);
        }

        if (showBottom) container.insertAdjacentHTML('beforeend', '<colored-divider></colored-divider>');
    });
}

function getSectionData(key) {
    switch(key) {
        case 'profile':
            return { html: renderProfileImage(), id: null };
        case 'socialLinks':
            return { html: renderLinkSection('Social Links', siteData.socialLinks), id: 'social-links-container' };
        case 'workLinks':
            return { html: renderLinkSection('Work', siteData.workLinks), id: 'work-links-container' };
        case 'publications':
            return { html: renderLinkSection('Publications', siteData.publications), id: 'publications-container' };
        case 'connectLinks':
            return { html: renderLinkSection(null, siteData.connectLinks, true), id: 'connect-container' };
        case 'footer':
            return { html: `<footer>${siteData.footer || ''}</footer>`, id: null };
        default:
            // Dynamic Custom Sections
            if (siteData[key]) {
                return { 
                    html: renderLinkSection(siteData[key].title, siteData[key].links), 
                    id: `section-${key}` 
                };
            }
            return { html: null };
    }
}

function renderProfileImage() {
    if (!siteData.profile || !siteData.profile.image) return '';
    return `
        <div class="profile-container">
            <img src="${siteData.profile.image}" alt="Profile" class="profile-img">
        </div>
    `;
}

function renderLinkSection(title, items, isConnect = false) {
    if (!items || items.length === 0) return '';
    let html = title ? `<h2 class="section-title">${title}</h2>` : '';
    html += generateItemsHtml(items, isConnect);
    return html;
}

function generateItemsHtml(items, isConnect = false) {
    if (!items || items.length === 0) return '';

    let html = '';
    let linksBuffer = [];

    const flushBuffer = () => {
        if (linksBuffer.length > 0) {
            const wrapperClass = isConnect ? 'social-icons' : 'links';
            html += `<div class="${wrapperClass}">${linksBuffer.join('')}</div>`;
            linksBuffer = [];
        }
    };

    items.forEach(item => {
        const { title, subtitle, description, text, url, icon } = item;
        
        const hasContent = title || subtitle || description;
        
        if (hasContent) {
            flushBuffer();
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

    flushBuffer();
    return html;
}

function applyButtonColors(theme) {
    const buttons = document.querySelectorAll('.link-btn');
    const colors = (theme && theme.buttonColors) 
        ? theme.buttonColors 
        : ['#80d6ff', '#3DCD49', '#ffd300', '#ff5852'];

    buttons.forEach((btn, index) => {
        const color = colors[index % colors.length];
        btn.style.setProperty('--btn-color', color);
        // Reset legacy inline styles
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.borderBottom = '';
        btn.style.boxShadow = '';
        btn.className = 'link-btn'; 
    });
}

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

        if (sectionHtml) {
            // Divider Logic
            const prevKey = index > 0 ? order[index - 1] : null;
            let shouldAddDivider = index > 0 && !isFooter;

            // Special case: No divider immediately after Profile (preserves original design)
            if (prevKey === 'profile') {
                shouldAddDivider = false;
            }

            if (shouldAddDivider) {
                container.insertAdjacentHTML('beforeend', '<colored-divider></colored-divider>');
            }

            // Wrap in ID if needed
            if (sectionId) {
                container.insertAdjacentHTML('beforeend', `<div id="${sectionId}">${sectionHtml}</div>`);
            } else {
                container.insertAdjacentHTML('beforeend', sectionHtml);
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
    const colors = ['link-btn--blue', 'link-btn--green', 'link-btn--yellow', 'link-btn--pink'];

    buttons.forEach((btn, index) => {
        colors.forEach(c => btn.classList.remove(c));
        btn.classList.add(colors[index % colors.length]);
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
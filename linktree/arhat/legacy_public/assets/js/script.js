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
    const urlParams = new URLSearchParams(window.location.search);
    const pageId = urlParams.get('page');
    
    let activeData = siteData;
    let isSubPage = false;

    if (pageId && siteData.pages && siteData.pages[pageId]) {
        const pageData = siteData.pages[pageId];
        activeData = {
            ...pageData,
            theme: pageData.theme || siteData.theme,
            profile: pageData.profile || siteData.profile,
            footer: (pageData.useGlobalFooter !== false) ? siteData.footer : pageData.footer
        };
        isSubPage = true;
    }

    const theme = activeData.theme || {};
    applyTheme(theme);
    renderHeader(activeData.profile);
    
    let order = activeData.sectionOrder || getDefaultOrder();
    if (isSubPage) {
        // Insert backButton after profile (index 0 usually) or at the top if no profile
        // Actually, let's just put it after profile.
        const profileIndex = order.indexOf('profile');
        if (profileIndex !== -1) {
            order = [...order.slice(0, profileIndex + 1), 'backButton', ...order.slice(profileIndex + 1)];
        } else {
            order = ['backButton', ...order];
        }
    }

    renderSections(order, activeData);
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

function renderSections(order, data) {
    const container = document.getElementById('site-container');
    if (!container) return;
    // Clear container only if it's the first render or we are handling it carefully. 
    // Since renderBackButton appends to it, we should probably clear it BEFORE renderBackButton is called?
    // Actually renderBackButton appends 'beforeend'. If we clear here, we lose the back button if it was added before.
    // Let's clear in renderSite before calling renderBackButton.
    // Wait, renderSite didn't clear.
    // Let's fix renderSite to clear first.
    
    // But wait, renderSections is called after renderBackButton in my previous edit.
    // If I clear here, I wipe the back button.
    // I should move the clearing logic.
    
    // For now, let's just append. But if I re-render, it duplicates.
    // The original code cleared it: container.innerHTML = '';
    
    // I will modify this function to NOT clear if it's already cleared, or I should handle the back button inside here or before.
    // Better: renderBackButton should be part of the section order or injected differently.
    // Or, I just prepend the back button inside renderSections if it's a subpage?
    // No, renderSections iterates order.
    
    // Let's stick to the plan: renderSections uses the data passed to it.
    // I will remove the innerHTML = '' from here and move it to renderSite or handle it better.
    // Actually, let's just let renderSections clear it, and I'll move renderBackButton call to AFTER renderSections? 
    // No, back button usually goes on top.
    
    // Let's change renderSections to accept an optional "preContent" or just handle the clearing in renderSite.
    // But renderSections is the one that knows about 'site-container'.
    
    // Let's keep it simple. I'll clear it here.
    // And I'll update renderSite to NOT call renderBackButton directly, but maybe add 'backButton' to the sectionOrder?
    // Or just prepend it here if data.isSubPage? (I didn't pass isSubPage flag to data).
    
    // Let's just modify renderSections to take the data.
    
    container.innerHTML = ''; // Clear existing content

    order.forEach((key, index) => {
        const sectionData = getSectionData(key, data);
        if (!sectionData.html) return;

        // Divider Logic
        const settings = (data.sectionSettings && data.sectionSettings[key]) || {};
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

function getSectionData(key, data) {
    switch(key) {
        case 'profile':
            return { html: renderProfileImage(data), id: null };
        case 'socialLinks':
            return { html: renderLinkSection('Social Links', data.socialLinks), id: 'social-links-container' };
        case 'workLinks':
            return { html: renderLinkSection('Work', data.workLinks), id: 'work-links-container' };
        case 'publications':
            return { html: renderLinkSection('Publications', data.publications), id: 'publications-container' };
        case 'connectLinks':
            return { html: renderLinkSection(null, data.connectLinks, true), id: 'connect-container' };
        case 'footer':
            return { html: `<footer>${data.footer || ''}</footer>`, id: null };
        case 'backButton':
             return { 
                 html: `
                 <div class="links">
                    <a href="/" class="link-btn" style="max-width: 250px; --btn-color: #6c757d;">
                        <i class="fas fa-arrow-left me-2"></i> Back to Home
                    </a>
                 </div>`, 
                 id: 'back-btn' 
             };
        default:
            // Dynamic Custom Sections
            if (data[key]) {
                return { 
                    html: renderLinkSection(data[key].title, data[key].links), 
                    id: `section-${key}` 
                };
            }
            return { html: null };
    }
}

function renderProfileImage(data) {
    if (!data.profile || !data.profile.image) return '';
    return `
        <div class="profile-container">
            <img src="${data.profile.image}" alt="Profile" class="profile-img">
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
        const { title, subtitle, description, text, url, icon, customColor } = item;
        
        const hasContent = title || subtitle || description;
        const btnStyle = customColor ? `style="--btn-color: ${customColor}"` : '';
        const btnClass = customColor ? 'link-btn custom-color' : 'link-btn';
        
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
                    <a href="${url}" class="${btnClass}" ${btnStyle}>${text}</a>
                </div>` : ''}
            `;
        } else {
            // Simple link/icon
            if (icon) {
                 linksBuffer.push(`<a href="${url}" target="_blank"><i class="${icon}"></i></a>`);
            } else if (text && url) {
                 linksBuffer.push(`<a href="${url}" class="${btnClass}" ${btnStyle} target="_blank">${text}</a>`);
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
        if (btn.classList.contains('custom-color')) return;

        const color = colors[index % colors.length];
        btn.style.setProperty('--btn-color', color);
        // Reset legacy inline styles
        btn.style.backgroundColor = '';
        btn.style.borderColor = '';
        btn.style.borderBottom = '';
        btn.style.boxShadow = '';
        if (!btn.classList.contains('link-btn')) btn.classList.add('link-btn');
    });
}

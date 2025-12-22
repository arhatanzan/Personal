window.initCarousel = async function() {
  // --- CONFIGURATION ---
  const urlParams = new URLSearchParams(window.location.search);
  const HOST_URL = urlParams.get('base') || "https://kaifabbas.com";

  // Detect if we are running from within the /games/ subdirectory or the root
  const isGamesFolder = window.location.pathname.includes('/games/');
  const dbPath = isGamesFolder ? '../db/products.json' : 'db/products.json';

  let PRODUCTS = [];
  try {
    const response = await fetch(dbPath);
    if (!response.ok) throw new Error('Failed to load products');
    const data = await response.json();
    PRODUCTS = data.map(item => ({
      id: item.id,
      title: item.title,
      category: item.category,
      summary: item.summary,
      imageUrl: item.imageUrl,
      url: item.productUrl,
      icon: item.thumbText
    }));
  } catch (error) {
    console.error('Error loading products:', error);
    // Fallback or empty
    PRODUCTS = [];
  }

  const track = document.getElementById('track');
  if (!track) {
    console.error("Carousel track not found!");
    return;
  }

  function toKebab(path) {
    if (!path) return path;
    let p = path.replace(/^\//, '');
    p = p.replace(/\.html?$/i, '');
    // Ensure kebab-case
    p = p.replace(/[_\s]+/g, '-').replace(/-+/g, '-').toLowerCase();
    return '/' + p;
  }

  function toLocalPath(path) {
    if (!path) return path;
    let p = path.replace(/^\//, '');
    // Ensure we don't double add .html
    if (!p.match(/\.html?$/i)) {
        p += '.html';
    }
    
    if (isGamesFolder) {
        return p;
    } else {
        return 'games/' + p;
    }
  }

  function shouldUseKebab() {
    const baseParam = urlParams.get('base');
    if (baseParam) return baseParam.indexOf('kaifabbas.com') !== -1;
    try { return location.hostname.indexOf('kaifabbas.com') !== -1; } catch(e) { return false; }
  }

  const useKebab = shouldUseKebab();

  function buildHref(p) {
    if (useKebab) {
      return (HOST_URL.replace(/\/$/, '') || '') + toKebab(p.url);
    }
    return toLocalPath(p.url);
  }

  function renderCarousel() {
    // Simplified: No infinite loop, just render the products once
    const linkTarget = useKebab ? '_top' : '_self';
    
    if (PRODUCTS.length === 0) {
        track.innerHTML = '<div class="col-12 text-center text-muted">No games found.</div>';
        return;
    }

    track.innerHTML = PRODUCTS.map(p => `
      <div class="col-auto">
        <a href="${buildHref(p)}" class="card c-card text-decoration-none h-100 p-3" target="${linkTarget}">
          <div class="c-thumb mb-3">
            ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" loading="lazy">` : p.icon}
          </div>
          <div class="d-flex flex-column flex-grow-1">
            <span class="c-cat mb-1">${p.category}</span>
            <h3 class="card-title h5 fw-bold mb-2 text-dark">${p.title}</h3>
            <p class="card-text c-desc mb-3 flex-grow-1">${p.summary}</p>
            <div class="btn c-btn w-100 mt-auto py-2">Play Now</div>
          </div>
        </a>
      </div>
    `).join('');
  }

  renderCarousel();

  // Navigation Logic
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const getScrollAmount = () => {
      const item = track.firstElementChild;
      if (!item) return 300; // fallback
      const style = window.getComputedStyle(track);
      const gap = parseFloat(style.gap) || 0;
      return item.offsetWidth + gap;
  };

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
  }
};

// Auto-init if not loaded dynamically (fallback)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if(document.getElementById('track')) window.initCarousel();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        if(document.getElementById('track')) window.initCarousel();
    });
}

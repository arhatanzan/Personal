window.initCarousel = async function() {
  // --- CONFIGURATION ---
  const urlParams = new URLSearchParams(window.location.search);
  const HOST_URL = urlParams.get('base') || "https://kaifabbas.com";

  let PRODUCTS = [];
  try {
    const response = await fetch('../db/products.json');
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
    p = p.replace(/[_\s]+/g, '-').replace(/-+/g, '-').toLowerCase();
    return '/' + p;
  }

  function toOriginal(path) {
    if (!path) return path;
    let p = path.replace(/^\//, '');
    p = p.replace(/\.html?$/i, '');
    p = p.replace(/[-\s]+/g, '_').replace(/_+/g, '_').toLowerCase();
    return '/' + p + '.html';
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
    return toOriginal(p.url);
  }

  function renderCarousel() {
    const loopFactor = 6;
    let infiniteList = [];
    for (let i = 0; i < loopFactor; i++) {
      infiniteList = infiniteList.concat(PRODUCTS);
    }

    const linkTarget = useKebab ? '_top' : '_self';
    track.innerHTML = infiniteList.map(p => `
      <a href="${buildHref(p)}" class="card c-card text-decoration-none" target="${linkTarget}">
        <div class="card-img-top c-thumb p-3">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.title}" loading="lazy">` : p.icon}
        </div>
        <div class="card-body d-flex flex-column p-3">
          <span class="c-cat mb-1">${p.category}</span>
          <h3 class="card-title h5 fw-bold mb-2 text-dark">${p.title}</h3>
          <p class="card-text c-desc mb-3 flex-grow-1">${p.summary}</p>
          <div class="btn c-btn w-100 mt-auto">Play Now</div>
        </div>
      </a>
    `).join('');
  }

  renderCarousel();

  // Navigation Logic
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const card = track.querySelector('.c-card');
      if (!card) return;
      const gap = 20;
      const scrollAmount = card.offsetWidth + gap;
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const card = track.querySelector('.c-card');
      if (!card) return;
      const gap = 20;
      const scrollAmount = card.offsetWidth + gap;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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

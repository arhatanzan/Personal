(function () {
  "use strict";
  const SITE_BASE =
    (window.SITE_BASE_URL && window.SITE_BASE_URL.replace(/\/$/, "")) ||
    location.origin.replace(/\/$/, "");
  const LISTING_PATH = "/products"; // relative path for listing pages in sitemap/canonical (change if needed)

  /*
THEME HELPER
If you want to change colors at runtime without editing the CSS, call
  setTheme({ '--accent': '#ff6600', '--navy': '#002244' });
It updates CSS custom properties on :root and keeps the file self-contained.
*/
  function setTheme(vars) {
    if (!vars || typeof vars !== "object") return;
    const root = document.documentElement;
    Object.keys(vars).forEach((k) => {
      try {
        root.style.setProperty(k, vars[k]);
      } catch (e) {}
    });
  }

  // PRODUCTS will be loaded from JSON
  let PRODUCTS = [];

  fetch('db/products.json')
    .then(response => response.json())
    .then(data => {
      PRODUCTS = data;
      setupFilters();
      applyFilters();
    })
    .catch(err => console.error('Error loading products:', err));

  /* DOM refs (cached) */
  const refs = {
    grid: document.getElementById("grid"),
    empty: document.getElementById("empty"),
    paginationWrap: document.getElementById("pagination"),
    categorySelect: document.getElementById("categorySelect"),
    priceSelect: document.getElementById("priceSelect"),
    pageSizeSelect: document.getElementById("pageSizeSelect"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    resetBtn: document.getElementById("resetBtn"),
    goTopBtn: document.getElementById("goTopBtn"),
    pageH1: document.getElementById("pageH1"),
    pageDescEl: document.getElementById("pageDesc"),
  };

  // Note: use `refs.*` for DOM access throughout the file.

  let filteredProducts = []; // Holds products after filtering, before pagination.
  let currentPage = 1;
  let currentPageSize = "all";
  

  /* --- HELPERS --- */
  function escapeHtml(s) {
    return (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function cap(s) {
    return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
  }
  /**
   * Returns a short summary for the card's front face.
   * Prefers the explicit `summary` field, otherwise derives from `description`.
   */
  function getSummary(p) {
    if (!p) return "";
    if (p.summary && String(p.summary).trim())
      return String(p.summary).trim();
    const s = (p.description || "").toString().trim();
    if (!s) return "";
    // Try to use the first sentence if it's a reasonable length.
    const first = s.split(/[\.?!]\s/)[0];
    if (first && first.length <= 160)
      return first + (/[\.?!]$/.test(first) ? "" : "...");
    // Fallback to a simple truncation.
    return s.length > 140 ? s.slice(0, 140).trim() + "..." : s;
  }

  /* --- SEO & METADATA --- */
  // SEO functions moved to seo.js

  /* --- UI RENDERING & INTERACTIONS --- */

  function getFileType(prod) {
    if (prod.type === "external") return "LINK";
    if (prod.fileName) return prod.fileName.split(".").pop().toUpperCase();
    return "FILE";
  }
  function createDemoFileBlob(p) {
    const txt = `${p.title}\n---\n${
      p.description
    }\nGenerated: ${new Date().toLocaleString()}`;
    return new Blob([txt], { type: "text/plain" });
  }
  function renderPrimaryButton(prod) {
    if (prod.type === "download") {
      return `<a class="btn btn-primary btn-sm w-100 download-btn" data-id="${
        prod.id
      }" href="#" aria-label="Download ${escapeHtml(
        prod.title
      )}">Download</a>`;
    }
    if (prod.type === "external") {
      const label = prod.buttonLabel || "Buy Now";
      const href = prod.productUrl || "#";
      return `<a class="btn btn-primary btn-sm w-100 download-btn" href="${escapeHtml(
        href
      )}" target="_blank" rel="noopener" aria-label="${escapeHtml(
        label
      )}">${escapeHtml(label)}</a>`;
    }
    return "";
  }
  /**
   * Determines if a product is 'FREE' or 'PAID' based on its price and discount.
   */
  function getPriceLabelText(prod) {
    function toNumber(s) {
      if (s === undefined || s === null || s === "") return NaN;
      const n = Number(String(s).replace(/,/g, ""));
      return isNaN(n) ? NaN : n;
    }
    const orig = toNumber(prod.originalPrice);
    const disc =
      typeof prod.discountPercent === "number"
        ? prod.discountPercent
        : prod.discountPercent
        ? Number(prod.discountPercent)
        : NaN;

    if (!isNaN(orig)) {
      if (!isNaN(disc)) {
        const safeDisc = Math.max(0, Math.min(100, disc));
        const priceNow = +(orig * (1 - safeDisc / 100)).toFixed(2);
        if (priceNow === 0 || safeDisc === 100) return "FREE";
        return "PAID";
      }
      return orig === 0 ? "FREE" : "PAID";
    }

    // Return empty if price is not specified
    return "";
  }

  /**
   * Renders a 'FREE' or 'PAID' badge based on the product's price.
   */
  function renderPriceLabel(prod) {
    const txt = getPriceLabelText(prod);
    if (txt === "FREE") return `<span class="badge bg-dark">FREE</span>`;
    if (txt === "PAID") return `<span class="badge bg-danger">PAID</span>`;
    if (txt) return `<span class="badge bg-light text-dark border">${escapeHtml(txt)}</span>`;
    return "";
  }

  /**
   * Formats a numeric value as a currency string (e.g., ₹1,234.56).
   * Defaults to INR but supports other currency codes.
   */
  function formatCurrency(v, currency) {
    const curr = (currency && String(currency).trim()) || "INR";
    const n = Number(String(v).replace(/,/g, ""));
    if (isNaN(n)) {
      try {
        // Show zero in the requested currency format.
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: curr,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(0);
      } catch (e) {
        return curr === "INR" ? "₹0.00" : `${curr}0.00`;
      }
    }
    try {
      // Use a locale that matches the currency for better formatting.
      const locale =
        curr === "INR" ? "en-IN" : curr === "USD" ? "en-US" : "en-US";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: curr,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(n);
    } catch (e) {
      // Fallback for unsupported currency codes.
      if (curr === "INR") return "₹" + n.toFixed(2);
      return curr + " " + n.toFixed(2);
    }
  }

  /**
   * Renders the price block, showing the current price and any applicable discount.
   */
  function renderPriceBlock(p) {
    function toNumber(s) {
      if (s === undefined || s === null || s === "") return NaN;
      const n = Number(String(s).replace(/,/g, ""));
      return isNaN(n) ? NaN : n;
    }

    const origNum = toNumber(p.originalPrice);
    const disc =
      typeof p.discountPercent === "number"
        ? p.discountPercent
        : p.discountPercent
        ? Number(p.discountPercent)
        : NaN;
    const curr = p.priceCurrency || "INR";
    // Case 1: Valid original price and discount percentage.
    if (!isNaN(origNum) && !isNaN(disc)) {
      const safeDisc = Math.max(0, Math.min(100, disc));
      const priceNowNum = +(origNum * (1 - safeDisc / 100)).toFixed(2);
      // If 100% off, show as FREE.
      if (safeDisc === 100) {
        const origHtml = `<span class="text-decoration-line-through text-muted me-2">${escapeHtml(
          formatCurrency(origNum, curr)
        )}</span>`;
        return `<div class="d-flex align-items-center small">${origHtml}<span class="fw-bold text-navy me-2">FREE</span><span class="badge bg-danger">${safeDisc}% OFF</span></div>`;
      }
      // Otherwise, show discounted price.
      const origHtml = `<span class="text-decoration-line-through text-muted me-2">${escapeHtml(
        formatCurrency(origNum, curr)
      )}</span>`;
      const nowHtml = `<span class="fw-bold text-navy me-2">${escapeHtml(
        formatCurrency(priceNowNum, curr)
      )}</span>`;
      return `<div class="d-flex align-items-center small">${origHtml}${nowHtml}<span class="badge bg-danger">${safeDisc}% OFF</span></div>`;
    }

    // Case 2: Valid original price but no discount.
    if (!isNaN(origNum) && (isNaN(disc) || disc === 0)) {
      return `<div class="d-flex align-items-center small"><span class="fw-bold text-navy">${escapeHtml(
        formatCurrency(origNum, curr)
      )}</span></div>`;
    }

    // Case 3: No reliable pricing info.
    return "";
  }
  /**
   * Renders the list of products for the current page.
   * Handles pagination logic and updates the grid.
   */
  function renderProductsPage(list, page, pageSize) {
    refs.grid.innerHTML = "";

    if (!list.length) {
      refs.empty.style.display = "block";
      refs.paginationWrap.style.display = "none";
      const siteBase = SITE_BASE;
      const listingPath = LISTING_PATH || LISTING_PATH || window.location.pathname;
      const currentFilters = {
        query: refs.searchInput.value,
        category: refs.categorySelect.value,
        price: refs.priceSelect.value,
      };
      window.SEO.updateTitleAndMeta(siteBase, currentFilters);
      window.SEO.injectStructuredData(siteBase, []);
      window.SEO.updateCanonicalAndPaginationLinks(
        siteBase,
        listingPath,
        1,
        1,
        "all"
      );
      return;
    }
    refs.empty.style.display = "none";

    let pageNum = parseInt(page, 10) || 1;
    let size = pageSize === "all" ? list.length : parseInt(pageSize, 10);
    const totalItems = list.length;
    const totalPages =
      size === 0 ? 1 : Math.max(1, Math.ceil(totalItems / size));
    if (pageNum > totalPages) pageNum = totalPages;
    const start = pageSize === "all" ? 0 : (pageNum - 1) * size;
    const end =
      pageSize === "all" ? totalItems : Math.min(totalItems, start + size);
    const slice = list.slice(start, end);

    slice.forEach((p) => {
      const col = document.createElement("div");
      col.className = "col";

      const card = document.createElement("div");
      card.className = "card h-100 border-0 bg-transparent";

      // Image fallback: use `imageUrl` if present, otherwise show `thumbText`.
      let thumbHtml = `<div class="thumb mb-1" aria-hidden="true">${escapeHtml(
        p.thumbText
      )}</div>`;
      if (p.imageUrl) {
        const imgSrc = escapeHtml(p.imageUrl);
        thumbHtml = `<div class="thumb mb-1" data-thumb-text="${escapeHtml(
          p.thumbText
        )}"><img src="${imgSrc}" alt="${escapeHtml(
          p.title
        )} thumbnail" loading="lazy" onerror="this.dataset.failed='1'; this.style.display='none'; this.parentNode.classList.add('thumb-failed');"></div>`;
      }

      const titleHref = p.seoUrl || p.productUrl || "";
      const titleLink = titleHref
        ? `<a href="${escapeHtml(titleHref)}" class="text-decoration-none text-navy">${escapeHtml(p.title)}</a>`
        : `<span class="text-navy">${escapeHtml(p.title)}</span>`;

      const priceLabel = getPriceLabelText(p);

      // The card's inner structure contains front and back faces for the flip effect.
      card.innerHTML = `
    <div class="card-inner">
      <div class="card-front shadow-sm">
        ${thumbHtml}
        <div class="d-flex align-items-start mb-1" style="min-height: 2.2rem;">
            <h6 class="card-title fw-bold mb-0 lh-sm" style="font-size: 0.95rem;">${titleLink}</h6>
        </div>
        <div class="d-flex flex-wrap gap-1 mb-1">
          <span class="badge bg-light text-dark border fw-normal" style="font-size: 0.7rem;">${escapeHtml(p.category)}</span>
          <span class="badge bg-light text-dark border fw-normal" style="font-size: 0.7rem;">${escapeHtml(getFileType(p))}</span>
          ${renderPriceLabel(p)}
        </div>
        ${renderPriceBlock(p)}
        <p class="card-text text-muted small mt-1 mb-1 flex-grow-1" style="font-size: 0.8rem; line-height: 1.3;">${escapeHtml(getSummary(p))}</p>
        <div class="mt-auto d-flex gap-2 align-items-center w-100">
          <div class="flex-grow-1">${renderPrimaryButton(p)}</div>
          <div><button class="btn btn-outline-secondary btn-sm details-btn" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" data-id="${
            p.id
          }" aria-label="Details for ${escapeHtml(
        p.title
      )}">Details</button></div>
        </div>
      </div>
      <div class="card-back shadow-sm">
        <h6 class="card-title fw-bold text-navy mb-2" style="font-size: 0.95rem;">Description</h6>
        <div class="card-text small flex-grow-1 overflow-auto custom-scrollbar" style="font-size: 0.8rem; line-height: 1.3;">
            ${escapeHtml(p.description)}
        </div>
        <div class="mt-2 d-flex gap-2 align-items-center w-100">
          <div class="flex-grow-1">${renderPrimaryButton(p)}</div>
          <div><button class="btn btn-outline-secondary btn-sm back-btn" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" data-id="${
            p.id
          }" aria-label="Back to product">Back</button></div>
        </div>
      </div>
    </div>
  `;
      col.appendChild(card);
      refs.grid.appendChild(col);

      // Handle broken image links gracefully by showing the thumb text.
      const img = card.querySelector(".thumb img");
      if (img) {
        img.addEventListener("error", () => {
          const thumb = card.querySelector(".thumb");
          thumb.innerHTML = thumb.dataset.thumbText || p.thumbText;
        });
        if (img.dataset && img.dataset.failed === "1") {
          const thumb = card.querySelector(".thumb");
          thumb.innerHTML = thumb.dataset.thumbText || p.thumbText;
        }
      }
    });

    renderPagination(totalItems, pageNum, totalPages, pageSize);

    // Update all SEO and metadata after rendering.
    const siteBase = window.location.origin;
    const listingPath = window.location.pathname;
    const currentFilters = {
      query: refs.searchInput.value,
      category: refs.categorySelect.value,
      price: refs.priceSelect.value,
    };
    window.SEO.updateTitleAndMeta(siteBase, currentFilters);
    window.SEO.injectStructuredData(siteBase, slice);
    window.SEO.updateCanonicalAndPaginationLinks(
      siteBase,
      listingPath,
      pageNum,
      totalPages,
      pageSize
    );

    // Update the visible H1 and description only if auto-update is enabled.
    // To enable, set `data-auto="true"` on the respective element.
    const shouldAutoH1 = refs.pageH1 && refs.pageH1.dataset.auto === "true";
    const shouldAutoDesc =
      refs.pageDescEl && refs.pageDescEl.dataset.auto === "true";

    if (shouldAutoH1) {
      let h = "Digital & Physical Products";
      if (refs.categorySelect.value)
        h = `${cap(refs.categorySelect.value)} — ${h}`;
      if (refs.searchInput.value)
        h = `Results for "${refs.searchInput.value}" — ${h}`;
      refs.pageH1.textContent = h;
    }

    if (shouldAutoDesc) {
      refs.pageDescEl.textContent = document.title; // Use the dynamic title as a sub-header.
    }

    // After rendering, normalize card heights to the tallest front face.
    requestAnimationFrame(adjustCardHeights);
  }

  /**
   * Renders pagination controls based on the total number of items and pages.
   */
  function renderPagination(totalItems, current, totalPages, pageSize) {
    if (pageSize === "all" || totalPages <= 1) {
      refs.paginationWrap.style.display = "none";
      return;
    }
    refs.paginationWrap.style.display = "flex";
    refs.paginationWrap.className = "d-flex justify-content-center align-items-center flex-wrap gap-3 mt-5";
    refs.paginationWrap.innerHTML = "";

    const ul = document.createElement("ul");
    ul.className = "pagination mb-0";

    // Helper to create page item
    const createItem = (text, page, disabled = false, active = false) => {
        const li = document.createElement("li");
        li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
        const a = document.createElement("button");
        a.className = "page-link";
        a.textContent = text;
        if (!disabled && !active) {
            a.addEventListener("click", () => {
                currentPage = page;
                refreshPage();
            });
        }
        li.appendChild(a);
        return li;
    };

    ul.appendChild(createItem("Prev", current - 1, current <= 1));

    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        ul.appendChild(createItem(i, i, false, i === current));
      }
    } else {
      ul.appendChild(createItem(1, 1, false, 1 === current));
      if (current > 4) {
         const li = document.createElement("li");
         li.className = "page-item disabled";
         li.innerHTML = '<span class="page-link">...</span>';
         ul.appendChild(li);
      }
      const start = Math.max(2, current - 2);
      const end = Math.min(totalPages - 1, current + 2);
      for (let i = start; i <= end; i++) {
        ul.appendChild(createItem(i, i, false, i === current));
      }
      if (current < totalPages - 3) {
         const li = document.createElement("li");
         li.className = "page-item disabled";
         li.innerHTML = '<span class="page-link">...</span>';
         ul.appendChild(li);
      }
      ul.appendChild(createItem(totalPages, totalPages, false, totalPages === current));
    }

    ul.appendChild(createItem("Next", current + 1, current >= totalPages));
    refs.paginationWrap.appendChild(ul);

    // Info text
    const info = document.createElement("div");
    info.className = "text-muted small";
    info.textContent = `Page ${current} of ${totalPages} • ${totalItems} items`;
    refs.paginationWrap.appendChild(info);
  }

  /* --- DATA FILTERING & SORTING --- */

  /**
   * Filters and sorts the products based on the current UI controls.
   */
  function applyFilters() {
    const q = refs.searchInput.value.toLowerCase().trim();
    const cat = refs.categorySelect.value;
    const price = refs.priceSelect.value;
    const sort = refs.sortSelect.value;

    filteredProducts = PRODUCTS.filter((p) => {
      const m1 = !cat || p.category === cat;
      const m2 =
        !price || (getPriceLabelText(p) || "").toLowerCase() === price;
      const m3 =
        !q ||
        (p.title + p.description + p.category + (p.seoUrl || ""))
          .toLowerCase()
          .includes(q);
      return m1 && m2 && m3;
    });

    if (sort === "az")
      filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za")
      filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    // 'new' is the default, no sort needed as data is pre-sorted.

    currentPage = 1;
    refreshPage();
  }
  /**
   * Refreshes the product grid with the current page and page size.
   */
  function refreshPage() {
    currentPageSize = refs.pageSizeSelect.value || "all";
    renderProductsPage(filteredProducts, currentPage, currentPageSize);
  }

  /* --- EVENT LISTENERS --- */
  refs.searchInput.addEventListener("input", applyFilters);
  refs.categorySelect.addEventListener("change", applyFilters);
  refs.priceSelect.addEventListener("change", applyFilters);
  refs.sortSelect.addEventListener("change", applyFilters);
  refs.pageSizeSelect.addEventListener("change", () => {
    currentPage = 1;
    refreshPage();
  });
  refs.resetBtn.addEventListener("click", () => {
    refs.searchInput.value = "";
    refs.categorySelect.value = "";
    refs.priceSelect.value = "";
    refs.sortSelect.value = "new";
    refs.pageSizeSelect.value = "all";
    currentPage = 1;
    applyFilters();
  });

  /**
   * Initiates a file download for a given product ID.
   * For "download" type, it creates a blob; for "external", it opens the URL.
   */
  function startDownloadById(id, triggerEl) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    // Visual feedback: change clicked button to "Downloaded" temporarily
    const btn = triggerEl || (document.querySelector(`.download-btn[data-id="${CSS.escape(id)}"]`));
    const revertBtn = () => {
      if (btn) {
        btn.textContent = p.type === "external" ? (p.buttonLabel || "Buy Now") : "Download";
        btn.disabled = false;
        btn.classList.remove("downloaded");
      }
    };
    if (p.productUrl) {
      const a = document.createElement("a");
      a.href = p.productUrl;
      a.download = p.fileName || "";
      a.click();
      if (btn) {
        btn.textContent = "Downloaded";
        btn.disabled = true;
        btn.classList.add("downloaded");
        setTimeout(revertBtn, 2500);
      }
      return;
    }
    const blob = createDemoFileBlob(p);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = p.fileName || p.title + ".txt";
    a.click();
    if (btn) {
      btn.textContent = "Downloaded";
      btn.disabled = true;
      btn.classList.add("downloaded");
      setTimeout(revertBtn, 2500);
    }
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /**
   * Flips a product card to show its back face, and flips back any other card.
   */
  function flipCard(cardEl) {
    if (!cardEl) return;
    // Close any other card that is already flipped.
    document.querySelectorAll(".card.is-flipped").forEach((c) => {
      if (c !== cardEl) c.classList.remove("is-flipped");
    });
    // Toggle the flip state of the target card.
    const willFlip = !cardEl.classList.contains("is-flipped");
    if (willFlip) cardEl.classList.add("is-flipped");
    else cardEl.classList.remove("is-flipped");
  }

  // Delegated event listener for the product grid to handle card interactions.
  refs.grid.addEventListener("click", (e) => {
    const dl = e.target.closest(".download-btn");
    const det = e.target.closest(".details-btn");
    const back = e.target.closest(".back-btn");

    if (dl && dl.dataset.id) {
      e.preventDefault();
      startDownloadById(dl.dataset.id, dl);
      return;
    }

    if (back) {
      const card = back.closest(".card");
      if (card) card.classList.remove("is-flipped");
      return;
    }

    if (det) {
      const card = det.closest(".card");
      if (card) flipCard(card);
      // Ensure height persists after flip; height is based on front but uniform across.
      requestAnimationFrame(adjustCardHeights);
      return;
    }
  });

  /* Go To Top Button */
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) refs.goTopBtn.classList.add("show");
    else refs.goTopBtn.classList.remove("show");
  });
  refs.goTopBtn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  /* --- UTILITIES --- */



  /* Keyboard shortcut: CTRL + SHIFT + S to generate and show the sitemap. */
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
      const xml = window.SEO.buildSitemapXml(SITE_BASE, PRODUCTS);
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);

      const win = window.open();
      win.document.write(`
    <pre>${xml.replace(/</g, "&lt;")}</pre>
    <a href="${url}" download="sitemap.xml">Download sitemap.xml</a>
    <p>Upload this file to your site root (/sitemap.xml)</p>
  `);
      win.document.close();

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  });

  /* --- INITIALIZATION --- */

  /**
   * IIFE to set up initial state: populates filters and ensures data integrity.
   */
  function setupFilters() {
    window.SEO.ensureSeoUrls(PRODUCTS);
    const cats = [...new Set(PRODUCTS.map((p) => p.category))].sort();
    cats.forEach((c) => {
      const op = document.createElement("option");
      op.value = c;
      op.textContent = c;
      refs.categorySelect.appendChild(op);
    });

    const prices = [
      ...new Set(
        PRODUCTS.map((p) => (getPriceLabelText(p) || "unknown").toLowerCase())
      ),
    ]
      .filter((p) => p !== "unknown")
      .sort();
    prices.forEach((pv) => {
      const op = document.createElement("option");
      op.value = pv;
      op.textContent = cap(pv);
      refs.priceSelect.appendChild(op);
    });


  }

  /* INITIAL RENDER */
  // applyFilters(); // Moved to fetch callback
  // Expose a minimal API to the global scope for runtime theme changes.
  window.setTheme = setTheme;

  /**
   * Measures all visible cards' front faces and sets a uniform height
   * equal to the tallest front content. Back face will scroll within this height.
   */
  function adjustCardHeights() {
    const cards = Array.from(document.querySelectorAll(".card"));
    if (!cards.length) return;
    
    // Reset inline heights to re-measure accurately.
    cards.forEach((c) => {
      c.style.height = "";
      const inner = c.querySelector(".card-inner");
      if (inner) inner.style.height = "";
    });

    let max = 0;
    
    // Measure the front face in-place by disabling transform temporarily.
    cards.forEach((card) => {
      const inner = card.querySelector(".card-inner");
      const front = card.querySelector(".card-front");
      if (!inner || !front) return;

      // Temporarily make front relative to measure its natural height
      const prevPos = front.style.position;
      const prevHeight = front.style.height;
      front.style.position = "relative";
      front.style.height = "auto";

      const h = front.scrollHeight;
      if (h > max) max = h;

      // Restore
      front.style.position = prevPos;
      front.style.height = prevHeight;
    });

    if (max <= 0) max = 400; // Fallback min height

    // Apply uniform height to all cards and their inner containers.
    cards.forEach((card) => {
      card.style.height = max + "px";
      const inner = card.querySelector(".card-inner");
      if (inner) inner.style.height = "100%";
    });
  }

  // Recalculate on resize and orientation changes.
  window.addEventListener("resize", () =>
    requestAnimationFrame(adjustCardHeights)
  );
  window.addEventListener("orientationchange", () =>
    requestAnimationFrame(adjustCardHeights)
  );
  // Recalculate when images inside thumbs load (affects front height)
  document.addEventListener(
    "load",
    (ev) => {
      const t = ev.target;
      if (t && t.tagName === "IMG" && t.closest(".thumb")) {
        requestAnimationFrame(adjustCardHeights);
      }
    },
    true
  );
})();

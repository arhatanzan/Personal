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

  /**
   * Ensures a <meta> tag exists in the <head> with the specified name/property and value.
   * Creates the tag if it doesn't exist, otherwise updates it.
   * @param {string} nameOrProp - The meta tag's `name` or `property` attribute.
   * @param {string} value - The value for the `content` attribute.
   * @param {boolean} isProperty - Set to true if `nameOrProp` is a `property` (e.g., 'og:title').
   */
  function ensureMetaTag(nameOrProp, value, isProperty = false) {
    let selector = isProperty
      ? `meta[property="${nameOrProp}"]`
      : `meta[name="${nameOrProp}"]`;
    let m = document.head.querySelector(selector);
    if (!m) {
      m = document.createElement("meta");
      if (isProperty) m.setAttribute("property", nameOrProp);
      else m.setAttribute("name", nameOrProp);
      document.head.appendChild(m);
    }
    m.setAttribute("content", value || "");
  }

  /**
   * Ensures a <link> tag with a given `rel` attribute exists and sets its `href`.
   * @param {string} rel - The `rel` attribute value (e.g., 'canonical').
   * @param {string} href - The `href` attribute value.
   */
  function ensureLinkRel(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href || "");
  }

  /**
   * Updates the page title and meta tags based on current filters and search query.
   * This makes the page SEO-friendly and improves user context.
   */
  function updateTitleAndMeta() {
    const parts = [];
    const cat = refs.categorySelect.value;
    const price = refs.priceSelect.value;
    const q = refs.searchInput.value.trim();

    if (q) parts.push(`"${q}"`);
    if (cat) parts.push(cap(cat));
    if (price) parts.push(cap(price));
    parts.push("Digital & Physical Products");
    const title = parts.join(" | ");
    document.title = title;

    const descParts = [];
    if (cat) descParts.push(`${cap(cat)} products`);
    if (price) descParts.push(`${cap(price)} items`);
    if (q) descParts.push(`Search results for "${q}"`);
    descParts.push("Instant downloads, external store links, and templates.");
    const description = descParts.join(" • ");

    // Update standard and social media meta tags for SEO.
    ensureMetaTag("description", description);
    ensureMetaTag("robots", "index,follow");
    ensureMetaTag("twitter:card", "summary_large_image");
    ensureMetaTag("twitter:title", title);
    ensureMetaTag("twitter:description", description);
    ensureMetaTag("og:title", title, true);
    ensureMetaTag("og:description", description, true);
    ensureMetaTag("og:type", "website", true);
    ensureMetaTag(
      "og:site_name",
      document.location.hostname || SITE_BASE,
      true
    );
    // Set a fallback Open Graph/Twitter image.
    ensureMetaTag("og:image", `${SITE_BASE}/assets/og-products.jpg`, true);
    ensureMetaTag("twitter:image", `${SITE_BASE}/assets/og-products.jpg`);
  }

  /**
   * Updates canonical, prev, and next link tags for paginated results.
   * This helps search engines understand the paginated structure of the content.
   */
  function updateCanonicalAndPaginationLinks(pageNum, totalPages, pageSize) {
    const urlBase =
      SITE_BASE +
      (LISTING_PATH.startsWith("/") ? LISTING_PATH : "/" + LISTING_PATH);
    const params = new URLSearchParams();
    if (pageNum && pageNum > 1) params.set("page", pageNum);
    if (pageSize && pageSize !== "all") params.set("pageSize", pageSize);
    const canonicalHref = params.toString()
      ? `${urlBase}?${params.toString()}`
      : urlBase;

    ensureLinkRel("canonical", canonicalHref);

    // Set or remove 'prev' link
    if (pageNum > 1) {
      const prevParams = new URLSearchParams();
      const prevPage = pageNum - 1;
      if (prevPage > 1) prevParams.set("page", prevPage);
      if (pageSize && pageSize !== "all")
        prevParams.set("pageSize", pageSize);
      ensureLinkRel(
        "prev",
        prevParams.toString()
          ? `${urlBase}?${prevParams.toString()}`
          : urlBase
      );
    } else {
      const prevEl = document.head.querySelector('link[rel="prev"]');
      if (prevEl) prevEl.remove();
    }

    // Set or remove 'next' link
    if (pageNum < totalPages) {
      const nextParams = new URLSearchParams();
      const nextPage = pageNum + 1;
      if (nextPage > 1) nextParams.set("page", nextPage);
      if (pageSize && pageSize !== "all")
        nextParams.set("pageSize", pageSize);
      ensureLinkRel(
        "next",
        nextParams.toString()
          ? `${urlBase}?${nextParams.toString()}`
          : urlBase
      );
    } else {
      const nextEl = document.head.querySelector('link[rel="next"]');
      if (nextEl) nextEl.remove();
    }
  }

  /**
   * Injects JSON-LD structured data for products into the page header.
   * This helps search engines understand product details like name, price, and offers.
   */
  function injectStructuredData() {
    const items = PRODUCTS.map((p) => {
      const node = {
        "@type": "Product",
        name: p.title,
        description: p.description,
      };

      // Use the SEO-friendly URL if available.
      const urlSource = p.seoUrl || p.productUrl;
      if (urlSource) {
        node.url = urlSource.startsWith("http")
          ? urlSource
          : SITE_BASE +
            (urlSource.startsWith("/") ? urlSource : "/" + urlSource);
      }
      if (p.imageUrl)
        node.image = p.imageUrl.startsWith("http")
          ? p.imageUrl
          : SITE_BASE +
            (p.imageUrl.startsWith("/") ? p.imageUrl : "/" + p.imageUrl);

      // Safely parse price and discount to generate structured data for offers.
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

      if (!isNaN(origNum)) {
        const curr = p.priceCurrency || "INR";
        if (!isNaN(disc)) {
          const safeDisc = Math.max(0, Math.min(100, disc));
          const priceNowNum = +(origNum * (1 - safeDisc / 100)).toFixed(2);
          node.offers = {
            "@type": "Offer",
            price: priceNowNum.toFixed(2),
            priceCurrency: p.priceCurrency || "INR",
            availability: "https://schema.org/InStock",
          };
          // Also include the original price for context.
          node.priceSpecification = {
            "@type": "PriceSpecification",
            priceCurrency: p.priceCurrency || "INR",
            price: origNum.toFixed(2),
          };
        } else {
          node.offers = {
            "@type": "Offer",
            price: origNum.toFixed(2),
            priceCurrency: p.priceCurrency || "INR",
            availability: "https://schema.org/InStock",
          };
          node.priceSpecification = {
            "@type": "PriceSpecification",
            priceCurrency: p.priceCurrency || "INR",
            price: origNum.toFixed(2),
          };
        }
      } else {
        // If no price, still include an Offer to indicate availability.
        node.offers = {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
        };
      }

      return node;
    });

    const graph = { "@context": "https://schema.org", "@graph": items };
    let existing = document.getElementById("__products_jsonld");
    if (existing) existing.textContent = JSON.stringify(graph);
    else {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.id = "__products_jsonld";
      s.textContent = JSON.stringify(graph);
      document.head.appendChild(s);
    }
  }

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
      return `<a class="download-btn" data-id="${
        prod.id
      }" href="#" aria-label="Download ${escapeHtml(
        prod.title
      )}">Download</a>`;
    }
    if (prod.type === "external") {
      const label = prod.buttonLabel || "Buy Now";
      const href = prod.productUrl || "#";
      return `<a class="download-btn" href="${escapeHtml(
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
    if (txt === "FREE") return `<span class="label-free">FREE</span>`;
    if (txt === "PAID") return `<span class="label-paid">PAID</span>`;
    if (txt) return `<span class="tag">${escapeHtml(txt)}</span>`;
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
        const origHtml = `<span class="price-old">${escapeHtml(
          formatCurrency(origNum, curr)
        )}</span>`;
        return `<div class="price-row">${origHtml}<span class="price-now">FREE</span><span class="discount-badge">${safeDisc}% OFF</span></div>`;
      }
      // Otherwise, show discounted price.
      const origHtml = `<span class="price-old">${escapeHtml(
        formatCurrency(origNum, curr)
      )}</span>`;
      const nowHtml = `<span class="price-now">${escapeHtml(
        formatCurrency(priceNowNum, curr)
      )}</span>`;
      return `<div class="price-row">${origHtml}${nowHtml}<span class="discount-badge">${safeDisc}% OFF</span></div>`;
    }

    // Case 2: Valid original price but no discount.
    if (!isNaN(origNum) && (isNaN(disc) || disc === 0)) {
      return `<div class="price-row"><span class="price-now">${escapeHtml(
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
      updateTitleAndMeta();
      injectStructuredData();
      updateCanonicalAndPaginationLinks(1, 1, "all");
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
      const card = document.createElement("div");
      card.className = "card";

      // Image fallback: use `imageUrl` if present, otherwise show `thumbText`.
      let thumbHtml = `<div class="thumb" aria-hidden="true">${escapeHtml(
        p.thumbText
      )}</div>`;
      if (p.imageUrl) {
        const imgSrc = escapeHtml(p.imageUrl);
        thumbHtml = `<div class="thumb" data-thumb-text="${escapeHtml(
          p.thumbText
        )}"><img src="${imgSrc}" alt="${escapeHtml(
          p.title
        )} thumbnail" loading="lazy" onerror="this.dataset.failed='1'; this.style.display='none'; this.parentNode.classList.add('thumb-failed');"></div>`;
      }

      const titleHref = p.seoUrl || p.productUrl || "";
      const titleLink = titleHref
        ? `<a href="${escapeHtml(titleHref)}">${escapeHtml(p.title)}</a>`
        : `<span>${escapeHtml(p.title)}</span>`;

      const priceLabel = getPriceLabelText(p);

      // The card's inner structure contains front and back faces for the flip effect.
      card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">
        ${thumbHtml}
        <h3 class="title">${titleLink}</h3>
        <div class="tags">
          <span class="tag">${escapeHtml(p.category)}</span>
          <span class="tag">${escapeHtml(getFileType(p))}</span>
          ${renderPriceLabel(p)}
        </div>
        ${renderPriceBlock(p)}
        <p class="desc">${escapeHtml(getSummary(p))}</p>
        <div class="card-footer">
          <div class="primary-wrap">${renderPrimaryButton(p)}</div>
          <div class="actions"><button class="details-btn" data-id="${
            p.id
          }" aria-label="Details for ${escapeHtml(
        p.title
      )}">Details</button></div>
        </div>
      </div>
      <div class="card-back" aria-hidden="true">
        <p class="desc">${escapeHtml(p.description)}</p>
        <div class="card-footer" style="margin-top:auto;">
          <div class="primary-wrap">${renderPrimaryButton(p)}</div>
          <div class="actions"><button class="back-btn" data-id="${
            p.id
          }" aria-label="Back to product">Back</button></div>
        </div>
      </div>
    </div>
  `;
      refs.grid.appendChild(card);

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
    updateTitleAndMeta();
    injectStructuredData();
    updateCanonicalAndPaginationLinks(pageNum, totalPages, pageSize);

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
    refs.paginationWrap.innerHTML = "";

    const prev = document.createElement("button");
    prev.className = "page-btn";
    prev.textContent = "Prev";
    prev.disabled = current <= 1;
    prev.addEventListener("click", () => {
      if (current > 1) {
        currentPage--;
        refreshPage();
      }
    });
    refs.paginationWrap.appendChild(prev);

    // Smart pagination: show all pages or use ellipses for large page counts.
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        const b = document.createElement("button");
        b.className = "page-btn" + (i === current ? " active" : "");
        b.textContent = i;
        b.addEventListener("click", () => {
          currentPage = i;
          refreshPage();
        });
        refs.paginationWrap.appendChild(b);
      }
    } else {
      const first = document.createElement("button");
      first.className = "page-btn";
      first.textContent = "1";
      first.addEventListener("click", () => {
        currentPage = 1;
        refreshPage();
      });
      refs.paginationWrap.appendChild(first);

      if (current > 4) {
        const dots = document.createElement("span");
        dots.textContent = "...";
        refs.paginationWrap.appendChild(dots);
      }

      const start = Math.max(2, current - 2);
      const end = Math.min(totalPages - 1, current + 2);
      for (let i = start; i <= end; i++) {
        const b = document.createElement("button");
        b.className = "page-btn" + (i === current ? " active" : "");
        b.textContent = i;
        b.addEventListener("click", () => {
          currentPage = i;
          refreshPage();
        });
        refs.paginationWrap.appendChild(b);
      }

      if (current < totalPages - 3) {
        const dots2 = document.createElement("span");
        dots2.textContent = "...";
        refs.paginationWrap.appendChild(dots2);
      }

      const last = document.createElement("button");
      last.className = "page-btn";
      last.textContent = totalPages;
      last.addEventListener("click", () => {
        currentPage = totalPages;
        refreshPage();
      });
      refs.paginationWrap.appendChild(last);
    }
    const next = document.createElement("button");
    next.className = "page-btn";
    next.textContent = "Next";
    next.disabled = current >= totalPages;
    next.addEventListener("click", () => {
      if (current < totalPages) {
        currentPage++;
        refreshPage();
      }
    });
    refs.paginationWrap.appendChild(next);

    // "Go to page" input for quick navigation.
    const goWrap = document.createElement("div");
    goWrap.className = "go-page";
    const goLabel = document.createElement("span");
    goLabel.style.color = "var(--muted)";
    goLabel.textContent = "Go to";
    const goInput = document.createElement("input");
    goInput.type = "number";
    goInput.min = 1;
    goInput.max = totalPages;
    goInput.value = current;
    goInput.setAttribute("aria-label", "Page number to go to");
    const goBtn = document.createElement("button");
    goBtn.className = "page-btn";
    goBtn.textContent = "Go";
    goBtn.addEventListener("click", () => {
      let v = parseInt(goInput.value, 10);
      if (isNaN(v)) return;
      if (v < 1) v = 1;
      if (v > totalPages) v = totalPages;
      currentPage = v;
      refreshPage();
      goBtn.blur();
    });
    goInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") goBtn.click();
    });
    goWrap.appendChild(goLabel);
    goWrap.appendChild(goInput);
    goWrap.appendChild(goBtn);
    refs.paginationWrap.appendChild(goWrap);

    const info = document.createElement("div");
    info.style.marginLeft = "8px";
    info.style.color = "var(--muted)";
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

  /**
   * Generates a sitemap.xml string from the product data.
   */
  function buildSitemapXml() {
    const domain = window.location.origin;

    const urls = PRODUCTS.map((p) => {
      const loc = p.seoUrl || p.productUrl || `${domain}/product/${p.id}`;
      return `
    <url>
      <loc>${loc}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `;
    }).join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${urls}
</urlset>`;
  }

  /* Keyboard shortcut: CTRL + SHIFT + S to generate and show the sitemap. */
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "s") {
      const xml = buildSitemapXml();
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
    /**
     * Ensures each product has a unique, SEO-friendly URL (`seoUrl`).
     * Auto-generates a slug from the title if `seoUrl` is missing.
     */
    function ensureSeoUrls() {
      function slugify(s) {
        return (s || "")
          .toString()
          .trim()
          .toLowerCase()
          .replace(/["'`]/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^[-]+|[-]+$/g, "");
      }
      const seen = new Set();
      // Pre-seed with any existing seoUrls to avoid duplicates.
      PRODUCTS.forEach((p) => {
        if (p.seoUrl) seen.add(p.seoUrl);
      });
      PRODUCTS.forEach((p) => {
        if (!p.seoUrl || !String(p.seoUrl).trim()) {
          const base =
            "/product/" + (slugify(p.title || p.id) || "product-" + p.id);
          let candidate = base;
          let i = 1;
          // Append a number if the slug already exists.
          while (seen.has(candidate)) {
            candidate = base + "-" + i;
            i++;
          }
          p.seoUrl = candidate;
          seen.add(candidate);
        }
      });
    }
    ensureSeoUrls();
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

    // Perform initial SEO and structured data injection on load.
    updateTitleAndMeta();
    injectStructuredData();
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
      const prevTransform = inner.style.transform;
      inner.style.transform = "none";
      // Ensure not flipped while measuring front
      const wasFlipped = card.classList.contains("is-flipped");
      if (wasFlipped) card.classList.remove("is-flipped");
      const h = front.scrollHeight;
      if (h > max) max = h;
      // Restore state
      if (wasFlipped) card.classList.add("is-flipped");
      inner.style.transform = prevTransform || "";
    });
    if (max <= 0) return;
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

(function () {
  "use strict";
  
  let HEIGHT_MODE = "uniform";
  window.setHeightMode = function (mode) {
    const m = String(mode || "").toLowerCase();
    if (m === "uniform" || m === "per-card") HEIGHT_MODE = m;
  };
  const SITE_BASE =
    (window.SITE_BASE_URL && window.SITE_BASE_URL.replace(/\/$/, "")) ||
    location.origin.replace(/\/$/, "");
  const LISTING_PATH = "/games";

  function setTheme(vars) {
    if (!vars || typeof vars !== "object") return;
    const root = document.documentElement;
    Object.keys(vars).forEach((k) => {
      try {
        root.style.setProperty(k, vars[k]);
      } catch (e) {}
    });
  }

  const PRODUCTS = [
    {
      id: "g1",
      summary:
        "Control a social media algorithm and balance truth, attention, and polarization.",
      buttonLabel: "Play Now",
      category: "Simulation",
      difficulty: "Low",
      description:
        "You control a social media algorithm. For each turn, decide which posts to boost and which to bury as citizens scroll their feeds.\n\nProblem: We blindly trust feeds that are optimized for profit, not truth.\nKey Learning: Algorithms naturally prioritize emotional content, especially anger, because it drives engagement more than nuanced facts.\nOutcome: Players practice spotting 'rage-bait' and engagement traps.\nNeed: Citizens need to understand how their attention is monetized and weaponized.\nGoal: Maintain high Public Info (>60%) while keeping Polarization low (<40%) before the turns run out.",
      imageUrl: "https://openmoji.org/data/color/svg/1F4ED.svg",
      productUrl: "/game_civic_feed.html",
      seoUrl: "/game/the-civic-feed",
      thumbText: "📱",
      title: "The Civic Feed",
      type: "external",
    },
    {
      id: "g2",
      summary:
        "Negotiate with rival parties to assemble a governing majority in a fractured parliament.",
      buttonLabel: "Play Now",
      category: "Strategy",
      difficulty: "High",
      description:
        "You are tasked with building a governing coalition in a fractured parliament. Negotiate with 4 rival political parties to secure enough seats to govern.\n\nProblem: Voters often struggle to understand messy post-election compromises and alliances.\nKey Learning: Ideological purity often dies in coalition math; power requires trade-offs.\nOutcome: Players grasp government instability and why alliances shift.\nNeed: Demystifying why politicians make seemingly contradictory alliances after elections.\nGoal: Secure 251+ seats (votes) and pass 5 Laws within 10 Weeks without running out of Political Capital.",
      imageUrl: "https://openmoji.org/data/color/svg/1F91D.svg",
      productUrl: "/game_coalition_builder.html",
      seoUrl: "/game/coalition-builder",
      thumbText: "🤝",
      title: "Coalition Builder",
      type: "external",
    },
    {
      id: "g3",
      summary:
        "Run the 9 PM news and juggle scandals vs. policy while keeping ratings and civic duty alive.",
      buttonLabel: "Play Now",
      category: "Management",
      difficulty: "Medium",
      description:
        "You control a 9 PM news bulletin. Each round, you have 15 seconds to pick stories (Scandals vs Policy) to fill 5 broadcast slots.\n\nProblem: Media businesses rely on capturing attention to survive, often at the cost of quality.\nKey Learning: The attention economy pushes sensationalism over substance.\nOutcome: Players learn to critically consume headlines and question why certain stories are chosen.\nNeed: Understanding the commercial pressures behind editorial choices.\nGoal: Keep both Ratings (Profit) and Civic Info (Duty) above zero for 5 full hours (rounds).",
      imageUrl: "https://openmoji.org/data/color/svg/1F4FA.svg",
      productUrl: "/game_news_desk.html",
      seoUrl: "/game/the-news-desk",
      thumbText: "📺",
      title: "The News Desk",
      type: "external",
    },
    {
      id: "g4",
      summary:
        "Allocate a strained city budget under pressure from angry sectors and tempting bribes.",
      buttonLabel: "Play Now",
      category: "Puzzle",
      difficulty: "High",
      description:
        "You are in charge of a city budget. You have ₹100 Cr but the city demands ₹160 Cr across 5 angry sectors (Roads, Schools, Health, Housing, etc.).\n\nProblem: Citizens demand world-class services but often ignore fiscal limits.\nKey Learning: Budgeting is a zero-sum game; every 'Yes' to one sector forces a 'No' to another.\nOutcome: Players understand policy trade-offs and populist pressure on representatives.\nNeed: Realizing that 'efficiency' isn't magic; resources are finite sand require hard choices.\nGoal: Achieve a Re-election Approval rating of 60%+ without being exposed for corruption (if you took bribes).",
      imageUrl: "https://openmoji.org/data/color/svg/1F4B0.svg",
      productUrl: "/game_budget_battle.html",
      seoUrl: "/game/budget-battle",
      thumbText: "💰",
      title: "Budget Battle",
      type: "external",
    },
    {
      id: "g5",
      summary:
        "Seed and track rumors through a network to tilt an election using limited influence.",
      buttonLabel: "Play Now",
      category: "Simulation",
      difficulty: "High",
      description:
        "You operate a whisper campaign during an election. Map how rumors spread through a network and choose which groups (nodes) to target.\n\nProblem: Disinformation thrives in insulated echo chambers where facts cannot penetrate.\nKey Learning: Information bubbles insulate voters from reality and can be engineered.\nOutcome: Players develop inoculation against network-based propaganda.\nNeed: Recognizing that misinformation is often designed to exploit social fault lines.\nGoal: Flip District Support to 60%+ (or higher for Dictatorship mode) within 14 Days using limited Influence.",
      imageUrl: "https://openmoji.org/data/color/svg/1F4E3.svg",
      productUrl: "/game_whisper_campaign.html",
      seoUrl: "/game/the-whisper-campaign",
      thumbText: "📢",
      title: "The Whisper Campaign",
      type: "external",
    },
  ];

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

  let filteredProducts = [];
  let currentPage = 1;
  let currentPageSize = "all";
  // remember last non-empty grid height so empty states can preserve layout
  let lastNonEmptyGridHeight = 0;

  function escapeHtml(s) {
    return (s || "").toString().replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function sanitizeHtml(input, options) {
    const allowedTags = (options && options.allowedTags) || [
      "strong",
      "em",
      "br",
      "a",
      "ul",
      "ol",
      "li",
    ];
    const allowedAttrs = (options && options.allowedAttrs) || {
      a: ["href", "title", "target", "rel"],
    };
    const normalizeTag = (t) => String(t || "").toLowerCase();
    const container = document.createElement("div");
    container.innerHTML = String(input || "");

    function escapeText(txt) {
      return String(txt || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeText(node.nodeValue);
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = normalizeTag(node.tagName);
        if (!allowedTags.includes(tag)) {
          let inner = "";
          node.childNodes.forEach((child) => {
            inner += sanitizeNode(child);
          });
          return inner;
        }

        let attrs = "";
        const allowedForTag = allowedAttrs[tag] || [];
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          const name = normalizeTag(attr.name);
          if (allowedForTag.includes(name)) {
            let val = attr.value || "";

            if (tag === "a" && name === "href") {
              const v = String(val).trim();
              const lower = v.toLowerCase();

              if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
                continue;
              }
            }

            val = String(val)
              .replace(/&/g, "&amp;")
              .replace(/"/g, "&quot;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            attrs += ` ${name}="${val}"`;
          }
        }

        if (tag === "br") return "<br>";

        let inner = "";
        node.childNodes.forEach((child) => {
          inner += sanitizeNode(child);
        });
        return `<${tag}${attrs}>${inner}</${tag}>`;
      }
      return "";
    }

    let out = "";
    container.childNodes.forEach((n) => {
      out += sanitizeNode(n);
    });
    return out;
  }

  function formatBackDescription(text) {
    if (!text) return "";
    let raw = String(text || "");

    raw = raw.replace(/\r\n|\r|\n/g, "<br>");

    const keys = ["Problem:", "Key Learning:", "Outcome:", "Need:", "Goal:"];
    keys.forEach((k) => {
      const regex = new RegExp(k.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "g");
      raw = raw.replace(regex, `<strong>${k}</strong>`);
    });

    const safe = sanitizeHtml(raw, {
      allowedTags: ["strong", "em", "br", "a", "ul", "ol", "li"],
      allowedAttrs: { a: ["href", "title", "target", "rel"] },
    });
    return safe;
  }

  function cap(s) {
    return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
  }
  function getSummary(p) {
    if (!p) return "";
    if (p.summary && String(p.summary).trim()) return String(p.summary).trim();
    const s = (p.description || "").toString().trim();
    if (!s) return "";
    const first = s.split(/[\.?!]\s/)[0];
    if (first && first.length <= 160) return first + (/[\.?!]$/.test(first) ? "" : "...");
    return s.length > 140 ? s.slice(0, 140).trim() + "..." : s;
  }

  function getDifficultyValue(p) {
    return (p.difficulty || "").toLowerCase();
  }

  function ensureMetaTag(nameOrProp, value, isProperty = false) {
    let selector = isProperty ? `meta[property="${nameOrProp}"]` : `meta[name="${nameOrProp}"]`;
    let m = document.head.querySelector(selector);
    if (!m) {
      m = document.createElement("meta");
      if (isProperty) m.setAttribute("property", nameOrProp);
      else m.setAttribute("name", nameOrProp);
      document.head.appendChild(m);
    }
    m.setAttribute("content", value || "");
  }

  function ensureLinkRel(rel, href) {
    let el = document.head.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", rel);
      document.head.appendChild(el);
    }
    el.setAttribute("href", href || "");
  }

  function updateTitleAndMeta() {
    const parts = [];
    const cat = refs.categorySelect.value;
    const diff = refs.priceSelect.value;
    const q = refs.searchInput.value.trim();

    if (q) parts.push(`"${q}"`);
    if (cat) parts.push(cap(cat));
    if (diff) parts.push(`Difficulty: ${cap(diff)}`);
    parts.push("Democracy Game Library");
    const title = parts.join(" | ");
    document.title = title;

    const descParts = [];
    if (cat) descParts.push(`${cap(cat)} games`);
    if (diff) descParts.push(`Difficulty: ${cap(diff)}`);
    if (q) descParts.push(`Search results for "${q}"`);
    descParts.push("Single-player civic simulations about media, coalitions, and democracy.");
    const description = descParts.join(" • ");

    ensureMetaTag("description", description);
    ensureMetaTag("robots", "index,follow");
    ensureMetaTag("twitter:card", "summary_large_image");
    ensureMetaTag("twitter:title", title);
    ensureMetaTag("twitter:description", description);
    ensureMetaTag("og:title", title, true);
    ensureMetaTag("og:description", description, true);
    ensureMetaTag("og:type", "website", true);
    ensureMetaTag("og:site_name", document.location.hostname || SITE_BASE, true);
  }

  function updateCanonicalAndPaginationLinks(pageNum, totalPages, pageSize) {
    const urlBase = SITE_BASE + (LISTING_PATH.startsWith("/") ? LISTING_PATH : "/" + LISTING_PATH);
    const params = new URLSearchParams();
    if (pageNum && pageNum > 1) params.set("page", pageNum);
    if (pageSize && pageSize !== "all") params.set("pageSize", pageSize);
    const canonicalHref = params.toString() ? `${urlBase}?${params.toString()}` : urlBase;

    ensureLinkRel("canonical", canonicalHref);

    if (pageNum > 1) {
      const prevParams = new URLSearchParams();
      const prevPage = pageNum - 1;
      if (prevPage > 1) prevParams.set("page", prevPage);
      if (pageSize && pageSize !== "all") prevParams.set("pageSize", pageSize);
      ensureLinkRel("prev", prevParams.toString() ? `${urlBase}?${prevParams.toString()}` : urlBase);
    } else {
      const prevEl = document.head.querySelector('link[rel="prev"]');
      if (prevEl) prevEl.remove();
    }

    if (pageNum < totalPages) {
      const nextParams = new URLSearchParams();
      const nextPage = pageNum + 1;
      if (nextPage > 1) nextParams.set("page", nextPage);
      if (pageSize && pageSize !== "all") nextParams.set("pageSize", pageSize);
      ensureLinkRel("next", nextParams.toString() ? `${urlBase}?${nextParams.toString()}` : urlBase);
    } else {
      const nextEl = document.head.querySelector('link[rel="next"]');
      if (nextEl) nextEl.remove();
    }
  }

  function injectStructuredData() {
    const items = PRODUCTS.map((p) => {
      const node = {
        "@type": "VideoGame",
        name: p.title,
        description: p.description,
        gamePlatform: "Web browser",
        applicationCategory: "Game",
      };

      const urlSource = p.seoUrl || p.productUrl;
      if (urlSource) {
        node.url = urlSource.startsWith("http") ? urlSource : SITE_BASE + (urlSource.startsWith("/") ? urlSource : "/" + urlSource);
      }
      if (p.imageUrl) node.image = p.imageUrl.startsWith("http") ? p.imageUrl : SITE_BASE + (p.imageUrl.startsWith("/") ? p.imageUrl : "/" + p.imageUrl);

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

  function renderPrimaryButton(prod) {
    const label = prod.buttonLabel || "Play Now";
    const href = prod.productUrl || "#";
    return `<a class="btn btn-primary" href="${escapeHtml(href)}" target="" rel="noopener" aria-label="${escapeHtml(label)}">${escapeHtml(label)}</a>`;
  }

  function renderProductsPage(list, page, pageSize) {
    // choose a stable height to preserve when results are empty:
    // prefer the last measured non-empty height, else use current measurement or a sensible fallback
    const currentMeasured = refs.grid ? Math.ceil(refs.grid.getBoundingClientRect().height) : 0;
    const prevGridHeight = lastNonEmptyGridHeight || currentMeasured || 240;
    refs.grid.style.visibility = "hidden";
    refs.grid.innerHTML = "";

    if (!list.length) {
      if (prevGridHeight && prevGridHeight > 0) refs.grid.style.minHeight = prevGridHeight + "px";
      refs.empty.style.display = "block";
      refs.paginationWrap.style.display = "none";
      updateTitleAndMeta();
      injectStructuredData();
      updateCanonicalAndPaginationLinks(1, 1, "all");

      // Add invisible placeholder cards to preserve grid shape and avoid jumpy layout
      try {
        // determine approximate number of columns based on grid width and min card width (240px)
        const gridWidth = Math.max(0, refs.grid.clientWidth || 0);
        const colWidth = 260; // min card + gap approximation
        const cols = Math.max(1, Math.floor(gridWidth / colWidth) || 3);
        const placeholders = Math.max(cols * 2, 3); // two rows of placeholders
        const frag = document.createDocumentFragment();
        for (let i = 0; i < placeholders; i++) {
          const ph = document.createElement('div');
          ph.className = 'card placeholder h-100';
          // minimal inner structure to match sizing
          ph.innerHTML = `<div class="card-inner"><div class="card-front"></div></div>`;
          const col = document.createElement('div');
          col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
          col.appendChild(ph);
          frag.appendChild(col);
        }
        refs.grid.appendChild(frag);
      } catch (e) {
        // silent
      }

      refs.grid.style.visibility = "";
      return;
    }
    refs.empty.style.display = "none";

    let pageNum = parseInt(page, 10) || 1;
    let size = pageSize === "all" ? list.length : parseInt(pageSize, 10);
    const totalItems = list.length;
    const totalPages = size === 0 ? 1 : Math.max(1, Math.ceil(totalItems / size));
    if (pageNum > totalPages) pageNum = totalPages;
    const start = pageSize === "all" ? 0 : (pageNum - 1) * size;
    const end = pageSize === "all" ? totalItems : Math.min(totalItems, start + size);
    const slice = list.slice(start, end);

    const tempCards = [];
    slice.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card h-100";

      let thumbHtml = `<div class="thumb" aria-hidden="true">${escapeHtml(p.thumbText || p.category || "Game")}</div>`;
      if (p.imageUrl) {
        const imgSrc = escapeHtml(p.imageUrl);
        thumbHtml = `<div class="thumb" data-thumb-text="${escapeHtml(p.thumbText || p.category || "Game")}"><img src="${imgSrc}" alt="${escapeHtml(p.title)} thumbnail" loading="lazy" onerror="this.dataset.failed='1'; this.style.display='none'; this.parentNode.classList.add('thumb-failed');"></div>`;
      }

      const titleHref = p.seoUrl || p.productUrl || "";
      const titleLink = titleHref ? `<a href="${escapeHtml(titleHref)}">${escapeHtml(p.title)}</a>` : `<span>${escapeHtml(p.title)}</span>`;

      const diffVal = (p.difficulty || "medium").toLowerCase();
      const diffClass = `tag diff-${diffVal}`;

      const backDescHtml = formatBackDescription(p.description);

      card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">
          ${thumbHtml}
          <div class="card-body d-flex flex-column">
            <h5 class="card-title title mb-2">${titleLink}</h5>
            <p class="desc card-text mb-3">${escapeHtml(getSummary(p))}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <div class="me-2">
                <span class="badge bg-light text-dark">${escapeHtml(p.category)}</span>
                ${p.difficulty ? `<span class="badge bg-secondary ms-1">${escapeHtml(p.difficulty)}</span>` : ""}
              </div>
              <div class="btn-group">
                ${renderPrimaryButton(p)}
                <a class="btn btn-outline-secondary details-btn" href="${escapeHtml(p.productUrl || '#')}" data-id="${p.id}" aria-label="Details for ${escapeHtml(p.title)}">Details</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
      tempCards.push(card);

      const img = card.querySelector(".thumb img");
      if (img) {
        img.addEventListener("error", () => {
          const thumb = card.querySelector(".thumb");
          thumb.innerHTML = thumb.dataset.thumbText || p.thumbText || "Game";
        });
        if (img.dataset && img.dataset.failed === "1") {
          const thumb = card.querySelector(".thumb");
          thumb.innerHTML = thumb.dataset.thumbText || p.thumbText || "Game";
        }
      }
    });

    const frag = document.createDocumentFragment();
    tempCards.forEach((c) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
      col.appendChild(c);
      frag.appendChild(col);
    });
    refs.grid.appendChild(frag);

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(() => {
      if (HEIGHT_MODE === "uniform") {
        let maxFront = 0;
        tempCards.forEach((card) => {
          const h = measureFrontContentHeight(card);
          if (h > maxFront) maxFront = h;
        });

        if (maxFront > 0) {
          tempCards.forEach((card) => {
            card.style.height = maxFront + "px";
            const inner = card.querySelector(".card-inner");
            if (inner) inner.style.height = "100%";
            clampBackScrollBounds(card);
          });

          tempCards.forEach((card) => {
            const needed = measureFrontContentHeight(card);
            const current = Math.ceil(card.getBoundingClientRect().height);
            if (needed > current) {
              card.style.height = needed + "px";
              clampBackScrollBounds(card);
            }
          });
        }
      } else {
        tempCards.forEach((card) => {
          const h = measureFrontContentHeight(card);
          if (h > 0) {
            card.style.height = h + "px";
            const inner = card.querySelector(".card-inner");
            if (inner) inner.style.height = "100%";
            clampBackScrollBounds(card);
          }
        });
      }

      renderPagination(totalItems, pageNum, totalPages, pageSize);

      updateTitleAndMeta();
      injectStructuredData();
      updateCanonicalAndPaginationLinks(pageNum, totalPages, pageSize);

      const shouldAutoH1 = refs.pageH1 && refs.pageH1.dataset.auto === "true";
      const shouldAutoDesc = refs.pageDescEl && refs.pageDescEl.dataset.auto === "true";

      if (shouldAutoH1) {
        let h = "Democracy Game Library";
        if (refs.categorySelect.value) h = `${cap(refs.categorySelect.value)} — ${h}`;
        if (refs.searchInput.value) h = `Results for "${refs.searchInput.value}" — ${h}`;
        refs.pageH1.textContent = h;
      }

      if (shouldAutoDesc) {
        refs.pageDescEl.textContent = document.title;
      }

      try {
        lastNonEmptyGridHeight = Math.max(lastNonEmptyGridHeight || 0, Math.ceil(refs.grid.getBoundingClientRect().height));
      } catch (e) {}
      refs.grid.style.minHeight = "";
      refs.grid.style.visibility = "";
    });
  }

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
    info.textContent = `Page ${current} of ${totalPages} • ${totalItems} games`;
    refs.paginationWrap.appendChild(info);
  }

  function applyFilters() {
    const q = (refs.searchInput.value || "").toLowerCase().trim();
    const cat = (refs.categorySelect.value || "").trim();
    const diff = (refs.priceSelect.value || "").toLowerCase().trim();

    const sort = refs.sortSelect.value;

    const validCats = new Set(PRODUCTS.map((p) => (p.category || "").trim()).filter(Boolean));
    const validDiffs = new Set(PRODUCTS.map((p) => (getDifficultyValue(p) || "").toLowerCase().trim()).filter(Boolean));
    const useCat = cat && validCats.has(cat) ? cat : "";
    const useDiff = diff && validDiffs.has(diff) ? diff : "";

    filteredProducts = PRODUCTS.filter((p) => {
      const pCat = (p.category || "").trim();
      const pDiff = (getDifficultyValue(p) || "").toLowerCase().trim();
      const m1 = !useCat || pCat === useCat;
      const m2 = !useDiff || pDiff === useDiff;
      const hay = ((p.title || "") + (p.description || "") + (p.category || "") + (p.seoUrl || "") + (p.difficulty || "")).toLowerCase();
      const m3 = !q || hay.includes(q);
      return m1 && m2 && m3;
    });

    if (sort === "az") filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za") filteredProducts.sort((a, b) => b.title.localeCompare(a.title));

    currentPage = 1;
    refreshPage();
  }

  function refreshPage() {
    currentPageSize = refs.pageSizeSelect.value || "all";
    renderProductsPage(filteredProducts, currentPage, currentPageSize);
  }

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

  // Simplified: details links are standard anchors/buttons; navigation is handled by the browser
  refs.grid.addEventListener("click", (e) => {
    const det = e.target.closest(".details-btn");
    if (det) {
      // let default anchor navigation occur; nothing to do here
      return;
    }
  });

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) refs.goTopBtn.classList.add("show");
    else refs.goTopBtn.classList.remove("show");
  });
  refs.goTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  function buildSitemapXml() {
    const domain = window.location.origin;

    const urls = PRODUCTS.map((p) => {
      const loc = p.seoUrl && p.seoUrl.startsWith("http") ? p.seoUrl : domain + (p.seoUrl ? p.seoUrl : `/game/${encodeURIComponent(p.id.toString())}`);
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

  (function setupFilters() {
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
      PRODUCTS.forEach((p) => {
        if (p.seoUrl) seen.add(p.seoUrl);
      });
      PRODUCTS.forEach((p) => {
        if (!p.seoUrl || !String(p.seoUrl).trim()) {
          const base = "/game/" + (slugify(p.title || p.id) || "game-" + p.id);
          let candidate = base;
          let i = 1;
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

    const diffs = [...new Set(PRODUCTS.map((p) => (getDifficultyValue(p) || "").toLowerCase()))].filter((d) => d).sort();
    diffs.forEach((dv) => {
      const op = document.createElement("option");
      op.value = dv;
      op.textContent = cap(dv);
      refs.priceSelect.appendChild(op);
    });

    updateTitleAndMeta();
    injectStructuredData();
  })();

  applyFilters();
  window.setTheme = setTheme;

  function clampBackScrollBounds(card) {
    try {
      if (!card) return;
      const back = card.querySelector(".card-back");
      const desc = back && back.querySelector(".desc");
      const footer = back && back.querySelector(".card-footer");
      if (!back || !desc) return;

      const inner = card.querySelector(".card-inner");
      const containerRect = inner ? inner.getBoundingClientRect() : card.getBoundingClientRect();
      const backStyles = getComputedStyle(back);
      const padTop = parseFloat(backStyles.paddingTop) || 0;
      const padBottom = parseFloat(backStyles.paddingBottom) || 0;
      const footerHeight = footer ? footer.getBoundingClientRect().height : 0;

      const available = Math.max(0, containerRect.height - padTop - padBottom - footerHeight);
      desc.style.maxHeight = available + "px";
      desc.style.overflowY = "auto";
      desc.style.minHeight = "0";
    } catch (e) {
      console.warn("[CLAMP BACK SCROLL] Failed:", e);
    }
  }

  function measureFrontContentHeight(card) {
    try {
      const front = card.querySelector(".card-front");
      const back = card.querySelector(".card-back");
      const inner = card.querySelector(".card-inner");
      if (!front) return 0;

      const prevBackDisplay = back ? back.style.display : "";
      if (back) back.style.display = "none";

      const prevFrontPos = front.style.position;
      const prevFrontHeight = front.style.height;
      const prevFrontInset = front.style.inset;
      const prevFrontWidth = front.style.width;
      const prevInnerHeight = inner ? inner.style.height : "";

      if (inner) inner.style.height = "auto";
      front.style.position = "static";
      front.style.height = "auto";
      front.style.inset = "";
      front.style.width = "100%";

      const h = Math.ceil(front.getBoundingClientRect().height);

      front.style.position = prevFrontPos || "absolute";
      front.style.height = prevFrontHeight || "100%";
      front.style.inset = prevFrontInset || "0";
      front.style.width = prevFrontWidth || "100%";
      if (inner) inner.style.height = prevInnerHeight || "100%";
      if (back) back.style.display = prevBackDisplay;

      return h || 0;
    } catch (e) {
      console.warn("[MEASURE FRONT] Failed:", e);
      return 0;
    }
  }

  window.addEventListener("resize", () => {});
  window.addEventListener("orientationchange", () => {});
})();

function sendHeight() {
  const height = document.body.scrollHeight;
  parent.postMessage({ type: "resizeIframe", height: height }, "*");
}

window.addEventListener("load", sendHeight);

if ("ResizeObserver" in window) {
  new ResizeObserver(sendHeight).observe(document.body);
}

/* Navigation behavior: rely on Bootstrap's navbar/collapse and dropdown JS. */


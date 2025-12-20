(function () {
  "use strict";

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

  function cap(s) {
    return (s || "").charAt(0).toUpperCase() + (s || "").slice(1);
  }

  /**
   * Updates the page title and meta tags based on current filters and search query.
   * This makes the page SEO-friendly and improves user context.
   */
  function updateTitleAndMeta(siteBase, { query, category, price }) {
    const parts = [];
    const q = (query || "").trim();
    const cat = category;
    const pVal = price;

    if (q) parts.push(`"${q}"`);
    if (cat) parts.push(cap(cat));
    if (pVal) parts.push(cap(pVal));
    parts.push("Digital & Physical Products");
    const title = parts.join(" | ");
    document.title = title;

    const descParts = [];
    if (cat) descParts.push(`${cap(cat)} products`);
    if (pVal) descParts.push(`${cap(pVal)} items`);
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
      document.location.hostname || siteBase,
      true
    );
    // Set a fallback Open Graph/Twitter image.
    ensureMetaTag("og:image", `${siteBase}/assets/og-products.jpg`, true);
    ensureMetaTag("twitter:image", `${siteBase}/assets/og-products.jpg`);
  }

  /**
   * Updates canonical, prev, and next link tags for paginated results.
   * This helps search engines understand the paginated structure of the content.
   */
  function updateCanonicalAndPaginationLinks(siteBase, listingPath, pageNum, totalPages, pageSize) {
    const urlBase =
      siteBase +
      (listingPath.startsWith("/") ? listingPath : "/" + listingPath);
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
  function injectStructuredData(siteBase, products) {
    const items = products.map((p) => {
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
          : siteBase +
            (urlSource.startsWith("/") ? urlSource : "/" + urlSource);
      }
      if (p.imageUrl)
        node.image = p.imageUrl.startsWith("http")
          ? p.imageUrl
          : siteBase +
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

  /**
   * Generates a sitemap.xml string from the product data.
   */
  function buildSitemapXml(siteBase, products) {
    const domain = window.location.origin;

    const urls = products.map((p) => {
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

  /**
   * Ensures each product has a unique, SEO-friendly URL (`seoUrl`).
   * Auto-generates a slug from the title if `seoUrl` is missing.
   */
  function ensureSeoUrls(products) {
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
    products.forEach((p) => {
      if (p.seoUrl) seen.add(p.seoUrl);
    });
    products.forEach((p) => {
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

  // Expose SEO API
  window.SEO = {
    updateTitleAndMeta,
    updateCanonicalAndPaginationLinks,
    injectStructuredData,
    buildSitemapXml,
    ensureSeoUrls
  };
})();

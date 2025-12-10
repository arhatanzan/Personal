(function (w, d) {
  function sendHeight(targetWindow) {
    try {
      const height = d.body.scrollHeight;
      (targetWindow || w.parent).postMessage({ type: "resizeIframe", height }, "*");
    } catch (e) {}
  }

  function setTheme(vars) {
    if (!vars || typeof vars !== "object") return;
    const root = d.documentElement;
    Object.keys(vars).forEach((k) => {
      try {
        root.style.setProperty(k, vars[k]);
      } catch (e) {}
    });
  }

  function sanitizeHtml(input, opts) {
    const allowedTags = (opts && opts.allowedTags) || ["strong", "em", "br", "a", "ul", "ol", "li"];
    const allowedAttrs = (opts && opts.allowedAttrs) || { a: ["href", "title", "target", "rel"] };
    const container = d.createElement("div");
    container.innerHTML = String(input || "");

    function escapeText(txt) {
      return String(txt || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function sanitizeNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return escapeText(node.nodeValue);
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      const tag = node.tagName.toLowerCase();
      if (!allowedTags.includes(tag)) {
        let inner = "";
        node.childNodes.forEach((c) => (inner += sanitizeNode(c)));
        return inner;
      }
      let attrs = "";
      const allowedFor = allowedAttrs[tag] || [];
      for (let i = 0; i < node.attributes.length; i++) {
        const a = node.attributes[i];
        const name = a.name.toLowerCase();
        if (allowedFor.includes(name)) {
          let val = a.value || "";
          if (tag === "a" && name === "href") {
            const v = String(val).trim().toLowerCase();
            if (v.startsWith("javascript:") || v.startsWith("data:")) continue;
          }
          val = val.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          attrs += ` ${name}="${val}"`;
        }
      }
      if (tag === "br") return "<br>";
      let inner = "";
      node.childNodes.forEach((c) => (inner += sanitizeNode(c)));
      return `<${tag}${attrs}>${inner}</${tag}>`;
    }

    let out = "";
    container.childNodes.forEach((n) => (out += sanitizeNode(n)));
    return out;
  }

  w.SiteHelpers = { sendHeight, setTheme, sanitizeHtml };
})(window, document);

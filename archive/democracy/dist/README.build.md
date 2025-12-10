Build instructions (SEO-friendly static pages)

Why a build step?
- We previously injected the navbar at runtime via JS fetch. For SEO and crawlers it's better to ship fully-rendered HTML.
- This build step replaces `<div id="site-navbar"></div>` with the content of `assets/partials/navbar.html` and copies the site to `dist/`.

How to run (from the `democracy` folder):

```pwsh
python tools/build_site.py
```

- Output is written to `democracy/dist/`.
- Serve the built site for testing:

```pwsh
cd dist
python -m http.server 8000
# then open http://localhost:8000
```

Notes:
- The build script is intentionally simple and has no external dependencies.
- If you add nested pages in subfolders, the script preserves structure and injects the partial in any `.html` containing the placeholder.
- The `assets/js/navbar-loader.js` is left in place as a harmless fallback, but it's no longer required for SEO since the navbar will be present in the built files.

Next steps you might want:
- Add this build step to your CI or a `Makefile`/npm script.
- Replace the loader script after confirming pages are built correctly.

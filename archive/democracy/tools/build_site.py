"""Build-time injector: copies site into a `dist/` folder and injects partials.

Usage (from `democracy` folder):
  python tools/build_site.py

What it does:
- Reads `assets/partials/navbar.html`
- Finds all `.html` files in the source folder (excluding `dist/` and `tools/`)
- Replaces a placeholder `<div id="site-navbar"></div>` with the partial markup
- Copies all other files and folders into `dist/` preserving structure

This produces fully-rendered static pages (no JS fetch needed) which is better for SEO.
"""
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # democracy/
SRC = ROOT
DIST = ROOT / 'dist'
PARTIAL = SRC / 'assets' / 'partials' / 'navbar.html'
PLACEHOLDER = '<div id="site-navbar"></div>'

EXCLUDE_DIRS = {DIST.name, 'tools', '.git'}


def read_partial():
    if not PARTIAL.exists():
        raise FileNotFoundError(f"Partial not found: {PARTIAL}")
    return PARTIAL.read_text(encoding='utf-8')


def ensure_dist():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)


def copy_and_inject():
    partial_html = read_partial()
    for root, dirs, files in os.walk(SRC):
        # skip excluded directories
        parts = Path(root).relative_to(SRC).parts
        if parts and parts[0] in EXCLUDE_DIRS:
            dirs[:] = []
            continue

        # determine destination directory
        rel_dir = Path(root).relative_to(SRC)
        dest_dir = DIST.joinpath(rel_dir)
        dest_dir.mkdir(parents=True, exist_ok=True)

        for f in files:
            src_file = Path(root) / f
            # skip the build script itself
            if src_file.match('tools/*'):
                continue
            # compute dest path
            dest_file = dest_dir / f

            if src_file.suffix.lower() == '.html':
                text = src_file.read_text(encoding='utf-8')
                if PLACEHOLDER in text:
                    text = text.replace(PLACEHOLDER, partial_html)
                dest_file.write_text(text, encoding='utf-8')
            else:
                shutil.copy2(src_file, dest_file)


def main():
    print('Building site into', DIST)
    ensure_dist()
    copy_and_inject()
    print('Build complete. Files written to', DIST)


if __name__ == '__main__':
    main()

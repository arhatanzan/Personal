# Civic Games Arcade

A collection of interactive simulations exploring democracy, media literacy, and governance. This project uses a modular, Bootstrap-first architecture to deliver lightweight, educational games.

## 🎮 Featured Games

The arcade currently features 5 distinct simulations:

1.  **The Civic Feed** (`game-civic-feed.html`)
    *   **Role:** Social Media Algorithm Manager
    *   **Goal:** Balance truth, user attention, and polarization.
    *   **Learning:** How algorithms prioritize emotional engagement over facts.

2.  **Coalition Builder** (`game-coalition-builder.html`)
    *   **Role:** Party Leader
    *   **Goal:** Negotiate with rival parties to form a majority government.
    *   **Learning:** The trade-offs and compromises inherent in parliamentary politics.

3.  **The News Desk** (`game-news-desk.html`)
    *   **Role:** TV News Editor
    *   **Goal:** Curate the 9 PM broadcast, balancing TRP (profit) with Civic Duty (information).
    *   **Learning:** The commercial pressures behind editorial choices.

4.  **Budget Battle** (`game-budget-battle.html`)
    *   **Role:** City Mayor
    *   **Goal:** Allocate a limited budget across competing sectors (Health, Education, etc.) while managing public approval.
    *   **Learning:** Fiscal responsibility and the zero-sum nature of public budgeting.

5.  **Whisper Campaign** (`game-whisper-campaign.html`)
    *   **Role:** Opposition Strategist
    *   **Goal:** Use rumors and scandals to break the incumbent's grip on power.
    *   **Learning:** How misinformation spreads through social networks.

## 📂 Project Structure

```
gamification/
├── assets/                 # Shared static assets
│   ├── css/                # Stylesheets (Bootstrap overrides + Game specific)
│   │   ├── carousel.css    # Styles for the shared game picker
│   │   ├── index.css       # Landing page styles
│   │   └── game-*.css      # Individual game styles
│   └── js/                 # Game logic scripts
│       ├── carousel.js     # Logic for the shared game picker
│       └── game-*.js       # Individual game logic
├── db/
│   └── products.json       # Central database of games (metadata, URLs, descriptions)
├── games/                  # Individual game HTML files
│   ├── game-*.html         # Standalone game files
├── partials/
│   └── carousel.html       # HTML fragment for the shared game picker
├── index.html              # Main landing page (Bootstrap 5)
└── README.md               # Project documentation
```

## 🛠 Technical Architecture

### Bootstrap First
The project relies heavily on **Bootstrap 5** for layout, responsiveness, and utility classes. Custom CSS is kept to a minimum, primarily for game-specific theming and the "Navy & Gold" brand identity.

### Modular Components
*   **Games Carousel**: A shared component (`partials/carousel.html` + `assets/js/carousel.js`) is dynamically injected into every page. This ensures that adding a new game to `db/products.json` automatically updates the navigation across the entire site.
*   **Separation of Concerns**: HTML, CSS, and JS are strictly separated.
    *   `games/*.html`: Structure only.
    *   `assets/css/*.css`: Presentation.
    *   `assets/js/*.js`: Logic.

### Iframe Resizing
All games include a `ResizeObserver` script that communicates the document height to the parent window via `postMessage`. This allows the games to be seamlessly embedded in other websites (like a portfolio or LMS) without scrollbars.

```javascript
// Standard Iframe Resizer Logic
function sendHeight() {
  const height = document.body.scrollHeight;
  parent.postMessage({ type: "resizeIframe", height: height }, "*");
}
window.addEventListener("load", sendHeight);
if ("ResizeObserver" in window) {
  new ResizeObserver(sendHeight).observe(document.body);
}
```

## 🚀 Setup & Usage

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/gamification.git
    ```
2.  **Serve the files**:
    Because the project uses `fetch()` to load the carousel partial and JSON database, you must run it on a local server (opening `index.html` directly in the browser will fail due to CORS).
    ```bash
    # Python 3
    python -m http.server 8000
    
    # Node.js (http-server)
    npx http-server
    ```
3.  **Visit**: `http://localhost:8000`

## 📝 Contribution Guidelines

*   **File Naming**: All game files must use **kebab-case** (e.g., `game-news-desk.html`, not `game_news_desk.html`).
*   **Assets**: Store game-specific assets in `assets/css` and `assets/js` with matching filenames.
*   **Database**: When adding a new game, update `db/products.json` with the new entry. The carousel will automatically pick it up.

## 📄 License

© 2025 Kaif Abbas. All rights reserved.

# Hostinger Deployment

This directory contains the deployment-ready files and layout templates used for the Hostinger hosting environment. Unlike the development branches, this folder maintains specific naming conventions and structure required for the live site.

## 📂 Project Structure

```
hostinger/
├── games/                  # Game files (Legacy snake_case naming)
│   ├── game_*.html         # Individual game simulations
│   └── index.html          # Games landing page
├── layouts/                # Reusable HTML layout templates
│   ├── product_page.html   # Main product listing layout
│   ├── metric_row.html     # KPI display components
│   └── *_box_*.html        # Grid layout components
└── README.md               # This documentation
```

## 🎮 Games Collection

The games in this directory follow the **snake_case** naming convention (e.g., `game_news_desk.html`) to maintain compatibility with existing permalinks and platform.

*   **The Civic Feed**: Social media algorithm simulation.
*   **Coalition Builder**: Parliamentary negotiation strategy.
*   **The News Desk**: Broadcast news management.
*   **Budget Battle**: City resource allocation puzzle.
*   **Whisper Campaign**: Political misinformation strategy.

## 🎨 Layout Templates

The `layouts/` directory contains standalone HTML/CSS components used to build the site's pages. These are designed to be copy-pasted or included server-side.

*   **product_page.html**: The master template for the games listing page, including CSS variables for theming (Navy & Gold).
*   **metric_row.html**: A component for displaying key performance indicators or stats.
*   **four_box_card.html** & **three_box_highlight.html**: Grid system components for featuring content.
*   **column_divider.html**: Structural separators for page sections.

## 🚀 Deployment Notes

*   **Naming Convention**: Ensure new game files added here use `snake_case` to match the existing URL structure.
*   **Styles**: Most layout files contain their own `<style>` blocks, making them self-contained for easy integration into the Hostinger site builder or file manager.

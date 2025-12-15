# Civic Games Arcade (Personal Monorepo)

This repository houses the development, staging, and deployment versions of the **Civic Games Arcade**—a collection of interactive simulations exploring democracy, media literacy, and governance.

## 📂 Repository Structure

The project is organized into three primary directories, each serving a distinct phase of the development lifecycle:

### 1. `bootstrap-migration/` (🚧 Active Development)
This is the **modern, refactored codebase**. It represents the future state of the project.
*   **Architecture**: Bootstrap 5 First, Modular Components.
*   **Naming Convention**: `kebab-case` (e.g., `game-news-desk.html`).
*   **Features**:
    *   Separation of concerns (CSS/JS in `assets/`).
    *   Shared components (Carousel loaded via `fetch`).
    *   Responsive design.

### 2. `gamification/` (🎮 Stable / Production)
This folder contains the current stable version of the games.
*   **Usage**: This is likely the version currently accessible to users or used for demos.
*   **Features**: Includes the core game logic and assets.
*   **Recent Updates**: Iframe resizing logic has been backported here.

### 3. `hostinger/` (🚀 Deployment)
This directory contains files specifically formatted for the **Hostinger** hosting environment.
*   **Constraint**: Hostinger's file manager or existing permalinks require specific naming conventions.
*   **Naming Convention**: `snake_case` (e.g., `game_news_desk.html`).
*   **Content**: Includes standalone layout templates (`layouts/`) for the site builder.

## 🛠 Key Technologies

*   **Frontend**: HTML5, CSS3, JavaScript (ES6+)
*   **Framework**: Bootstrap 5.3
*   **Data**: JSON (`db/products.json`) for dynamic content loading.
*   **Architecture**: Static site with client-side rendering for shared components.

## 🚀 Getting Started

Since the project uses `fetch()` to load shared components (like the games carousel) and JSON data, you cannot simply open the HTML files in a browser. You must run a local HTTP server.

### Prerequisites
*   Python 3.x OR Node.js

### Running Locally

1.  **Navigate to the desired folder** (e.g., `bootstrap-migration`):
    ```bash
    cd bootstrap-migration
    ```

2.  **Start a local server**:

    *   **Using Python**:
        ```bash
        python -m http.server 8000
        ```

    *   **Using Node.js (http-server)**:
        ```bash
        npx http-server
        ```

3.  **Open in Browser**:
    Visit `http://localhost:8000`

## 🔄 Workflow

1.  **Develop**: Make changes and refactors in `bootstrap-migration`.
2.  **Test**: Verify changes locally.
3.  **Deploy**:
    *   For general updates, sync with `gamification`.
    *   For Hostinger deployment, rename files to `snake_case` and move to `hostinger/`.

## 📄 License

© 2025 Kaif Abbas. All rights reserved.

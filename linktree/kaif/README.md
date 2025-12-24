# Kaif Linktree (React Migration)

This project has been migrated from `legacy_public` to a React application using Vite.

## Project Structure

- `src/`: Contains the React source code.
  - `components/`: React components (Header, Profile, LinkSection, etc.).
  - `data.js`: The site data (migrated from `assets/js/data.js`).
  - `App.jsx`: The main application component.
  - `main.jsx`: The entry point.
  - `index.css`: The global styles (migrated from `assets/css/styles.css`).
- `public/`: Contains static assets.
  - `assets/`: Images, fonts, etc.
  - `admin/`: Legacy admin pages.
  - `references/`: Legacy reference pages.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Run the development server:
    ```bash
    npm run dev
    ```

3.  Build for production:
    ```bash
    npm run build
    ```

## Notes

- The `data.js` file is now an ES module exporting `siteData`.
- Styles are in `src/index.css`.
- Images and fonts are served from the `public/assets` directory.

--------------------------------------------------------------

# HTML Entry Point - `index.html`

This is the main HTML entry point for the AdHoc_Trader web application. It’s structured to load the React-based frontend, define essential metadata, and support SEO and social sharing features.

## Location
Root of the project: `/index.html`

---

## 🧠 Key Elements

### `<head>`

- **Meta Charset**: UTF-8 encoding for broad character support.
- **Viewport**: Optimized for mobile responsiveness.
- **Title**: `ADH0C_Trading` — shown in the browser tab.
- **Description**: Helps with SEO, summarizing your app.
- **Author**: `"Famous.ai"` credited as the creator.
- **Favicon**: `/placeholder.svg` used as tab icon.

### SEO & Social Tags

- **Open Graph (`og:`)**:
  - Used by social media previews (e.g., Facebook, LinkedIn).
  - `og:image`: `/og.jpg` used for link previews.
- **Twitter Card**:
  - Supports large image preview on shared links.
  - Includes Twitter handle and image metadata.

---

### `<body>`

- **`<div id="root"></div>`**:
  - This is where the React app is mounted by `main.tsx`.

- **Main Script**:
  ```html
  <script type="module" src="/src/main.tsx"></script>

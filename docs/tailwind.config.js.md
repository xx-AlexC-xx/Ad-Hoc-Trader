# Tailwind CSS Configuration (`tailwind.config.ts`)

This file configures **Tailwind CSS** for your project.

---

## Content

- Specifies the files to scan for class names:

  ```ts
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

Extends the default theme with custom colors and border radius using CSS variables.
Defines custom CSS variables for light and dark modes.
Adds the @tailwindcss/typography plugin for better prose styling.
Uses a custom plugin to set CSS variables on :root for light and .dark for dark mode themes.

Key Features
Custom Colors: Colors are defined via CSS variables for dynamic theming.
Dark Mode Support: Dark mode variables override colors when .dark class is applied.
Border Radius: Uses a CSS variable for consistent rounded corners.
Typography Plugin: Enhances styling of rich text content like articles or markdown.

Usage Notes
The custom plugin defines color schemes in HSL with CSS variables, allowing easy theme switching.
Make sure your app toggles the .dark class on the <html> or <body> element to activate dark mode.
This config works seamlessly with Tailwind’s JIT mode for efficient CSS generation.


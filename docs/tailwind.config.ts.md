# Tailwind CSS Configuration (`tailwind.config.ts`)

This file configures Tailwind CSS for your project, including custom themes, colors, fonts, animations, and plugins.

---

## Dark Mode

```ts
darkMode: ["class"],

Enables dark mode toggling via a .dark class.
Content Paths
ts
Copy
Edit
content: [
  "./pages/**/*.{ts,tsx}",
  "./components/**/*.{ts,tsx}",
  "./app/**/*.{ts,tsx}",
  "./src/**/*.{ts,tsx}",
],

Specifies files Tailwind should scan for class names to generate styles.

Theme Customizations
Container
ts
Copy
Edit
container: {
  center: true,
  padding: '2rem',
  screens: { '2xl': '1400px' },
},

Centers container with padding and custom max width for large screens.

Extended Colors
Uses CSS variables (--primary, --background, etc.) for colors, supporting theming.
Includes specialized color groups for UI elements like sidebar, popover, card, etc.

Fonts
ts
Copy
Edit
fontFamily: {
  mono: ['JetBrains Mono', 'monospace'],
  sans: ['Inter', 'sans-serif'],
},


Defines monospace and sans-serif fonts.
Border Radius
Customizes sizes for lg, md, and sm radii using CSS variables.

Animations & Keyframes
Defines keyframes and animations for accordion open/close, fade-in, and slide-in effects.

Typography
ts
Copy
Edit
typography: {
  DEFAULT: { css: { maxWidth: 'none' } }
}


Customizes default typography styles.

Plugins
tailwindcss-animate: Adds utility classes for animations.
@tailwindcss/typography: Provides prose classes for rich text formatting.

Summary
This config gives you a fully customizable, theme-aware Tailwind setup with dark mode support, smooth animations, and a clean typography system — all ready to power a modern React + TypeScript UI.




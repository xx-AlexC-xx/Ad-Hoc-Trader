# PostCSS Configuration (`postcss.config.js`)

This configuration file sets up **PostCSS** plugins for the project.

## Plugins Used

- **tailwindcss**: Enables Tailwind CSS processing.
- **autoprefixer**: Adds vendor prefixes automatically for better browser compatibility.

## Content of `postcss.config.js`

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

Purpose: 
TailwindCSS uses PostCSS to process utility classes and generate CSS.
Autoprefixer ensures that CSS works correctly across different browsers by adding necessary vendor prefixes.

How to Use
This file is automatically detected by build tools like Vite when running the development server or building the project.
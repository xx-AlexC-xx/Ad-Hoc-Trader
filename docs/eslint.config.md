# ESLint Configuration (`eslint.config.js`)

This file sets up ESLint with TypeScript and React support tailored for this project.

## Highlights

- **Core ESLint config:** Uses `@eslint/js` recommended rules.
- **TypeScript ESLint integration:** Applies TypeScript-specific linting with `typescript-eslint`.
- **File targeting:** Applies only to `.ts` and `.tsx` files.
- **Environment:** ECMAScript 2020 and browser globals enabled.
- **Plugins:**
  - `react-hooks`: Enforces rules of React hooks usage.
  - `react-refresh`: Supports React Fast Refresh for hot reloading during development.
- **Custom rules:**
  - React hooks recommended rules enabled.
  - Warns if non-components are exported during React refresh except constant exports.
  - Turns off the `@typescript-eslint/no-unused-vars` rule.

## Ignored files

- All files in the `dist` directory are ignored from linting.

## Purpose

This configuration ensures clean, consistent, and error-free code while supporting TypeScript and React-specific features, improving development experience with hot reloading.


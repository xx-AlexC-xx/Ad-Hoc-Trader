# package.json Overview

The `package.json` file defines your project metadata, dependencies, development tools, and scripts.

---

## Project Metadata

- **name:** `vite_react_shadcn_ts`
- **version:** `0.0.0`
- **private:** true (not published publicly)
- **type:** module (ES Modules enabled)

---

## Scripts

These are the npm scripts you can run:

| Script     | Description                      |
|------------|---------------------------------|
| `dev`      | Start development server (`vite`) |
| `build`    | Build production assets          |
| `build:dev`| Build with development mode      |
| `lint`     | Run ESLint to check code quality |
| `preview`  | Preview the production build     |

Run scripts like this:

```bash
npm run dev

Dependencies
Your runtime dependencies include:

UI & React ecosystem:

react ^18.3.1, react-dom ^18.3.1

@radix-ui/* (various UI primitives)

shadcn/ui components (implied by Radix usage)

lucide-react icons

clsx, class-variance-authority for class management

cmdk command palette

recharts charting

Backend / Data:

@supabase/supabase-js ^2.49.4 and auth helpers

axios for HTTP requests

uuid for unique IDs

zod for schema validation

Utility:

date-fns for date utilities

marked markdown parser

react-hook-form and resolver for forms

react-router-dom for routing

react-day-picker for date picking UI

sonner for notifications

tailwind-merge & tailwindcss-animate for CSS utilities

vaul (likely for state or storage)


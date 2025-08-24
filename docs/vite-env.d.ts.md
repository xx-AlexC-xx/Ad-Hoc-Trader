# Vite Environment Type Declarations (`vite-env.d.ts`)

This file provides TypeScript type definitions for environment variables used in the Vite project.

---

## Purpose

- Extends the TypeScript typings for the `import.meta.env` object.
- Ensures TypeScript understands the shape of your environment variables.
- Enables type safety and autocompletion when accessing environment variables.

---

## Defined Environment Variables

```ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ALPACA_API_KEY: string;
  readonly VITE_ALPACA_SECRET_KEY: string;
  readonly VITE_ALPACA_BASE_URL: string;
  // Add more vars here as needed
}


Notes
Make sure all these variables are defined in your .env or environment configuration.
Prefix environment variables with VITE_ so Vite exposes them to the client-side code.


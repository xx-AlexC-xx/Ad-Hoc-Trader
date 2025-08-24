# Vite Configuration (`vite.config.ts`)

This file configures the Vite build tool and development server for the project.

---

## Key Configuration Sections

### Server

```ts
server: {
  host: "::",
  port: 8080,
  watch: {
    ignored: ['**/ml_pipeline/**'], // Ignore this directory to prevent EIO crash
  },
  historyApiFallback: true,
},


host: "::" — Accepts connections on all IPv6 addresses.
port: 8080 — Development server runs on port 8080.
watch.ignored — Prevents Vite from watching the ml_pipeline directory to avoid errors.

historyApiFallback: true — Supports SPA routing by redirecting unknown routes to index.
Defines environment variables for use in the client code.
Uses JSON.stringify to inject the variables safely at build time.

Usage Notes
The config supports React with fast SWC compilation.
Alias paths make your imports cleaner and easier to maintain.
Environment variables prefixed with NEXT_PUBLIC_ are exposed to client code.
Ignoring large or frequently changing directories during watch avoids crashes and improves performance.
# TypeScript Configuration (`tsconfig.json`)

This file configures the TypeScript compiler options for your project.

---

## Key Compiler Options

- **target:** `ES2020`  
  Compiles TypeScript to ECMAScript 2020 standard.

- **lib:** `[ "ES2020" ]`  
  Includes ES2020 built-in type definitions.

- **module:** `CommonJS`  
  Uses CommonJS module system.

- **composite:** `true`  
  Enables project references and incremental builds.

- **skipLibCheck:** `true`  
  Skips type checking of declaration files for faster compilation.

- **emitDeclarationOnly:** `true`  
  Only emits `.d.ts` declaration files without JavaScript output.

- **strict:** `true`  
  Enables all strict type-checking options.

- **noUnusedLocals:** `false`  
  Allows unused local variables without error.

- **noUnusedParameters:** `false`  
  Allows unused function parameters without error.

---

## Paths and Base URL

- **baseUrl:** `.`  
  Sets the base directory for module resolution.

- **paths:**  
  ```json
  {
    "@/*": ["./src/*"]
  }

  ["src/**/*.ts", "src/**/*.d.ts", "vite.config.ts"]

Usage Notes
This config focuses on generating type declaration files only (emitDeclarationOnly), so your build system must handle JS compilation separately.
The paths setting simplifies imports by using @/ as an alias for the src directory.
Strict mode helps catch common bugs by enforcing rigorous type checks.
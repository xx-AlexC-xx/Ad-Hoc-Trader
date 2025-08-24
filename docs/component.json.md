Component Configuration ('shadcn.config')
component.JSON file 

# UI Configuration (`shadcn.config.json`)

This JSON configuration controls the UI setup and tooling options.

## Overview

- **Schema**: Defines the JSON schema for validation and tooling support.
- **Style**: The default UI style/theme used.
- **React Server Components (RSC)**: Disabled (`false`).
- **TypeScript JSX (TSX)**: Enabled (`true`).
- **Tailwind CSS**: Configuration settings including:
  - Tailwind config file: `tailwind.config.ts`
  - CSS entry file: `src/index.css`
  - Base color palette: `slate`
  - Use of CSS variables: enabled
  - CSS class prefix: none

## Aliases

Defines path aliases for cleaner imports:
| Alias       | Maps To           |
|-------------|-------------------|
| `components`| `@/components`    |
| `utils`     | `@/lib/utils`     |
| `ui`        | `@/components/ui` |
| `lib`       | `@/lib`           |
| `hooks`     | `@/hooks`         |

## Purpose

This config helps streamline component and utility imports in the project, manages Tailwind CSS integration, and sets core UI framework options.

---
site_name: AdHoc_Trader

nav:
  - Home:
      - index: index.html.md
      - Deno.json: deno.md
      - Component.json: component.md
      - eslint.config: eslint.config.md
      - import_map: import_map.md
      - package: package.md
      - package-lock: package-lock.md
      - postcss.config: postcss.config.md
      - tailwind.config.js: tailwind.config.js.md
      - tailwind.config.ts: tailwind.config.ts.md
      - tsconfig.node: tsconfig.node.md
      - vite-env.d.ts: vite-env.d.ts.md
      - vite.config: vite.config.md

  - Dependencies:
      - dependencies: dependencies.md

  - VSCode:
      - settings.json: settings.json.md

  - ml_pipeline:
      - .env: .env.md
      - VSCode:
          - settings.json: settings.json.md
      - historical_ingestion:
          - alpha_vantage: alpha_vantage.md
          - config: config.md
          - ingestion_historical: ingestion_historical.md
          - run_pipeline: run_pipeline.md
          - supabase_client: supabase_client.md
          - utils: utils.md
      - src:
          - dl:
              - lstm_model: lstm_model.md
          - ml:
              - data_fetcher: data_fetcher.md
              - feature_engineering: feature_engineering.md
              - predictor: predictor.md
              - supabase_uploader: supabase_uploader.md
              - training_model: training_model.md
      - tests:
          - test_normalization: test_normalization.md
      - venv:
          - requirements: requirements.md

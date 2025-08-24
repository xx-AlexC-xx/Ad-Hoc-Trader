# Welcome to MkDocs

For full documentation visit [mkdocs.org](https://www.mkdocs.org).

## Commands

* `mkdocs new [dir-name]` - Create a new project.
* `mkdocs serve` - Start the live-reloading docs server.
* `mkdocs build` - Build the documentation site.
* `mkdocs -h` - Print help message and exit.



## Project layout

    mkdocs.yml    # The configuration file.
    - Home: AdHoc_Trader
        -index.html.md
        - Deno.json: deno.md
        - Component.json: component.md
        - eslint.config: eslint.config.md
        - import_map: import_map.md
        - package: package.md
        - package-lock: package-lock.md
        - postcss.config: postcss.config.md
        - tailwind.config: tailwind.config.js.md
        - tailwind.config: tailwind.config.ts.md
        - tsconfig.node: tsconfig.node.md
        - vite-env.d.ts: vite-env.d.ts.md
        - vite.config: vite.config.md
    - Dependencies:
        - dependencies: dependencies.md
    - VSCode
        - settings.json: settings.json.md
    - ml_pipeline:
        - .env: 
        - VSCode: 
            - settings.json.md
        - historical_ingestion 
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
          - pedictor: predictor.md    
          - supabase_uploader: supabase_uplder.md
          - training_model: training_model.md
        - tests: 
          - test_normalization: test_normalization.md
        
    - requirements: requirements.md
     
            













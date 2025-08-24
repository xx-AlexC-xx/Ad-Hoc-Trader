# VSCode Workspace Settings

This file configures editor and tooling preferences tailored to your multi-language project setup.

---

## TypeScript & Deno Configuration

```json
"typescript.tsdk": "node_modules\\typescript\\lib",
"deno.enable": true,
"deno.lint": true,
"deno.unstable": true,
"deno.importMap": "./import_map.json",
"files.associations": {
  "**/supabase/functions/**/*.ts": "typescript"
}
Uses local TypeScript SDK from node_modules.
Enables Deno integration with linting and unstable APIs.
Specifies import map for Deno (import_map.json).
Associates .ts files under supabase/functions as TypeScript for better tooling.

Python / Machine Learning Backend
json
Copy
Edit
"python.analysis.extraPaths": ["./ml_pipeline"],
"python.envFile": "${workspaceFolder}/.env",
"python.linting.enabled": true,
"python.linting.pylintEnabled": true,
"python.linting.lintOnSave": true,
"python.linting.pylintPath": "${workspaceFolder}/venv/Scripts/pylint.exe",
"python.defaultInterpreterPath": "${workspaceFolder}/venv/Scripts/python.exe",

Adds ml_pipeline folder to Python analysis paths.
Uses project .env file for environment variables.
Enables linting with pylint on save.
Explicitly points to Python interpreter and pylint inside the project virtual environment.

Editor Enhancements
json
Copy
Edit
"editor.defaultFormatter": "ms-python.black-formatter",
"editor.formatOnSave": true,
"editor.minimap.enabled": false,
"diffEditor.codeLens": true,
"workbench.settings.useSplitJSON": true,
"workbench.editor.enablePreview": false

Sets black as default formatter for Python.
Automatically formats on save.
Disables minimap for cleaner view.
Enables code lens in diff editor.
Uses split JSON view for settings.
Disables preview mode in editors for better tab control.

Summary
These workspace settings ensure smooth multi-language development with Deno, TypeScript, Python, and enhanced editor experience, all configured to your project structure and workflow.


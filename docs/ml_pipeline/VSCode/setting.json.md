# VSCode Settings Overview

These settings are specific to the current workspace. They support both the **backend (Python)** and **frontend (TypeScript + Deno)** parts of the project.

---

## ✅ Python Configuration

```jsonc
"python.analysis.extraPaths": ["./"],
"python.envFile": "${workspaceFolder}/.env",
"python.linting.enabled": true,
"python.linting.pylintEnabled": true,
"python.linting.lintOnSave": true,
"python.linting.pylintPath": "${workspaceFolder}/venv/Scripts/pylint.exe"


extraPaths: Ensures proper import resolution.

envFile: Loads environment variables for Python scripts.

pylint: Enabled for code quality.

"deno.enable": true,
"deno.lint": true,
"deno.unstable": true,
"deno.importMap": "./import_map.json",
"files.associations": {
  "**/supabase/functions/**/*.ts": "typescript"
}

Used for Supabase Edge Functions only.

If not using Deno across the entire project, scope it to subfolders.

Used for Supabase Edge Functions only.




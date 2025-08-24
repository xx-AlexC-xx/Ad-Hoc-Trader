# Import Map

The `import_map.json` file is used to define module specifier aliases for the Deno runtime. This allows you to simplify and standardize your imports across the project without hardcoding long URLs everywhere.

## File: `import_map.json`

```json
{
  "imports": {
    "supabase": "https://esm.sh/@supabase/supabase-js@2.39.5"
  }
}

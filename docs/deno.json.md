# Deno Configuration (`deno.json`)

This file configures the Deno runtime and compiler options for the project.

## Contents

```json
{
  "compilerOptions": {
    "lib": ["deno.ns", "deno.unstable", "dom"]
  },
  "importMap": "./import_map.json"
}

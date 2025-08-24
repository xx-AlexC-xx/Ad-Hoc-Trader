# 📦 Python Requirements

This file lists all required Python packages for the **AdHoc_Trader** project. These packages are pinned to specific versions for consistent builds.

**File**: `requirements.txt`

---

## 🧱 Core Libraries

| **Package**            | **Version** | **Purpose**                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| pydantic               | 2.11.7      | Data validation and settings management using Python type annotations.      |
| pydantic_core          | 2.33.2      | Low-level core of Pydantic.                                                 |
| typing_extensions      | 4.14.1      | Backports for new typing features.                                          |
| typing-inspection      | 0.4.1       | Runtime inspection utilities for types.                                     |
| annotated-types        | 0.7.0       | Defines annotated types to improve Pydantic models.                         |
| StrEnum                | 0.4.15      | Enum base class that serializes to strings.                                 |

---

## 🌐 Web and API Libraries

| **Package**            | **Version** | **Purpose**                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| httpx                  | 0.28.1      | Async HTTP client.                                                          |
| requests               | 2.32.4      | Standard HTTP client.                                                       |
| httpcore               | 1.0.9       | Core HTTP engine used by HTTPX.                                             |
| h11                    | 0.16.0      | HTTP/1.1 client/server protocol.                                            |
| h2                     | 4.2.0       | HTTP/2 protocol support.                                                    |
| hyperframe             | 6.1.0       | Frame-based protocol layer for HTTP/2.                                      |
| idna                   | 3.10        | Internationalized Domain Names.                                             |
| certifi                | 2025.7.14   | SSL certificates.                                                           |
| urllib3                | 2.5.0       | HTTP library used with requests.                                            |
| charset-normalizer     | 3.4.2       | Character encoding auto-detection.                                          |
| sniffio                | 1.3.1       | Async environment sniffing.                                                 |
| anyio                  | 4.9.0       | Async concurrency library used by HTTPX.                                    |
| websockets             | 15.0.1      | WebSocket support.                                                          |

---

## 🔗 Supabase Integration

| **Package**            | **Version** | **Purpose**                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| supabase               | 2.17.0      | Supabase Python SDK.                                                        |
| gotrue                 | 2.12.3      | Auth client for Supabase.                                                   |
| postgrest              | 1.1.1       | REST API layer over PostgreSQL.                                             |
| realtime               | 2.6.0       | Realtime communication with Supabase.                                       |
| storage3               | 0.12.0      | Supabase storage access.                                                    |
| supafunc               | 0.10.1      | Serverless function utilities for Supabase.                                 |

---

## 📘 Markdown & Documentation

| **Package**            | **Version** | **Purpose**                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| mkdocs                 | 1.6.1       | Static site generator.                                                      |
| mkdocs-material        | 9.6.16      | Material design theme for MkDocs.                                           |
| mkdocs-material-extensions | 1.3.1   | Extra features for Material theme.                                          |
| mkdocs-get-deps        | 0.2.0       | MkDocs plugin to extract Python dependencies. 
|mkdocs-mermaid2-plugin  | 1.2.1       | Markdown Extension Mermaid.js                       |
| pymdown-extensions     | 10.16.1     | Markdown extensions (used in Material theme).                               |
| Markdown               | 3.8.2       | Core Python Markdown parser.                                                |
| ghp-import             | 2.1.0       | Publish MkDocs site to GitHub Pages.                                        |

---

## 🛠️ Development Tools

| **Package**            | **Version** | **Purpose**                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| pylint                 | 3.3.7       | Code analysis / linter.                                                     |
| isort                  | 6.0.1       | Sorts imports.                                                              |
| astroid                | 3.3.11      | Abstract syntax tree for Python.                                            |
| mccabe                 | 0.7.0       | Complexity checker (used by pylint).                                        |
| deprecation            | 2.1.0       | Mark deprecated code.                                                       |
| watchdog               | 6.0.0       | File watching utilities.                                                    |

---

## 🧰 Utilities & Config

| **Package**            | **Version** | **Purpose**                                                                 |
|------------------------|-------------|------------------------------------------------------------------------------|
| dill                   | 0.4.0       | Serialize Python objects (better than pickle).                              |
| click                  | 8.2.2       | Command-line utilities.                                                     |
| colorama               | 0.4.6       | Colored terminal output.                                                    |
| python-dotenv          | 1.1.1       | Loads environment variables from .env.                                      |
| pyyaml                 | 6.0.2       | YAML parser.                                                                |
| pyyaml_env_tag         | 1.1         | Adds !ENV support to pyyaml.                                                |
| pathspec               | 0.12.1      | Filesystem pattern matching.                                                |
| platformdirs           | 4.3.8       | OS-specific dirs for config/data/cache.                                     |
| mergedeep              | 1.3.4       | Deep merge dictionaries.                                                    |
| babel                  | 2.17.0      | i18n/l10n tools.                                                             |
| paginate               | 0.5.7       | Pagination for large lists.                                                 |
| Jinja2                 | 3.1.6       | Templating engine.                                                          |
| MarkupSafe             | 3.0.2       | Required by Jinja2.                                                         |
| six                    | 1.17.0      | Python 2/3 compatibility.                                                   |
| python-dateutil        | 2.9.0.post0 | Date parsing utilities.                                                     |
| Pygments               | 2.19.2      | Syntax highlighting.                                                        |
| PyJWT                  | 2.10.1      | JSON Web Token library.                                                     |
| packaging              | 25.0        | Package version parsing.                                                    |

---

## ✅ Installation Command

To install all dependencies, run:

```bash
pip install -r requirements.txt

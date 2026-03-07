# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

This is an early-stage project ("Application Aureak") with no source code yet. This CLAUDE.md should be updated as the project grows.

## Tooling (configured in claude/setting.local.json)

**Language**: Python

**Linting**: `ruff`
```bash
ruff check .
ruff format .
```

**Testing**: pytest
```bash
pytest
python -m pytest
python -m pytest path/to/test_file.py::test_name  # single test
```

**Git workflow**: Standard git commands (init, add, commit, push, etc.) are pre-authorized.

## Documentation & Code Generation

Always use **Context7** (MCP Context7 tools) automatically when:
- Generating code that uses a library or framework
- Following setup or installation steps
- Looking up library/API documentation

This means: resolve the library ID first (`mcp__context7__resolve-library-id`), then fetch the relevant docs (`mcp__context7__query-docs`) — without waiting for an explicit request.

---
name: codebase-memory
description: >-
  Use this skill to query, search, and navigate the codebase structure using the codebase-memory-mcp toolset.
  Ideal for tracing code paths, understanding architecture, searching code semantically, and checking indexing status.
---

# Codebase Memory MCP Skill

This skill teaches the agent how to interact with the `codebase-memory-mcp` tools to quickly understand, index, and query the current repository structure.

## Available Tools

The following tools are available when `codebase-memory-mcp` is active:

1. `index_repository`: Starts or updates the index of the current codebase.
2. `index_status`: Checks the progress and status of the codebase indexing.
3. `search_graph`: Searches for structural code symbols (classes, functions, files, modules).
4. `query_graph`: Performs custom semantic/structural queries on the repository graph.
5. `trace_path`: Traces dependencies and call graphs between files or code symbols.
6. `get_code_snippet`: Retrieves specific parsed functions or class declarations without reading entire files.
7. `get_architecture`: Generates a high-level overview of the folder hierarchy and modules.
8. `search_code`: Performs efficient regex and keyword searches across all indexed code.

## Direct CLI Execution Fallback

If `codebase-memory-mcp` is installed on the system but the direct MCP tools are not registered in your tool declarations, you can execute all commands directly using the CLI:
`codebase-memory-mcp cli <tool_name> [flags]`

### Project Discovery
First, discover the name of the current project (it matches the normalized repository path):
```bash
codebase-memory-mcp cli list_projects
```
*(Example project name: `home-rasel-Rasel-FSD-zakers23-website`)*

### Standard Workflows & Commands

#### 1. Indexing the Workspace
If not already indexed, index the repository by pointing it to the workspace directory:
```bash
codebase-memory-mcp cli index_repository --repo-path /home/rasel/Rasel/FSD/zakers23-website
```

Check status:
```bash
codebase-memory-mcp cli index_status --project home-rasel-Rasel-FSD-zakers23-website
```

#### 2. Searching for Code Symbols
To search for a function, class, or symbol:
```bash
codebase-memory-mcp cli search_graph --project home-rasel-Rasel-FSD-zakers23-website --query "InsightsPage"
```

#### 3. Tracing Call Paths
To trace inbound or outbound dependencies of a function:
```bash
codebase-memory-mcp cli trace_path --project home-rasel-Rasel-FSD-zakers23-website --function-name "getInsightsData" --direction inbound
```

#### 4. Retrieving Code Snippets
To retrieve the exact declaration and body of a symbol:
```bash
codebase-memory-mcp cli get_code_snippet --project home-rasel-Rasel-FSD-zakers23-website --qualified-name "insights-page.tsx"
```

#### 5. High-Level Architecture Overview
```bash
codebase-memory-mcp cli get_architecture --project home-rasel-Rasel-FSD-zakers23-website --aspects overview
```


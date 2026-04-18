# Prompt Entheos Domain Module

This folder is the foundation for Prompt Entheos as a provider-specific prompt optimization system.

Current structure:

```text
modules/prompt-entheos/
  agents/      Provider-specific expert agents
  knowledge/   Local mock knowledge shaped for future official-doc ingestion
  pipeline/    Deterministic orchestration for prompt optimization
  providers/   Central provider metadata and registry helpers
  resolver/    Provider resolution and graceful fallback suggestions
  scoring/     Deterministic scoring helpers
  tasks/       Shared task catalog, registry, and detection rules
  types/       Shared domain contracts
```

How to add a new provider later:

1. Add provider metadata in `providers/catalog.ts`.
2. Add a knowledge file in `knowledge/`.
3. Create a provider agent in `agents/`.
4. Register the agent in `agents/registry.ts`.

The future pipeline, API routes, and UI should depend on this module instead of hardcoding provider logic in pages.

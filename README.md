# Prompt Entheos

Prompt Entheos is a local-first AI prompt workspace for marketers, founders, and product teams.

It combines:

- provider-specific prompt optimization
- reusable Brand Intelligence Profiles
- deterministic Prompt Context Packs
- run history with refinement lineage
- side-by-side run comparison

The current app is built as a single Next.js workspace with a strong domain boundary under `modules/prompt-entheos/`. The UI stays thin, API routes stay thin, and provider logic lives inside domain modules rather than pages.

## What The Product Does

Prompt Entheos helps a user move from one-off prompting to a reusable workflow:

1. Capture business context in a Brand Intelligence profile
2. Convert that context into a reusable Prompt Context Pack
3. Optimize prompts for a specific provider and task
4. Save every optimization run locally
5. Reuse, refine, filter, and compare runs over time

The current product is intentionally:

- local-first
- deterministic
- architecture-first
- friendly to Arabic and English content
- free of auth, billing, scraping, and external persistence services

## Core Workflows

### 1. Prompt Optimization

The user selects:

- provider
- task
- raw prompt
- optional additional context
- optional Brand Intelligence profile

The app then:

- normalizes the input
- resolves the provider
- resolves or validates the task
- sends the request into a provider-specific optimization agent
- returns:
  - optimized prompt
  - rationale
  - score
- saves the result as a local run

### 2. Brand Intelligence

The app includes a multi-step business intake flow that captures:

- company details
- geography
- products or services
- target audience
- competitors
- differentiators
- goals
- tone
- notes

This is turned into a `BrandIntelligenceProfile` that contains:

- facts
- observations
- inferences
- recommendations
- audience summary
- competitor snapshots
- positioning notes
- messaging insights
- content pillars
- prompt context pack

### 3. Run History

Every prompt optimization run is persisted locally and can be:

- browsed
- filtered by provider, task, or brand profile
- reopened as a draft
- refined into a child run
- compared side by side
- deleted

### 4. Run Refinement

A saved run can be loaded back into the optimizer with:

- provider
- task
- raw prompt
- context
- linked brand profile

When optimized again, the result is saved as a new run with a simple parent-child lineage relationship.

### 5. Run Comparison

Two runs can be selected and compared for:

- raw prompt
- optimized prompt
- rationale
- score
- provider
- task
- brand profile
- relationship between runs

## Supported Providers

Current provider catalog:

- `openai`
- `anthropic`
- `gemini`
- `midjourney`

Provider metadata lives in [modules/prompt-entheos/providers/catalog.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/providers/catalog.ts).

Provider-specific prompt behavior lives in:

- [modules/prompt-entheos/agents/openai-agent.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/agents/openai-agent.ts)
- [modules/prompt-entheos/agents/anthropic-agent.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/agents/anthropic-agent.ts)
- [modules/prompt-entheos/agents/gemini-agent.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/agents/gemini-agent.ts)
- [modules/prompt-entheos/agents/midjourney-agent.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/agents/midjourney-agent.ts)

## Supported Tasks

Current shared task catalog:

- `general-chat`
- `marketing-copy`
- `research-assistant`
- `image-generation`

Task definitions live in [modules/prompt-entheos/tasks/catalog.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/tasks/catalog.ts).

## Architecture

The architecture is intentionally layered:

### UI Layer

The UI lives under `app/` and is responsible for:

- layout
- forms
- interaction states
- rendering results
- calling API routes only

Important UI files:

- [app/prompt-optimizer-client.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/prompt-optimizer-client.tsx)
- [app/components/brand-intelligence-wizard.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/brand-intelligence-wizard.tsx)
- [app/components/brand-intelligence-library.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/brand-intelligence-library.tsx)
- [app/components/brand-intelligence-profile-view.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/brand-intelligence-profile-view.tsx)
- [app/components/run-history-panel.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/run-history-panel.tsx)
- [app/components/run-compare-panel.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/run-compare-panel.tsx)
- [app/components/workspace-ui.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/workspace-ui.tsx)

### API Layer

Routes live under `app/api/` and are thin adapters over services and pipeline logic.

Current routes:

- `/api/prompt-optimization`
- `/api/brand-intelligence`
- `/api/brand-intelligence/[profileId]`
- `/api/brand-intelligence/analyze`
- `/api/runs`
- `/api/runs/[runId]`
- `/api/runs/[runId]/refine`
- `/api/runs/compare`
- `/api/brands`
- `/api/brands/[brandId]`

### Domain Layer

The real product logic lives under `modules/prompt-entheos/`.

Main areas:

- `agents/`: provider-specific optimization behavior
- `api/`: shared API request/response contracts
- `brands/`: older lightweight brand profile workflow
- `intelligence/`: Brand Intelligence Profiles and Prompt Context Packs
- `pipeline/`: deterministic prompt optimization orchestration
- `providers/`: provider metadata and registry helpers
- `resolver/`: provider resolution and suggestions
- `runs/`: run persistence, lineage, refinement, comparison
- `tasks/`: task registry and detection
- `types/`: shared domain types
- `data/`: local JSON file store helpers and service errors
- `knowledge/`: local provider knowledge scaffolding
- `scoring/`: heuristic scoring helpers

## Project Structure

```text
app/
  api/
  components/
  globals.css
  layout.tsx
  page.tsx
  prompt-optimizer-client.tsx

modules/prompt-entheos/
  agents/
  api/
  brands/
  data/
  intelligence/
  knowledge/
  pipeline/
  providers/
  resolver/
  runs/
  scoring/
  tasks/
  types/

scripts/
  prompt-pipeline-smoke.ts
```

## Local-First Persistence

This project stores application data on disk under:

```text
.data/prompt-entheos/
```

Current files:

- `brands.json`
- `brand-intelligence-profiles.json`
- `runs.json`

Persistence behavior is implemented in [modules/prompt-entheos/data/file-store.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/data/file-store.ts).

Notes:

- writes are queued
- writes are atomic via temp-file rename
- missing files are auto-created with fallbacks
- older saved run records are normalized for backward compatibility

## Important Domain Types

Some of the most important shared contracts are:

- `PromptOptimizationRequest`
- `PromptOptimizationResponse`
- `BrandIntelligenceProfile`
- `PromptContextPack`
- `SavedPromptRun`
- `RunRefinementDraft`
- `RunComparison`

These live mainly in:

- [modules/prompt-entheos/api/prompt-optimization-contract.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/api/prompt-optimization-contract.ts)
- [modules/prompt-entheos/api/brand-intelligence-contract.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/api/brand-intelligence-contract.ts)
- [modules/prompt-entheos/api/runs-contract.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/api/runs-contract.ts)
- [modules/prompt-entheos/types/intelligence.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/types/intelligence.ts)
- [modules/prompt-entheos/types/run-history.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/types/run-history.ts)

## Prompt Optimization Pipeline

The pipeline is deterministic and provider-aware.

High-level flow:

1. Normalize raw input
2. Validate prompt/provider/task
3. Detect or resolve the task
4. Resolve the provider
5. Build agent input
6. Run provider-specific optimization
7. Score the result
8. Persist the run

Key files:

- [modules/prompt-entheos/pipeline/prompt-optimization-pipeline.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/pipeline/prompt-optimization-pipeline.ts)
- [modules/prompt-entheos/pipeline/normalize.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/pipeline/normalize.ts)
- [modules/prompt-entheos/resolver/provider-resolver.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/resolver/provider-resolver.ts)

## Brand Intelligence System

The Brand Intelligence system is a structured context engine built for prompt optimization.

Important files:

- [modules/prompt-entheos/intelligence/intake.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/intelligence/intake.ts)
- [modules/prompt-entheos/intelligence/analysis.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/intelligence/analysis.ts)
- [modules/prompt-entheos/intelligence/service.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/intelligence/service.ts)
- [modules/prompt-entheos/intelligence/repository.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/intelligence/repository.ts)

What it produces:

- summaries
- messaging guidance
- positioning notes
- audience framing
- competitor watchouts
- prompt instructions

## Run History, Refinement, and Compare

The run system supports:

- newest-first listing
- filtering
- retrieval by ID
- deletion
- reuse
- refinement draft generation
- comparison between two runs
- lineage metadata

Key files:

- [modules/prompt-entheos/runs/service.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/runs/service.ts)
- [modules/prompt-entheos/runs/repository.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/modules/prompt-entheos/runs/repository.ts)

## UI Design Direction

The current UI is designed as:

- dark, modern, serious SaaS workspace
- Arabic-first but still usable with English text
- dashboard-style shell
- two-column optimizer workspace
- local product feel rather than template demo styling

Global UI primitives live in [app/components/workspace-ui.tsx](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/app/components/workspace-ui.tsx).

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

Smoke test the prompt pipeline:

```bash
npm run smoke:prompt
```

The smoke script lives in [scripts/prompt-pipeline-smoke.ts](/Users/mapmac/Desktop/Prompt%20Entheos/prompt-entheos/scripts/prompt-pipeline-smoke.ts).

## Technical Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- local JSON persistence

## Design and Implementation Constraints

This repo intentionally avoids:

- auth
- billing
- external AI API calls in the app runtime
- scraping
- heavy frontend state libraries
- provider-specific business logic in pages

The goal is to keep the system:

- maintainable for a solo founder
- easy to reason about
- deterministic
- simple to extend

## How To Extend The Project

### Add a new provider

1. Add metadata in `modules/prompt-entheos/providers/catalog.ts`
2. Add a provider knowledge file in `modules/prompt-entheos/knowledge/`
3. Add a provider agent in `modules/prompt-entheos/agents/`
4. Register the agent in `modules/prompt-entheos/agents/registry.ts`

### Add a new task

1. Add the task to `modules/prompt-entheos/tasks/catalog.ts`
2. Update task typing if needed
3. Ensure supported providers reference it
4. Update UI selectors automatically through the existing metadata route

### Add a new workspace surface

Keep the current boundary:

- UI calls API routes
- API routes call services and pipeline
- domain logic stays under `modules/prompt-entheos/`

## Current State

This project already includes:

- provider-specific agents
- provider resolver
- deterministic prompt optimization pipeline
- local heuristic scoring
- Brand Intelligence Profiles
- Prompt Context Packs
- local-first run persistence
- run refinement
- run comparison
- modern workspace UI

It is no longer a starter stub. It is now a structured product workspace with real domain boundaries and reusable flows.

"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandIntelligenceLibrary } from "@/app/components/brand-intelligence-library";
import { BrandIntelligenceProfileView } from "@/app/components/brand-intelligence-profile-view";
import { BrandIntelligenceWizard } from "@/app/components/brand-intelligence-wizard";
import { RunComparePanel } from "@/app/components/run-compare-panel";
import { RunHistoryPanel } from "@/app/components/run-history-panel";
import {
  Badge,
  MetricCard,
  WorkspaceSection,
  nestedSurfaceClass,
  primaryButtonClass,
  secondaryButtonClass,
  subtleButtonClass,
  surfaceClass,
} from "@/app/components/workspace-ui";
import type {
  BrandIntelligenceAnalyzeRequest,
  BrandIntelligenceDeleteResponse,
  BrandIntelligenceErrorResponse,
  BrandIntelligenceListResponse,
  BrandIntelligenceSuccessResponse,
} from "@/modules/prompt-entheos/api/brand-intelligence-contract";
import type {
  PromptOptimizationErrorResponse,
  PromptOptimizationMetadataResponse,
  PromptOptimizationResponse,
} from "@/modules/prompt-entheos/api/prompt-optimization-contract";
import type {
  RunCompareResponse,
  RunDeleteResponse,
  RunErrorResponse,
  RunRefinementResponse,
  RunResponse,
  RunsListResponse,
} from "@/modules/prompt-entheos/api/runs-contract";
import {
  createEmptyBusinessIntakeInput,
  normalizeBusinessIntakeInput,
  validateBusinessIntakeInput,
} from "@/modules/prompt-entheos/intelligence/intake";
import type {
  BrandIntelligenceProfile,
  BrandIntelligenceValidationErrors,
  BusinessIntakeInput,
  CompetitorSeed,
  PromptScore,
  RunComparison,
  RunFilters,
  SavedPromptRun,
} from "@/modules/prompt-entheos/types";

type IntakeListField = "productsOrServices" | "goals" | "differentiators";

interface PromptFormState {
  provider: string;
  task: string;
  rawPrompt: string;
  context: string;
}

interface DisplayResult {
  optimizedPrompt: string;
  rationale: {
    summary: string;
    reasons: string[];
  };
  score: PromptScore;
  resolvedProvider: {
    name: string;
    description?: string;
  };
  resolvedTask: {
    name: string;
    description?: string;
  };
}

interface FeedbackState {
  tone: "success" | "error";
  message: string;
}

interface ActiveRefinementState {
  parentRunId: string;
  refinementType: string;
  sourceRun: SavedPromptRun;
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function sortProfiles(profiles: BrandIntelligenceProfile[]): BrandIntelligenceProfile[] {
  return [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function toDisplayResultFromOptimization(
  response: Extract<PromptOptimizationResponse, { ok: true }>,
): DisplayResult {
  return {
    optimizedPrompt: response.optimizedPrompt,
    rationale: response.rationale,
    score: response.score,
    resolvedProvider: response.resolvedProvider,
    resolvedTask: response.resolvedTask,
  };
}

function toDisplayResultFromRun(run: SavedPromptRun): DisplayResult {
  return {
    optimizedPrompt: run.optimizedPrompt,
    rationale: run.rationale,
    score: run.score,
    resolvedProvider: run.resolvedProvider,
    resolvedTask: run.resolvedTask,
  };
}

function toDraftFromProfile(profile: BrandIntelligenceProfile): BusinessIntakeInput {
  return {
    companyName: profile.companyName,
    websiteUrl: profile.websiteUrl ?? "",
    businessType: profile.businessType,
    geography: profile.geography,
    productsOrServices:
      profile.productsOrServices.length > 0 ? profile.productsOrServices : [""],
    targetAudience: profile.targetAudience,
    competitors: profile.competitors,
    goals: profile.goals.length > 0 ? profile.goals : [""],
    tone: profile.tone,
    differentiators:
      profile.differentiators.length > 0 ? profile.differentiators : [""],
    notes: profile.notes ?? "",
  };
}

function buildRunsRequestUrl(filters: RunFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.provider) {
    searchParams.set("provider", filters.provider);
  }

  if (filters.task) {
    searchParams.set("task", filters.task);
  }

  if (filters.brandProfileId) {
    searchParams.set("brandProfileId", filters.brandProfileId);
  }

  const query = searchParams.toString();
  return query ? `/api/runs?${query}` : "/api/runs";
}

export function PromptOptimizerClient() {
  const [metadata, setMetadata] = useState<PromptOptimizationMetadataResponse | null>(null);
  const [profiles, setProfiles] = useState<BrandIntelligenceProfile[]>([]);
  const [runs, setRuns] = useState<SavedPromptRun[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [promptForm, setPromptForm] = useState<PromptFormState>({
    provider: "",
    task: "",
    rawPrompt: "",
    context: "",
  });
  const [intakeDraft, setIntakeDraft] = useState<BusinessIntakeInput>(
    createEmptyBusinessIntakeInput(),
  );
  const [intakeErrors, setIntakeErrors] = useState<BrandIntelligenceValidationErrors>({});
  const [intakeMode, setIntakeMode] = useState<"create" | "edit">("create");
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [optimizationError, setOptimizationError] =
    useState<PromptOptimizationErrorResponse | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [reusingRunId, setReusingRunId] = useState<string | null>(null);
  const [refiningRunId, setRefiningRunId] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [runFilters, setRunFilters] = useState<RunFilters>({});
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompareRunIds, setSelectedCompareRunIds] = useState<string[]>([]);
  const [isComparingRuns, setIsComparingRuns] = useState(false);
  const [comparison, setComparison] = useState<RunComparison | null>(null);
  const [activeRefinement, setActiveRefinement] = useState<ActiveRefinementState | null>(null);
  const [latestResultRunId, setLatestResultRunId] = useState<string | null>(null);

  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? null;
  const selectedProvider =
    metadata?.providers.find((provider) => provider.id === promptForm.provider) ?? null;
  const availableTasks = metadata
    ? selectedProvider
      ? metadata.tasks.filter((task) => selectedProvider.supportedTasks.includes(task.id))
      : metadata.tasks
    : [];
  const editingProfile =
    profiles.find((profile) => profile.id === editingProfileId) ?? null;

  const loadRuns = useCallback(async (filters: RunFilters = {}) => {
    setIsLoadingRuns(true);

    try {
      const response = await fetch(buildRunsRequestUrl(filters), {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as RunsListResponse;
      setRuns(data.runs);
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not load run history.",
      });
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function bootstrap() {
      try {
        const [metadataResponse, profilesResponse, runsResponse] = await Promise.all([
          fetch("/api/prompt-optimization", {
            method: "GET",
            cache: "no-store",
          }),
          fetch("/api/brand-intelligence", {
            method: "GET",
            cache: "no-store",
          }),
          fetch(buildRunsRequestUrl({}), {
            method: "GET",
            cache: "no-store",
          }),
        ]);
        const metadataData =
          (await metadataResponse.json()) as PromptOptimizationMetadataResponse;
        const profilesData = (await profilesResponse.json()) as BrandIntelligenceListResponse;
        const runsData = (await runsResponse.json()) as RunsListResponse;

        if (!isActive) {
          return;
        }

        setMetadata(metadataData);
        setPromptForm((current) => ({
          ...current,
          provider: current.provider || metadataData.defaults.provider,
          task: current.task || metadataData.defaults.task,
        }));
        setProfiles(sortProfiles(profilesData.profiles));
        setSelectedProfileId((current) =>
          current && profilesData.profiles.some((profile) => profile.id === current)
            ? current
            : "",
        );
        setRuns(runsData.runs);
      } catch {
        if (!isActive) {
          return;
        }

        setFeedback({
          tone: "error",
          message: "Could not load the initial app data.",
        });
      } finally {
        if (!isActive) {
          return;
        }

        setIsLoadingMetadata(false);
        setIsLoadingProfiles(false);
        setIsLoadingRuns(false);
      }
    }

    void bootstrap();

    return () => {
      isActive = false;
    };
  }, [loadRuns]);

  function scrollToPromptOptimizer() {
    document.getElementById("prompt-optimizer")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToSection(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function clearRefinement() {
    setActiveRefinement(null);
  }

  async function handleCopyOptimizedPrompt() {
    if (!result?.optimizedPrompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.optimizedPrompt);
      setFeedback({
        tone: "success",
        message: "Optimized prompt copied to clipboard.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not copy the optimized prompt right now.",
      });
    }
  }

  function updatePromptField<Key extends keyof PromptFormState>(
    key: Key,
    value: PromptFormState[Key],
  ) {
    setPromptForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleProviderChange(providerId: string) {
    const provider = metadata?.providers.find((candidate) => candidate.id === providerId);

    setPromptForm((current) => ({
      ...current,
      provider: providerId,
      task:
        provider && !provider.supportedTasks.includes(current.task as (typeof provider.supportedTasks)[number])
          ? provider.supportedTasks[0] ?? current.task
          : current.task,
    }));
  }

  function updateIntakeField<Key extends keyof BusinessIntakeInput>(
    field: Key,
    value: BusinessIntakeInput[Key],
  ) {
    setIntakeDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setIntakeErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function updateListItem(field: IntakeListField, index: number, value: string) {
    setIntakeDraft((current) => {
      const nextValues = [...current[field]];
      nextValues[index] = value;

      return {
        ...current,
        [field]: nextValues,
      };
    });
    setIntakeErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function addListItem(field: IntakeListField) {
    setIntakeDraft((current) => ({
      ...current,
      [field]: [...current[field], ""],
    }));
  }

  function removeListItem(field: IntakeListField, index: number) {
    setIntakeDraft((current) => {
      const nextValues = current[field].filter((_, currentIndex) => currentIndex !== index);

      return {
        ...current,
        [field]: nextValues.length > 0 ? nextValues : [""],
      };
    });
  }

  function updateCompetitor<Key extends keyof CompetitorSeed>(
    index: number,
    field: Key,
    value: CompetitorSeed[Key],
  ) {
    setIntakeDraft((current) => ({
      ...current,
      competitors: current.competitors.map((competitor, currentIndex) =>
        currentIndex === index
          ? {
              ...competitor,
              [field]: value,
            }
          : competitor,
      ),
    }));
  }

  function addCompetitor() {
    setIntakeDraft((current) => ({
      ...current,
      competitors: [...current.competitors, { name: "", websiteUrl: "", notes: "" }],
    }));
  }

  function removeCompetitor(index: number) {
    setIntakeDraft((current) => ({
      ...current,
      competitors: current.competitors.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function resetIntakeDraft() {
    setIntakeDraft(createEmptyBusinessIntakeInput());
    setIntakeErrors({});
    setIntakeMode("create");
    setEditingProfileId(null);
    setSelectedProfileId("");
  }

  function handleSelectProfile(profileId: string) {
    setSelectedProfileId(profileId);
    setFeedback(null);
  }

  function handleEditProfile(profileId: string) {
    const profile = profiles.find((candidate) => candidate.id === profileId);

    if (!profile) {
      return;
    }

    setSelectedProfileId(profile.id);
    setIntakeDraft(toDraftFromProfile(profile));
    setIntakeErrors({});
    setIntakeMode("edit");
    setEditingProfileId(profile.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveProfile() {
    const validationErrors = validateBusinessIntakeInput(
      normalizeBusinessIntakeInput(intakeDraft),
    );

    if (Object.keys(validationErrors).length > 0) {
      setIntakeErrors(validationErrors);
      setFeedback({
        tone: "error",
        message: "Please complete the required business intake fields before saving.",
      });
      return;
    }

    setIsSavingProfile(true);
    setIntakeErrors({});
    setFeedback(null);

    try {
      const payload: BrandIntelligenceAnalyzeRequest = {
        input: intakeDraft,
        persist: true,
        profileId: intakeMode === "edit" ? editingProfileId ?? undefined : undefined,
      };
      const response = await fetch("/api/brand-intelligence/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as
        | BrandIntelligenceSuccessResponse
        | BrandIntelligenceErrorResponse;

      if (!response.ok || !("ok" in data) || !data.ok) {
        if ("error" in data) {
          setIntakeErrors(data.error.fieldErrors ?? {});
          setFeedback({
            tone: "error",
            message: data.error.message,
          });
        }
        return;
      }

      setProfiles((current) =>
        sortProfiles([data.profile, ...current.filter((profile) => profile.id !== data.profile.id)]),
      );
      setSelectedProfileId(data.profile.id);
      setIntakeDraft(toDraftFromProfile(data.profile));
      setIntakeMode("edit");
      setEditingProfileId(data.profile.id);
      setFeedback({
        tone: "success",
        message: data.message,
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not analyze and save the Brand Intelligence profile right now.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleDeleteProfile(profileId: string) {
    setDeletingProfileId(profileId);

    try {
      const response = await fetch(`/api/brand-intelligence/${profileId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as
        | BrandIntelligenceDeleteResponse
        | BrandIntelligenceErrorResponse;

      if (!response.ok || !("ok" in data) || !data.ok) {
        setFeedback({
          tone: "error",
          message: "Could not delete this Brand Intelligence profile.",
        });
        return;
      }

      setProfiles((current) => current.filter((profile) => profile.id !== profileId));

      if (selectedProfileId === profileId) {
        setSelectedProfileId("");
      }

      if (editingProfileId === profileId) {
        setIntakeDraft(createEmptyBusinessIntakeInput());
        setIntakeErrors({});
        setIntakeMode("create");
        setEditingProfileId(null);
      }

      if (runFilters.brandProfileId === profileId) {
        const nextFilters = {
          ...runFilters,
          brandProfileId: undefined,
        };

        setRunFilters(nextFilters);
        await loadRuns(nextFilters);
      }

      setFeedback({
        tone: "success",
        message: data.message,
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not delete this Brand Intelligence profile.",
      });
    } finally {
      setDeletingProfileId(null);
    }
  }

  function handleUseProfileInPrompt(profileId: string) {
    setSelectedProfileId(profileId);
    setFeedback({
      tone: "success",
      message: "Brand Intelligence profile linked to the prompt optimizer.",
    });
    scrollToPromptOptimizer();
  }

  async function handlePromptSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOptimizing(true);
    setOptimizationError(null);
    setFeedback(null);

    try {
      const response = await fetch("/api/prompt-optimization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: promptForm.provider,
          task: promptForm.task,
          rawPrompt: promptForm.rawPrompt,
          context: promptForm.context || undefined,
          brandProfileId: selectedProfileId || undefined,
          parentRunId: activeRefinement?.parentRunId,
          refinementType: activeRefinement?.refinementType,
        }),
      });
      const data = (await response.json()) as PromptOptimizationResponse;

      if (!data.ok) {
        setResult(null);
        setLatestResultRunId(null);
        setOptimizationError(data);
        return;
      }

      setResult(toDisplayResultFromOptimization(data));
      setLatestResultRunId(data.runId ?? null);
      setFeedback({
        tone: "success",
        message: activeRefinement
          ? "Refinement saved as a new child run."
          : "Prompt optimized and saved to local history.",
      });
      clearRefinement();
      await loadRuns(runFilters);
    } catch {
      setOptimizationError({
        ok: false,
        error: {
          code: "PROVIDER_NOT_RESOLVED",
          message: "Something went wrong while running optimization.",
        },
        suggestions: {
          providers: [],
          tasks: [],
        },
      });
    } finally {
      setIsOptimizing(false);
    }
  }

  async function handleReuseRun(runId: string) {
    setReusingRunId(runId);

    try {
      const response = await fetch(`/api/runs/${runId}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as RunResponse | RunErrorResponse;

      if (!response.ok || !("run" in data)) {
        setFeedback({
          tone: "error",
          message: "Could not load this run.",
        });
        return;
      }

      const nextSelectedProfileId =
        data.run.brandProfileId &&
        profiles.some((profile) => profile.id === data.run.brandProfileId)
          ? data.run.brandProfileId
          : "";

      setSelectedProfileId(nextSelectedProfileId);
      setPromptForm({
        provider: data.run.provider,
        task: data.run.task,
        rawPrompt: data.run.rawPrompt,
        context: data.run.context ?? "",
      });
      setLatestResultRunId(data.run.id);
      clearRefinement();
      setResult(toDisplayResultFromRun(data.run));
      setOptimizationError(null);
      setFeedback({
        tone: "success",
        message: nextSelectedProfileId
          ? "Run loaded back into the form with its Brand Intelligence profile."
          : "Run loaded back into the form.",
      });
      scrollToPromptOptimizer();
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not reuse this run.",
      });
    } finally {
      setReusingRunId(null);
    }
  }

  async function handleRefineRun(runId: string) {
    setRefiningRunId(runId);

    try {
      const response = await fetch(`/api/runs/${runId}/refine`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as RunRefinementResponse | RunErrorResponse;

      if (!response.ok || !("draft" in data)) {
        setFeedback({
          tone: "error",
          message: "Could not prepare this run for refinement.",
        });
        return;
      }

      const nextSelectedProfileId =
        data.draft.brandProfileId &&
        profiles.some((profile) => profile.id === data.draft.brandProfileId)
          ? data.draft.brandProfileId
          : "";

      setSelectedProfileId(nextSelectedProfileId);
      setPromptForm({
        provider: data.draft.provider,
        task: data.draft.task,
        rawPrompt: data.draft.rawPrompt,
        context: data.draft.context ?? "",
      });
      setLatestResultRunId(data.sourceRun.id);
      setActiveRefinement({
        parentRunId: data.draft.parentRunId,
        refinementType: data.draft.refinementType,
        sourceRun: data.sourceRun,
      });
      setResult(toDisplayResultFromRun(data.sourceRun));
      setOptimizationError(null);
      setFeedback({
        tone: "success",
        message: "Refinement draft loaded. Your next optimization will be saved as a child run.",
      });
      scrollToPromptOptimizer();
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not prepare this run for refinement.",
      });
    } finally {
      setRefiningRunId(null);
    }
  }

  async function handleDeleteRun(runId: string) {
    setDeletingRunId(runId);

    try {
      const response = await fetch(`/api/runs/${runId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as RunDeleteResponse | RunErrorResponse;

      if (!response.ok || !("ok" in data) || !data.ok) {
        setFeedback({
          tone: "error",
          message: "Could not delete this run.",
        });
        return;
      }

      await loadRuns(runFilters);
      setSelectedCompareRunIds((current) => current.filter((currentRunId) => currentRunId !== runId));
      setComparison((current) =>
        current && current.runs.some((run) => run.id === runId) ? null : current,
      );
      setLatestResultRunId((current) => (current === runId ? null : current));
      setFeedback({
        tone: "success",
        message: data.message,
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not delete this run.",
      });
    } finally {
      setDeletingRunId(null);
    }
  }

  async function handleRunFiltersChange(nextFilters: RunFilters) {
    setRunFilters(nextFilters);
    setSelectedCompareRunIds([]);
    setComparison(null);
    await loadRuns(nextFilters);
  }

  function handleToggleCompareMode() {
    setIsCompareMode((current) => {
      const next = !current;

      if (!next) {
        setSelectedCompareRunIds([]);
        setComparison(null);
      }

      return next;
    });
  }

  function handleToggleRunSelection(runId: string) {
    setSelectedCompareRunIds((current) => {
      const nextSelection = current.includes(runId)
        ? current.filter((currentRunId) => currentRunId !== runId)
        : current.length === 2
          ? [current[1], runId]
          : [...current, runId];

      if (nextSelection.length !== 2) {
        setComparison(null);
      }

      return nextSelection;
    });
  }

  async function handleCompareRuns() {
    if (selectedCompareRunIds.length !== 2) {
      return;
    }

    setIsComparingRuns(true);

    try {
      const searchParams = new URLSearchParams();
      selectedCompareRunIds.forEach((runId) => searchParams.append("runIds", runId));
      const response = await fetch(`/api/runs/compare?${searchParams.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as RunCompareResponse | RunErrorResponse;

      if (!response.ok || !("comparison" in data)) {
        setFeedback({
          tone: "error",
          message: "Could not compare the selected runs.",
        });
        return;
      }

      setComparison(data.comparison);
      setFeedback({
        tone: "success",
        message: "Run comparison is ready.",
      });
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not compare the selected runs.",
      });
    } finally {
      setIsComparingRuns(false);
    }
  }

  function handleCloseComparison() {
    setComparison(null);
    setSelectedCompareRunIds([]);
    setIsCompareMode(false);
  }

  const latestVisibleRun = runs[0] ?? null;
  const activeResultRun =
    (latestResultRunId && runs.find((run) => run.id === latestResultRunId)) ?? latestVisibleRun;
  const profileLinkedToOptimizer =
    selectedProfileId && selectedProfile ? selectedProfile : null;

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(148,163,184,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.04)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />

      <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className={`sticky top-4 z-20 ${surfaceClass} px-4 py-4 sm:px-6`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-sm font-bold text-slate-950">
                  PE
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.24em] text-slate-500 uppercase">
                    Prompt Entheos
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    AI workspace for strategy-aware prompt optimization
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex flex-wrap gap-2">
              {[
                ["prompt-optimizer", "Prompt Optimizer"],
                ["brand-intelligence", "Brand Intelligence"],
                ["profiles-library", "Profiles Library"],
                ["run-history", "Run History"],
                ["compare-workspace", "Compare"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={subtleButtonClass}
                  onClick={() => scrollToSection(id)}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <section className={`${surfaceClass} overflow-hidden px-5 py-6 sm:px-6 sm:py-7`}>
          <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="accent">Local-first</Badge>
                <Badge>Arabic-first</Badge>
                <Badge>Provider-safe architecture</Badge>
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                Brand Intelligence meets prompt optimization in one focused workspace.
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-400 sm:text-lg">
                Collect structured business context, connect it to provider-specific prompt optimization,
                and iterate through saved runs with refinement and comparison built in.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <MetricCard
                label="Profiles"
                value={String(profiles.length)}
                helper="Reusable Brand Intelligence contexts"
              />
              <MetricCard
                label="Runs"
                value={String(runs.length)}
                helper="Saved prompt optimization attempts"
              />
              <MetricCard
                label="Compare"
                value={comparison ? "Active" : isCompareMode ? "Ready" : "Off"}
                helper="Side-by-side review workspace"
              />
            </div>
          </div>
        </section>

        {feedback ? (
          <div
            className={`rounded-[22px] border px-4 py-4 text-sm ${
              feedback.tone === "success"
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                : "border-rose-300/20 bg-rose-400/10 text-rose-100"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div id="brand-intelligence" className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <BrandIntelligenceWizard
            key={`${intakeMode}:${editingProfileId ?? "new"}`}
            errors={intakeErrors}
            isSubmitting={isSavingProfile}
            mode={intakeMode}
            profile={editingProfile}
            value={intakeDraft}
            onAddCompetitor={addCompetitor}
            onAddListItem={addListItem}
            onChange={updateIntakeField}
            onCompetitorChange={updateCompetitor}
            onListItemChange={updateListItem}
            onRemoveCompetitor={removeCompetitor}
            onRemoveListItem={removeListItem}
            onReset={resetIntakeDraft}
            onSubmit={handleSaveProfile}
          />

          <div id="profiles-library" className="grid gap-6">
            <BrandIntelligenceLibrary
              deletingProfileId={deletingProfileId}
              isLoading={isLoadingProfiles}
              profiles={profiles}
              selectedProfileId={selectedProfileId}
              onCreate={resetIntakeDraft}
              onDelete={handleDeleteProfile}
              onEdit={handleEditProfile}
              onSelect={handleSelectProfile}
            />

            <BrandIntelligenceProfileView
              profile={selectedProfile}
              onEdit={handleEditProfile}
              onUseInPrompt={handleUseProfileInPrompt}
            />
          </div>
        </div>

        <div
          id="prompt-optimizer"
          className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]"
        >
          <WorkspaceSection>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] tracking-[0.24em] text-slate-500 uppercase">
                  Prompt Optimizer
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Prompt workspace
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-400">
                Configure provider and task, attach an optional Brand Intelligence profile, then iterate from history instead of rewriting prompts from scratch.
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handlePromptSubmit}>

            {activeRefinement ? (
              <div className="rounded-[22px] border border-cyan-300/20 bg-cyan-300/10 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs tracking-[0.18em] text-cyan-100 uppercase">
                      Refinement Mode
                    </p>
                    <p className="mt-2 text-sm leading-7 text-cyan-50">
                      The next optimization will be saved as a child run of{" "}
                      {activeRefinement.sourceRun.resolvedProvider.name} ·{" "}
                      {activeRefinement.sourceRun.resolvedTask.name}.
                    </p>
                    <p className="mt-1 text-xs text-cyan-100/80">
                      Parent run: {activeRefinement.parentRunId.slice(0, 8)} ·{" "}
                      {new Date(activeRefinement.sourceRun.createdAt).toLocaleString("en-US")}
                    </p>
                  </div>

                  <button type="button" className={subtleButtonClass} onClick={clearRefinement}>
                    Exit refinement
                  </button>
                </div>
              </div>
            ) : null}

            <div className={nestedSurfaceClass}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Brand context</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Link a profile when you want the optimizer to inherit strategy, audience, and positioning.
                  </p>
                </div>
                {profileLinkedToOptimizer ? <Badge tone="accent">Connected</Badge> : <Badge>No profile</Badge>}
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">
                  Brand Intelligence profile
                </span>
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0a1017] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
                  value={selectedProfileId}
                  onChange={(event) => setSelectedProfileId(event.target.value)}
                  disabled={isLoadingProfiles || isOptimizing}
                >
                  <option value="">No profile selected</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.companyName}
                    </option>
                  ))}
                </select>
              </label>

              {isLoadingProfiles ? (
                <p className="mt-3 text-sm text-slate-400">Loading Brand Intelligence profiles...</p>
              ) : null}

              {!isLoadingProfiles && profiles.length === 0 ? (
                <div className="mt-4 rounded-[20px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-5">
                  <p className="text-sm font-medium text-white">No Brand Intelligence yet</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    The optimizer still works without a profile, but prompts become stronger when
                    you pass reusable business context first.
                  </p>
                </div>
              ) : null}

              {selectedProfile ? (
                <div className="mt-4 rounded-[20px] border border-cyan-300/12 bg-cyan-300/[0.08] p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="accent">{selectedProfile.companyName}</Badge>
                    <Badge>{selectedProfile.targetAudience}</Badge>
                    <Badge>{selectedProfile.tone}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-100">
                    {selectedProfile.promptContextPack.summary}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={nestedSurfaceClass}>
                <span className="text-sm font-medium text-slate-200">Provider</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0a1017] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
                  value={promptForm.provider}
                  onChange={(event) => handleProviderChange(event.target.value)}
                  disabled={isLoadingMetadata || isOptimizing}
                >
                  {metadata?.providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={nestedSurfaceClass}>
                <span className="text-sm font-medium text-slate-200">Task</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0a1017] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/35"
                  value={promptForm.task}
                  onChange={(event) => updatePromptField("task", event.target.value)}
                  disabled={isLoadingMetadata || isOptimizing}
                >
                  {availableTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={nestedSurfaceClass}>
              <span className="text-sm font-medium text-slate-200">Raw prompt</span>
              <textarea
                className="mt-2 min-h-52 w-full rounded-[22px] border border-white/10 bg-[#0a1017] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
                placeholder="أريد برومبت يطلب من النموذج كتابة صفحة هبوط تقنع فرق النمو بالاشتراك..."
                value={promptForm.rawPrompt}
                onChange={(event) => updatePromptField("rawPrompt", event.target.value)}
                disabled={isOptimizing}
              />
            </label>

            <label className={nestedSurfaceClass}>
              <span className="text-sm font-medium text-slate-200">Additional context</span>
              <textarea
                className="mt-2 min-h-32 w-full rounded-[22px] border border-white/10 bg-[#0a1017] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/35"
                placeholder="Optional: campaign context, constraints, deliverable notes, or extra guidance."
                value={promptForm.context}
                onChange={(event) => updatePromptField("context", event.target.value)}
                disabled={isOptimizing}
              />
            </label>

            {optimizationError ? (
              <div className="rounded-[22px] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
                <p className="font-medium">{optimizationError.error.message}</p>
                {optimizationError.suggestions.tasks.length > 0 ? (
                  <p className="mt-2 text-rose-100/80">
                    Suggested tasks:{" "}
                    {optimizationError.suggestions.tasks.map((task) => task.name).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <button type="submit" className={`${primaryButtonClass} min-h-14 w-full text-base`} disabled={isLoadingMetadata || isOptimizing}>
              {isOptimizing ? "Optimizing..." : "Optimize Prompt"}
            </button>
            </form>
          </WorkspaceSection>

          <div className="grid gap-4">
            <WorkspaceSection>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] tracking-[0.24em] text-slate-500 uppercase">Result</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Optimized prompt</h2>
                </div>

                {result ? (
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="accent">{result.resolvedProvider.name}</Badge>
                    <Badge tone="success">{result.resolvedTask.name}</Badge>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 rounded-[22px] border border-white/8 bg-[#0a1017] p-4">
                <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                  {result?.optimizedPrompt ??
                    "Your optimized prompt will appear here after you run the workspace."}
                </pre>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={secondaryButtonClass}
                  onClick={handleCopyOptimizedPrompt}
                  disabled={!result}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className={subtleButtonClass}
                  onClick={() => activeResultRun && handleRefineRun(activeResultRun.id)}
                  disabled={!activeResultRun || Boolean(refiningRunId || reusingRunId)}
                >
                  Refine
                </button>
                <button
                  type="button"
                  className={subtleButtonClass}
                  onClick={() => activeResultRun && handleReuseRun(activeResultRun.id)}
                  disabled={!activeResultRun || Boolean(refiningRunId || reusingRunId)}
                >
                  Reuse
                </button>
              </div>
            </WorkspaceSection>

            <WorkspaceSection>
              <p className="text-[11px] tracking-[0.24em] text-slate-500 uppercase">Rationale</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Why this version is stronger</h2>
              <div className="mt-5 rounded-[22px] border border-white/8 bg-[#0b1118] p-4">
                <p className="text-sm leading-7 text-slate-100">
                  {result?.rationale.summary ??
                    "A concise explanation of optimization choices will appear here after a run completes."}
                </p>
                {result ? (
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                    {result.rationale.reasons.map((reason) => (
                      <li
                        key={reason}
                        className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </WorkspaceSection>

            <WorkspaceSection>
              <p className="text-[11px] tracking-[0.24em] text-slate-500 uppercase">Score</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Quality snapshot</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <ScoreRow label="Overall" value={result?.score.overall ?? 0} />
                <ScoreRow label="Clarity" value={result?.score.breakdown.clarity ?? 0} />
                <ScoreRow label="Structure" value={result?.score.breakdown.structure ?? 0} />
                <ScoreRow label="Specificity" value={result?.score.breakdown.specificity ?? 0} />
                <ScoreRow label="Provider Fit" value={result?.score.breakdown.providerFit ?? 0} />
                <ScoreRow
                  label="Constraint Coverage"
                  value={result?.score.breakdown.constraintCoverage ?? 0}
                />
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                {result?.score.summary ??
                  "Once a prompt is optimized, the score card will show a quick quality breakdown."}
              </p>
            </WorkspaceSection>
          </div>
        </div>

        <div id="run-history">
        <RunHistoryPanel
          deletingRunId={deletingRunId}
          filters={runFilters}
          isCompareMode={isCompareMode}
          isComparing={isComparingRuns}
          isLoading={isLoadingRuns}
          onCompare={handleCompareRuns}
          onDelete={handleDeleteRun}
          onFilterChange={handleRunFiltersChange}
          onRefine={handleRefineRun}
          onReuse={handleReuseRun}
          onToggleCompareMode={handleToggleCompareMode}
          onToggleRunSelection={handleToggleRunSelection}
          profiles={profiles}
          providers={metadata?.providers ?? []}
          refiningRunId={refiningRunId}
          reusingRunId={reusingRunId}
          runs={runs}
          selectedCompareRunIds={selectedCompareRunIds}
          tasks={metadata?.tasks ?? []}
        />
        </div>

        <div id="compare-workspace">
        <RunComparePanel
          comparison={comparison}
          isLoading={isComparingRuns}
          onBackToOptimizer={scrollToPromptOptimizer}
          onClose={handleCloseComparison}
          onRefine={handleRefineRun}
          onReuse={handleReuseRun}
          refiningRunId={refiningRunId}
          reusingRunId={reusingRunId}
        />
        </div>
      </section>
    </main>
  );
}

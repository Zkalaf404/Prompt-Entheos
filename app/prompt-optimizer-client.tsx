"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandEditorModal } from "@/app/components/brand-editor-modal";
import { RunHistoryPanel } from "@/app/components/run-history-panel";
import type {
  BrandDeleteResponse,
  BrandErrorResponse,
  BrandMutationRequest,
  BrandSuccessResponse,
  BrandsListResponse,
} from "@/modules/prompt-entheos/api/brands-contract";
import type {
  PromptOptimizationErrorResponse,
  PromptOptimizationMetadataResponse,
  PromptOptimizationResponse,
} from "@/modules/prompt-entheos/api/prompt-optimization-contract";
import type {
  RunDeleteResponse,
  RunErrorResponse,
  RunResponse,
  RunsListResponse,
} from "@/modules/prompt-entheos/api/runs-contract";
import type {
  BrandDraft,
  BrandProfile,
  BrandValidationErrors,
  PromptScore,
  SavedPromptRun,
} from "@/modules/prompt-entheos/types";

interface FormState {
  brandId: string;
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

const emptyBrandDraft: BrandDraft = {
  name: "",
  audience: "",
  tone: "",
  description: "",
  notes: "",
};

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function validateBrandDraft(draft: BrandDraft): BrandValidationErrors {
  const errors: BrandValidationErrors = {};

  if (!draft.name.trim()) {
    errors.name = "Brand name is required.";
  }

  if (!draft.audience.trim()) {
    errors.audience = "Audience is required.";
  }

  if (!draft.tone.trim()) {
    errors.tone = "Tone is required.";
  }

  if (!draft.description.trim()) {
    errors.description = "Description is required.";
  }

  return errors;
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

export function PromptOptimizerClient() {
  const [metadata, setMetadata] = useState<PromptOptimizationMetadataResponse | null>(null);
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [runs, setRuns] = useState<SavedPromptRun[]>([]);
  const [form, setForm] = useState<FormState>({
    brandId: "",
    provider: "",
    task: "",
    rawPrompt: "",
    context: "",
  });
  const [result, setResult] = useState<DisplayResult | null>(null);
  const [optimizationError, setOptimizationError] =
    useState<PromptOptimizationErrorResponse | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);
  const [reusingRunId, setReusingRunId] = useState<string | null>(null);
  const [deletingRunId, setDeletingRunId] = useState<string | null>(null);
  const [brandDraft, setBrandDraft] = useState<BrandDraft>(emptyBrandDraft);
  const [brandErrors, setBrandErrors] = useState<BrandValidationErrors>({});
  const [brandModal, setBrandModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    brandId?: string;
  }>({
    isOpen: false,
    mode: "create",
  });

  const selectedBrand = useMemo(
    () => brands.find((brand) => brand.id === form.brandId) ?? null,
    [brands, form.brandId],
  );
  const selectedProvider = useMemo(
    () => metadata?.providers.find((provider) => provider.id === form.provider) ?? null,
    [metadata, form.provider],
  );
  const availableTasks = useMemo(() => {
    if (!metadata) {
      return [];
    }

    if (!selectedProvider) {
      return metadata.tasks;
    }

    return metadata.tasks.filter((task) => selectedProvider.supportedTasks.includes(task.id));
  }, [metadata, selectedProvider]);
  const activeBrandForEdit = useMemo(
    () => brands.find((brand) => brand.id === brandModal.brandId) ?? null,
    [brands, brandModal.brandId],
  );

  useEffect(() => {
    void Promise.all([loadMetadata(), loadBrands(), loadRuns()]);
  }, []);

  async function loadMetadata() {
    setIsLoadingMetadata(true);

    try {
      const response = await fetch("/api/prompt-optimization", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as PromptOptimizationMetadataResponse;

      setMetadata(data);
      setForm((current) => ({
        ...current,
        provider: current.provider || data.defaults.provider,
        task: current.task || data.defaults.task,
      }));
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not load provider and task options.",
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  }

  async function loadBrands() {
    setIsLoadingBrands(true);

    try {
      const response = await fetch("/api/brands", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await response.json()) as BrandsListResponse;

      setBrands(data.brands);
      setForm((current) => ({
        ...current,
        brandId:
          current.brandId && data.brands.some((brand) => brand.id === current.brandId)
            ? current.brandId
            : "",
      }));
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not load saved brands.",
      });
    } finally {
      setIsLoadingBrands(false);
    }
  }

  async function loadRuns() {
    setIsLoadingRuns(true);

    try {
      const response = await fetch("/api/runs", {
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
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleProviderChange(providerId: string) {
    const provider = metadata?.providers.find((candidate) => candidate.id === providerId);

    setForm((current) => ({
      ...current,
      provider: providerId,
      task:
        provider && !provider.supportedTasks.includes(current.task as (typeof provider.supportedTasks)[number])
          ? provider.supportedTasks[0] ?? current.task
          : current.task,
    }));
  }

  function openCreateBrandModal() {
    setBrandDraft(emptyBrandDraft);
    setBrandErrors({});
    setBrandModal({
      isOpen: true,
      mode: "create",
    });
  }

  function openEditBrandModal() {
    if (!selectedBrand) {
      return;
    }

    setBrandDraft({
      name: selectedBrand.name,
      audience: selectedBrand.audience,
      tone: selectedBrand.tone,
      description: selectedBrand.description,
      notes: selectedBrand.notes ?? "",
    });
    setBrandErrors({});
    setBrandModal({
      isOpen: true,
      mode: "edit",
      brandId: selectedBrand.id,
    });
  }

  function closeBrandModal() {
    setBrandModal({
      isOpen: false,
      mode: "create",
    });
    setBrandErrors({});
    setBrandDraft(emptyBrandDraft);
  }

  function updateBrandDraft<Key extends keyof BrandDraft>(field: Key, value: BrandDraft[Key]) {
    setBrandDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleBrandSave() {
    const validationErrors = validateBrandDraft(brandDraft);

    if (Object.keys(validationErrors).length > 0) {
      setBrandErrors(validationErrors);
      return;
    }

    setIsSavingBrand(true);
    setBrandErrors({});

    try {
      const isEditing = brandModal.mode === "edit" && brandModal.brandId;
      const response = await fetch(
        isEditing ? `/api/brands/${brandModal.brandId}` : "/api/brands",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(brandDraft as BrandMutationRequest),
        },
      );
      const data = (await response.json()) as BrandSuccessResponse | BrandErrorResponse;

      if (!response.ok || !("ok" in data) || !data.ok) {
        if ("error" in data) {
          setBrandErrors(data.error.fieldErrors ?? {});
          setFeedback({
            tone: "error",
            message: data.error.message,
          });
        }
        return;
      }

      await loadBrands();
      setForm((current) => ({
        ...current,
        brandId: data.brand.id,
      }));
      setFeedback({
        tone: "success",
        message: data.message,
      });
      closeBrandModal();
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not save the brand right now.",
      });
    } finally {
      setIsSavingBrand(false);
    }
  }

  async function handleBrandDelete() {
    if (!brandModal.brandId) {
      return;
    }

    setDeletingBrandId(brandModal.brandId);

    try {
      const response = await fetch(`/api/brands/${brandModal.brandId}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as BrandDeleteResponse | BrandErrorResponse;

      if (!response.ok || !("ok" in data) || !data.ok) {
        if ("error" in data) {
          setFeedback({
            tone: "error",
            message: data.error.message,
          });
        }
        return;
      }

      const deletedBrandId = brandModal.brandId;
      await loadBrands();
      setForm((current) => ({
        ...current,
        brandId: current.brandId === deletedBrandId ? "" : current.brandId,
      }));
      setFeedback({
        tone: "success",
        message: data.message,
      });
      closeBrandModal();
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not delete the brand right now.",
      });
    } finally {
      setDeletingBrandId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
          provider: form.provider,
          task: form.task,
          rawPrompt: form.rawPrompt,
          context: form.context || undefined,
          brandId: form.brandId || undefined,
        }),
      });
      const data = (await response.json()) as PromptOptimizationResponse;

      if (!data.ok) {
        setResult(null);
        setOptimizationError(data);
        return;
      }

      setResult(toDisplayResultFromOptimization(data));
      setFeedback({
        tone: "success",
        message: "Prompt optimized and saved to local history.",
      });
      await loadRuns();
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

      const brandId =
        data.run.brandId && brands.some((brand) => brand.id === data.run.brandId)
          ? data.run.brandId
          : "";

      setForm({
        brandId,
        provider: data.run.provider,
        task: data.run.task,
        rawPrompt: data.run.rawPrompt,
        context: data.run.context ?? "",
      });
      setResult(toDisplayResultFromRun(data.run));
      setOptimizationError(null);
      setFeedback({
        tone: "success",
        message: "Run loaded back into the form.",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setFeedback({
        tone: "error",
        message: "Could not reuse this run.",
      });
    } finally {
      setReusingRunId(null);
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

      await loadRuns();
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

  return (
    <>
      <main className="relative isolate min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_25%),radial-gradient(circle_at_right,_rgba(14,165,233,0.14),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#08111f_100%)]">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:26px_26px] opacity-25" />

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 sm:px-10 lg:px-12 lg:py-14">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium tracking-[0.24em] text-cyan-300/75 uppercase">
                Prompt optimization studio
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                برومبتات أقوى مع ذاكرة للعلامة التجارية وسجل لكل تشغيل
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                احفظ سياق العلامة مرة واحدة، شغّل التحسين عبر الـ pipeline، ثم ارجع لأي
                نتيجة سابقة وأعد استخدامها بدون منطق خاص بالمزوّد داخل الواجهة.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 text-sm text-slate-300 backdrop-blur-xl">
              <p className="font-medium text-white">Local-first MVP</p>
              <p className="mt-2">البيانات محفوظة محليًا عبر طبقة repositories/services قابلة للاستبدال لاحقًا.</p>
            </div>
          </div>

          {feedback ? (
            <div
              className={`rounded-[1.5rem] border px-4 py-4 text-sm ${
                feedback.tone === "success"
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  : "border-rose-300/20 bg-rose-400/10 text-rose-100"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <form
              className="rounded-[2rem] border border-white/10 bg-white/6 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6"
              onSubmit={handleSubmit}
            >
              <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/45 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm tracking-[0.18em] text-slate-400 uppercase">Brand</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Brand memory</h2>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                      onClick={openCreateBrandModal}
                    >
                      New brand
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={openEditBrandModal}
                      disabled={!selectedBrand}
                    >
                      Edit brand
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                    value={form.brandId}
                    onChange={(event) => updateField("brandId", event.target.value)}
                    disabled={isLoadingBrands || isOptimizing}
                  >
                    <option value="">No brand selected</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {isLoadingBrands ? (
                  <p className="mt-3 text-sm text-slate-400">Loading brands...</p>
                ) : null}

                {!isLoadingBrands && brands.length === 0 ? (
                  <div className="mt-4 rounded-[1.25rem] border border-dashed border-white/12 bg-white/4 px-4 py-5">
                    <p className="text-sm font-medium text-white">No brands saved yet</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      Create your first brand profile to reuse audience, tone, and positioning in every optimization run.
                    </p>
                  </div>
                ) : null}

                {selectedBrand ? (
                  <div className="mt-4 rounded-[1.25rem] border border-cyan-300/12 bg-cyan-300/8 p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white">
                        {selectedBrand.name}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
                        {selectedBrand.audience}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200">
                        {selectedBrand.tone}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-100">
                      {selectedBrand.description}
                    </p>
                    {selectedBrand.notes ? (
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        Notes: {selectedBrand.notes}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Provider</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                    value={form.provider}
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

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Task</span>
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40"
                    value={form.task}
                    onChange={(event) => updateField("task", event.target.value)}
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

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-slate-200">Raw prompt</span>
                <textarea
                  className="min-h-44 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40"
                  placeholder="أريد برومبت يطلب من النموذج كتابة رسالة إطلاق قوية لمنتج SaaS جديد..."
                  value={form.rawPrompt}
                  onChange={(event) => updateField("rawPrompt", event.target.value)}
                  disabled={isOptimizing}
                />
              </label>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-slate-200">Additional context</span>
                <textarea
                  className="min-h-28 w-full rounded-[1.5rem] border border-white/10 bg-slate-950/60 px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40"
                  placeholder="Optional: campaign context, constraints, deliverable notes, or extra guidance."
                  value={form.context}
                  onChange={(event) => updateField("context", event.target.value)}
                  disabled={isOptimizing}
                />
              </label>

              {optimizationError ? (
                <div className="mt-4 rounded-[1.5rem] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
                  <p className="font-medium">{optimizationError.error.message}</p>
                  {optimizationError.suggestions.tasks.length > 0 ? (
                    <p className="mt-2 text-rose-100/80">
                      Suggested tasks:{" "}
                      {optimizationError.suggestions.tasks.map((task) => task.name).join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-gradient-to-l from-emerald-300 to-cyan-300 px-6 text-base font-semibold text-slate-950 shadow-[0_20px_70px_rgba(45,212,191,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLoadingMetadata || isOptimizing}
              >
                {isOptimizing ? "Optimizing..." : "Optimize Prompt"}
              </button>
            </form>

            <div className="grid gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm tracking-[0.18em] text-slate-400 uppercase">Result</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Optimized Prompt</h2>
                  </div>
                  {result ? (
                    <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                      {result.resolvedProvider.name} · {result.resolvedTask.name}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/70 p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-100">
                    {result?.optimizedPrompt ??
                      "The optimized prompt will appear here once you submit the form."}
                  </pre>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl sm:p-6">
                <p className="text-sm tracking-[0.18em] text-slate-400 uppercase">Rationale</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Why this version is stronger</h2>
                <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-slate-950/60 p-4">
                  <p className="text-sm leading-7 text-slate-100">
                    {result?.rationale.summary ??
                      "A short explanation of the optimization choices will appear here."}
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
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl sm:p-6">
                <p className="text-sm tracking-[0.18em] text-slate-400 uppercase">Score</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Quality snapshot</h2>
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
              </div>
            </div>
          </div>

          <RunHistoryPanel
            brands={brands}
            deletingRunId={deletingRunId}
            isLoading={isLoadingRuns}
            onDelete={handleDeleteRun}
            onReuse={handleReuseRun}
            reusingRunId={reusingRunId}
            runs={runs}
          />
        </section>
      </main>

      <BrandEditorModal
        brand={activeBrandForEdit}
        errors={brandErrors}
        isOpen={brandModal.isOpen}
        isSubmitting={isSavingBrand || Boolean(deletingBrandId)}
        mode={brandModal.mode}
        onChange={updateBrandDraft}
        onClose={closeBrandModal}
        onDelete={brandModal.mode === "edit" ? handleBrandDelete : undefined}
        onSave={handleBrandSave}
        value={brandDraft}
      />
    </>
  );
}

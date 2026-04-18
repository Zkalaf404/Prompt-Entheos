"use client";

import { useState } from "react";
import {
  normalizeBusinessIntakeInput,
  validateBusinessIntakeInput,
} from "@/modules/prompt-entheos/intelligence/intake";
import type {
  BrandIntelligenceProfile,
  BrandIntelligenceValidationErrors,
  BusinessIntakeInput,
  CompetitorSeed,
} from "@/modules/prompt-entheos/types";
import { businessTypes } from "@/modules/prompt-entheos/types";
import {
  Badge,
  MetricCard,
  SectionHeader,
  WorkspaceSection,
  inputClass,
  nestedSurfaceClass,
  primaryButtonClass,
  secondaryButtonClass,
  subtleButtonClass,
  textareaClass,
} from "@/app/components/workspace-ui";

type IntakeListField = "productsOrServices" | "goals" | "differentiators";

interface BrandIntelligenceWizardProps {
  errors: BrandIntelligenceValidationErrors;
  isSubmitting: boolean;
  mode: "create" | "edit";
  profile?: BrandIntelligenceProfile | null;
  value: BusinessIntakeInput;
  onAddCompetitor: () => void;
  onAddListItem: (field: IntakeListField) => void;
  onChange: <Key extends keyof BusinessIntakeInput>(
    field: Key,
    value: BusinessIntakeInput[Key],
  ) => void;
  onCompetitorChange: <Key extends keyof CompetitorSeed>(
    index: number,
    field: Key,
    value: CompetitorSeed[Key],
  ) => void;
  onListItemChange: (field: IntakeListField, index: number, value: string) => void;
  onRemoveCompetitor: (index: number) => void;
  onRemoveListItem: (field: IntakeListField, index: number) => void;
  onReset: () => void;
  onSubmit: () => void;
}

interface StepDefinition {
  id: string;
  title: string;
  description: string;
  summary: string;
}

const steps: StepDefinition[] = [
  {
    id: "basics",
    title: "Business basics",
    description: "Company identity, business model, geography, and offer structure.",
    summary: "Define the core shape of the business before the system reasons about messaging.",
  },
  {
    id: "audience",
    title: "Audience and context",
    description: "Buyer profile, market context, and internal notes that affect outputs.",
    summary: "Clarify who the prompt system is speaking to and what context should shape tone and framing.",
  },
  {
    id: "positioning",
    title: "Market position",
    description: "Competitors, alternatives, and differentiators that matter.",
    summary: "Make the point of difference explicit so optimized prompts can avoid generic category language.",
  },
  {
    id: "goals",
    title: "Goals and voice",
    description: "Business outcomes, message hierarchy, and tone system.",
    summary: "Finish with the target outcomes and the voice the optimizer should preserve.",
  },
];

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-rose-200">{message}</p>;
}

function StepNavCard({
  definition,
  index,
  isActive,
  isComplete,
  onClick,
}: {
  definition: StepDefinition;
  index: number;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`rounded-[22px] border p-4 text-right transition ${
        isActive
          ? "border-cyan-300/22 bg-cyan-300/[0.08]"
          : "border-white/8 bg-[#0b1118] hover:border-white/14 hover:bg-white/[0.03]"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-slate-500 uppercase">
            Step {index + 1}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{definition.title}</p>
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm ${
            isActive
              ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
              : isComplete
                ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-white/[0.03] text-slate-300"
          }`}
        >
          {isComplete ? "✓" : index + 1}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{definition.description}</p>
    </button>
  );
}

function StringListEditor({
  disabled,
  error,
  helper,
  label,
  onAdd,
  onChange,
  onRemove,
  placeholder,
  values,
}: {
  disabled: boolean;
  error?: string;
  helper: string;
  label: string;
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  values: string[];
}) {
  return (
    <div className={nestedSurfaceClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{helper}</p>
        </div>
        <button type="button" className={secondaryButtonClass} onClick={onAdd} disabled={disabled}>
          Add item
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="flex gap-3">
            <input
              className={inputClass}
              value={value}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => onRemove(index)}
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <FieldError message={error} />
      </div>
    </div>
  );
}

function CompetitorListEditor({
  disabled,
  onAdd,
  onChange,
  onRemove,
  values,
}: {
  disabled: boolean;
  onAdd: () => void;
  onChange: <Key extends keyof CompetitorSeed>(
    index: number,
    field: Key,
    value: CompetitorSeed[Key],
  ) => void;
  onRemove: (index: number) => void;
  values: CompetitorSeed[];
}) {
  return (
    <div className={nestedSurfaceClass}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Known competitors</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Optional. Add only competitors the founder or marketer already knows.
          </p>
        </div>
        <button
          type="button"
          className={secondaryButtonClass}
          onClick={onAdd}
          disabled={disabled}
        >
          Add competitor
        </button>
      </div>

      {values.length === 0 ? (
        <div className="mt-4 rounded-[20px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm leading-7 text-slate-400">
          No competitor context yet. Leave this blank if the profile should stay category-first.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {values.map((competitor, index) => (
            <div key={`${competitor.name || "competitor"}-${index}`} className="rounded-[20px] border border-white/8 bg-white/[0.03] p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Competitor name</span>
                  <input
                    className={inputClass}
                    value={competitor.name}
                    onChange={(event) => onChange(index, "name", event.target.value)}
                    placeholder="Example: Acme AI"
                    disabled={disabled}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-200">Website</span>
                  <input
                    className={inputClass}
                    value={competitor.websiteUrl ?? ""}
                    onChange={(event) => onChange(index, "websiteUrl", event.target.value)}
                    placeholder="https://example.com"
                    disabled={disabled}
                  />
                </label>
              </div>

              <label className="mt-3 block space-y-2">
                <span className="text-sm font-medium text-slate-200">Notes</span>
                <textarea
                  className={`${textareaClass} min-h-28`}
                  value={competitor.notes ?? ""}
                  onChange={(event) => onChange(index, "notes", event.target.value)}
                  placeholder="What matters about this competitor in the buyer's mind?"
                  disabled={disabled}
                />
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className={subtleButtonClass}
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                >
                  Remove competitor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStepFields(stepIndex: number): Array<keyof BrandIntelligenceValidationErrors> {
  if (stepIndex === 0) {
    return ["companyName", "businessType", "geography", "productsOrServices"];
  }

  if (stepIndex === 1) {
    return ["targetAudience"];
  }

  if (stepIndex === 2) {
    return ["differentiators"];
  }

  return ["goals", "tone"];
}

function getFirstErrorStep(errors: BrandIntelligenceValidationErrors): number | null {
  for (const [index] of steps.entries()) {
    if (getStepFields(index).some((field) => Boolean(errors[field]))) {
      return index;
    }
  }

  return null;
}

function getStepErrorMap(
  stepIndex: number,
  errors: BrandIntelligenceValidationErrors,
): BrandIntelligenceValidationErrors {
  const map: BrandIntelligenceValidationErrors = {};

  for (const field of getStepFields(stepIndex)) {
    if (errors[field]) {
      map[field] = errors[field];
    }
  }

  return map;
}

export function BrandIntelligenceWizard({
  errors,
  isSubmitting,
  mode,
  profile,
  value,
  onAddCompetitor,
  onAddListItem,
  onChange,
  onCompetitorChange,
  onListItemChange,
  onRemoveCompetitor,
  onRemoveListItem,
  onReset,
  onSubmit,
}: BrandIntelligenceWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [validationStep, setValidationStep] = useState<number | null>(null);
  const normalized = normalizeBusinessIntakeInput(value);
  const clientErrors = validateBusinessIntakeInput(normalized);
  const stepLocalErrors =
    validationStep === activeStep ? getStepErrorMap(activeStep, clientErrors) : {};
  const stepServerErrors = getStepErrorMap(activeStep, errors);
  const progress = ((activeStep + 1) / steps.length) * 100;

  function goToStep(index: number) {
    setActiveStep(index);
    setValidationStep(null);
  }

  function handleNextStep() {
    const currentStepErrors = getStepErrorMap(activeStep, clientErrors);

    if (Object.keys(currentStepErrors).length > 0) {
      setValidationStep(activeStep);
      return;
    }

    setValidationStep(null);
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleSubmit() {
    const firstErrorStep = getFirstErrorStep(errors);

    if (firstErrorStep !== null) {
      setActiveStep(firstErrorStep);
      setValidationStep(firstErrorStep);
      return;
    }

    setValidationStep(activeStep);
    onSubmit();
  }

  function renderStepContent() {
    if (activeStep === 0) {
      return (
        <div className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={nestedSurfaceClass}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Company name</span>
                <input
                  className={inputClass}
                  value={value.companyName}
                  onChange={(event) => onChange("companyName", event.target.value)}
                  placeholder="Prompt Entheos"
                  disabled={isSubmitting}
                />
                <FieldError message={stepServerErrors.companyName ?? stepLocalErrors.companyName} />
              </label>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-slate-200">Website</span>
                <input
                  className={inputClass}
                  value={value.websiteUrl ?? ""}
                  onChange={(event) => onChange("websiteUrl", event.target.value)}
                  placeholder="https://promptentheos.com"
                  disabled={isSubmitting}
                />
              </label>
            </div>

            <div className={nestedSurfaceClass}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Business type</span>
                <select
                  className={inputClass}
                  value={value.businessType}
                  onChange={(event) =>
                    onChange("businessType", event.target.value as BusinessIntakeInput["businessType"])
                  }
                  disabled={isSubmitting}
                >
                  {businessTypes.map((businessType) => (
                    <option key={businessType} value={businessType}>
                      {businessType}
                    </option>
                  ))}
                </select>
                <FieldError message={stepServerErrors.businessType ?? stepLocalErrors.businessType} />
              </label>

              <label className="mt-4 block space-y-2">
                <span className="text-sm font-medium text-slate-200">Geography</span>
                <input
                  className={inputClass}
                  value={value.geography}
                  onChange={(event) => onChange("geography", event.target.value)}
                  placeholder="MENA, GCC, global, Egypt..."
                  disabled={isSubmitting}
                />
                <FieldError message={stepServerErrors.geography ?? stepLocalErrors.geography} />
              </label>
            </div>
          </div>

          <StringListEditor
            disabled={isSubmitting}
            error={stepServerErrors.productsOrServices ?? stepLocalErrors.productsOrServices}
            helper="List the offers the optimizer should understand as the business output."
            label="Products or services"
            onAdd={() => onAddListItem("productsOrServices")}
            onChange={(index, nextValue) => onListItemChange("productsOrServices", index, nextValue)}
            onRemove={(index) => onRemoveListItem("productsOrServices", index)}
            placeholder="Prompt optimization for SaaS teams"
            values={value.productsOrServices}
          />
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="grid gap-4">
          <div className={nestedSurfaceClass}>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Target audience</span>
              <textarea
                className={`${textareaClass} min-h-36`}
                value={value.targetAudience}
                onChange={(event) => onChange("targetAudience", event.target.value)}
                placeholder="Founders, growth teams, prompt engineers, marketers..."
                disabled={isSubmitting}
              />
              <FieldError message={stepServerErrors.targetAudience ?? stepLocalErrors.targetAudience} />
            </label>
          </div>

          <div className={nestedSurfaceClass}>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-200">Market or strategy notes</span>
              <textarea
                className={`${textareaClass} min-h-32`}
                value={value.notes ?? ""}
                onChange={(event) => onChange("notes", event.target.value)}
                placeholder="Optional: buyer objections, seasonal context, product maturity, internal constraints..."
                disabled={isSubmitting}
              />
            </label>
          </div>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="grid gap-4">
          <CompetitorListEditor
            disabled={isSubmitting}
            onAdd={onAddCompetitor}
            onChange={onCompetitorChange}
            onRemove={onRemoveCompetitor}
            values={value.competitors}
          />

          <StringListEditor
            disabled={isSubmitting}
            error={stepServerErrors.differentiators ?? stepLocalErrors.differentiators}
            helper="Capture why this brand wins against alternatives so prompts can make the difference explicit."
            label="Differentiators"
            onAdd={() => onAddListItem("differentiators")}
            onChange={(index, nextValue) => onListItemChange("differentiators", index, nextValue)}
            onRemove={(index) => onRemoveListItem("differentiators", index)}
            placeholder="Provider-specific expertise"
            values={value.differentiators}
          />
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <StringListEditor
          disabled={isSubmitting}
          error={stepServerErrors.goals ?? stepLocalErrors.goals}
          helper="Define the business outcomes the prompt engine should optimize toward."
          label="Goals"
          onAdd={() => onAddListItem("goals")}
          onChange={(index, nextValue) => onListItemChange("goals", index, nextValue)}
          onRemove={(index) => onRemoveListItem("goals", index)}
          placeholder="Increase qualified leads"
          values={value.goals}
        />

        <div className={nestedSurfaceClass}>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Tone</span>
            <input
              className={inputClass}
              value={value.tone}
              onChange={(event) => onChange("tone", event.target.value)}
              placeholder="Confident, clear, premium, and precise"
              disabled={isSubmitting}
            />
            <FieldError message={stepServerErrors.tone ?? stepLocalErrors.tone} />
          </label>
        </div>

        <div className={nestedSurfaceClass}>
          <p className="text-sm font-semibold text-white">Review before generation</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Company" value={value.companyName || "Not set"} />
            <MetricCard label="Audience" value={value.targetAudience || "Not set"} />
            <MetricCard label="Goals" value={String(normalized.goals.length)} />
            <MetricCard label="Differentiators" value={String(normalized.differentiators.length)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceSection>
      <SectionHeader
        eyebrow="Brand Intelligence"
        title={mode === "create" ? "Business intake workspace" : "Edit Brand Intelligence profile"}
        description="Capture business facts once, structure them into a deterministic strategy profile, and reuse that context across future prompt optimization runs."
        actions={
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={onReset}
            disabled={isSubmitting}
          >
            New profile
          </button>
        }
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <aside className="space-y-4">
          <div className={nestedSurfaceClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Progress</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Step {activeStep + 1} of {steps.length}
                </p>
              </div>
              <Badge tone="accent">{Math.round(progress)}%</Badge>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-cyan-300 transition-[width]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-400">{steps[activeStep].summary}</p>
            {profile ? (
              <p className="mt-4 text-xs text-slate-500">
                Last updated {new Date(profile.updatedAt).toLocaleString("en-US")}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3">
            {steps.map((step, index) => {
              const isComplete = Object.keys(getStepErrorMap(index, clientErrors)).length === 0;

              return (
                <StepNavCard
                  key={step.id}
                  definition={step}
                  index={index}
                  isActive={index === activeStep}
                  isComplete={isComplete}
                  onClick={() => goToStep(index)}
                />
              );
            })}
          </div>
        </aside>

        <div className={nestedSurfaceClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                {steps[activeStep].title}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-400">{steps[activeStep].description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeStep > 0 ? <Badge>Backtracking allowed</Badge> : null}
              <Badge tone="warning">
                {mode === "create" ? "Draft mode" : "Editing existing profile"}
              </Badge>
            </div>
          </div>

          <div className="mt-6">{renderStepContent()}</div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className={subtleButtonClass}
              onClick={() => goToStep(Math.max(activeStep - 1, 0))}
              disabled={isSubmitting || activeStep === 0}
            >
              Previous step
            </button>

            {activeStep < steps.length - 1 ? (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={handleNextStep}
                disabled={isSubmitting}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className={primaryButtonClass}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? mode === "create"
                    ? "Analyzing..."
                    : "Updating..."
                  : mode === "create"
                    ? "Generate strategy profile"
                    : "Update strategy profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </WorkspaceSection>
  );
}

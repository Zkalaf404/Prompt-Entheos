"use client";

import type { BrandIntelligenceProfile } from "@/modules/prompt-entheos/types";
import {
  Badge,
  EmptyState,
  SectionHeader,
  WorkspaceSection,
  mutedSurfaceClass,
  nestedSurfaceClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/app/components/workspace-ui";

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className={nestedSurfaceClass}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InsightCard({
  title,
  body,
  caption,
}: {
  title: string;
  body: string;
  caption?: string;
}) {
  return (
    <article className={mutedSurfaceClass}>
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
      {caption ? <p className="mt-3 text-xs leading-6 text-slate-500">{caption}</p> : null}
    </article>
  );
}

interface BrandIntelligenceProfileViewProps {
  profile: BrandIntelligenceProfile | null;
  onEdit: (profileId: string) => void;
  onUseInPrompt: (profileId: string) => void;
}

export function BrandIntelligenceProfileView({
  profile,
  onEdit,
  onUseInPrompt,
}: BrandIntelligenceProfileViewProps) {
  if (!profile) {
    return (
      <WorkspaceSection>
        <SectionHeader
          eyebrow="Strategy Document"
          title="Brand Intelligence Profile"
          description="Select a saved profile to review the brand brief, messaging strategy, audience framing, and reusable prompt context."
        />
        <div className="mt-6">
          <EmptyState
            title="No profile selected"
            description="Once you save or select a profile, this panel becomes your strategy document for messaging, positioning, and reusable prompt context."
          />
        </div>
      </WorkspaceSection>
    );
  }

  return (
    <WorkspaceSection>
      <SectionHeader
        eyebrow="Strategy Document"
        title={profile.companyName}
        description={profile.generatedIntelligence.brandSummary}
        actions={
          <>
            <button
              type="button"
              className={secondaryButtonClass}
              onClick={() => onEdit(profile.id)}
            >
              Edit profile
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              onClick={() => onUseInPrompt(profile.id)}
            >
              Use in optimizer
            </button>
          </>
        }
      />

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge tone="accent">{profile.businessType}</Badge>
        <Badge>{profile.geography}</Badge>
        <Badge>Tone: {profile.tone}</Badge>
        <Badge>Updated {new Date(profile.updatedAt).toLocaleDateString("en-US")}</Badge>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className={nestedSurfaceClass}>
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Executive Summary</p>
          <p className="mt-4 text-base leading-8 text-slate-100">
            {profile.generatedIntelligence.audienceSummary}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className={mutedSurfaceClass}>
              <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Audience</p>
              <p className="mt-3 text-sm leading-7 text-white">{profile.targetAudience}</p>
            </div>
            <div className={mutedSurfaceClass}>
              <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Primary Goals</p>
              <p className="mt-3 text-sm leading-7 text-white">{profile.goals.slice(0, 2).join(" · ")}</p>
            </div>
            <div className={mutedSurfaceClass}>
              <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Differentiation</p>
              <p className="mt-3 text-sm leading-7 text-white">
                {profile.differentiators.slice(0, 2).join(" · ")}
              </p>
            </div>
          </div>
        </div>

        <div className={nestedSurfaceClass}>
          <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">Prompt Context Pack</p>
          <p className="mt-4 text-sm leading-7 text-slate-300">{profile.promptContextPack.summary}</p>
          <div className="mt-5 grid gap-3">
            {profile.promptContextPack.instructions.slice(0, 3).map((instruction) => (
              <div
                key={instruction}
                className="rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-300"
              >
                {instruction}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ListBlock title="Facts" items={profile.generatedIntelligence.facts} />
        <ListBlock title="Observations" items={profile.generatedIntelligence.observations} />
        <ListBlock title="Inferences" items={profile.generatedIntelligence.inferences} />
        <ListBlock title="Recommendations" items={profile.generatedIntelligence.recommendations} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={nestedSurfaceClass}>
          <p className="text-sm font-semibold text-white">Messaging Strategy</p>
          <div className="mt-4 space-y-3">
            {profile.generatedIntelligence.messagingInsights.map((insight) => (
              <InsightCard
                key={`${insight.title}-${insight.angle}`}
                title={insight.title}
                body={insight.angle}
                caption={`Audience need: ${insight.audienceNeed}`}
              />
            ))}
          </div>
        </div>

        <div className={nestedSurfaceClass}>
          <p className="text-sm font-semibold text-white">Competitive Landscape</p>
          {profile.generatedIntelligence.competitorSnapshots.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-slate-400">
              No competitor context was provided for this profile yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {profile.generatedIntelligence.competitorSnapshots.map((competitor) => (
                <InsightCard
                  key={competitor.name}
                  title={competitor.name}
                  body={competitor.positioningSummary}
                  caption={competitor.differentiationOpportunity}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ListBlock
          title="Positioning Notes"
          items={profile.generatedIntelligence.positioningNotes}
        />
        <ListBlock title="Content Pillars" items={profile.generatedIntelligence.contentPillars} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ListBlock title="Context Lines" items={profile.promptContextPack.contextLines} />
        <ListBlock title="Prompt Instructions" items={profile.promptContextPack.instructions} />
      </div>
    </WorkspaceSection>
  );
}

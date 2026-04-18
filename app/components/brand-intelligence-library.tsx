"use client";

import type { BrandIntelligenceProfile } from "@/modules/prompt-entheos/types";
import {
  Badge,
  EmptyState,
  SectionHeader,
  WorkspaceSection,
  dangerButtonClass,
  secondaryButtonClass,
} from "@/app/components/workspace-ui";

interface BrandIntelligenceLibraryProps {
  deletingProfileId: string | null;
  isLoading: boolean;
  profiles: BrandIntelligenceProfile[];
  selectedProfileId: string;
  onCreate: () => void;
  onDelete: (profileId: string) => void;
  onEdit: (profileId: string) => void;
  onSelect: (profileId: string) => void;
}

export function BrandIntelligenceLibrary({
  deletingProfileId,
  isLoading,
  profiles,
  selectedProfileId,
  onCreate,
  onDelete,
  onEdit,
  onSelect,
}: BrandIntelligenceLibraryProps) {
  return (
    <WorkspaceSection>
      <SectionHeader
        eyebrow="Profiles Library"
        title="Saved Brand Intelligence"
        description="A reusable strategy layer for each brand. Select a profile to review its messaging strategy or connect it directly to the optimizer."
        actions={
          <button type="button" className={secondaryButtonClass} onClick={onCreate}>
            New profile
          </button>
        }
      />

      {isLoading ? (
        <div className="mt-6 rounded-[24px] border border-white/8 bg-[#0b1118] px-5 py-6 text-sm text-slate-300">
          Loading Brand Intelligence profiles...
        </div>
      ) : null}

      {!isLoading && profiles.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No profiles yet"
            description="Create your first Brand Intelligence profile to turn one-off prompt work into a reusable strategic context layer."
            action={
              <button type="button" className={secondaryButtonClass} onClick={onCreate}>
                Start a profile
              </button>
            }
          />
        </div>
      ) : null}

      {!isLoading && profiles.length > 0 ? (
        <div className="mt-6 grid gap-3">
          {profiles.map((profile) => {
            const isSelected = profile.id === selectedProfileId;

            return (
              <article
                key={profile.id}
                className={`rounded-[24px] border p-5 transition ${
                  isSelected
                    ? "border-cyan-300/25 bg-cyan-300/[0.08]"
                    : "border-white/8 bg-[#0b1118] hover:border-white/14 hover:bg-white/[0.03]"
                }`}
              >
                <button type="button" className="w-full text-right" onClick={() => onSelect(profile.id)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="accent">{profile.businessType}</Badge>
                    <Badge>{profile.geography}</Badge>
                    {isSelected ? <Badge tone="success">Active</Badge> : null}
                  </div>

                  <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">{profile.companyName}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        {profile.generatedIntelligence.brandSummary}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-slate-400 xl:min-w-56 xl:text-left">
                      <p>Audience: {profile.targetAudience}</p>
                      <p>Updated: {new Date(profile.updatedAt).toLocaleString("en-US")}</p>
                    </div>
                  </div>
                </button>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={secondaryButtonClass}
                    onClick={() => onEdit(profile.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    onClick={() => onDelete(profile.id)}
                    disabled={deletingProfileId === profile.id}
                  >
                    {deletingProfileId === profile.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </WorkspaceSection>
  );
}

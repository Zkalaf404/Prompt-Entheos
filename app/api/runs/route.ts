import { NextResponse } from "next/server";
import type { RunsListResponse } from "@/modules/prompt-entheos/api/runs-contract";
import { listRuns } from "@/modules/prompt-entheos/runs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider")?.trim() ?? "";
  const task = searchParams.get("task")?.trim() ?? "";
  const brandProfileId = searchParams.get("brandProfileId")?.trim() ?? "";
  const response: RunsListResponse = {
    runs: await listRuns({
      provider: provider || undefined,
      task: task || undefined,
      brandProfileId: brandProfileId || undefined,
    }),
    filters: {
      provider: provider || undefined,
      task: task || undefined,
      brandProfileId: brandProfileId || undefined,
    },
    sort: "newest",
  };

  return NextResponse.json(response);
}

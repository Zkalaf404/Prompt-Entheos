import { NextResponse } from "next/server";
import type { RunsListResponse } from "@/modules/prompt-entheos/api/runs-contract";
import { listRuns } from "@/modules/prompt-entheos/runs";

export async function GET() {
  const response: RunsListResponse = {
    runs: await listRuns(),
  };

  return NextResponse.json(response);
}

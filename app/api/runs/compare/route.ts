import { NextResponse } from "next/server";
import type {
  RunCompareResponse,
  RunErrorResponse,
} from "@/modules/prompt-entheos/api/runs-contract";
import { NotFoundError } from "@/modules/prompt-entheos/data/service-errors";
import { compareRuns } from "@/modules/prompt-entheos/runs";

function toRunErrorResponse(error: unknown): RunErrorResponse {
  if (error instanceof NotFoundError) {
    return {
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: error.message,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong while processing the run.",
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runIds = searchParams
    .getAll("runIds")
    .map((runId) => runId.trim())
    .filter(Boolean);

  if (runIds.length !== 2) {
    const response: RunErrorResponse = {
      ok: false,
      error: {
        code: "INVALID_COMPARE",
        message: "Select exactly two runs to compare.",
      },
    };

    return NextResponse.json(response, { status: 400 });
  }

  try {
    const comparison = await compareRuns([runIds[0], runIds[1]]);
    const response: RunCompareResponse = {
      comparison,
    };

    return NextResponse.json(response);
  } catch (error) {
    const response = toRunErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}

import { NextResponse } from "next/server";
import type {
  RunDeleteResponse,
  RunErrorResponse,
  RunResponse,
} from "@/modules/prompt-entheos/api/runs-contract";
import { NotFoundError } from "@/modules/prompt-entheos/data/service-errors";
import { deleteRun, getRunById } from "@/modules/prompt-entheos/runs";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await context.params;
    const run = await getRunById(runId);
    const response: RunResponse = { run };

    return NextResponse.json(response);
  } catch (error) {
    const response = toRunErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
) {
  try {
    const { runId } = await context.params;
    await deleteRun(runId);
    const response: RunDeleteResponse = {
      ok: true,
      message: "Run deleted successfully.",
    };

    return NextResponse.json(response);
  } catch (error) {
    const response = toRunErrorResponse(error);
    const status = response.error.code === "NOT_FOUND" ? 404 : 500;

    return NextResponse.json(response, { status });
  }
}

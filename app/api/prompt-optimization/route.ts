import { NextResponse } from "next/server";
import type {
  PromptOptimizationErrorResponse,
  PromptOptimizationMetadataResponse,
  PromptOptimizationProviderOption,
  PromptOptimizationRequest,
  PromptOptimizationResponse,
  PromptOptimizationTaskOption,
} from "@/modules/prompt-entheos/api/prompt-optimization-contract";
import { getBrandById, normalizeBrandContext } from "@/modules/prompt-entheos/brands";
import { NotFoundError } from "@/modules/prompt-entheos/data/service-errors";
import { runPromptPipeline } from "@/modules/prompt-entheos/pipeline";
import { listProviders } from "@/modules/prompt-entheos/providers";
import { createRun } from "@/modules/prompt-entheos/runs";
import { listTasks } from "@/modules/prompt-entheos/tasks";

function toProviderOption(provider: ReturnType<typeof listProviders>[number]): PromptOptimizationProviderOption {
  return {
    id: provider.id,
    name: provider.name,
    description: provider.description,
    supportedTasks: provider.supportedTasks,
  };
}

function toTaskOption(task: ReturnType<typeof listTasks>[number]): PromptOptimizationTaskOption {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
  };
}

function getStatusCode(code: PromptOptimizationErrorResponse["error"]["code"]): number {
  if (
    code === "EMPTY_PROMPT" ||
    code === "INVALID_BRAND" ||
    code === "INVALID_PROVIDER" ||
    code === "INVALID_TASK"
  ) {
    return 400;
  }

  if (code === "TASK_NOT_SUPPORTED") {
    return 422;
  }

  return 404;
}

export async function GET() {
  const providers = listProviders().map(toProviderOption);
  const tasks = listTasks().map(toTaskOption);
  const response: PromptOptimizationMetadataResponse = {
    providers,
    tasks,
    defaults: {
      provider: "openai",
      task: "general-chat",
    },
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PromptOptimizationRequest>;
    let brandContext = undefined;

    if (typeof body.brandId === "string" && body.brandId.trim()) {
      try {
        const brand = await getBrandById(body.brandId);
        brandContext = normalizeBrandContext(brand);
      } catch (error) {
        if (error instanceof NotFoundError) {
          const response: PromptOptimizationErrorResponse = {
            ok: false,
            error: {
              code: "INVALID_BRAND",
              message: `The selected brand "${body.brandId}" could not be found.`,
            },
            suggestions: {
              providers: [],
              tasks: [],
            },
          };

          return NextResponse.json<PromptOptimizationResponse>(response, {
            status: getStatusCode(response.error.code),
          });
        }

        throw error;
      }
    }

    const pipelineInput = {
      provider: typeof body.provider === "string" ? body.provider : "",
      task: typeof body.task === "string" ? body.task : "",
      rawPrompt: typeof body.rawPrompt === "string" ? body.rawPrompt : "",
      context: typeof body.context === "string" ? body.context : undefined,
      brandContext,
    } as const;
    const result = runPromptPipeline(pipelineInput);

    if (!result.ok) {
      const response: PromptOptimizationErrorResponse = {
        ok: false,
        error: result.error,
        suggestions: {
          providers: result.suggestions.providers.map(toProviderOption),
          tasks: result.suggestions.tasks.map(toTaskOption),
        },
      };

      return NextResponse.json<PromptOptimizationResponse>(response, {
        status: getStatusCode(result.error.code),
      });
    }

    await createRun({
      input: pipelineInput,
      result,
      brandId: typeof body.brandId === "string" ? body.brandId : undefined,
    });

    const response: PromptOptimizationResponse = {
      ok: true,
      optimizedPrompt: result.output.prompt,
      rationale: result.output.explanation,
      score: result.output.score,
      resolvedProvider: toProviderOption(result.provider),
      resolvedTask: toTaskOption(result.task),
    };

    return NextResponse.json(response);
  } catch {
    const response: PromptOptimizationErrorResponse = {
      ok: false,
      error: {
        code: "PROVIDER_NOT_RESOLVED",
        message: "Something went wrong while processing the optimization request.",
      },
      suggestions: {
        providers: [],
        tasks: [],
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

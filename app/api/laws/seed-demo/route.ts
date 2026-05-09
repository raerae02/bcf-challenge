import { NextRequest, NextResponse } from "next/server";
import demoLegalExcerpts from "@/data/demo-legal-excerpts.json";
import { createStructuredLaw, type RawLawInput } from "@/lib/rag/laws";
import { runMonitoringForLaw } from "@/lib/rag/monitoring";

type SeedRequest = {
  monitor?: boolean;
};

type SeedResult = {
  seedId?: string;
  title: string;
  lawId?: string;
  monitoring?: Awaited<ReturnType<typeof runMonitoringForLaw>>;
  error?: string;
};

function parseSeedRequest(value: unknown): SeedRequest {
  if (!value || typeof value !== "object") {
    return {};
  }

  const body = value as { monitor?: unknown };

  return {
    monitor: typeof body.monitor === "boolean" ? body.monitor : undefined,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { monitor = true } = parseSeedRequest(body);
  const results: SeedResult[] = [];
  let created = 0;
  let failed = 0;
  let notificationsCreated = 0;

  for (const input of demoLegalExcerpts as RawLawInput[]) {
    try {
      const law = await createStructuredLaw(input);
      created += 1;
      const result: SeedResult = {
        seedId: input.seedId,
        title: input.title,
        lawId: law.id,
      };

      if (monitor) {
        result.monitoring = await runMonitoringForLaw({ law });
        notificationsCreated += result.monitoring.notificationsCreated;
      }

      results.push(result);
    } catch (error) {
      failed += 1;
      results.push({
        seedId: input.seedId,
        title: input.title,
        error: error instanceof Error ? error.message : "Unable to seed law.",
      });
    }
  }

  return NextResponse.json({
    created,
    failed,
    notificationsCreated,
    monitor,
    results,
  });
}

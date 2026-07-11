import { NextRequest, NextResponse } from "next/server";
import { executeCleanup } from "@/cleanup/actions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { runId, confirmation } = body as { runId?: string; confirmation?: string };

    if (!runId || typeof runId !== "string") {
      return NextResponse.json({ error: "Missing or invalid runId." }, { status: 400 });
    }
    if (!confirmation || typeof confirmation !== "string") {
      return NextResponse.json({ error: "Missing confirmation phrase." }, { status: 400 });
    }

    const result = await executeCleanup(runId, confirmation);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cleanup execution failed." },
      { status: 500 },
    );
  }
}

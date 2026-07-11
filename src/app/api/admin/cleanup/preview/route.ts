import { NextResponse } from "next/server";
import { getCleanupPreview } from "@/cleanup/actions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const preview = await getCleanupPreview();
    return NextResponse.json(preview);
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load preview counts." },
      { status: 500 },
    );
  }
}

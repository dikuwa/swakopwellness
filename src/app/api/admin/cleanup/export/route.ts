import { NextResponse } from "next/server";
import { exportCleanup } from "@/cleanup/actions";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await exportCleanup();
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return the workbook as a downloadable file with run metadata in headers
    const response = new NextResponse(new Uint8Array(result.workbook), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="activity-cleanup-${result.runId.slice(0, 8)}.xlsx"`,
        "X-Cleanup-Run-Id": result.runId,
        "X-Cleanup-Cutoff": result.cutoffAt,
        "X-Cleanup-Counts": JSON.stringify(result.exportedCounts),
      },
    });

    return response;
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed." },
      { status: 500 },
    );
  }
}

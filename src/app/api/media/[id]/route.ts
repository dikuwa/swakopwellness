import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db/client";
import { mediaAssets } from "@/db/schema";
import { getFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const db = getDb();

  const [asset] = await db
    .select({
      id: mediaAssets.id,
      storageKey: mediaAssets.storageKey,
      mimeType: mediaAssets.mimeType,
      byteSize: mediaAssets.byteSize,
    })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .limit(1);

  if (!asset) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  try {
    const body = await getFile(asset.storageKey);
    const responseBody = new ArrayBuffer(body.byteLength);
    new Uint8Array(responseBody).set(body);

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(asset.byteSize),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Media file unavailable" }, { status: 404 });
  }
}

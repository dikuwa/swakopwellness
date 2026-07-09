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
      publicUrl: mediaAssets.publicUrl,
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
    return new NextResponse(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Image unavailable"><rect width="160" height="160" rx="80" fill="#e8eddf"/><path d="M80 40c12 0 22 10 22 22S92 84 80 84 58 74 58 62s10-22 22-22Zm0 54c20 0 38 10 48 26H32c10-16 28-26 48-26Z" fill="#2f5b45"/></svg>',
      {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=300",
        },
      },
    );
  }
}

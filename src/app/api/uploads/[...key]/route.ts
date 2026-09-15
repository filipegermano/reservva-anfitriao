import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { s3, uploadsBucket } from "@/lib/storage";

type RouteParams = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { key } = await params;
  const objectKey = key.join("/");

  try {
    const object = await s3.send(
      new GetObjectCommand({ Bucket: uploadsBucket, Key: objectKey }),
    );

    const bytes = await object.Body?.transformToByteArray();
    if (!bytes) {
      return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}

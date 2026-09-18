import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";

import { parseRange } from "@/lib/range";
import { s3, uploadsBucket } from "@/lib/storage";

type RouteParams = { params: Promise<{ key: string[] }> };

export async function GET(request: Request, { params }: RouteParams) {
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

    const contentType = object.ContentType ?? "application/octet-stream";
    const headers = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      // Sem isso o Safari do iPhone não toca vídeo: ele pede um trecho antes.
      "Accept-Ranges": "bytes",
    };

    const range = parseRange(request.headers.get("range"), bytes.length);
    if (range) {
      const slice = bytes.slice(range.start, range.end + 1);
      return new NextResponse(new Uint8Array(slice), {
        status: 206,
        headers: {
          ...headers,
          "Content-Range": `bytes ${range.start}-${range.end}/${bytes.length}`,
          "Content-Length": String(slice.length),
        },
      });
    }

    return new NextResponse(new Uint8Array(bytes), { headers });
  } catch {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
}

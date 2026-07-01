import { NextResponse } from "next/server";

/** Same-origin QR proxy so canvas PDF/image export can draw the code without CORS taint. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = searchParams.get("data");
  const sizeParam = searchParams.get("size") ?? "200";
  const size = Math.min(512, Math.max(64, Number.parseInt(sizeParam, 10) || 200));

  if (!data?.trim()) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const upstream = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
  const response = await fetch(upstream, { next: { revalidate: 86400 } });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 502 });
  }

  const bytes = await response.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

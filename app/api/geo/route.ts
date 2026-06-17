import { NextRequest, NextResponse } from "next/server";

// Resuelve un enlace de Google Maps (incluido el corto maps.app.goo.gl) y
// devuelve sus coordenadas "lat,lng", para poder embeber el mapa sin API key.
export const runtime = "nodejs";

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h === "::1" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^0\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(h)
  );
}

function coordsFrom(s: string): string | null {
  let m = s.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  m = s.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  m = s.match(/[?&/](?:q|query|ll|center|destination)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ coords: null }, { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ coords: null }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
    return NextResponse.json({ coords: null }, { status: 400 });
  }

  // Si la URL ya trae coordenadas, no hace falta resolverla.
  const inline = coordsFrom(target.href);
  if (inline) return NextResponse.json({ coords: inline });

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(target.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; InmobiliariaPV/1.0)",
        "Accept-Language": "es-MX,es",
      },
      redirect: "follow",
      signal: ctrl.signal,
      next: { revalidate: 86400 },
    });
    let coords = coordsFrom(res.url || "");
    if (!coords) coords = coordsFrom(await res.text());
    return NextResponse.json({ coords: coords || null });
  } catch {
    return NextResponse.json({ coords: null });
  } finally {
    clearTimeout(timeout);
  }
}

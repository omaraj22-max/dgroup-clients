import { NextRequest, NextResponse } from "next/server";

// Endpoint que lee el HTML de una página de propiedad (de otro sitio) y
// extrae sus fotos: og:image, twitter:image y el campo `image` de JSON-LD.
// Necesario porque el navegador no puede leer otra web por CORS.
//
// Cachea 1 día a nivel de respuesta para no re-scrapear en cada visita.
export const runtime = "nodejs";
export const revalidate = 86400;

const MAX_IMAGES = 20;

// Bloquea hosts internos/privados (anti-SSRF básico).
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

function absolutize(base: string, src: string): string | null {
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function metaContent(html: string, key: string): string[] {
  const out: string[] = [];
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`,
    "gi"
  );
  const tags = html.match(re) || [];
  for (const tag of tags) {
    const c = tag.match(/content=["']([^"']+)["']/i);
    if (c) out.push(c[1]);
  }
  return out;
}

function collectFromJsonLd(node: unknown, out: string[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((n) => collectFromJsonLd(n, out));
    return;
  }
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (k === "image" || k === "contentUrl" || k === "thumbnailUrl") {
      if (typeof v === "string") out.push(v);
      else if (Array.isArray(v))
        v.forEach((x) =>
          typeof x === "string" ? out.push(x) : collectFromJsonLd(x, out)
        );
      else collectFromJsonLd(v, out);
    } else if (v && typeof v === "object") {
      collectFromJsonLd(v, out);
    }
  }
}

function jsonLdImages(html: string): string[] {
  const out: string[] = [];
  const re =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      collectFromJsonLd(JSON.parse(m[1].trim()), out);
    } catch {
      /* JSON-LD inválido — se ignora */
    }
  }
  return out;
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}

// Devuelve la URL de mayor resolución de un srcset ("a.jpg 600w, b.jpg 2000w").
function largestFromSrcset(srcset: string): string | null {
  let best: string | null = null;
  let bestW = -1;
  for (const part of srcset.split(",")) {
    const seg = part.trim().split(/\s+/);
    const u = seg[0];
    if (!u) continue;
    const w = seg[1] && /(\d+)w/.test(seg[1]) ? parseInt(seg[1], 10) : 0;
    if (w > bestW) {
      bestW = w;
      best = u;
    }
  }
  return best;
}

// Fotos en tags <img> (con soporte de lazy-load y srcset). Es lo que usan
// muchos sitios (WordPress/Swiper, etc.) que no tienen og:image.
function imgTagImages(html: string): string[] {
  const out: string[] = [];
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const w = parseInt(attr(tag, "width") || "", 10);
    const h = parseInt(attr(tag, "height") || "", 10);
    if ((w && w <= 120) || (h && h <= 120)) continue; // descarta miniaturas/íconos
    let url =
      attr(tag, "data-src") ||
      attr(tag, "data-lazy-src") ||
      attr(tag, "data-original") ||
      attr(tag, "src");
    const ss = attr(tag, "srcset") || attr(tag, "data-srcset");
    if (ss) {
      const best = largestFromSrcset(ss);
      if (best) url = best;
    }
    if (url) out.push(url);
  }
  return out;
}

// Enlaces <a href="...jpg"> que apuntan directo a una imagen (galerías
// con miniatura que enlaza a la foto a tamaño completo).
function anchorImageHrefs(html: string): string[] {
  const out: string[] = [];
  const re =
    /<a\b[^>]+href=["']([^"']+\.(?:jpe?g|png|webp|avif)(?:\?[^"']*)?)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

// Logos, íconos, pixeles de tracking, placeholders → fuera.
const JUNK =
  /(?:logo|sprite|icon|favicon|avatar|placeholder|spinner|loader|loading|blank|pixel|spacer|1x1|transparent|watermark|cropped-)/i;

// Decodifica entidades comunes en URLs del HTML (&amp; rompe el query string).
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, "&")
    .replace(/&#0*38;/g, "&")
    .replace(/&#x0*26;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/gi, "'");
}

function extractImages(html: string, base: string): string[] {
  const raw = [
    ...metaContent(html, "og:image:secure_url"),
    ...metaContent(html, "og:image:url"),
    ...metaContent(html, "og:image"),
    ...metaContent(html, "twitter:image:src"),
    ...metaContent(html, "twitter:image"),
    ...jsonLdImages(html),
    ...anchorImageHrefs(html),
    ...imgTagImages(html),
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const r of raw) {
    const a = absolutize(base, decodeEntities(r.trim()));
    if (!a || !/^https?:/i.test(a)) continue;
    if (/\.svg($|\?)/i.test(a)) continue; // descarta vectoriales
    if (JUNK.test(a)) continue; // descarta logos/íconos
    try {
      // descarta enlaces a páginas (ej. /wiki/File:foo.jpg), no a imágenes
      if (new URL(a).pathname.includes(":")) continue;
    } catch {
      continue;
    }
    if (seen.has(a)) continue;
    seen.add(a);
    out.push(a);
    if (out.length >= MAX_IMAGES) break;
  }
  return out;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ images: [], error: "missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return NextResponse.json({ images: [], error: "bad url" }, { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
    return NextResponse.json({ images: [], error: "blocked" }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(target.href, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; InmobiliariaPV/1.0; +https://vercel.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ctrl.signal,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ images: [] });
    const html = await res.text();
    return NextResponse.json({ images: extractImages(html, target.href) });
  } catch {
    return NextResponse.json({ images: [] });
  } finally {
    clearTimeout(timeout);
  }
}

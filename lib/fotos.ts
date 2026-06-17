"use client";

// Pide al endpoint /api/fotos las imágenes de la página externa de la
// propiedad. Cachea en memoria + sessionStorage para no re-scrapear al
// navegar entre el grid y el detalle.
const mem = new Map<string, string[]>();

export async function fetchFotos(website?: string): Promise<string[]> {
  if (!website) return [];
  if (mem.has(website)) return mem.get(website)!;

  const key = "fotos:" + website;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const arr = JSON.parse(cached) as string[];
      mem.set(website, arr);
      return arr;
    }
  } catch {
    /* sessionStorage no disponible */
  }

  try {
    const r = await fetch("/api/fotos?url=" + encodeURIComponent(website));
    const j = await r.json();
    const arr: string[] = Array.isArray(j.images) ? j.images : [];
    mem.set(website, arr);
    try {
      sessionStorage.setItem(key, JSON.stringify(arr));
    } catch {
      /* ignore quota */
    }
    return arr;
  } catch {
    return [];
  }
}

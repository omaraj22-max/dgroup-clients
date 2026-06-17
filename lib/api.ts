// ─────────────────────────────────────────────────────────────
//  Cliente del API — apunta a tu Apps Script vía NEXT_PUBLIC_API_URL.
//  El POST usa header text/plain para evitar el preflight CORS de
//  Apps Script (igual que el prototipo).
// ─────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

function assertConfigured() {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL no está configurada. Crea .env.local (ver .env.local.example)."
    );
  }
}

export async function apiGet<T = any>(
  params: Record<string, string>
): Promise<T> {
  assertConfigured();
  const url = API_URL + "?" + new URLSearchParams(params).toString();
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Error ${r.status} al consultar el API`);
  return r.json();
}

export async function apiPost<T = any>(body: unknown): Promise<T> {
  assertConfigured();
  const r = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight CORS
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Error ${r.status} al enviar datos al API`);
  return r.json();
}

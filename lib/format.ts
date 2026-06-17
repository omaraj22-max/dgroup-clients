// Formato de precio en pesos — idéntico al prototipo.
export const peso = (v: unknown): string => {
  if (v === "" || v == null) return "";
  if (typeof v === "string" && /[a-zA-Z$]/.test(v)) return v;
  const n = Number(v);
  if (isNaN(n)) return String(v);
  if (n >= 1e6) return `MX$${(n / 1e6).toFixed(2)}M`;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
};

// Extrae un número de un valor que puede venir como número o texto
// ("5500000", "MX$5,500,000", "USD 320,000" → 5500000 / 320000).
export function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return isFinite(n) && n > 0 ? n : null;
}

// Precio por metro cuadrado, automático: precio total / m². Asume MXN.
// Devuelve null si falta precio o m², o si no son numéricos.
export function pricePerM2(precio: unknown, m2: unknown): string | null {
  const p = num(precio);
  const m = num(m2);
  if (!p || !m) return null;
  const per = Math.round(p / m);
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(per);
}

export function fmtDate(d: string | number | Date): string {
  try {
    return new Date(d).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

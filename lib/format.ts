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

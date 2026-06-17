import type { CSSProperties } from "react";

// ── design tokens (premium, costa / arena) ──────────────────
// Idénticos al prototipo original — preservan el diseño "tal cual".
export const T = {
  bg: "#FAF8F5",
  ink: "#1C1917",
  sub: "#78716C",
  line: "#E7E2DB",
  card: "#FFFFFF",
  accent: "#0F766E", // teal profundo (mar)
  accentSoft: "#0F766E14",
  gold: "#B08D57",
} as const;

export const iconBtn = (
  bg: string,
  color: string,
  pos: CSSProperties
): CSSProperties => ({
  position: "absolute",
  ...pos,
  width: 40,
  height: 40,
  borderRadius: 999,
  border: "none",
  background: bg,
  color,
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  backdropFilter: "blur(6px)",
});

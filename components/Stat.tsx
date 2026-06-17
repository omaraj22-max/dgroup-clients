import type { ReactNode } from "react";
import { T } from "@/lib/tokens";

export default function Stat({
  icon,
  n,
  label,
}: {
  icon: ReactNode;
  n: ReactNode;
  label: string;
}) {
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.line}`,
        borderRadius: 16,
        padding: "18px 20px",
      }}
    >
      <div style={{ color: T.accent }}>{icon}</div>
      <p style={{ margin: "10px 0 2px", fontSize: 28, fontWeight: 700, letterSpacing: -1 }}>
        {n}
      </p>
      <p style={{ margin: 0, color: T.sub, fontSize: 13 }}>{label}</p>
    </div>
  );
}

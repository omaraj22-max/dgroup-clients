"use client";

import { LogOut } from "lucide-react";
import { T } from "@/lib/tokens";

export default function Header({
  title,
  subtitle,
  onLogout,
}: {
  title: string;
  subtitle?: string;
  onLogout: () => void;
}) {
  return (
    <header
      style={{
        borderBottom: `1px solid ${T.line}`,
        background: "rgba(250,248,245,.85)",
        backdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: -0.4 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ margin: "2px 0 0", color: T.sub, fontSize: 13 }}>{subtitle}</p>
          )}
        </div>
        <button
          onClick={onLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: `1px solid ${T.line}`,
            borderRadius: 10,
            padding: "8px 14px",
            cursor: "pointer",
            fontSize: 13.5,
            color: T.sub,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          <LogOut size={15} /> Salir
        </button>
      </div>
    </header>
  );
}

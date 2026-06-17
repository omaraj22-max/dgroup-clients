"use client";

import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { T } from "@/lib/tokens";

export function FullLoader() {
  return (
    <div style={{ minHeight: "100dvh", background: T.bg, display: "grid", placeItems: "center" }}>
      <Loader2 size={32} className="spin" color={T.accent} />
    </div>
  );
}

export function Empty({ text }: { text?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px", color: T.sub }}>
      <Sparkles size={32} color={T.gold} />
      <p style={{ marginTop: 16, fontSize: 16 }}>
        {text || "Tu asesor aún no te ha asignado propiedades."}
      </p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div style={{ textAlign: "center", padding: "70px 20px", color: T.sub }}>
      <AlertTriangle size={32} color="#B91C1C" />
      <p style={{ marginTop: 16, fontSize: 16, color: T.ink }}>
        {message || "No se pudo conectar con el servidor."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 18,
            padding: "12px 22px",
            borderRadius: 12,
            border: "none",
            background: T.ink,
            color: "#fff",
            fontSize: 14.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

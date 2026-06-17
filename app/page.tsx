"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, ArrowRight, Loader2 } from "lucide-react";
import { T } from "@/lib/tokens";
import { apiGet } from "@/lib/api";
import { saveSession, getSession } from "@/lib/session";
import type { LoginResponse } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Si ya hay sesión, manda directo a su vista.
  useEffect(() => {
    const s = getSession();
    if (s) router.replace(s.role === "admin" ? "/admin" : "/propiedades");
  }, [router]);

  const submit = async () => {
    if (!pin.trim()) return;
    setLoading(true);
    setErr("");
    try {
      const res = await apiGet<LoginResponse>({ action: "login", pin: pin.trim() });
      if (!res.ok) {
        setErr(res.error || "PIN no válido");
        setLoading(false);
        return;
      }
      saveSession({
        role: res.role,
        pin: pin.trim(),
        name: res.name,
        agente: res.agente,
      });
      router.replace(res.role === "admin" ? "/admin" : "/propiedades");
    } catch {
      setErr("No se pudo conectar. Revisa la URL del API.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bg,
        color: T.ink,
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: T.accentSoft,
              color: T.accent,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: 0.3,
              marginBottom: 20,
            }}
          >
            <Sparkles size={14} /> Selección privada
          </div>
          <h1
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -0.5,
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Tus propiedades
            <br />
            en Puerto Vallarta
          </h1>
          <p style={{ color: T.sub, marginTop: 12, fontSize: 15 }}>
            Ingresa el código que te compartió tu asesor.
          </p>
        </div>

        <div
          style={{
            background: T.card,
            border: `1px solid ${T.line}`,
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 40px rgba(28,25,23,0.06)",
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: T.sub,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Lock size={14} /> Código de acceso
          </label>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="••••"
            inputMode="numeric"
            autoFocus
            style={{
              width: "100%",
              marginTop: 10,
              padding: "16px 18px",
              fontSize: 22,
              letterSpacing: 6,
              textAlign: "center",
              borderRadius: 14,
              border: `1px solid ${T.line}`,
              outline: "none",
              background: "#fff",
              color: T.ink,
              fontWeight: 700,
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = T.accent)}
            onBlur={(e) => (e.target.style.borderColor = T.line)}
          />
          {err && (
            <p style={{ color: "#B91C1C", fontSize: 13, marginTop: 10, marginBottom: 0 }}>
              {err}
            </p>
          )}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 18,
              padding: "15px",
              borderRadius: 14,
              border: "none",
              background: T.ink,
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
        <p style={{ textAlign: "center", color: T.sub, fontSize: 12, marginTop: 20 }}>
          ¿No tienes código? Contacta a tu asesor inmobiliario.
        </p>
      </div>
    </div>
  );
}

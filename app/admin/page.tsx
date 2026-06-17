"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Users, Heart, ExternalLink } from "lucide-react";
import { T } from "@/lib/tokens";
import { peso, fmtDate } from "@/lib/format";
import { apiGet } from "@/lib/api";
import { useSession, clearSession } from "@/lib/session";
import Header from "@/components/Header";
import Stat from "@/components/Stat";
import { FullLoader, ErrorState } from "@/components/states";
import type { AdminResponse } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const { session, ready } = useSession("admin");

  const [data, setData] = useState<AdminResponse | null>(null);
  const [tab, setTab] = useState<"likes" | "clientes">("likes");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<AdminResponse>({ action: "admin", pin: session.pin });
      if (res.ok) setData(res);
      else setError(res.error || "Sin acceso.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const logout = () => {
    clearSession();
    router.replace("/");
  };

  if (!ready || loading) return <FullLoader />;

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.ink }}>
      <Header
        title="Panel del asesor"
        subtitle="Intereses de tus clientes en tiempo real"
        onLogout={logout}
      />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>
        {error || !data ? (
          <ErrorState message={error || "Sin acceso."} onRetry={load} />
        ) : (
          <>
            {/* stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <Stat
                icon={<LayoutGrid size={18} />}
                n={data.stats.propiedades}
                label="Propiedades activas"
              />
              <Stat icon={<Users size={18} />} n={data.stats.clientes} label="Clientes" />
              <Stat
                icon={<Heart size={18} />}
                n={data.stats.intereses}
                label="Propiedades gustadas"
              />
            </div>

            {/* tabs */}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                borderBottom: `1px solid ${T.line}`,
              }}
            >
              {([
                ["likes", "Me interesa"],
                ["clientes", "Clientes"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  style={{
                    padding: "10px 16px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 14.5,
                    fontWeight: 600,
                    color: tab === k ? T.ink : T.sub,
                    borderBottom:
                      tab === k ? `2px solid ${T.accent}` : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "likes" ? (
              data.likes.length === 0 ? (
                <p style={{ color: T.sub }}>Aún no hay intereses registrados.</p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {data.likes.map((l, i) => (
                    <div
                      key={i}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.line}`,
                        borderRadius: 16,
                        padding: 14,
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={l.foto || "https://picsum.photos/seed/" + l.property_id + "/200"}
                        alt=""
                        style={{
                          width: 76,
                          height: 64,
                          borderRadius: 10,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>
                          {l.nombre_propiedad}
                        </p>
                        <p style={{ margin: "3px 0 0", color: T.sub, fontSize: 13 }}>
                          {l.zona && l.zona + " · "}
                          {peso(l.precio)}
                        </p>
                        <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                          <span
                            style={{
                              background: T.accentSoft,
                              color: T.accent,
                              padding: "2px 9px",
                              borderRadius: 999,
                              fontWeight: 600,
                            }}
                          >
                            {l.cliente}
                          </span>
                          <span style={{ color: T.sub, marginLeft: 8 }}>
                            {fmtDate(l.fecha)}
                          </span>
                        </p>
                      </div>
                      {l.website && (
                        <a
                          href={l.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: T.accent, flexShrink: 0 }}
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {data.clientes.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      background: T.card,
                      border: `1px solid ${T.line}`,
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{c.nombre}</p>
                      <p style={{ margin: "2px 0 0", color: T.sub, fontSize: 13 }}>
                        PIN {c.pin}
                        {c.agente && " · " + c.agente}
                      </p>
                    </div>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                        color: c.likes ? "#E11D48" : T.sub,
                        flexShrink: 0,
                      }}
                    >
                      <Heart size={16} fill={c.likes ? "#E11D48" : "none"} /> {c.likes}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

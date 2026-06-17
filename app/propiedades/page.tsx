"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { T } from "@/lib/tokens";
import { apiGet, apiPost } from "@/lib/api";
import { useSession, clearSession } from "@/lib/session";
import Header from "@/components/Header";
import PropertyCard from "@/components/PropertyCard";
import { FullLoader, Empty, ErrorState } from "@/components/states";
import type { PropertiesResponse, Property } from "@/types";

export default function PropiedadesPage() {
  const router = useRouter();
  const { session, ready } = useSession("client");

  const [data, setData] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<PropertiesResponse>({
        action: "properties",
        pin: session.pin,
      });
      if (res.ok) setData(res);
      else setError(res.error || "No se pudieron cargar las propiedades.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const toggleLike = async (prop: Property) => {
    if (!session) return;
    const liked = !prop.liked;
    // actualización optimista
    setData((d) =>
      d
        ? {
            ...d,
            properties: d.properties.map((p) =>
              p.id === prop.id ? { ...p, liked } : p
            ),
          }
        : d
    );
    try {
      await apiPost({
        action: "interest",
        pin: session.pin,
        property_id: prop.id,
        nombre_propiedad: prop.nombre,
        liked,
      });
    } catch {
      // revierte si falla
      setData((d) =>
        d
          ? {
              ...d,
              properties: d.properties.map((p) =>
                p.id === prop.id ? { ...p, liked: prop.liked } : p
              ),
            }
          : d
      );
    }
  };

  const logout = () => {
    clearSession();
    router.replace("/");
  };

  if (!ready || (loading && !data)) return <FullLoader />;

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.ink }}>
      <Header
        title={`Hola, ${data?.client || session?.name || ""}`}
        subtitle={
          data?.agente ? `Tu asesor: ${data.agente}` : "Propiedades seleccionadas para ti"
        }
        onLogout={logout}
      />
      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 20px 80px" }}>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !data || !data.properties.length ? (
          <Empty />
        ) : (
          <>
            <p style={{ color: T.sub, fontSize: 14, marginBottom: 20 }}>
              {data.properties.length}{" "}
              {data.properties.length === 1
                ? "propiedad recomendada"
                : "propiedades recomendadas"}
            </p>
            <div
              style={{
                display: "grid",
                gap: 22,
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
              }}
            >
              {data.properties.map((p) => (
                <PropertyCard key={p.id} p={p} onLike={() => toggleLike(p)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

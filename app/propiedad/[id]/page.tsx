"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  BedDouble,
  Maximize,
  Waves,
  Heart,
  ArrowLeft,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import { T } from "@/lib/tokens";
import { peso, pricePerM2 } from "@/lib/format";
import { apiGet, apiPost } from "@/lib/api";
import { fetchFotos } from "@/lib/fotos";
import { useSession } from "@/lib/session";
import Gallery from "@/components/Gallery";
import PropertyMap from "@/components/PropertyMap";
import { FullLoader, Empty, ErrorState } from "@/components/states";
import type { PropertiesResponse, Property } from "@/types";

export default function PropiedadDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const { session, ready } = useSession("client");

  const [prop, setProp] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fotos resueltas: manuales del Sheet o, si no hay, las de la página externa.
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotosLoading, setFotosLoading] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiGet<PropertiesResponse>({
        action: "properties",
        pin: session.pin,
      });
      if (res.ok) {
        const found = res.properties.find((x) => String(x.id) === String(id));
        setProp(found || null);
      } else {
        setError(res.error || "No se pudo cargar la propiedad.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }, [session, id]);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  // Resuelve las fotos cuando ya tenemos la propiedad.
  useEffect(() => {
    if (!prop) return;
    if (prop.fotos && prop.fotos.length) {
      setFotos(prop.fotos);
      return;
    }
    const source = prop.website || prop.mapa; // web de la propiedad o link de Maps
    if (source) {
      let alive = true;
      setFotosLoading(true);
      fetchFotos(source)
        .then((imgs) => {
          if (alive) setFotos(imgs);
        })
        .finally(() => {
          if (alive) setFotosLoading(false);
        });
      return () => {
        alive = false;
      };
    }
    setFotos([]);
  }, [prop]);

  const toggleLike = async () => {
    if (!session || !prop) return;
    const liked = !prop.liked;
    setProp((p) => (p ? { ...p, liked } : p));
    try {
      await apiPost({
        action: "interest",
        pin: session.pin,
        property_id: prop.id,
        nombre_propiedad: prop.nombre,
        liked,
      });
    } catch {
      setProp((p) => (p ? { ...p, liked: !liked } : p));
    }
  };

  if (!ready || loading) return <FullLoader />;

  if (error)
    return (
      <div style={{ minHeight: "100dvh", background: T.bg }}>
        <ErrorState message={error} onRetry={load} />
      </div>
    );

  if (!prop)
    return (
      <div style={{ minHeight: "100dvh", background: T.bg }}>
        <Empty text="No encontramos esta propiedad." />
        <div style={{ textAlign: "center" }}>
          <button
            onClick={() => router.push("/propiedades")}
            style={{
              padding: "12px 22px",
              borderRadius: 12,
              border: `1px solid ${T.line}`,
              background: T.card,
              color: T.ink,
              fontSize: 14.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Volver a propiedades
          </button>
        </div>
      </div>
    );

  const ppm2 = pricePerM2(prop.precio, prop.m2);

  const specs: { Icon: LucideIcon; label: string; val: string }[] = [
    prop.habitaciones && {
      Icon: BedDouble,
      label: "Habitaciones",
      val: String(prop.habitaciones),
    },
    prop.m2 && { Icon: Maximize, label: "Construcción", val: `${prop.m2} m²` },
    ppm2 && { Icon: Ruler, label: "Precio / m²", val: ppm2 },
    prop.distancia_playa && {
      Icon: Waves,
      label: "A la playa",
      val: prop.distancia_playa,
    },
    prop.zona && { Icon: MapPin, label: "Zona", val: prop.zona },
  ].filter(Boolean) as { Icon: LucideIcon; label: string; val: string }[];

  return (
    <div style={{ minHeight: "100dvh", background: T.bg, color: T.ink }}>
      {/* barra superior con volver */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(250,248,245,.85)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "14px 20px" }}>
          <button
            onClick={() => router.push("/propiedades")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: `1px solid ${T.line}`,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 13.5,
              color: T.sub,
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={15} /> Volver
          </button>
        </div>
      </div>

      <main
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 0 60px",
        }}
      >
        <div
          style={{
            background: T.bg,
            borderRadius: 24,
            overflow: "hidden",
            animation: "rise .35s cubic-bezier(.16,1,.3,1)",
          }}
        >
          <Gallery fotos={fotos} loading={fotosLoading} />

          <div style={{ padding: "26px 24px 32px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 25,
                    fontWeight: 700,
                    letterSpacing: -0.6,
                    lineHeight: 1.2,
                  }}
                >
                  {prop.nombre}
                </h1>
                <p
                  style={{
                    margin: "7px 0 0",
                    color: T.sub,
                    fontSize: 14.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <MapPin size={15} /> {prop.direccion || prop.zona}
                </p>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: -0.8,
                  color: T.accent,
                }}
              >
                {peso(prop.precio)}
              </p>
            </div>

            {/* specs */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
                gap: 12,
                marginTop: 24,
              }}
            >
              {specs.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: T.card,
                    border: `1px solid ${T.line}`,
                    borderRadius: 14,
                    padding: "16px 14px",
                  }}
                >
                  <div style={{ color: T.accent }}>
                    <s.Icon size={20} />
                  </div>
                  <p style={{ margin: "10px 0 2px", fontSize: 12, color: T.sub }}>
                    {s.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{s.val}</p>
                </div>
              ))}
            </div>

            {prop.comentarios && (
              <div style={{ marginTop: 26 }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>
                  Notas de tu asesor
                </h4>
                <p
                  style={{
                    margin: 0,
                    color: "#44403C",
                    fontSize: 14.5,
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                  }}
                >
                  {prop.comentarios}
                </p>
              </div>
            )}

            {prop.mapa && <PropertyMap value={prop.mapa} />}

            {/* acciones */}
            <div style={{ display: "flex", gap: 12, marginTop: 30, flexWrap: "wrap" }}>
              <button
                onClick={toggleLike}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "16px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  background: prop.liked ? "#E11D48" : T.ink,
                  color: "#fff",
                  fontSize: 15.5,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 9,
                  transition: "background .2s",
                }}
              >
                <Heart size={19} fill={prop.liked ? "#fff" : "none"} />
                {prop.liked
                  ? "Te interesa  ·  notificado a tu asesor"
                  : "Me interesa"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

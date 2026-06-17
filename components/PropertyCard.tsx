"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Maximize, Waves, Heart } from "lucide-react";
import { T } from "@/lib/tokens";
import { peso } from "@/lib/format";
import { fetchFotos } from "@/lib/fotos";
import type { Property } from "@/types";

export default function PropertyCard({
  p,
  onLike,
}: {
  p: Property;
  onLike: () => void;
}) {
  const router = useRouter();
  const manual = p.fotos?.[0];
  const source = p.website || p.mapa; // página de la propiedad o link de Google Maps
  const [cover, setCover] = useState<string>(manual || "");

  // Si no hay foto manual pero sí una fuente (web o Maps), jala la portada.
  useEffect(() => {
    if (manual) {
      setCover(manual);
      return;
    }
    if (source) {
      let alive = true;
      fetchFotos(source).then((imgs) => {
        if (alive && imgs[0]) setCover(imgs[0]);
      });
      return () => {
        alive = false;
      };
    }
  }, [manual, source]);

  const shown = cover || "https://picsum.photos/seed/" + p.id + "/800/600";
  const waiting = !cover && !!source;

  return (
    <div
      onClick={() => router.push(`/propiedad/${p.id}`)}
      style={{
        background: T.card,
        border: `1px solid ${T.line}`,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform .25s ease, box-shadow .25s ease",
        boxShadow: "0 1px 2px rgba(28,25,23,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 18px 50px rgba(28,25,23,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 1px 2px rgba(28,25,23,0.04)";
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "4/3",
          overflow: "hidden",
          background: waiting ? T.line : "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shown}
          alt={p.nombre}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: waiting ? 0 : 1,
            transition: "opacity .3s",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(6px)",
            padding: "5px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {p.zona || "Casa"}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          aria-label="Me interesa"
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 40,
            height: 40,
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,.92)",
            backdropFilter: "blur(6px)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Heart
            size={19}
            fill={p.liked ? "#E11D48" : "none"}
            color={p.liked ? "#E11D48" : T.ink}
          />
        </button>
      </div>
      <div style={{ padding: "16px 18px 18px" }}>
        <h3
          style={{
            margin: 0,
            fontSize: 16.5,
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: -0.2,
          }}
        >
          {p.nombre}
        </h3>
        <p
          style={{
            margin: "5px 0 0",
            color: T.sub,
            fontSize: 13.5,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <MapPin size={13} /> {p.direccion || p.zona}
        </p>
        <div style={{ display: "flex", gap: 14, marginTop: 13, color: T.sub, fontSize: 13 }}>
          {p.habitaciones && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <BedDouble size={14} /> {p.habitaciones}
            </span>
          )}
          {p.m2 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Maximize size={14} /> {p.m2} m²
            </span>
          )}
          {p.distancia_playa && (
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Waves size={14} /> {p.distancia_playa}
            </span>
          )}
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 20, fontWeight: 700, letterSpacing: -0.5 }}>
          {peso(p.precio)}
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { T } from "@/lib/tokens";

// Construye el src embebible de Google Maps (sin API key) a partir de una
// consulta: coordenadas, dirección o lugar.
function embed(q: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

// Coordenadas detectables sin tocar el servidor.
function localCoords(v: string): string | null {
  let m = v.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  m = v.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  m = v.match(/[?&](?:q|query|ll|center|destination)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return `${m[1]},${m[2]}`;
  m = v.match(/^\s*(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
  if (m) return `${m[1]},${m[2]}`;
  return null;
}

// Resuelve sin servidor: código <iframe>, URL de embed, o coordenadas.
function resolveLocal(v: string): string | null {
  const ifr = v.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (ifr) return ifr[1];
  if (/^https?:\/\/[^"'\s]*(?:\/maps\/embed|output=embed)/i.test(v)) return v;
  const c = localCoords(v);
  if (c) return embed(c);
  return null;
}

export default function PropertyMap({ value }: { value: string }) {
  const v = (value || "").trim();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!v) return;

    const direct = resolveLocal(v);
    if (direct) {
      setSrc(direct);
      return;
    }

    // Link sin coordenadas (p.ej. maps.app.goo.gl) → resolver en el servidor.
    if (/^https?:\/\//i.test(v)) {
      let alive = true;
      fetch("/api/geo?url=" + encodeURIComponent(v))
        .then((r) => r.json())
        .then((j) => {
          if (alive) setSrc(embed(j.coords || v));
        })
        .catch(() => {
          if (alive) setSrc(embed(v));
        });
      return () => {
        alive = false;
      };
    }

    // Dirección o nombre de lugar.
    setSrc(embed(v));
  }, [v]);

  if (!v) return null;

  return (
    <div style={{ marginTop: 26 }}>
      <h4
        style={{
          margin: "0 0 10px",
          fontSize: 14,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <MapPin size={15} /> Ubicación
      </h4>
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${T.line}`,
          background: T.line,
          aspectRatio: "16/9",
        }}
      >
        {src && (
          <iframe
            title="Mapa de la propiedad"
            src={src}
            width="100%"
            height="100%"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}

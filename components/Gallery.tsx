"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { T, iconBtn } from "@/lib/tokens";

// Galería de la página de detalle: flechas, dots y teclado (←/→/Esc).
export default function Gallery({ fotos }: { fotos: string[] }) {
  const router = useRouter();
  const imgs = fotos.length ? fotos : ["https://picsum.photos/seed/detalle/1200/800"];
  const [idx, setIdx] = useState(0);

  const next = () => setIdx((i) => (i + 1) % imgs.length);
  const prev = () => setIdx((i) => (i - 1 + imgs.length) % imgs.length);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push("/propiedades");
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgs.length]);

  return (
    <div style={{ position: "relative", aspectRatio: "16/10", background: "#000" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgs[idx]}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <button
        onClick={() => router.push("/propiedades")}
        aria-label="Cerrar"
        style={iconBtn("rgba(0,0,0,.5)", "#fff", { top: 14, right: 14 })}
      >
        <X size={20} />
      </button>
      {imgs.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Anterior"
            style={iconBtn("rgba(255,255,255,.9)", T.ink, {
              top: "50%",
              left: 14,
              transform: "translateY(-50%)",
            })}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            style={iconBtn("rgba(255,255,255,.9)", T.ink, {
              top: "50%",
              right: 14,
              transform: "translateY(-50%)",
            })}
          >
            <ArrowRight size={20} />
          </button>
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
            }}
          >
            {imgs.map((_, i) => (
              <span
                key={i}
                style={{
                  width: i === idx ? 22 : 7,
                  height: 7,
                  borderRadius: 999,
                  background: i === idx ? "#fff" : "rgba(255,255,255,.5)",
                  transition: "width .25s",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

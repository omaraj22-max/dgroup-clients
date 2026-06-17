"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/types";

export type Session = {
  role: Role;
  pin: string;
  name?: string;
  agente?: string;
};

const KEY = "inmo_session";
const COOKIE_DAYS = 30;

// Guarda en localStorage (sesión) + cookie (por si quieres leerla server-side).
export function saveSession(s: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  document.cookie = `inmo_pin=${encodeURIComponent(s.pin)}; path=/; max-age=${
    60 * 60 * 24 * COOKIE_DAYS
  }; samesite=lax`;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  document.cookie = "inmo_pin=; path=/; max-age=0";
}

// Hook de guardia: redirige al login si no hay sesión y, opcionalmente,
// exige un rol. Devuelve { session, ready } para evitar parpadeos.
export function useSession(requireRole?: Role) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.replace("/");
      return;
    }
    if (requireRole && s.role !== requireRole) {
      router.replace(s.role === "admin" ? "/admin" : "/propiedades");
      return;
    }
    setSession(s);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { session, ready };
}

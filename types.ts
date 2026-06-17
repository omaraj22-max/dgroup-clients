export type Role = "admin" | "client";

export type Property = {
  id: string;
  nombre: string;
  zona?: string;
  direccion?: string;
  habitaciones?: string | number;
  m2?: string | number;
  distancia_playa?: string;
  precio?: string | number;
  comentarios?: string;
  website?: string;
  mapa?: string; // valor de la columna "Google maps" (link, coords o dirección)
  fotos: string[];
  liked?: boolean;
};

export type PropertiesResponse = {
  ok: boolean;
  error?: string;
  client?: string;
  agente?: string;
  properties: Property[];
};

export type LoginResponse = {
  ok: boolean;
  error?: string;
  role: Role;
  name?: string;
  agente?: string;
};

export type AdminLike = {
  property_id: string;
  nombre_propiedad: string;
  zona?: string;
  precio?: string | number;
  cliente: string;
  fecha: string | number;
  foto?: string;
  website?: string;
};

export type AdminCliente = {
  nombre: string;
  pin: string;
  agente?: string;
  likes: number;
};

export type AdminResponse = {
  ok: boolean;
  error?: string;
  stats: { propiedades: number; clientes: number; intereses: number };
  likes: AdminLike[];
  clientes: AdminCliente[];
};

# Inmobiliaria PV — Next.js + TypeScript + Tailwind

App de selección privada de propiedades en Puerto Vallarta. Vista de cliente
(login por PIN) + panel del agente. El backend sigue siendo tu **Google Apps
Script** (`Code.gs`) que lee de un Google Sheet — esta app no lo reescribe, solo
lo consume.

## Rutas

| Ruta              | Qué hace                                        |
| ----------------- | ----------------------------------------------- |
| `/`               | Login por PIN (cliente o admin, mismo endpoint) |
| `/propiedades`    | Grid de propiedades del cliente (tras login)    |
| `/propiedad/[id]` | Detalle completo con galería                    |
| `/admin`          | Panel del agente (stats, likes, clientes)       |

La sesión se guarda en `localStorage` (`inmo_session`) + una cookie `inmo_pin`.
Las rutas protegidas usan el hook `useSession()` (`lib/session.ts`) que redirige
al login si no hay sesión y respeta el rol (admin / client).

---

## 1) Correr en local

Requisitos: Node 18.18+ (recomendado 20+).

```bash
# 1. instala dependencias
npm install

# 2. crea tu archivo de entorno y pega tu URL /exec
cp .env.local.example .env.local
#    edita .env.local y reemplaza el valor de NEXT_PUBLIC_API_URL

# 3. arranca el servidor de desarrollo
npm run dev
```

Abre http://localhost:3000

Otros scripts:

```bash
npm run build   # build de producción
npm run start   # sirve el build (después de build)
npm run lint    # linter
```

---

## 2) ¿Dónde pego la URL de mi Apps Script?

En **una sola variable**: `NEXT_PUBLIC_API_URL`.

- **Local:** en `.env.local`

  ```
  NEXT_PUBLIC_API_URL=https://script.google.com/macros/s/TU_ID/exec
  ```

- **Vercel:** en Project → Settings → Environment Variables (ver abajo).

> La URL es la de **Implementar → Nueva implementación → App web → URL `/exec`**
> de tu proyecto de Apps Script. Asegúrate de que la implementación tenga acceso
> "Cualquier usuario".
>
> El POST se manda con header `text/plain;charset=utf-8` (en `lib/api.ts`) para
> **evitar el preflight CORS** de Apps Script — igual que tu prototipo. No lo
> cambies a `application/json`.

---

## 3) Desplegar en Vercel

### Opción A — desde GitHub (recomendado)

1. Sube este proyecto a un repo de GitHub:

   ```bash
   git init
   git add .
   git commit -m "Inmobiliaria PV - Next.js"
   git branch -M main
   git remote add origin git@github.com:TU_USUARIO/inmobiliaria-pv.git
   git push -u origin main
   ```

2. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa el repo.
3. Framework: **Next.js** (se detecta solo). No cambies build ni output.
4. **Environment Variables** → agrega:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://script.google.com/macros/s/TU_ID/exec`
   - Environments: Production, Preview, Development
5. **Deploy**. Listo. Cada `git push` a `main` redeploya solo.

### Opción B — desde la CLI

```bash
npm i -g vercel
vercel              # primera vez: vincula el proyecto
vercel env add NEXT_PUBLIC_API_URL   # pega tu URL /exec
vercel --prod       # despliega a producción
```

> Si cambias el valor de `NEXT_PUBLIC_API_URL` después de un deploy, vuelve a
> desplegar para que tome el nuevo valor (las `NEXT_PUBLIC_*` se inyectan en
> build).

---

## Estructura

```
app/
  layout.tsx                 # shell + fuente Inter
  page.tsx                   # /            login por PIN
  propiedades/page.tsx       # /propiedades grid del cliente
  propiedad/[id]/page.tsx    # /propiedad/[id] detalle + galería
  admin/page.tsx             # /admin       panel del agente
components/
  Header.tsx  PropertyCard.tsx  Gallery.tsx  Stat.tsx  states.tsx
lib/
  api.ts        # apiGet / apiPost (text/plain para evitar CORS)
  session.ts    # sesión en localStorage + cookie, hook useSession
  tokens.ts     # design tokens (paleta arena/teal) — diseño tal cual
  format.ts     # peso() y fmtDate()
types.ts        # tipos del API (Property, AdminResponse, etc.)
```

El diseño premium (paleta arena/teal, tarjetas, galería, animaciones) se
conserva idéntico al prototipo usando los mismos design tokens. La paleta
también está mapeada en `tailwind.config.ts` por si quieres usar utilidades.

> **No se tocó la lógica del Sheet ni los nombres de los campos.** El login admin
> usa el mismo endpoint `?action=login`.

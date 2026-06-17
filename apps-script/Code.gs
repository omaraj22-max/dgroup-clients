/**
 * ============================================================
 *  INMOBILIARIA PV — API (Google Apps Script)
 *  Backend para el panel de clientes + admin del agente.
 * ============================================================
 *
 *  PESTAÑAS REQUERIDAS EN EL SHEET (crea estas 3 hojas):
 *
 *  1) "Propiedades"  — encabezados en la fila 1, exactamente:
 *     id | nombre | zona | Google maps | habitaciones | m2 | distancia_playa | precio | comentarios | website | fotos | activo
 *       - id:            cualquier texto único (ej. P001). Si lo dejas vacío, se autogenera.
 *       - Google maps:   link de Google Maps (corto o largo), coordenadas "lat,lng",
 *                        una dirección, o el código <iframe> de "Insertar un mapa".
 *       - fotos:         varias URLs separadas por coma o salto de línea.
 *       - website:       URL de la página de la propiedad (si fotos está vacío, se
 *                        intentan extraer las fotos de ahí).
 *       - precio:        número (ej. 2410000) o texto (ej. "MX$2.41M").
 *       - activo:        TRUE/FALSE (FALSE = oculta la propiedad). Si la columna no
 *                        existe, se asume TRUE.
 *
 *  2) "Clientes" — encabezados en la fila 1:
 *     pin | nombre | propiedades | agente
 *       - pin:           código de acceso del cliente (ej. 4821).
 *       - propiedades:   ids separados por coma (ej. P001,P003,P004).
 *                        Déjalo vacío o pon "ALL" para mostrarle TODAS las activas.
 *       - agente:        nombre del agente que lo atiende (opcional).
 *
 *  3) "Intereses" — encabezados en la fila 1 (se llena solo):
 *     fecha | pin | cliente | property_id | nombre_propiedad | accion
 *
 *  ------------------------------------------------------------
 *  CÓMO PUBLICAR:
 *   1. Pega este código en Extensiones > Apps Script.
 *   2. Cambia ADMIN_PIN abajo por uno tuyo.
 *   3. Implementar > Nueva implementación > Tipo: Aplicación web.
 *   4. Ejecutar como: Yo.  Quién tiene acceso: Cualquier persona.
 *   5. Copia la URL /exec y pégala en el frontend (campo API_URL).
 *
 *   Para actualizar SIN cambiar la URL: Implementar > Administrar
 *   implementaciones > (lápiz) > Versión: Nueva versión > Implementar.
 * ============================================================
 */

const ADMIN_PIN = '7777'; // <-- CAMBIA ESTO. Es el PIN del agente para entrar al admin.

const SHEETS = {
  props: 'Propiedades',
  clients: 'Clientes',
  interests: 'Intereses',
};

// ---------- ROUTER ----------
function doGet(e) {
  const action = (e.parameter.action || '').toLowerCase();
  try {
    if (action === 'login')      return json(login(e.parameter.pin));
    if (action === 'properties') return json(getPropertiesForPin(e.parameter.pin));
    if (action === 'admin')      return json(adminData(e.parameter.pin));
    return json({ ok: true, msg: 'API viva. Usa ?action=login|properties|admin' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if ((body.action || '') === 'interest') return json(saveInterest(body));
    return json({ ok: false, error: 'acción desconocida' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// ---------- LÓGICA ----------
function login(pin) {
  pin = String(pin || '').trim();
  if (pin && pin === ADMIN_PIN) return { ok: true, role: 'admin' };
  const client = findClient(pin);
  if (!client) return { ok: false, error: 'PIN no válido' };
  return { ok: true, role: 'client', name: client.nombre, agente: client.agente };
}

function getPropertiesForPin(pin) {
  pin = String(pin || '').trim();
  const client = findClient(pin);
  if (!client) return { ok: false, error: 'PIN no válido' };

  const all = readProperties().filter(p => p.activo);
  let list = all;
  const assigned = String(client.propiedades || '').trim().toUpperCase();
  if (assigned && assigned !== 'ALL') {
    const ids = assigned.split(/[,\n]/).map(s => s.trim().toUpperCase()).filter(Boolean);
    list = all.filter(p => ids.includes(String(p.id).toUpperCase()));
  }
  // qué propiedades ya marcó como "me interesa"
  const liked = readInterests()
    .filter(i => String(i.pin) === pin)
    .map(i => String(i.property_id).toUpperCase());

  list = list.map(p => ({ ...p, liked: liked.includes(String(p.id).toUpperCase()) }));
  return { ok: true, client: client.nombre, agente: client.agente, properties: list };
}

function saveInterest(body) {
  const pin = String(body.pin || '').trim();
  const client = findClient(pin);
  if (!client) return { ok: false, error: 'PIN no válido' };

  const sh = sheet(SHEETS.interests);
  ensureHeaders(sh, ['fecha', 'pin', 'cliente', 'property_id', 'nombre_propiedad', 'accion']);

  // Evita duplicados: si ya existe like activo para ese pin+propiedad y la acción es like, no repite
  const existing = readInterests().filter(
    i => String(i.pin) === pin && String(i.property_id).toUpperCase() === String(body.property_id).toUpperCase()
  );
  const lastAction = existing.length ? existing[existing.length - 1].accion : null;
  const action = (body.liked ? 'like' : 'unlike');
  if (lastAction === action) return { ok: true, dup: true };

  sh.appendRow([
    new Date(),
    pin,
    client.nombre,
    body.property_id,
    body.nombre_propiedad || '',
    action,
  ]);
  return { ok: true };
}

function adminData(pin) {
  if (String(pin || '').trim() !== ADMIN_PIN) return { ok: false, error: 'Acceso denegado' };

  const props = readProperties();
  const clients = readClients();
  const interests = readInterests();

  // Estado actual por cliente+propiedad (último registro gana)
  const stateMap = {};
  interests.forEach(i => {
    const key = i.pin + '||' + String(i.property_id).toUpperCase();
    stateMap[key] = i; // el último sobrescribe
  });

  const likes = Object.values(stateMap)
    .filter(i => i.accion === 'like')
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .map(i => {
      const prop = props.find(p => String(p.id).toUpperCase() === String(i.property_id).toUpperCase());
      return {
        fecha: i.fecha,
        pin: i.pin,
        cliente: i.cliente,
        property_id: i.property_id,
        nombre_propiedad: prop ? prop.nombre : i.nombre_propiedad,
        zona: prop ? prop.zona : '',
        precio: prop ? prop.precio : '',
        foto: prop && prop.fotos.length ? prop.fotos[0] : '',
        website: prop ? prop.website : '',
      };
    });

  return {
    ok: true,
    stats: {
      propiedades: props.filter(p => p.activo).length,
      clientes: clients.length,
      intereses: likes.length,
    },
    clientes: clients.map(c => ({
      nombre: c.nombre,
      pin: c.pin,
      agente: c.agente,
      likes: likes.filter(l => String(l.pin) === String(c.pin)).length,
    })),
    likes: likes,
  };
}

// ---------- LECTURA DE HOJAS ----------
function readProperties() {
  const rows = readSheet(SHEETS.props);
  return rows.map((r, idx) => {
    const fotos = String(r.fotos || '')
      .split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    return {
      id: String(r.id || ('P' + String(idx + 1).padStart(3, '0'))).trim(),
      nombre: r.nombre || '',
      direccion: r.direccion || '',
      zona: r.zona || '',
      m2: r.m2 || '',
      habitaciones: r.habitaciones || '',
      distancia_playa: r.distancia_playa || '',
      comentarios: r.comentarios || '',
      precio: r.precio || '',
      website: r.website || '',
      mapa: r['google maps'] || '',   // columna "Google maps" -> mapa
      fotos: fotos,
      activo: parseBool(r.activo, true),
    };
  });
}

function readClients() {
  return readSheet(SHEETS.clients).map(r => ({
    pin: String(r.pin || '').trim(),
    nombre: r.nombre || '',
    propiedades: r.propiedades || '',
    agente: r.agente || '',
  })).filter(c => c.pin);
}

function readInterests() {
  return readSheet(SHEETS.interests).map(r => ({
    fecha: r.fecha || '',
    pin: String(r.pin || '').trim(),
    cliente: r.cliente || '',
    property_id: r.property_id || '',
    nombre_propiedad: r.nombre_propiedad || '',
    accion: String(r.accion || '').trim().toLowerCase(),
  }));
}

function findClient(pin) {
  pin = String(pin || '').trim();
  if (!pin) return null;
  return readClients().find(c => String(c.pin) === pin) || null;
}

// ---------- HELPERS ----------
function sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function readSheet(name) {
  const sh = sheet(name);
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim().toLowerCase());
  return data.slice(1)
    .filter(row => row.some(c => String(c).trim() !== ''))
    .map(row => {
      const o = {};
      headers.forEach((h, i) => (o[h] = row[i]));
      return o;
    });
}

function ensureHeaders(sh, headers) {
  const first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  const empty = first.every(c => String(c).trim() === '');
  if (empty) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function parseBool(v, def) {
  if (v === '' || v === null || v === undefined) return def;
  const s = String(v).trim().toLowerCase();
  if (['true', '1', 'si', 'sí', 'yes', 'x'].includes(s)) return true;
  if (['false', '0', 'no'].includes(s)) return false;
  return def;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- UTIL: crea las hojas y encabezados de un clic ----------
function setupSheets() {
  ensureHeaders(sheet(SHEETS.props),
    ['id', 'nombre', 'zona', 'Google maps', 'habitaciones', 'm2', 'distancia_playa', 'precio', 'comentarios', 'website', 'fotos', 'activo']);
  ensureHeaders(sheet(SHEETS.clients),
    ['pin', 'nombre', 'propiedades', 'agente']);
  ensureHeaders(sheet(SHEETS.interests),
    ['fecha', 'pin', 'cliente', 'property_id', 'nombre_propiedad', 'accion']);
  SpreadsheetApp.getUi().alert('Listo. Se crearon/verificaron las 3 hojas.');
}

// Carga, valida y prepara las recetas de /recetas/*.md
import fs from 'node:fs';
import path from 'node:path';
import { splitFrontmatter, YamlError } from './yaml.mjs';
import { CAT } from './categorias.mjs';
import { norm, claveIngrediente } from '../../public/js/comun.js';

export class RecetaError extends Error {}

const DIFICULTADES = { facil: 'Fácil', media: 'Media', dificil: 'Difícil' };

// Plural de unidades habituales
const UNIDADES_PLURAL = {
  cda: 'cdas', cdta: 'cdtas', vaso: 'vasos', taza: 'tazas', pizca: 'pizcas',
  diente: 'dientes', hoja: 'hojas', rama: 'ramas', rodaja: 'rodajas', lata: 'latas',
  sobre: 'sobres', puñado: 'puñados', chorrito: 'chorritos', loncha: 'lonchas',
  cabeza: 'cabezas', manojo: 'manojos', bote: 'botes', tarro: 'tarros', pellizco: 'pellizcos'
};

const NOTAS = { consejo: 'acc', variante: 'oli', 'se conserva': 'saf', truco: 'acc', 'para servir': 'oli' };

function parseCantidad(v, ctx) {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim().replace(',', '.');
  const uni = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
  let m;
  if ((m = s.match(/^(\d+)?\s*([¼½¾⅓⅔])$/))) return (m[1] ? Number(m[1]) : 0) + uni[m[2]];
  if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return Number(m[1]) / Number(m[2]);
  if (/^\d+(\.\d+)?$/.test(s)) return Number(s);
  throw new RecetaError(`${ctx}: cantidad "${v}" no válida (usa un número, 1/2 o ½)`);
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** **negrita** y *cursiva* dentro de texto ya escapado */
function inline(s) {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

function resolverMencion(texto, idExplicito, ings, ctx) {
  if (idExplicito) {
    const i = ings.findIndex((g) => norm(g.id) === norm(idExplicito));
    if (i === -1) throw new RecetaError(`${ctx}: [${texto}|${idExplicito}] no corresponde a ningún ingrediente (id)`);
    return i;
  }
  const t = norm(texto);
  const k = claveIngrediente(texto);
  const exactos = ings
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => [g.id, g.nombre, g.plural].filter(Boolean).some((x) => norm(x) === t || claveIngrediente(x) === k));
  if (exactos.length === 1) return exactos[0].i;
  const porId = exactos.filter(({ g }) => norm(g.id) === t);
  if (porId.length === 1) return porId[0].i;
  const palabras = (x) => ' ' + claveIngrediente(x) + ' ';
  const parciales = ings
    .map((g, i) => ({ g, i }))
    .filter(({ g }) => [g.id, g.nombre, g.plural].filter(Boolean).some((x) => palabras(x).includes(' ' + k + ' ') || palabras(texto).includes(' ' + claveIngrediente(x) + ' ')));
  const cand = exactos.length > 1 ? exactos : parciales;
  if (cand.length === 1) return cand[0].i;
  if (cand.length > 1) {
    throw new RecetaError(`${ctx}: [${texto}] es ambiguo (${cand.map((c) => c.g.id).join(', ')}). Escribe [${texto}|id]`);
  }
  throw new RecetaError(`${ctx}: [${texto}] no corresponde a ningún ingrediente. Revisa el nombre o escribe [${texto}|id]`);
}

const RE_TIMER = /⏲\s*((?:\d+\s*h\s*)?(?:\d+\s*min\s*)?(?:\d+\s*s)?)\s*$/;

function parseTimer(s) {
  let total = 0;
  const h = s.match(/(\d+)\s*h/);
  const m = s.match(/(\d+)\s*min/);
  const sec = s.match(/(\d+)\s*s\b/);
  if (h) total += Number(h[1]) * 3600;
  if (m) total += Number(m[1]) * 60;
  if (sec) total += Number(sec[1]);
  return total;
}

function parsePaso(texto, ings, ctx) {
  let timer = null;
  const tm = texto.match(RE_TIMER);
  if (tm) {
    timer = parseTimer(tm[1]);
    if (!timer) throw new RecetaError(`${ctx}: temporizador "⏲ ${tm[1]}" no válido (ej.: ⏲ 10 min, ⏲ 1 h 30 min)`);
    texto = texto.slice(0, tm.index).trim();
  }
  if (texto.includes('⏲')) throw new RecetaError(`${ctx}: el temporizador ⏲ debe ir al final del paso y solo puede haber uno`);
  const parts = [];
  const uses = [];
  const re = /\[([^\]|]+)(?:\|([^\]]+))?\]/g;
  let last = 0;
  let m;
  while ((m = re.exec(texto))) {
    if (m.index > last) parts.push({ t: texto.slice(last, m.index) });
    const i = resolverMencion(m[1].trim(), m[2]?.trim(), ings, ctx);
    parts.push({ t: m[1].trim(), i });
    if (!uses.includes(i)) uses.push(i);
    last = m.index + m[0].length;
  }
  if (last < texto.length) parts.push({ t: texto.slice(last) });
  if (/[[\]]/.test(parts.filter((p) => p.i == null).map((p) => p.t).join(''))) {
    throw new RecetaError(`${ctx}: corchete sin cerrar`);
  }
  const html = parts.map((p) => (p.i == null ? inline(esc(p.t)) : `<span class="mencion">${esc(p.t)}</span>`)).join('');
  // Texto plano sin marcas de formato para el modo cocina
  const plain = parts.map((p) => ({ ...p, t: p.t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1') }));
  return { html, parts: plain, uses, timer };
}

function parseCuerpo(body, ings, file) {
  const secciones = {};
  let actual = null;
  for (const raw of body.split(/\r?\n/)) {
    const h = raw.match(/^##\s+(.+?)\s*$/);
    if (h) {
      actual = norm(h[1]);
      if (!['preparacion', 'notas'].includes(actual)) {
        throw new RecetaError(`${file}: sección "## ${h[1]}" desconocida (usa "## Preparación" y "## Notas")`);
      }
      secciones[actual] = [];
      continue;
    }
    if (raw.trim() === '') continue;
    if (!actual) throw new RecetaError(`${file}: hay texto antes de "## Preparación"`);
    secciones[actual].push(raw);
  }
  const lista = (lineas, re, nombre) => {
    const items = [];
    for (const l of lineas) {
      const m = l.match(re);
      if (m) items.push(m[1].trim());
      else if (/^\s+\S/.test(l) && items.length) items[items.length - 1] += ' ' + l.trim();
      else throw new RecetaError(`${file}: en "${nombre}" cada línea debe empezar por ${nombre === 'Preparación' ? '"1. ", "2. "…' : '"- "'}: «${l.trim()}»`);
    }
    return items;
  };
  if (!secciones.preparacion?.length) throw new RecetaError(`${file}: falta "## Preparación" con al menos un paso`);
  const pasos = lista(secciones.preparacion, /^\d+[.)]\s+(.*)$/, 'Preparación').map((t, n) =>
    parsePaso(t, ings, `${file}, paso ${n + 1}`)
  );
  const notas = lista(secciones.notas || [], /^[-*]\s+(.*)$/, 'Notas').map((t) => {
    const m = t.match(/^\*\*(.+?):?\*\*:?\s*(.*)$/);
    const etiqueta = m ? m[1].replace(/:$/, '') : 'Nota';
    const texto = m ? m[2] : t;
    return { etiqueta, familia: NOTAS[norm(etiqueta)] || 'ink', html: inline(esc(texto)) };
  });
  return { pasos, notas };
}

function req(cond, msg) {
  if (!cond) throw new RecetaError(msg);
}

export function cargarReceta(file, src, dirFotos) {
  let data, body;
  try {
    ({ data, body } = splitFrontmatter(src));
  } catch (e) {
    if (e instanceof YamlError) throw new RecetaError(`${file}: ${e.message}`);
    throw e;
  }
  const slug = path.basename(file, '.md');
  req(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug), `${file}: el nombre del archivo debe ir en minúsculas, sin tildes y con guiones (ej.: arroz-con-costillas.md)`);
  const known = ['titulo', 'descripcion', 'tipo', 'preparacion', 'coccion', 'raciones', 'dificultad', 'fecha', 'foto', 'etiquetas', 'ingredientes'];
  for (const k of Object.keys(data)) req(known.includes(k), `${file}: campo "${k}" desconocido`);
  req(typeof data.titulo === 'string' && data.titulo, `${file}: falta "titulo"`);
  req(typeof data.descripcion === 'string' && data.descripcion, `${file}: falta "descripcion"`);
  const tipo = Array.isArray(data.tipo) ? data.tipo : data.tipo ? [data.tipo] : [];
  req(tipo.length, `${file}: falta "tipo"`);
  for (const t of tipo) req(CAT[t], `${file}: tipo "${t}" desconocido. Opciones: ${Object.keys(CAT).join(', ')}`);
  for (const k of ['preparacion', 'coccion']) {
    req(Number.isInteger(data[k]) && data[k] >= 0, `${file}: "${k}" debe ser un número de minutos`);
  }
  req(Number.isInteger(data.raciones) && data.raciones >= 1 && data.raciones <= 50, `${file}: "raciones" debe ser un número entero`);
  req(DIFICULTADES[data.dificultad], `${file}: "dificultad" debe ser facil, media o dificil`);
  req(/^\d{4}-\d{2}-\d{2}$/.test(String(data.fecha)), `${file}: "fecha" debe tener el formato AAAA-MM-DD`);
  let foto = null;
  if (data.foto) {
    foto = String(data.foto);
    req(fs.existsSync(path.join(dirFotos, foto)), `${file}: no existe la foto recetas/fotos/${foto}`);
  }
  const etiquetas = Array.isArray(data.etiquetas) ? data.etiquetas.map(String) : [];

  req(Array.isArray(data.ingredientes) && data.ingredientes.length, `${file}: falta la lista "ingredientes"`);
  const ids = new Set();
  const ingredientes = data.ingredientes.map((g, n) => {
    const ctx = `${file}, ingrediente ${n + 1}`;
    req(g && typeof g === 'object', `${ctx}: debe ser { id: …, nombre: … }`);
    const okKeys = ['id', 'nombre', 'plural', 'cantidad', 'unidad', 'unidadPlural', 'nota', 'grupo', 'opcional'];
    for (const k of Object.keys(g)) req(okKeys.includes(k), `${ctx}: campo "${k}" desconocido`);
    req(g.nombre, `${ctx}: falta "nombre"`);
    const id = String(g.id ?? g.nombre);
    req(!ids.has(norm(id)), `${ctx}: id "${id}" repetido`);
    ids.add(norm(id));
    const unidad = g.unidad ? String(g.unidad) : null;
    return {
      id,
      nombre: String(g.nombre),
      plural: g.plural ? String(g.plural) : null,
      cantidad: parseCantidad(g.cantidad, ctx),
      unidad,
      unidadPlural: g.unidadPlural ? String(g.unidadPlural) : unidad ? UNIDADES_PLURAL[unidad] || null : null,
      nota: g.nota ? String(g.nota) : null,
      grupo: g.grupo ? String(g.grupo) : null,
      opcional: g.opcional === true
    };
  });

  const { pasos, notas } = parseCuerpo(body, ingredientes, file);
  const total = data.preparacion + data.coccion;
  return {
    slug,
    titulo: data.titulo,
    descripcion: data.descripcion,
    tipo,
    preparacion: data.preparacion,
    coccion: data.coccion,
    total,
    raciones: data.raciones,
    dificultad: data.dificultad,
    dificultadLabel: DIFICULTADES[data.dificultad],
    fecha: String(data.fecha),
    foto,
    etiquetas,
    ingredientes,
    pasos,
    notas
  };
}

/** Datos compactos de ingredientes para el navegador */
export function ingsCliente(r) {
  return r.ingredientes.map((g) => ({
    q: g.cantidad, u: g.unidad, up: g.unidadPlural, n: g.nombre, np: g.plural, nota: g.nota
  }));
}

export function cargarRecetas(dir) {
  const dirFotos = path.join(dir, 'fotos');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('_')).sort();
  const errores = [];
  const recetas = [];
  for (const f of files) {
    try {
      recetas.push(cargarReceta(f, fs.readFileSync(path.join(dir, f), 'utf8'), dirFotos));
    } catch (e) {
      if (e instanceof RecetaError) errores.push(e.message);
      else throw e;
    }
  }
  if (errores.length) {
    const err = new RecetaError('Hay errores en las recetas:\n  • ' + errores.join('\n  • '));
    err.lista = errores;
    throw err;
  }
  // de la más reciente a la más antigua; a igual fecha, por título
  recetas.sort((a, b) => b.fecha.localeCompare(a.fecha) || a.titulo.localeCompare(b.titulo, 'es'));
  return recetas;
}

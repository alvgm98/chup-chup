// Utilidades compartidas entre el generador (Node) y el navegador.

/** Minúsculas y sin tildes, para comparar textos. */
export function norm(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Clave de ingrediente para la Nevera: ignora tildes, mayúsculas y plurales. */
export function claveIngrediente(s) {
  return norm(s)
    .split(/\s+/)
    .map((w) => {
      if (w.length > 4 && /[lnrdzj]es$/.test(w)) return w.slice(0, -2);
      if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
      return w;
    })
    .join(' ');
}

/** Cantidad legible: redondeo a ¼ y a 5 por encima de 20 (hoja de estilo). */
export function fmtCantidad(q) {
  if (q >= 20) return String(Math.round(q / 5) * 5);
  const r = Math.round(q * 4) / 4;
  const w = Math.floor(r);
  const f = r - w;
  const g = f === 0.25 ? '¼' : f === 0.5 ? '½' : f === 0.75 ? '¾' : '';
  if (!w && !g) return '¼';
  return (w ? String(w) : '') + g;
}

// Notas que en realidad son una cantidad («al gusto»): van en la columna de cantidad
const NOTA_CANTIDAD = /^(al gusto|la necesaria|lo necesario|el necesario|los necesarios|las necesarias|un puñado|unas gotas|un chorrito)$/i;

/**
 * Texto de cantidad + unidad y nombre, ya escalados.
 * `nota` es lo que queda para mostrar tras el nombre; `suave` indica una cantidad no numérica.
 */
export function ingredienteEscalado(ing, factor, opcion = 0) {
  let qty = '';
  const alt = ing.o && opcion > 0 && ing.o[opcion];
  let nombre = alt || ing.n;
  let nota = ing.nota || '';
  let suave = false;
  if (ing.q != null) {
    const v = ing.q * factor;
    const muchos = v > 1;
    qty = fmtCantidad(v) + (ing.u ? ' ' + (muchos && ing.up ? ing.up : ing.u) : '');
    if (muchos && ing.np && !alt) nombre = ing.np;
  } else if (NOTA_CANTIDAD.test(nota.trim())) {
    qty = nota.trim();
    nota = '';
    suave = true;
  }
  return { qty, nombre, nota, suave };
}

/** 75 → "1 h 15 min" */
export function fmtMinutos(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return m + ' min';
  return m ? h + ' h ' + m + ' min' : h + ' h';
}

/** 600 → "10:00" */
export function mmss(s) {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const dd = (n) => (n < 10 ? '0' : '') + n;
  return h ? h + ':' + dd(m) + ':' + dd(r) : dd(m) + ':' + dd(r);
}

/** 600 → "10 min", 90 → "1 min 30 s" */
export function fmtSegundos(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const out = [];
  if (h) out.push(h + ' h');
  if (m) out.push(m + ' min');
  if (r) out.push(r + ' s');
  return out.join(' ') || '0 s';
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

/** "2026-10-12" → "12 oct" (o relativo si es reciente y se pasa `hoy`). */
export function fmtFecha(iso, hoy) {
  const [y, mo, d] = iso.split('-').map(Number);
  if (hoy) {
    const a = Date.UTC(y, mo - 1, d);
    const b = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const dias = Math.round((b - a) / 86400000);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias > 1 && dias < 7) return 'Hace ' + dias + ' días';
    if (y !== hoy.getFullYear()) return d + ' ' + MESES[mo - 1] + ' ' + y;
  }
  return d + ' ' + MESES[mo - 1];
}

export function plural(n, uno, varios) {
  return n === 1 ? '1 ' + uno : n + ' ' + varios;
}

/** 30, 45 → "30–45 min"; 50, 90 → "50 min – 1 h 30 min"; iguales → "50 min" */
export function fmtRango(a, b) {
  if (a === b) return fmtMinutos(a);
  if (b < 60) return a + '–' + b + ' min';
  return fmtMinutos(a) + ' – ' + fmtMinutos(b);
}

/** ["Con patatas", "Con ñoquis"] → "Con patatas o con ñoquis" */
export function listaO(nombres) {
  const l = nombres.map((n, i) => (i === 0 ? n : n.charAt(0).toLowerCase() + n.slice(1)));
  return l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' o ' + l[l.length - 1];
}

/** Opciones elegidas en una receta: { "variante:índice": opción } (se comparte entre la ficha y el modo cocina) */
export function leerOpciones(slug) {
  try { return JSON.parse(localStorage.getItem('opciones:' + slug)) || {}; } catch { return {}; }
}
export function guardarOpcion(slug, clave, opcion) {
  const o = leerOpciones(slug);
  o[clave] = opcion;
  try { localStorage.setItem('opciones:' + slug, JSON.stringify(o)); } catch {}
}

// ---------- Lista de la compra ----------

// Unidades que se pueden sumar entre sí (aprox.: 1 cda ≈ 15 g/ml, 1 cdta ≈ 5)
const A_BASE = { g: 1, kg: 1000, ml: 1, l: 1000, cda: 15, cdta: 5 };

/**
 * Junta los ingredientes de una receta para la compra: los que comparten id
 * (sin el calificativo entre paréntesis) se suman, pasando a gramos si las unidades difieren.
 * Devuelve [{ clave, qty, nombre, opcional }].
 */
export function listaCompra(ings, factor, opcionDe = () => 0) {
  const grupos = new Map();
  ings.forEach((ing, i) => {
    const clave = claveIngrediente(ing.k || ing.n);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push({ ...ing, opc: opcionDe(i) });
  });
  return [...grupos.entries()].flatMap(([clave, gs]) => {
    const p = gs[0];
    const conQ = gs.filter((g) => g.q != null);
    const nombreDe = (g) => (g.o && g.opc > 0 ? { n: g.o[g.opc], np: null } : { n: g.n, np: g.np });
    let syn;
    if (!conQ.length) syn = { ...nombreDe(p), nota: p.nota };
    else if (conQ.every((g) => g.u === conQ[0].u)) {
      syn = { ...nombreDe(conQ[0]), q: conQ.reduce((a, g) => a + g.q, 0), u: conQ[0].u, up: conQ[0].up };
    } else if (conQ.every((g) => A_BASE[g.u])) {
      const u = conQ.some((g) => g.u === 'g' || g.u === 'kg') ? 'g' : 'ml';
      syn = { ...nombreDe(conQ[0]), q: conQ.reduce((a, g) => a + g.q * A_BASE[g.u], 0), u };
    } else {
      // Unidades que no se pueden sumar (zumo de lima y lima en cuartos): cada una por su lado
      return gs.map((g, n) => {
        const { qty, nombre } = ingredienteEscalado({ ...g, ...nombreDe(g) }, factor);
        return { clave: clave + '#' + n, qty, nombre, opcional: !!g.op };
      });
    }
    const { qty, nombre } = ingredienteEscalado(syn, factor);
    return { clave, qty: /^al gusto$/i.test(qty) ? '' : qty, nombre, opcional: gs.every((g) => g.op) };
  });
}

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

/** Texto de cantidad + unidad y nombre, ya escalados. */
export function ingredienteEscalado(ing, factor) {
  let qty = '';
  let nombre = ing.n;
  if (ing.q != null) {
    const v = ing.q * factor;
    const muchos = v > 1;
    qty = fmtCantidad(v) + (ing.u ? ' ' + (muchos && ing.up ? ing.up : ing.u) : '');
    if (muchos && ing.np) nombre = ing.np;
  }
  return { qty, nombre };
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

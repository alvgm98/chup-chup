// Plantillas HTML: `html\`...\`` escapa los valores salvo los marcados con raw().

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(String(s));

export function esc(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function val(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(val).join('');
  return esc(v);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += val(values[i]) + strings[i + 1];
  return new Raw(out);
}

/** JSON seguro dentro de <script type="application/json"> */
export const jsonScript = (id, data) =>
  raw(`<script type="application/json" id="${id}">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`);

// Iconos de interfaz (retícula de 24, trazo de la hoja de estilo)
const P = {
  buscar: '<circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path>',
  atras: '<path d="M15 6l-6 6 6 6"></path>',
  adelante: '<path d="M9 6l6 6-6 6"></path>',
  abajo: '<path d="M6 9l6 6 6-6"></path>',
  arriba: '<path d="M6 15l6-6 6 6"></path>',
  cerrar: '<path d="M6 6l12 12M18 6L6 18"></path>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
  reloj: '<circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path>',
  temporizador: '<circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 1.5M9.5 2.5h5"></path>',
  olla: '<path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"></path><path d="M2 10h2M20 10h2M9 6.5c0-1 1-1.5 1-2.5M14 6.5c0-1 1-1.5 1-2.5"></path>',
  nevera: '<rect x="6" y="3" width="12" height="18" rx="2"></rect><path d="M6 10h12M9 6v2M9 13v3"></path>',
  libro: '<path d="M12 6c-2-1.3-4.5-2-8-2v14c3.5 0 6 .7 8 2 2-1.3 4.5-2 8-2V4c-3.5 0-6 .7-8 2z"></path><path d="M12 6v14"></path>',
  sol: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path>',
  sinred: '<path d="M3 3l18 18"></path><path d="M8.5 6.6A6 6 0 0 1 17.6 10H18a4 4 0 0 1 2.3 7.3M16 19H7a5 5 0 0 1-2.4-9.4"></path>',
  menos: '<path d="M5 12h14"></path>',
  mas: '<path d="M12 5v14M5 12h14"></path>',
  flecha: '<path d="M5 12h14M13 6l6 6-6 6"></path>',
  orden: '<path d="M7 4v16M3.5 16.5L7 20l3.5-3.5M14 6h7M14 12h5M14 18h3"></path>',
  compartir: '<path d="M12 3v12M7 8l5-5 5 5"></path><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"></path>'
};

export function icono(nombre, { size = 24, sw = 1.6, cls = '' } = {}) {
  return raw(
    `<svg class="ico${cls ? ' ' + cls : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[nombre]}</svg>`
  );
}

/** Motivo de categoría (retícula de 64) */
export function motivo(d, { size = 42, sw = 1.8 } = {}) {
  return raw(
    `<svg class="motivo" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"></path></svg>`
  );
}

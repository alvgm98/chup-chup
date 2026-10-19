import { html, raw, icono, motivo } from '../html.mjs';
import { CAT } from '../categorias.mjs';
import { fmtMinutos, fmtFecha, fmtRango, listaO } from '../../../public/js/comun.js';

export function crearContexto({ base, sitio, version, hoy }) {
  const u = (p = '') => base + p.replace(/^\//, '');
  return { u, sitio, version, hoy };
}

export const famInk = (f) => `var(--${f}-ink)`;
export const famSoft = (f) => `var(--${f}-soft)`;

export function marca(ctx, tag = 'span') {
  return html`<${raw(tag)} class="marca">${ctx.sitio.nombre}<span class="punto">.</span></${raw(tag)}>`;
}

export function metaReceta(r) {
  return `${fmtRango(r.totalMin, r.totalMax)} · ${r.raciones} rac. · ${r.dificultadLabel}`;
}

/** Miniatura: foto recortada o tinte de categoría con su motivo */
export function miniatura(ctx, r, size = 'm') {
  const c = CAT[r.tipo[0]];
  if (r.foto) {
    return html`<span class="thumb thumb-${size}"><img src="${ctx.u('fotos/' + r.foto)}" alt="" loading="lazy" decoding="async"></span>`;
  }
  return html`<span class="thumb thumb-${size}" style="background:${famSoft(c.familia)};color:${famInk(c.familia)}">${motivo(c.d, { size: size === 's' ? 34 : size === 'l' ? 50 : 42, sw: size === 's' ? 2 : 1.8 })}</span>`;
}

/**
 * Fila de receta del índice.
 * modo "ultimas": categoría + fecha; modo "cat": "También en …"
 */
export function filaReceta(ctx, r, { modo = 'ultimas', actual = null } = {}) {
  const cats = r.tipo.map((t) => CAT[t].nombre);
  const otras = r.tipo.filter((t) => t !== actual).map((t) => CAT[t].nombre);
  return html`<a class="fila fila-${modo}" href="${ctx.u('receta/' + r.slug + '/')}"
      data-tiempo="${r.variantes.map((v) => v.total).join(',')}" data-dificultad="${[...new Set(r.variantes.map((v) => v.dificultad))].join(',')}"
      data-orden-fecha="${r.fecha}" data-orden-titulo="${r.titulo}" data-orden-tiempo="${r.totalMin}"
      data-orden-dif="${Math.min(...r.variantes.map((v) => ({ facil: 1, media: 2, dificil: 3 })[v.dificultad]))}">
    ${modo === 'ultimas' ? html`<span class="fila-fecha" data-fecha="${r.fecha}">${fmtFecha(r.fecha)}</span>` : ''}
    ${miniatura(ctx, r)}
    <span class="fila-txt">
      ${modo === 'ultimas'
        ? html`<span class="fila-top"><span class="kicker">${cats.join(' · ')}</span><span class="fila-fecha-m" data-fecha="${r.fecha}">${fmtFecha(r.fecha)}</span></span>`
        : ''}
      <span class="fila-titulo">${r.titulo}</span>
      <span class="fila-meta">${metaReceta(r)}</span>
      ${r.multi ? html`<span class="fila-var">${listaO(r.variantes.map((v) => v.nombre))}</span>` : ''}
      ${modo === 'cat' && actual && otras.length ? html`<span class="fila-otras">También en <b>${otras.join(', ')}</b></span>` : ''}
    </span>
    ${modo === 'ultimas' ? html`<span class="fila-meta-d">${fmtRango(r.totalMin, r.totalMax)}<br>${r.raciones} rac. · ${r.dificultadLabel}</span>` : ''}
  </a>`;
}

export function avisoRed() {
  return html`<div class="aviso-red" role="status" hidden>
    ${icono('sinred', { size: 20, sw: 1.7 })}
    <span><strong>Sin conexión.</strong> Mostrando las recetas guardadas en este dispositivo.</span>
    <button type="button" class="btn-ico" data-cerrar-aviso aria-label="Ocultar aviso">${icono('cerrar', { size: 16, sw: 2 })}</button>
  </div>`;
}

export function buscador(ctx, { valor = '', grande = true, autofocus = false, id = 'q' } = {}) {
  return html`<form class="buscador${grande ? '' : ' buscador-s'}" action="${ctx.u('buscar/')}" method="get" role="search">
    <label>
      ${icono('buscar', { size: grande ? 20 : 18 })}
      <input type="search" name="q" id="${id}" value="${valor}" aria-label="Buscar recetas" placeholder="Busca una receta o un ingrediente" autocomplete="off" enterkeyhint="search"${autofocus ? raw(' autofocus') : ''}>
      ${grande ? '' : html`<kbd>/</kbd>`}
    </label>
  </form>`;
}

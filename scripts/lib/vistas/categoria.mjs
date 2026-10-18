import { html, raw, icono, motivo } from '../html.mjs';
import { CATEGORIAS, CAT } from '../categorias.mjs';
import { layout } from './layout.mjs';
import { filaReceta, avisoRed, famInk, famSoft } from './comun.mjs';
import { plural } from '../../../public/js/comun.js';

const TIEMPOS = [
  ['', 'Todos'], ['lt30', '< 30 min'], ['30a60', '30–60 min'], ['gt60', '> 1 h']
];
const DIFICULTADES = [
  ['', 'Todas'], ['facil', 'Fácil'], ['media', 'Media'], ['dificil', 'Difícil']
];

function segmentado(nombre, etiqueta, opciones) {
  return html`<div class="seg" role="group" aria-label="${etiqueta}">
    <span class="seg-label">${etiqueta}</span>
    <div class="seg-opts">
      ${opciones.map(([v, l], i) => html`<button type="button" data-filtro="${nombre}" data-valor="${v}" aria-pressed="${i === 0 ? 'true' : 'false'}">${l}</button>`)}
    </div>
  </div>`;
}

function desplegable(nombre, etiqueta, opciones, ico) {
  return html`<details class="dd" data-dd="${nombre}">
    <summary class="chip chip-borde">${ico ? icono(ico, { size: 18 }) : ''}<span data-dd-label>${etiqueta}</span>${icono('abajo', { size: 16 })}</summary>
    <div class="dd-panel" role="group" aria-label="${etiqueta}">
      ${opciones.map(([v, l], i) => html`<button type="button" data-filtro="${nombre}" data-valor="${v}" data-etiqueta="${i === 0 ? etiqueta : l}" aria-pressed="${i === 0 ? 'true' : 'false'}">${icono('check', { size: 16, sw: 2, cls: 'dd-check' })}${l}</button>`)}
    </div>
  </details>`;
}

export function vistaCategoria(ctx, recetas, slug) {
  const todas = slug === null;
  const c = todas ? null : CAT[slug];
  const items = todas ? recetas : recetas.filter((r) => r.tipo.includes(slug));
  const nombre = todas ? 'Todas las recetas' : c.nombre;
  const tint = c ? famSoft(c.familia) : 'var(--sunk)';
  const ink = c ? famInk(c.familia) : 'var(--ink2)';
  const otras = CATEGORIAS.filter((x) => x.slug !== slug)
    .map((x) => ({ ...x, n: recetas.filter((r) => r.tipo.includes(x.slug)).length }))
    .filter((x) => x.n > 0);

  const cuerpo = html`<main class="pagina categoria">
    <div class="barra-movil solo-movil">
      <a class="btn-volver" href="${ctx.u('')}">${icono('atras', { size: 22, sw: 1.8 })}Inicio</a>
      <a class="btn-ico" href="${ctx.u('buscar/')}" aria-label="Buscar">${icono('buscar', { size: 22 })}</a>
    </div>
    <nav class="ruta solo-escritorio" aria-label="Ruta"><a href="${ctx.u('')}">Inicio</a><span aria-hidden="true">/</span><span>${nombre}</span></nav>
    ${avisoRed()}
    <header class="cat-cab" style="background:${tint};color:${ink}">
      <span class="lamina" aria-hidden="true"></span>
      <div class="cat-cab-txt">
        <span class="kicker-cab">${todas ? ctx.sitio.nombre : 'Categoría'}</span>
        <h1>${nombre}</h1>
        <span class="cat-cab-n">${items.length ? plural(items.length, 'receta', 'recetas') : 'Sin recetas aún'}</span>
      </div>
      ${c ? motivo(c.d, { size: 120, sw: 1.1 }) : ''}
    </header>

    ${items.length
      ? html`<div class="filtros" data-filtros>
          <div class="filtros-movil solo-movil">
            ${desplegable('tiempo', 'Tiempo', TIEMPOS, 'reloj')}
            ${desplegable('dificultad', 'Dificultad', DIFICULTADES)}
            <span class="filtros-orden">Más recientes</span>
          </div>
          <div class="filtros-escritorio solo-escritorio">
            ${segmentado('tiempo', 'Tiempo', TIEMPOS)}
            ${segmentado('dificultad', 'Dificultad', DIFICULTADES)}
            <span class="filtros-orden">Más recientes primero</span>
          </div>
        </div>
        <section class="lista-cat" aria-label="Recetas">
          ${items.map((r) => filaReceta(ctx, r, { modo: 'cat', actual: slug }))}
        </section>
        <div class="vacio vacio-filtros" hidden>
          <p class="vacio-titulo">Ninguna receta encaja con esos filtros.</p>
          <button type="button" class="btn-enlace" data-limpiar-filtros>Quitar filtros</button>
        </div>`
      : html`<div class="vacio">
          <p class="vacio-titulo">Esta página del cuaderno aún está en blanco.</p>
          <p>Todavía no hay recetas de ${nombre.toLowerCase()}.</p>
        </div>`}

    ${otras.length
      ? html`<section class="otras" aria-labelledby="otras">
          <h2 id="otras" class="etiqueta">Otras categorías</h2>
          <div class="carrusel">
            ${!todas ? html`<a class="chip chip-alto" href="${ctx.u('recetas/')}">Todas <span class="chip-n">${recetas.length}</span></a>` : ''}
            ${otras.map((o) => html`<a class="chip chip-alto" href="${ctx.u('categoria/' + o.slug + '/')}">
              <span style="color:${famInk(o.familia)}">${motivo(CAT[o.slug].d, { size: 22, sw: 2.6 })}</span>${o.nombre}<span class="chip-n">${o.n}</span></a>`)}
          </div>
        </section>`
      : ''}
  </main>`;
  return layout(ctx, {
    titulo: nombre,
    descripcion: todas ? undefined : `Recetas de ${nombre.toLowerCase()} del ${ctx.sitio.nombre.toLowerCase()}.`,
    seccion: 'recetas',
    cuerpo,
    scripts: items.length ? ['categoria.js'] : []
  });
}

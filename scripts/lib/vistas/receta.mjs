import { html, raw, icono, motivo, jsonScript } from '../html.mjs';
import { CAT } from '../categorias.mjs';
import { ingsCliente } from '../recetas.mjs';
import { layout } from './layout.mjs';
import { avisoRed, famInk, famSoft } from './comun.mjs';
import { fmtMinutos, fmtSegundos, ingredienteEscalado } from '../../../public/js/comun.js';

function barrasDificultad(d) {
  const n = { facil: 1, media: 2, dificil: 3 }[d];
  return html`<span class="barras" aria-hidden="true">${[1, 2, 3].map((k) => html`<span class="${k <= n ? 'llena' : ''}"></span>`)}</span>`;
}

function listaIngredientes(r) {
  const cli = ingsCliente(r);
  let grupo = null;
  const out = [];
  r.ingredientes.forEach((g, i) => {
    if (g.grupo && g.grupo !== grupo) {
      grupo = g.grupo;
      out.push(html`<li class="ing-grupo" role="presentation">${grupo}</li>`);
    }
    const { qty, nombre } = ingredienteEscalado(cli[i], 1);
    const nota = [g.nota, g.opcional ? 'opcional' : null].filter(Boolean).join(', ');
    out.push(html`<li><button type="button" class="ing" aria-pressed="false" data-i="${i}">
      <span class="caja" aria-hidden="true">${icono('check', { size: 16, sw: 2.6 })}</span>
      <span class="ing-q">${qty}</span>
      <span class="ing-n"><span class="ing-nombre">${nombre}</span>${nota ? html`<span class="ing-nota">, ${nota}</span>` : ''}</span>
    </button></li>`);
  });
  return out;
}

export function vistaReceta(ctx, r) {
  const c = CAT[r.tipo[0]];
  const cats = r.tipo.map((t) => CAT[t].nombre).join(' · ');
  const conFoto = !!r.foto;
  const datosCliente = { slug: r.slug, raciones: r.raciones, ings: ingsCliente(r) };

  const cuerpo = html`<main class="pagina receta">
    <div class="barra-movil solo-movil">
      <a class="btn-volver" href="${ctx.u('')}">${icono('atras', { size: 22, sw: 1.8 })}Recetas</a>
      <a class="barra-cat" href="${ctx.u('categoria/' + c.slug + '/')}">${c.nombre}</a>
    </div>
    <nav class="ruta solo-escritorio" aria-label="Ruta"><a href="${ctx.u('')}">Recetas</a><span aria-hidden="true">/</span><a href="${ctx.u('categoria/' + c.slug + '/')}">${c.nombre}</a></nav>
    ${avisoRed()}

    <section class="hero${conFoto ? ' hero-foto' : ''}" style="--tint:${famSoft(c.familia)};--tint-ink:${famInk(c.familia)}">
      <div class="hero-arte">
        ${conFoto
          ? html`<img src="${ctx.u('fotos/' + r.foto)}" alt="${r.titulo}" decoding="async" fetchpriority="high">`
          : html`<span class="lamina" aria-hidden="true"></span><span class="lamina lamina-2" aria-hidden="true"></span>
            <span class="hero-motivo-d">${motivo(c.d, { size: 150, sw: 1 })}</span>
            <span class="hero-pie">${c.nombre} · para <span data-raciones-txt>${r.raciones}</span></span>`}
      </div>
      <div class="hero-txt">
        <span class="kicker kicker-hero">${cats}</span>
        ${conFoto ? '' : html`<span class="hero-motivo-m">${motivo(c.d, { size: 76, sw: 1.4 })}</span>`}
        <h1>${r.titulo}</h1>
      </div>
      <p class="hero-desc">${r.descripcion}</p>
      <dl class="hero-datos">
        <div><dt><span class="solo-movil">Tiempo</span><span class="solo-escritorio">Tiempo total</span></dt><dd class="dato">${fmtMinutos(r.total)}</dd>
          <dd class="dato-sub solo-movil">${r.coccion ? `${r.preparacion} prep. · ${r.coccion} fuego` : 'sin fuego'}</dd></div>
        <div class="solo-escritorio"><dt>${r.coccion ? 'Preparación' : 'Al fuego'}</dt><dd class="dato">${fmtMinutos(r.coccion ? r.preparacion : 0)}</dd></div>
        <div><dt>Raciones</dt><dd class="dato" data-raciones-txt>${r.raciones}</dd><dd class="dato-sub solo-movil">personas</dd></div>
        <div><dt>Dificultad</dt><dd class="dato dato-dif">${r.dificultadLabel}${barrasDificultad(r.dificultad)}</dd></div>
      </dl>
      <div class="hero-cta">
        <a class="btn btn-acc btn-grande" href="cocina/" data-enlace-cocina>${icono('olla', { size: 22, sw: 1.8 })}Empezar a cocinar</a>
      </div>
    </section>

    <div class="receta-cuerpo">
      <aside class="ingredientes" aria-labelledby="ing">
        <h2 id="ing">Ingredientes</h2>
        <div class="raciones" data-raciones>
          <button type="button" class="raciones-btn" data-menos aria-label="Quitar una ración">${icono('menos', { size: 22, sw: 2 })}</button>
          <div class="raciones-val" aria-live="polite"><span class="raciones-n" data-raciones-txt>${r.raciones}</span> <span data-raciones-label>${r.raciones === 1 ? 'ración' : 'raciones'}</span></div>
          <button type="button" class="raciones-btn" data-mas aria-label="Añadir una ración">${icono('mas', { size: 22, sw: 2 })}</button>
        </div>
        <p class="recalculado" hidden>Cantidades recalculadas para <span data-raciones-txt>${r.raciones}</span>. <button type="button" class="btn-enlace" data-reset>Volver a ${r.raciones}</button></p>
        <ul class="lista-ing">${listaIngredientes(r)}</ul>
        <div class="ing-pie">
          <span data-hechos>0 de ${r.ingredientes.length} preparados</span>
          <button type="button" class="btn-enlace" data-desmarcar>Desmarcar todo</button>
        </div>
      </aside>

      <div class="receta-main">
        <section class="pasos" aria-labelledby="pasos">
          <h2 id="pasos">Preparación</h2>
          <ol>
            ${r.pasos.map((p, n) => html`<li class="paso">
              <span class="paso-n" aria-hidden="true">${n + 1}</span>
              <div class="paso-c">
                <p>${raw(p.html)}</p>
                ${p.timer ? html`<button type="button" class="chip chip-timer" data-timer="${p.timer}" data-paso="${n + 1}">
                  ${icono('temporizador', { size: 18, sw: 1.7 })}<span data-timer-txt>Temporizador · ${fmtSegundos(p.timer)}</span></button>` : ''}
              </div>
            </li>`)}
          </ol>
        </section>
        ${r.notas.length
          ? html`<section class="notas" aria-labelledby="notas">
              <h2 id="notas">Notas</h2>
              <div class="notas-caja">
                ${r.notas.map((nt) => html`<div class="nota">
                  <div class="etiqueta" style="color:${nt.familia === 'ink' ? 'var(--ink2)' : `var(--${nt.familia}-ink)`}">${nt.etiqueta}</div>
                  <p>${raw(nt.html)}</p>
                </div>`)}
              </div>
            </section>`
          : ''}
      </div>
    </div>
    ${jsonScript('datos-receta', datosCliente)}
  </main>`;
  return layout(ctx, {
    titulo: r.titulo,
    descripcion: r.descripcion,
    seccion: 'recetas',
    cuerpo,
    scripts: ['receta.js'],
    canonical: 'receta/' + r.slug + '/'
  });
}

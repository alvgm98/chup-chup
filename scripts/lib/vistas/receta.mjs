import { html, raw, icono, motivo, jsonScript } from '../html.mjs';
import { CAT } from '../categorias.mjs';
import { ingsCliente, etiquetasOpciones } from '../recetas.mjs';
import { layout } from './layout.mjs';
import { avisoRed, famInk, famSoft } from './comun.mjs';
import { fmtMinutos, fmtSegundos, ingredienteEscalado } from '../../../public/js/comun.js';

function barrasDificultad(d) {
  const n = { facil: 1, media: 2, dificil: 3 }[d];
  return html`<span class="barras" aria-hidden="true">${[1, 2, 3].map((k) => html`<span class="${k <= n ? 'llena' : ''}"></span>`)}</span>`;
}

function listaIngredientes(v) {
  const cli = ingsCliente(v);
  let grupo = null;
  const out = [];
  v.ingredientes.forEach((g, i) => {
    if (g.grupo && g.grupo !== grupo) {
      grupo = g.grupo;
      out.push(html`<li class="ing-grupo" role="presentation">${grupo}</li>`);
    }
    const { qty, nombre, nota: notaRestante, suave } = ingredienteEscalado(cli[i], 1);
    const nota = [notaRestante, g.opcional ? 'opcional' : null].filter(Boolean).join(', ');
    out.push(html`<li><button type="button" class="ing" aria-pressed="false" data-i="${i}">
      <span class="caja" aria-hidden="true">${icono('check', { size: 16, sw: 2.6 })}</span>
      <span class="ing-q${suave ? ' ing-q-suave' : ''}">${qty}</span>
      <span class="ing-n"><span class="ing-nombre">${nombre}</span>${nota ? html`<span class="ing-nota">, ${nota}</span>` : ''}</span>
    </button>${g.opciones
      ? html`<div class="ing-opciones" role="group" aria-label="Opciones para ${g.nombre}">
          ${etiquetasOpciones(g.opciones).map((et, k) => html`<button type="button" class="ing-opc" data-opc="${k}" data-i="${i}" aria-pressed="${k === 0 ? 'true' : 'false'}">${et}</button>`)}
        </div>`
      : ''}</li>`);
  });
  return out;
}

const fmtG = (n) => (n < 10 && n % 1 ? String(Math.round(n * 10) / 10).replace('.', ',') : String(Math.round(n)));

function seccionMacros(m) {
  if (!m) return '';
  // Reparto de la energía: proteínas e hidratos 4 kcal/g, grasas 9 kcal/g
  const partes = [
    { k: 'proteinas', n: 'Proteínas', f: 'acc', kcal: m.proteinas * 4 },
    { k: 'hidratos', n: 'Hidratos', f: 'saf', kcal: m.hidratos * 4 },
    { k: 'grasas', n: 'Grasas', f: 'oli', kcal: m.grasas * 9 }
  ];
  const total = partes.reduce((a, p) => a + p.kcal, 0) || 1;
  const pct = partes.map((p) => Math.round((p.kcal / total) * 100));
  pct[pct.indexOf(Math.max(...pct))] += 100 - pct.reduce((a, b) => a + b, 0);
  const extras = [['azucares', 'Azúcares'], ['saturadas', 'Grasas saturadas'], ['fibra', 'Fibra'], ['sal', 'Sal']].filter(([k]) => m[k] != null);
  return html`<section class="macros" aria-label="Valor nutricional">
    <h2>Valor nutricional</h2>
    <div class="macros-caja">
      <div class="macros-kcal"><span class="macros-num">${Math.round(m.kcal)}</span><span class="macros-ud">kcal<br>por ración</span></div>
      <div class="macros-barra" aria-hidden="true">${partes.map((p, i) => html`<span style="flex-grow:${pct[i]};background:var(--${p.f})"></span>`)}</div>
      <dl class="macros-lista">
        ${partes.map((p, i) => html`<div class="macro"><dt><span class="macro-punto" style="background:var(--${p.f})" aria-hidden="true"></span>${p.n}</dt><dd><span class="macro-g">${fmtG(m[p.k])} g</span><span class="macro-pct">${pct[i]} % de kcal</span></dd></div>`)}
      </dl>
      ${extras.length ? html`<p class="macros-extra">${extras.map(([k, n], i) => html`${i ? ' · ' : ''}${n} <b>${fmtG(m[k])} g</b>`)}</p>` : ''}
    </div>
    <p class="macros-pie">Aproximado, calculado a partir de los ingredientes.</p>
  </section>`;
}

/** Atributos para un bloque que solo se ve con una variante */
const bloque = (r, v) => raw(`data-v="${v.id}"${v.id !== r.defecto ? ' hidden' : ''}`);

function datosVariante(r, v) {
  return html`<dl class="hero-datos" ${bloque(r, v)}>
    <div><dt><span class="solo-movil">Tiempo</span><span class="solo-escritorio">Tiempo total</span></dt><dd class="dato">${fmtMinutos(v.total)}</dd>
      <dd class="dato-sub solo-movil">${v.coccion ? `${v.preparacion} prep. · ${v.coccion} fuego` : 'sin fuego'}</dd></div>
    <div class="solo-escritorio"><dt>${v.coccion ? 'Preparación' : 'Al fuego'}</dt><dd class="dato">${fmtMinutos(v.coccion ? v.preparacion : 0)}</dd></div>
    <div><dt>Raciones</dt><dd class="dato" data-raciones-txt>${v.raciones}</dd><dd class="dato-sub solo-movil">personas</dd></div>
    <div><dt>Dificultad</dt><dd class="dato dato-dif">${v.dificultadLabel}${barrasDificultad(v.dificultad)}</dd></div>
  </dl>`;
}

function cuerpoVariante(r, v) {
  return html`<div class="receta-variante" ${bloque(r, v)}>
    <aside class="ingredientes" aria-label="Ingredientes">
      <h2>Ingredientes</h2>
      <div class="raciones">
        <button type="button" class="raciones-btn" data-menos aria-label="Quitar una ración">${icono('menos', { size: 22, sw: 2 })}</button>
        <div class="raciones-val" aria-live="polite"><span class="raciones-n" data-raciones-txt>${v.raciones}</span> <span data-raciones-label>${v.raciones === 1 ? 'ración' : 'raciones'}</span></div>
        <button type="button" class="raciones-btn" data-mas aria-label="Añadir una ración">${icono('mas', { size: 22, sw: 2 })}</button>
      </div>
      <p class="recalculado" hidden>Cantidades recalculadas para <span data-raciones-txt>${v.raciones}</span>. <button type="button" class="btn-enlace" data-reset>Volver a ${v.raciones}</button></p>
      <ul class="lista-ing">${listaIngredientes(v)}</ul>
      <div class="ing-pie">
        <span data-hechos>0 de ${v.ingredientes.length} preparados</span>
        <button type="button" class="btn-enlace" data-desmarcar>Desmarcar todo</button>
      </div>
    </aside>

    <div class="receta-main">
      <section class="pasos" aria-label="Preparación">
        <h2>Preparación</h2>
        <ol>
          ${v.pasos.map((p, n) => html`<li class="paso">
            <span class="paso-n" aria-hidden="true">${n + 1}</span>
            <div class="paso-c">
              <p>${raw(p.html)}</p>
              ${p.tips.map((tp) => html`<p class="paso-tip"><span class="tip-e" style="color:${tp.familia === 'ink' ? 'var(--ink2)' : `var(--${tp.familia}-ink)`}">${tp.etiqueta}.</span> ${raw(tp.html)}</p>`)}
              ${p.timer ? html`<button type="button" class="chip chip-timer" data-timer="${p.timer}" data-paso="${n + 1}">
                ${icono('temporizador', { size: 18, sw: 1.7 })}<span data-timer-txt>Temporizador · ${fmtSegundos(p.timer)}</span></button>` : ''}
            </div>
          </li>`)}
        </ol>
      </section>
      ${v.notas.length
        ? html`<section class="notas" aria-label="Notas">
            <h2>Notas</h2>
            <div class="notas-caja">
              ${v.notas.map((nt) => html`<div class="nota">
                <div class="etiqueta" style="color:${nt.familia === 'ink' ? 'var(--ink2)' : `var(--${nt.familia}-ink)`}">${nt.etiqueta}</div>
                <p>${raw(nt.html)}</p>
              </div>`)}
            </div>
          </section>`
        : ''}
      ${seccionMacros(v.macros)}
    </div>
  </div>`;
}

function selectorVariantes(r) {
  const def = r.variantes.find((v) => v.id === r.defecto);
  const minimo = Math.min(...r.variantes.map((v) => v.total));
  const rapidas = r.variantes.filter((v) => v.total === minimo);
  return html`<div class="variantes">
    <button type="button" class="var-boton" data-var-abrir aria-haspopup="dialog" aria-expanded="false" aria-controls="var-panel">
      <span class="var-boton-txt"><span class="etiqueta">Variante</span><span class="var-actual" data-var-actual>${def.nombre}</span></span>
      <span class="var-cuenta">${r.variantes.length} variantes</span>${icono('abajo', { size: 18, sw: 1.8 })}
    </button>
    <div class="var-panel" id="var-panel" data-var-panel hidden>
      <button type="button" class="var-fondo" aria-label="Cerrar" data-var-cerrar></button>
      <section class="var-hoja" role="dialog" aria-modal="true" aria-labelledby="var-t">
        <span class="hoja-asa" aria-hidden="true"></span>
        <div class="var-cab">
          <h2 id="var-t">Elige variante</h2>
          <button type="button" class="btn-ico btn-ico-borde" aria-label="Cerrar" data-var-cerrar>${icono('cerrar', { size: 22, sw: 2 })}</button>
        </div>
        <ul class="var-lista">
          ${r.variantes.map((v) => html`<li><button type="button" class="var-op" data-elegir="${v.id}" aria-pressed="${v.id === r.defecto ? 'true' : 'false'}">
            <span class="var-radio" aria-hidden="true">${icono('check', { size: 14, sw: 2.6 })}</span>
            <span class="var-op-txt">
              <span class="var-op-nombre">${v.nombre}${rapidas.length < r.variantes.length && v.total === minimo ? html`<span class="var-rapida">La más rápida</span>` : ''}</span>
              <span class="var-op-meta">${icono('reloj', { size: 15, sw: 1.7 })}${fmtMinutos(v.total)}<span class="var-sep">·</span>${v.dificultadLabel}${barrasDificultad(v.dificultad)}<span class="var-sep">·</span>${v.raciones} rac.</span>
            </span>
          </button></li>`)}
        </ul>
      </section>
    </div>
  </div>`;
}

export function vistaReceta(ctx, r) {
  const c = CAT[r.tipo[0]];
  const cats = r.tipo.map((t) => CAT[t].nombre).join(' · ');
  const conFoto = !!r.foto;
  const datosCliente = {
    slug: r.slug,
    defecto: r.defecto,
    variantes: Object.fromEntries(r.variantes.map((v) => [v.id, { nombre: v.nombre, raciones: v.raciones, ings: ingsCliente(v) }]))
  };

  const cuerpo = html`<main class="pagina receta">
    <div class="barra-movil solo-movil">
      <a class="btn-volver" href="${ctx.u('')}">${icono('atras', { size: 22, sw: 1.8 })}Recetas</a>
      <a class="barra-cat" href="${ctx.u('categoria/' + c.slug + '/')}">${c.nombre}</a>
    </div>
    <nav class="ruta solo-escritorio" aria-label="Ruta"><a href="${ctx.u('')}">Recetas</a><span aria-hidden="true">/</span><a href="${ctx.u('categoria/' + c.slug + '/')}">${c.nombre}</a></nav>
    ${avisoRed()}

    <section class="hero${conFoto ? ' hero-foto' : ''}${r.multi ? ' hero-multi' : ''}" style="--tint:${famSoft(c.familia)};--tint-ink:${famInk(c.familia)}">
      <div class="hero-arte">
        ${conFoto
          ? html`<img src="${ctx.u('fotos/' + r.foto)}" alt="${r.titulo}" decoding="async" fetchpriority="high">`
          : html`<span class="lamina" aria-hidden="true"></span><span class="lamina lamina-2" aria-hidden="true"></span>
            <span class="hero-motivo-d">${motivo(c.d, { size: 150, sw: 1 })}</span>
            <span class="hero-pie">${c.nombre} · para <span data-raciones-pie>${r.raciones}</span></span>`}
      </div>
      <div class="hero-txt">
        <span class="kicker kicker-hero">${cats}</span>
        ${conFoto ? '' : html`<span class="hero-motivo-m">${motivo(c.d, { size: 76, sw: 1.4 })}</span>`}
        <h1>${r.titulo}</h1>
      </div>
      ${r.multi ? selectorVariantes(r) : ''}
      <p class="hero-desc">${r.descripcion}</p>
      ${r.variantes.map((v) => datosVariante(r, v))}
      <div class="hero-cta">
        <a class="btn btn-acc btn-grande" href="cocina/" data-enlace-cocina>${icono('olla', { size: 22, sw: 1.8 })}Empezar a cocinar</a>
      </div>
    </section>

    <div class="receta-cuerpo">
      ${r.variantes.map((v) => cuerpoVariante(r, v))}
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

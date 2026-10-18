import { html, icono, motivo } from '../html.mjs';
import { CATEGORIAS, CAT } from '../categorias.mjs';
import { layout } from './layout.mjs';
import { marca, filaReceta, avisoRed, buscador, famInk, famSoft } from './comun.mjs';

export function indiceCategorias(ctx, recetas, { compacto = false } = {}) {
  return html`<ul class="indice">
    ${CATEGORIAS.map((c) => {
      const n = recetas.filter((r) => r.tipo.includes(c.slug)).length;
      const cc = CAT[c.slug];
      return html`<li><a class="indice-item${n ? '' : ' vacia'}" href="${ctx.u('categoria/' + c.slug + '/')}">
        <span class="indice-tile" style="${n ? `background:${famSoft(c.familia)};color:${famInk(c.familia)}` : ''}">${motivo(cc.d, { size: 28, sw: 2.2 })}</span>
        <span class="indice-nombre">${c.nombre}</span>
        <span class="indice-puntos" aria-hidden="true"></span>
        <span class="indice-n">${n ? n : '—'}<span class="sr"> ${n === 1 ? 'receta' : 'recetas'}</span></span>
        ${compacto ? '' : icono('adelante', { size: 18, sw: 1.8, cls: 'indice-flecha' })}
      </a></li>`;
    })}
  </ul>`;
}

export function vistaInicio(ctx, recetas) {
  const ultimas = recetas.slice(0, 5);
  const cuerpo = html`<main class="pagina inicio">
    <header class="inicio-cab solo-movil">
      <div class="inicio-marca">${marca(ctx, 'h1')}<span class="lema">${ctx.sitio.lema}</span></div>
      ${buscador(ctx)}
    </header>
    ${avisoRed()}
    <div class="inicio-grid">
      <section class="bloque ultimas" aria-labelledby="ultimas">
        <div class="cab-seccion">
          <h2 id="ultimas">Últimas recetas</h2>
          <a class="enlace-fuerte" href="${ctx.u('recetas/')}">Ver las ${recetas.length}<span class="solo-escritorio">&nbsp;recetas →</span></a>
        </div>
        ${recetas.length
          ? ultimas.map((r) => filaReceta(ctx, r, { modo: 'ultimas' }))
          : html`<p class="vacio-texto">El cuaderno está en blanco. Pídele a Claude tu primera receta.</p>`}
      </section>
      <aside class="nevera-mini solo-escritorio" aria-labelledby="nevera-mini-t">
        <div class="kicker-ico">${icono('nevera', { size: 16, sw: 1.8 })} Nevera</div>
        <h2 id="nevera-mini-t">¿Qué tengo en la <em>nevera</em>?</h2>
        <p>Dime lo que tienes y te digo qué puedes cocinar.</p>
        <form action="${ctx.u('nevera/')}" method="get" class="nevera-mini-form">
          <input type="text" name="i" aria-label="Ingredientes, separados por comas" placeholder="huevos, patatas, cebolla…" autocomplete="off">
          <button type="submit" class="btn btn-acc btn-ancho">Ver qué puedo cocinar ${icono('flecha', { size: 20, sw: 2 })}</button>
        </form>
      </aside>
    </div>
    <section class="bloque categorias" aria-labelledby="indice">
      <div class="cab-seccion">
        <h2 id="indice">Categorías</h2>
        <span class="cab-nota">índice<span class="solo-escritorio"> del cuaderno</span></span>
      </div>
      ${indiceCategorias(ctx, recetas)}
    </section>
  </main>`;
  return layout(ctx, { seccion: 'recetas', cuerpo, scripts: [] });
}

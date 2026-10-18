import { html, icono, jsonScript } from '../html.mjs';
import { CATEGORIAS } from '../categorias.mjs';
import { layout } from './layout.mjs';
import { avisoRed, famInk } from './comun.mjs';
import { indiceCliente } from './nevera.mjs';
import { motivo } from '../html.mjs';
import { CAT } from '../categorias.mjs';

export function vistaBuscar(ctx, recetas) {
  const conRecetas = CATEGORIAS.filter((c) => recetas.some((r) => r.tipo.includes(c.slug)));
  const cuerpo = html`<main class="pagina buscar" data-buscar>
    <div class="buscar-barra">
      <form class="buscador buscador-activo" role="search" data-form>
        <label>
          ${icono('buscar', { size: 20 })}
          <input type="search" name="q" data-q aria-label="Buscar recetas" placeholder="Busca una receta o un ingrediente" autocomplete="off" enterkeyhint="search" autofocus>
          <button type="button" class="btn-ico" data-borrar aria-label="Borrar búsqueda" hidden>${icono('cerrar', { size: 18, sw: 2 })}</button>
        </label>
      </form>
    </div>
    ${avisoRed()}

    <section class="buscar-inicio" data-inicio>
      <h1 class="buscar-h1">Buscar en el cuaderno</h1>
      <p class="buscar-sub">Por nombre, ingrediente, tipo de plato o etiqueta. Aunque escribas con prisa.</p>
      <div class="etiqueta">Tipos de plato</div>
      <div class="chips-wrap">
        ${conRecetas.map((c) => html`<a class="chip chip-alto" href="${ctx.u('categoria/' + c.slug + '/')}"><span style="color:${famInk(c.familia)}">${motivo(CAT[c.slug].d, { size: 22, sw: 2.6 })}</span>${c.nombre}</a>`)}
      </div>
      <a class="btn btn-sec btn-ancho buscar-nevera" href="${ctx.u('nevera/')}">${icono('nevera', { size: 20, sw: 1.7 })}Buscar por ingredientes</a>
    </section>

    <section class="buscar-res" data-res-wrap hidden aria-live="polite">
      <div class="cab-seccion cab-seccion-s"><h2>Resultados</h2><span class="cab-nota-sans" data-res-n></span></div>
      <div data-res></div>
    </section>

    <section class="buscar-vacio" data-vacio hidden>
      <span class="buscar-vacio-ico">${motivo(CAT.pescado.d, { size: 56, sw: 1.5 })}</span>
      <h1>Ese plato aún no está en el cuaderno.</h1>
      <p>Prueba con menos palabras, o busca por lo que tengas en la nevera.</p>
      <div data-prueba-wrap>
        <div class="etiqueta">Prueba con</div>
        <div class="chips-wrap" data-prueba></div>
      </div>
      <div class="parecidas" data-parecidas-wrap>
        <div class="parecidas-t">Parecidas</div>
        <div data-parecidas></div>
      </div>
      <a class="btn btn-sec btn-ancho" href="${ctx.u('nevera/')}">${icono('nevera', { size: 20, sw: 1.7 })}Buscar por ingredientes</a>
    </section>
    ${jsonScript('indice', indiceCliente(ctx, recetas))}
  </main>`;
  return layout(ctx, {
    titulo: 'Buscar',
    seccion: 'buscar',
    cuerpo,
    scripts: ['buscar.js']
  });
}

export function vista404(ctx) {
  const cuerpo = html`<main class="pagina p404">
    <div class="vacio vacio-404">
      <p class="vacio-titulo">Esta página se ha despegado del cuaderno.</p>
      <p>Puede que la receta haya cambiado de nombre.</p>
      <div class="p404-acciones">
        <a class="btn btn-acc" href="${ctx.u('')}">Ir al inicio</a>
        <a class="btn btn-sec" href="${ctx.u('buscar/')}">Buscar una receta</a>
      </div>
    </div>
  </main>`;
  return layout(ctx, { titulo: 'No encontrada', seccion: '', cuerpo });
}

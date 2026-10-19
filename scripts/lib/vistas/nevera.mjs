import { html, icono, jsonScript } from '../html.mjs';
import { CAT } from '../categorias.mjs';
import { layout } from './layout.mjs';
import { avisoRed } from './comun.mjs';
import { fmtMinutos, fmtRango, claveIngrediente } from '../../../public/js/comun.js';

// "azúcar (caramelo)" cuenta como "azúcar" en la Nevera
const nombreNevera = (id) => id.replace(/\s*\(.*\)\s*$/, '');
const unicos = (l) => l.filter((x, i) => l.findIndex((y) => claveIngrediente(y) === claveIngrediente(x)) === i);

/** Índice ligero de recetas para la Nevera y el buscador */
export function indiceCliente(ctx, recetas) {
  return {
    cats: Object.fromEntries(Object.values(CAT).map((c) => [c.slug, { n: c.nombre, f: c.familia, d: c.d }])),
    recetas: recetas.map((r) => ({
      s: r.slug,
      u: ctx.u('receta/' + r.slug + '/'),
      t: r.titulo,
      c: r.tipo,
      tl: fmtRango(r.totalMin, r.totalMax),
      r: r.raciones,
      d: r.dificultadLabel,
      foto: r.foto ? ctx.u('fotos/' + r.foto) : null,
      def: r.defecto,
      // Ingredientes de cada variante (la Nevera elige la que mejor encaja)
      v: r.variantes.map((v) => ({
        id: v.id,
        n: v.nombre,
        tl: fmtMinutos(v.total),
        // Un ingrediente con opciones se guarda como "a|b|c": vale cualquiera
        i: unicos(v.ingredientes.filter((g) => !g.opcional).map((g) => [nombreNevera(g.id), ...(g.opciones || []).slice(1)].join('|'))),
        io: unicos(v.ingredientes.filter((g) => g.opcional).map((g) => nombreNevera(g.id)))
      })),
      n: [...new Set(r.variantes.flatMap((v) => v.ingredientes.flatMap((g) => g.opciones || [g.nombre])))],
      vn: r.multi ? r.variantes.map((v) => v.nombre) : [],
      e: r.etiquetas,
      x: r.descripcion
    }))
  };
}

export function vistaNevera(ctx, recetas) {
  const cuerpo = html`<main class="pagina nevera" data-nevera>
    ${avisoRed()}
    <header class="nevera-cab">
      <div class="kicker-ico">${icono('nevera', { size: 16, sw: 1.8 })} Nevera</div>
      <h1>¿Qué tengo en la <em>nevera</em>?</h1>
      <p>Dime lo que tienes a mano y te digo qué puedes cocinar.</p>
    </header>
    <section class="nevera-entrada">
      <div class="etiquetas-caja" data-caja>
        <ul class="etiquetas" data-tags aria-label="Ingredientes que tienes"></ul>
        <input type="text" data-input aria-label="Añadir ingrediente" placeholder="Añade un ingrediente…" autocomplete="off" enterkeyhint="done"
          role="combobox" aria-expanded="false" aria-controls="sugerencias" aria-autocomplete="list">
      </div>
      <ul class="sugerencias" id="sugerencias" role="listbox" aria-label="Sugerencias" data-sug hidden></ul>
      <div class="nevera-opciones">
        <button type="button" class="btn-enlace" data-vaciar>Vaciar</button>
      </div>
    </section>
    <section class="nevera-res" aria-live="polite">
      <div class="cab-seccion cab-seccion-s">
        <h2>Con lo que tienes</h2>
        <span class="cab-nota-sans" data-res-label></span>
      </div>
      <p class="nevera-vacio" data-res-vacio>Añade un par de ingredientes y empezamos a buscar.</p>
      <div class="nevera-lista" data-res></div>
    </section>
    ${jsonScript('indice', indiceCliente(ctx, recetas))}
  </main>`;
  return layout(ctx, {
    titulo: '¿Qué tengo en la nevera?',
    descripcion: 'Dime qué ingredientes tienes y te digo qué recetas puedes cocinar.',
    seccion: 'nevera',
    cuerpo,
    scripts: ['nevera.js']
  });
}

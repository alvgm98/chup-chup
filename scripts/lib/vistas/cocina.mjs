import { html, icono, jsonScript } from '../html.mjs';
import { ingsCliente } from '../recetas.mjs';
import { layout } from './layout.mjs';

export function vistaCocina(ctx, r) {
  const datos = {
    slug: r.slug,
    titulo: r.titulo,
    defecto: r.defecto,
    variantes: Object.fromEntries(
      r.variantes.map((v) => [
        v.id,
        {
          nombre: v.nombre,
          raciones: v.raciones,
          ings: ingsCliente(v),
          pasos: v.pasos.map((p) => ({ parts: p.parts, uses: p.uses, timer: p.timer }))
        }
      ])
    )
  };
  const cuerpo = html`<div class="cocina" data-cocina>
    <div class="cocina-top">
      <a class="btn-ico btn-ico-borde" href="../" aria-label="Salir del modo cocina" data-salir>${icono('cerrar', { size: 22, sw: 2 })}</a>
      <div class="cocina-titulo">${r.titulo}<span class="cocina-variante" data-variante-txt></span></div>
      <div class="pantalla-on" role="status" data-wake hidden>${icono('sol', { size: 16, sw: 1.8 })}<span>Pantalla encendida</span></div>
    </div>
    <div class="cocina-prog">
      <div class="cocina-prog-txt"><span data-num>Paso 1 de ${r.pasos.length}</span><span data-serv>Para ${r.raciones} raciones</span></div>
      <div class="cocina-barra" aria-hidden="true" data-barra></div>
    </div>
    <main class="cocina-main">
      <div class="cocina-otros" data-otros></div>
      <div class="cocina-texto" aria-live="polite" data-texto></div>
      <div class="cocina-usos" data-usos hidden>
        <div class="etiqueta">En este paso</div>
        <div class="cocina-usos-l" data-usos-l></div>
      </div>
      <div class="cocina-timer" data-timer hidden>
        ${icono('temporizador', { size: 28 })}
        <div class="cocina-timer-txt">
          <span class="cocina-reloj" role="timer" aria-label="Tiempo restante" data-reloj>00:00</span>
          <span class="cocina-timer-hint" data-hint>Temporizador de este paso</span>
        </div>
        <button type="button" class="btn btn-tinta" data-timer-btn>Iniciar</button>
      </div>
      <noscript><p>El modo cocina necesita JavaScript. <a href="../">Volver a la receta</a>.</p></noscript>
    </main>
    <div class="cocina-pie">
      <button type="button" class="btn-ver-ing" data-abrir-hoja aria-expanded="false">${icono('arriba', { size: 20, sw: 1.8 })}Ver ingredientes</button>
      <div class="cocina-nav">
        <button type="button" class="btn-cocina btn-cocina-sec" data-prev>${icono('atras', { size: 24, sw: 2.2 })}Anterior</button>
        <button type="button" class="btn-cocina btn-cocina-pri" data-next><span data-next-label>Siguiente</span>${icono('adelante', { size: 24, sw: 2.2 })}</button>
      </div>
    </div>
    <div class="hoja" data-hoja hidden>
      <button type="button" class="hoja-fondo" aria-label="Cerrar ingredientes" data-cerrar-hoja></button>
      <section class="hoja-panel" role="dialog" aria-modal="true" aria-labelledby="hoja-t">
        <span class="hoja-asa" aria-hidden="true"></span>
        <div class="hoja-cab">
          <h2 id="hoja-t">Ingredientes</h2>
          <button type="button" class="btn-ico btn-ico-borde" aria-label="Cerrar" data-cerrar-hoja>${icono('cerrar', { size: 22, sw: 2 })}</button>
        </div>
        <ul class="hoja-lista" data-hoja-lista></ul>
      </section>
    </div>
  </div>
  ${jsonScript('datos-cocina', datos)}`;
  return layout(ctx, {
    titulo: 'Cocinando · ' + r.titulo,
    descripcion: r.descripcion,
    cuerpo,
    clase: 'modo-cocina',
    cocina: true,
    scripts: ['cocina.js']
  });
}

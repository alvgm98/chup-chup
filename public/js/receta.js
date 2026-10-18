// Ficha de receta: raciones, ingredientes marcables y temporizadores.
import { ingredienteEscalado, fmtSegundos, mmss } from './comun.js';
import { Temporizador } from './sonido.js';

const datos = JSON.parse(document.getElementById('datos-receta').textContent);
const BASE = datos.raciones;
const clave = 'receta:' + datos.slug;
const guardado = (() => {
  try { return JSON.parse(sessionStorage.getItem(clave)) || {}; } catch { return {}; }
})();
let raciones = guardado.raciones || BASE;
const hechos = new Set(guardado.hechos || []);

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const botonesIng = $$('.ing');
const menos = $('[data-menos]');
const mas = $('[data-mas]');
const enlaceCocina = $('[data-enlace-cocina]');

function guardar() {
  try { sessionStorage.setItem(clave, JSON.stringify({ raciones, hechos: [...hechos] })); } catch {}
}

function pintar() {
  const k = raciones / BASE;
  botonesIng.forEach((b) => {
    const i = Number(b.dataset.i);
    const { qty, nombre } = ingredienteEscalado(datos.ings[i], k);
    $('.ing-q', b).textContent = qty;
    $('.ing-nombre', b).textContent = nombre;
    b.setAttribute('aria-pressed', hechos.has(i) ? 'true' : 'false');
  });
  $$('[data-raciones-txt]').forEach((el) => (el.textContent = raciones));
  $('[data-raciones-label]').textContent = raciones === 1 ? 'ración' : 'raciones';
  $('.recalculado').hidden = raciones === BASE;
  menos.disabled = raciones <= 1;
  mas.disabled = raciones >= 12;
  $('[data-hechos]').textContent = `${hechos.size} de ${datos.ings.length} preparados`;
  enlaceCocina.href = 'cocina/' + (raciones !== BASE ? '?r=' + raciones : '');
}

menos.addEventListener('click', () => { raciones = Math.max(1, raciones - 1); pintar(); guardar(); });
mas.addEventListener('click', () => { raciones = Math.min(12, raciones + 1); pintar(); guardar(); });
$('[data-reset]').addEventListener('click', () => { raciones = BASE; pintar(); guardar(); });
$('[data-desmarcar]').addEventListener('click', () => { hechos.clear(); pintar(); guardar(); });
botonesIng.forEach((b) =>
  b.addEventListener('click', () => {
    const i = Number(b.dataset.i);
    hechos.has(i) ? hechos.delete(i) : hechos.add(i);
    pintar();
    guardar();
  })
);

// Temporizadores de los pasos
$$('[data-timer]').forEach((btn) => {
  const total = Number(btn.dataset.timer);
  const txt = $('[data-timer-txt]', btn);
  const t = new Temporizador(total, {
    onTick: (tt) => {
      btn.dataset.estado = tt.estado;
      if (tt.estado === 'marcha') txt.textContent = mmss(tt.segundos) + ' · Pausar';
      else if (tt.estado === 'fin') txt.textContent = '¡Listo! · Paso ' + btn.dataset.paso;
      else if (tt.segundos < total) txt.textContent = mmss(tt.segundos) + ' · Seguir';
      else txt.textContent = 'Temporizador · ' + fmtSegundos(total);
    }
  });
  btn.addEventListener('click', () => {
    if (t.estado === 'fin') t.reiniciar();
    else t.alternar();
  });
});

pintar();

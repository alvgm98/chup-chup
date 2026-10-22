// Ficha de receta: variantes, raciones, ingredientes marcables y temporizadores.
import { ingredienteEscalado, fmtSegundos, mmss, leerOpciones, guardarOpcion } from './comun.js';
import { Temporizador } from './sonido.js';

const datos = JSON.parse(document.getElementById('datos-receta').textContent);
const ids = Object.keys(datos.variantes);
const multi = ids.length > 1;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const enlaceCocina = $('[data-enlace-cocina]');
const pie = $('[data-raciones-pie]');

const leer = (k) => { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } };
const escribir = (k, v) => { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} };
const claveVariante = 'variante:' + datos.slug;

/** Estado y comportamiento de una variante (sus ingredientes, raciones y temporizadores) */
function crearVariante(id) {
  const v = datos.variantes[id];
  const cuerpo = $(`.receta-variante[data-v="${id}"]`);
  const clave = `receta:${datos.slug}:${id}`;
  const g = leer(clave) || {};
  const st = { raciones: g.raciones || v.raciones, hechos: new Set(g.hechos || []) };
  const botones = $$('.ing', cuerpo);
  const menos = $('[data-menos]', cuerpo);
  const mas = $('[data-mas]', cuerpo);

  function pintar() {
    const k = st.raciones / v.raciones;
    botones.forEach((b) => {
      const i = Number(b.dataset.i);
      const opc = leerOpciones(datos.slug)[id + ':' + i] || 0;
      const { qty, nombre } = ingredienteEscalado(v.ings[i], k, opc);
      $$(`.ing-opc[data-i="${i}"]`, cuerpo).forEach((o) => o.setAttribute('aria-pressed', Number(o.dataset.opc) === opc ? 'true' : 'false'));
      $('.ing-q', b).textContent = qty;
      $('.ing-nombre', b).textContent = nombre;
      b.setAttribute('aria-pressed', st.hechos.has(i) ? 'true' : 'false');
    });
    $$(`[data-v="${id}"] [data-raciones-txt]`).forEach((el) => (el.textContent = st.raciones));
    $('[data-raciones-label]', cuerpo).textContent = st.raciones === 1 ? 'ración' : 'raciones';
    $('.recalculado', cuerpo).hidden = st.raciones === v.raciones;
    menos.disabled = st.raciones <= 1;
    mas.disabled = st.raciones >= 12;
    $('[data-hechos]', cuerpo).textContent = `${st.hechos.size} de ${v.ings.length} preparados`;
    if (activa === id) pintarComun();
    escribir(clave, { raciones: st.raciones, hechos: [...st.hechos] });
  }

  $$('.ing-opc', cuerpo).forEach((o) =>
    o.addEventListener('click', () => { guardarOpcion(datos.slug, id + ':' + o.dataset.i, Number(o.dataset.opc)); pintar(); })
  );
  menos.addEventListener('click', () => { st.raciones = Math.max(1, st.raciones - 1); pintar(); });
  mas.addEventListener('click', () => { st.raciones = Math.min(12, st.raciones + 1); pintar(); });
  $('[data-reset]', cuerpo).addEventListener('click', () => { st.raciones = v.raciones; pintar(); });
  $('[data-desmarcar]', cuerpo).addEventListener('click', () => { st.hechos.clear(); pintar(); });
  botones.forEach((b) =>
    b.addEventListener('click', () => {
      const i = Number(b.dataset.i);
      st.hechos.has(i) ? st.hechos.delete(i) : st.hechos.add(i);
      pintar();
    })
  );

  // Temporizadores de los pasos
  $$('[data-timer]', cuerpo).forEach((btn) => {
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
    btn.addEventListener('click', () => (t.estado === 'fin' ? t.reiniciar() : t.alternar()));
  });

  return { st, pintar, v };
}

let activa = null;
const variantes = {};

/** Lo que depende de la variante activa y está fuera de su bloque */
function pintarComun() {
  const { st, v } = variantes[activa];
  if (pie) pie.textContent = st.raciones;
  const q = new URLSearchParams();
  if (multi) q.set('v', activa);
  if (st.raciones !== v.raciones) q.set('r', st.raciones);
  enlaceCocina.href = 'cocina/' + (q.toString() ? '?' + q : '');
}

function elegir(id, { guardar = true } = {}) {
  activa = id;
  $$('[data-v]').forEach((el) => (el.hidden = el.dataset.v !== id));
  $$('[data-elegir]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.elegir === id ? 'true' : 'false'));
  const actual = $('[data-var-actual]');
  if (actual) actual.textContent = datos.variantes[id].nombre;
  pintarComun();
  if (multi) {
    if (guardar) { try { localStorage.setItem(claveVariante, id); } catch {} }
    const url = new URL(location.href);
    if (id === datos.defecto) url.searchParams.delete('v');
    else url.searchParams.set('v', id);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
}

for (const id of ids) variantes[id] = crearVariante(id);

// Variante inicial: la del enlace (?v=), la última que abriste o la de por defecto
let inicial = new URLSearchParams(location.search).get('v');
if (!datos.variantes[inicial]) {
  try { inicial = localStorage.getItem(claveVariante); } catch { inicial = null; }
}
if (!datos.variantes[inicial]) inicial = datos.defecto;
activa = inicial;
for (const id of ids) variantes[id].pintar();
elegir(inicial, { guardar: false });

// Selector de variantes (hoja en el móvil, desplegable en el ordenador)
const abrir = $('[data-var-abrir]');
const panel = $('[data-var-panel]');
function cerrarPanel(volverFoco = true) {
  if (!panel || panel.hidden) return;
  panel.hidden = true;
  abrir.setAttribute('aria-expanded', 'false');
  if (volverFoco) abrir.focus();
}
if (abrir) {
  abrir.addEventListener('click', () => {
    if (!panel.hidden) return cerrarPanel();
    panel.hidden = false;
    abrir.setAttribute('aria-expanded', 'true');
    ($('[data-elegir][aria-pressed="true"]', panel) || $('[data-elegir]', panel)).focus();
  });
  $$('[data-var-cerrar]').forEach((b) => b.addEventListener('click', () => cerrarPanel()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarPanel(); });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !e.target.closest('.variantes')) cerrarPanel(false);
  });
}
$$('[data-elegir]').forEach((b) => b.addEventListener('click', () => { elegir(b.dataset.elegir); cerrarPanel(); }));

// Compartir: menú del sistema si lo hay; si no, copia el enlace
const compartir = $('[data-compartir]');
const copiado = $('[data-copiado]');
let avisoT;
compartir.addEventListener('click', async () => {
  const url = new URL(location.pathname, location.origin);
  if (multi && activa !== datos.defecto) url.searchParams.set('v', activa);
  const titulo = document.querySelector('h1').textContent.trim();
  if (navigator.share) {
    try { await navigator.share({ title: titulo, url: url.href }); } catch {}
    return;
  }
  try {
    await navigator.clipboard.writeText(url.href);
    copiado.textContent = 'Enlace copiado';
  } catch {
    copiado.textContent = 'No se pudo copiar el enlace';
  }
  copiado.classList.add('visible');
  clearTimeout(avisoT);
  avisoT = setTimeout(() => copiado.classList.remove('visible'), 2200);
});

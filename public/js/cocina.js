// Modo cocina: un paso a la vez, temporizadores y pantalla encendida.
import { ingredienteEscalado, mmss } from './comun.js';
import { Temporizador, prepararAudio } from './sonido.js';

const todo = JSON.parse(document.getElementById('datos-cocina').textContent);
const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
// Variante: la del enlace, la última que abriste o la de por defecto
let vid = params.get('v');
if (!todo.variantes[vid]) { try { vid = localStorage.getItem('variante:' + todo.slug); } catch { vid = null; } }
if (!todo.variantes[vid]) vid = todo.defecto;
const multi = Object.keys(todo.variantes).length > 1;
const datos = { ...todo, ...todo.variantes[vid] };
const volver = '../' + (multi && vid !== todo.defecto ? '?v=' + vid : '');
const raciones = Math.min(12, Math.max(1, Number(params.get('r')) || datos.raciones));
const k = raciones / datos.raciones;
const N = datos.pasos.length;
const claveEstado = 'cocina:' + datos.slug + ':' + vid;
$('[data-barra]').replaceChildren(...datos.pasos.map(() => document.createElement('span')));
$('[data-salir]').href = volver;
if (multi) $('[data-variante-txt]').textContent = ' · ' + datos.nombre.charAt(0).toLowerCase() + datos.nombre.slice(1);

let i = 0;
try {
  const g = JSON.parse(sessionStorage.getItem(claveEstado));
  if (g && g.raciones === raciones && g.i < N) i = g.i;
} catch {}

const ings = datos.ings.map((g) => ingredienteEscalado(g, k));
const el = {
  num: $('[data-num]'), serv: $('[data-serv]'), barra: [...document.querySelectorAll('.cocina-barra span')],
  texto: $('[data-texto]'), usos: $('[data-usos]'), usosL: $('[data-usos-l]'),
  timer: $('[data-timer]'), reloj: $('[data-reloj]'), hint: $('[data-hint]'), timerBtn: $('[data-timer-btn]'),
  otros: $('[data-otros]'), prev: $('[data-prev]'), next: $('[data-next]'), nextLabel: $('[data-next-label]'),
  hoja: $('[data-hoja]'), hojaLista: $('[data-hoja-lista]'), abrirHoja: $('[data-abrir-hoja]'), wake: $('[data-wake]')
};

el.serv.textContent = `Para ${raciones} ${raciones === 1 ? 'ración' : 'raciones'}`;

// Temporizadores: uno por paso, siguen corriendo aunque cambies de paso
const timers = new Map();
function timerDe(n) {
  const seg = datos.pasos[n].timer;
  if (!seg) return null;
  if (!timers.has(n)) timers.set(n, new Temporizador(seg, { onTick: () => pintarTimers() }));
  return timers.get(n);
}

function pintarTimers() {
  const t = timers.get(i) || null;
  const seg = datos.pasos[i].timer;
  if (seg) {
    const tt = t || { estado: 'parado', segundos: seg };
    el.timer.dataset.estado = tt.estado;
    el.reloj.textContent = mmss(tt.segundos);
    el.hint.textContent = tt.estado === 'fin' ? 'Listo. Pasa al siguiente paso.' : tt.estado === 'marcha' ? 'En marcha · suena al terminar' : tt.segundos < seg ? 'En pausa' : 'Temporizador de este paso';
    el.timerBtn.textContent = tt.estado === 'fin' ? 'Repetir' : tt.estado === 'marcha' ? 'Pausar' : tt.segundos < seg ? 'Seguir' : 'Iniciar';
  }
  // Temporizadores de otros pasos que siguen en marcha o han terminado
  const otros = [...timers.entries()].filter(([n, tt]) => n !== i && (tt.estado === 'marcha' || tt.estado === 'fin'));
  el.otros.replaceChildren(
    ...otros.map(([n, tt]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.estado = tt.estado;
      b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2.5 1.5M9.5 2.5h5"></path></svg>';
      b.append(`Paso ${n + 1} · ${tt.estado === 'fin' ? '¡listo!' : mmss(tt.segundos)}`);
      b.addEventListener('click', () => ir(n));
      return b;
    })
  );
}

function pintarPaso(animar) {
  const p = datos.pasos[i];
  el.num.textContent = `Paso ${i + 1} de ${N}`;
  el.barra.forEach((s, n) => s.classList.toggle('on', n <= i));
  el.texto.replaceChildren(
    ...p.parts.map((part) => {
      if (part.i == null) return document.createTextNode(part.t);
      const s = document.createElement('strong');
      s.textContent = part.t;
      return s;
    })
  );
  if (animar) {
    el.texto.classList.remove('entra');
    void el.texto.offsetWidth;
    el.texto.classList.add('entra');
  }
  el.usos.hidden = p.uses.length === 0;
  el.usosL.replaceChildren(
    ...p.uses.map((u) => {
      const s = document.createElement('span');
      s.className = 'uso';
      const g = ings[u];
      if (g.qty) {
        const b = document.createElement(g.suave ? 'em' : 'strong');
        b.textContent = g.qty;
        s.append(b);
      }
      s.append(g.nombre + (g.nota ? ', ' + g.nota : ''));
      return s;
    })
  );
  el.timer.hidden = !p.timer;
  el.prev.setAttribute('aria-disabled', i === 0 ? 'true' : 'false');
  el.nextLabel.textContent = i === N - 1 ? 'Terminar' : 'Siguiente';
  pintarHoja();
  pintarTimers();
  $('.cocina-main').scrollTop = 0;
  try { sessionStorage.setItem(claveEstado, JSON.stringify({ i, raciones })); } catch {}
}

function pintarHoja() {
  const usos = datos.pasos[i].uses;
  el.hojaLista.replaceChildren(
    ...ings.map((g, n) => {
      const li = document.createElement('li');
      const ahora = usos.includes(n);
      li.className = ahora ? 'ahora' : '';
      li.innerHTML = '<span class="q"></span><span class="n"></span>';
      li.querySelector('.q').textContent = g.qty;
      li.querySelector('.n').textContent = g.nombre + (g.nota ? ', ' + g.nota : '');
      if (g.suave) li.querySelector('.q').classList.add('q-suave');
      if (ahora) {
        const a = document.createElement('span');
        a.className = 'ahora-t';
        a.textContent = 'Ahora';
        li.append(a);
      }
      return li;
    })
  );
}

function ir(n, animar = true) {
  n = Math.max(0, Math.min(N - 1, n));
  if (n === i) return;
  i = n;
  pintarPaso(animar);
}

el.prev.addEventListener('click', () => ir(i - 1));
el.next.addEventListener('click', () => {
  if (i === N - 1) {
    try { sessionStorage.removeItem(claveEstado); } catch {}
    location.href = volver;
  } else ir(i + 1);
});
el.timerBtn.addEventListener('click', () => {
  prepararAudio();
  const t = timerDe(i);
  if (t.estado === 'fin') t.iniciar();
  else t.alternar();
});

// Hoja de ingredientes
function abrirHoja() {
  el.hoja.hidden = false;
  el.abrirHoja.setAttribute('aria-expanded', 'true');
  el.hoja.querySelector('.hoja-cab button').focus();
}
function cerrarHoja() {
  el.hoja.hidden = true;
  el.abrirHoja.setAttribute('aria-expanded', 'false');
  el.abrirHoja.focus();
}
el.abrirHoja.addEventListener('click', abrirHoja);
document.querySelectorAll('[data-cerrar-hoja]').forEach((b) => b.addEventListener('click', cerrarHoja));

// Teclado y gestos
document.addEventListener('keydown', (e) => {
  if (!el.hoja.hidden) {
    if (e.key === 'Escape') cerrarHoja();
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); ir(i + 1); }
  if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ir(i - 1); }
  if (e.key === 'Escape') location.href = volver;
});
let x0 = null, y0 = null;
const main = $('.cocina-main');
main.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
main.addEventListener('touchend', (e) => {
  if (x0 == null) return;
  const dx = e.changedTouches[0].clientX - x0;
  const dy = e.changedTouches[0].clientY - y0;
  x0 = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(i + (dx < 0 ? 1 : -1));
});

// Pantalla siempre encendida
let lock = null;
async function pedirPantalla() {
  try {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    lock = await navigator.wakeLock.request('screen');
    el.wake.hidden = false;
    lock.addEventListener('release', () => { el.wake.hidden = true; });
  } catch { el.wake.hidden = true; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { pedirPantalla(); pintarTimers(); }
});
pedirPantalla();
// Algunos navegadores solo lo conceden tras un toque
document.addEventListener('pointerdown', () => { if (!lock || lock.released) pedirPantalla(); }, { passive: true });

pintarPaso(false);

// Comportamiento común a todas las páginas.
import { fmtFecha } from './comun.js';

const base = document.body.dataset.base || '/';

// Service worker (modo sin conexión)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch(() => {});
  });
}

// Fechas relativas ("Hoy", "Ayer", "Hace 3 días")
const hoy = new Date();
document.querySelectorAll('[data-fecha]').forEach((el) => {
  el.textContent = fmtFecha(el.dataset.fecha, hoy);
});

// Aviso de "sin conexión"
let avisoCerrado = false;
function actualizarRed() {
  document.querySelectorAll('.aviso-red').forEach((el) => {
    el.hidden = navigator.onLine || avisoCerrado;
  });
}
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar-aviso]')) {
    avisoCerrado = true;
    actualizarRed();
  }
});
window.addEventListener('online', actualizarRed);
window.addEventListener('offline', () => { avisoCerrado = false; actualizarRed(); });
actualizarRed();

// Atajo "/" para buscar (escritorio)
document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target;
  if (t.closest('input, textarea, [contenteditable]')) return;
  const q = document.querySelector('[data-q]') || document.getElementById('q-top') || document.getElementById('q');
  if (q && q.offsetParent !== null) {
    e.preventDefault();
    q.focus();
    q.select();
  }
});

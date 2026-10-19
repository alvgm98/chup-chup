// Filtros de tiempo y dificultad en las páginas de categoría.
const estado = { tiempo: '', dificultad: '' };
const filas = [...document.querySelectorAll('.lista-cat .fila')];
const vacio = document.querySelector('.vacio-filtros');

const encaja = {
  '': () => true,
  lt30: (m) => m < 30,
  '30a60': (m) => m >= 30 && m <= 60,
  gt60: (m) => m > 60
};

function aplicar() {
  let visibles = 0;
  for (const f of filas) {
    const ok = f.dataset.tiempo.split(',').some((m) => encaja[estado.tiempo](Number(m))) &&
      (!estado.dificultad || f.dataset.dificultad.split(',').includes(estado.dificultad));
    f.classList.toggle('oculta', !ok);
    if (ok) visibles++;
  }
  vacio.hidden = visibles > 0;
  document.querySelectorAll('[data-filtro]').forEach((b) => {
    b.setAttribute('aria-pressed', estado[b.dataset.filtro] === b.dataset.valor ? 'true' : 'false');
  });
  document.querySelectorAll('[data-dd]').forEach((dd) => {
    const nombre = dd.dataset.dd;
    const sel = dd.querySelector(`[data-valor="${estado[nombre]}"]`);
    dd.querySelector('[data-dd-label]').textContent = sel.dataset.etiqueta;
    dd.toggleAttribute('data-activo', estado[nombre] !== '');
  });
  const q = new URLSearchParams();
  if (estado.tiempo) q.set('tiempo', estado.tiempo);
  if (estado.dificultad) q.set('dificultad', estado.dificultad);
  history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-filtro]');
  if (b) {
    estado[b.dataset.filtro] = b.dataset.valor;
    b.closest('details')?.removeAttribute('open');
    aplicar();
    return;
  }
  if (e.target.closest('[data-limpiar-filtros]')) {
    estado.tiempo = estado.dificultad = '';
    aplicar();
    return;
  }
  // cerrar desplegables al tocar fuera
  document.querySelectorAll('details.dd[open]').forEach((d) => { if (!d.contains(e.target)) d.removeAttribute('open'); });
});
document.querySelectorAll('details.dd').forEach((d) =>
  d.addEventListener('toggle', () => {
    if (d.open) document.querySelectorAll('details.dd[open]').forEach((o) => o !== d && o.removeAttribute('open'));
  })
);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('details.dd[open]').forEach((d) => d.removeAttribute('open'));
});

const p = new URLSearchParams(location.search);
if (encaja[p.get('tiempo')]) estado.tiempo = p.get('tiempo');
if (['facil', 'media', 'dificil'].includes(p.get('dificultad'))) estado.dificultad = p.get('dificultad');
aplicar();

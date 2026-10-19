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
  const url = new URL(location.href);
  for (const k of ['tiempo', 'dificultad']) {
    if (estado[k]) url.searchParams.set(k, estado[k]);
    else url.searchParams.delete(k);
  }
  history.replaceState(null, '', url.pathname + url.search);
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

// Orden de la lista
const lista = document.querySelector('.lista-cat');
const ORDEN = {
  recientes: (a, b) => b.dataset.ordenFecha.localeCompare(a.dataset.ordenFecha),
  antiguas: (a, b) => a.dataset.ordenFecha.localeCompare(b.dataset.ordenFecha),
  az: (a, b) => a.dataset.ordenTitulo.localeCompare(b.dataset.ordenTitulo, 'es'),
  rapidas: (a, b) => a.dataset.ordenTiempo - b.dataset.ordenTiempo,
  faciles: (a, b) => a.dataset.ordenDif - b.dataset.ordenDif || a.dataset.ordenTiempo - b.dataset.ordenTiempo
};
let orden = 'recientes';
try { if (ORDEN[localStorage.getItem('orden')]) orden = localStorage.getItem('orden'); } catch {}
if (ORDEN[p.get('orden')]) orden = p.get('orden');

function ordenarLista() {
  const desempate = ORDEN.az;
  [...lista.children].sort((a, b) => ORDEN[orden](a, b) || desempate(a, b)).forEach((f) => lista.append(f));
  document.querySelectorAll('[data-orden]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.orden === orden ? 'true' : 'false'));
  document.querySelectorAll('[data-orden-label]').forEach((el) => {
    el.textContent = document.querySelector(`[data-orden="${orden}"]`).dataset.etiqueta;
  });
  document.querySelectorAll('[data-dd-orden]').forEach((d) => d.toggleAttribute('data-activo', orden !== 'recientes'));
  const url = new URL(location.href);
  if (orden === 'recientes') url.searchParams.delete('orden');
  else url.searchParams.set('orden', orden);
  history.replaceState(null, '', url.pathname + url.search);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-orden]');
  if (!b) return;
  orden = b.dataset.orden;
  try { localStorage.setItem('orden', orden); } catch {}
  b.closest('details')?.removeAttribute('open');
  ordenarLista();
});
ordenarLista();

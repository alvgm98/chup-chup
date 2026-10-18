// ¿Qué tengo en la nevera? Búsqueda de recetas por ingredientes.
import { norm, claveIngrediente as clave } from './comun.js';

const { cats, recetas } = JSON.parse(document.getElementById('indice').textContent);
const $ = (s) => document.querySelector(s);
const caja = $('[data-caja]');
const input = $('[data-input]');
const tagsEl = $('[data-tags]');
const sugEl = $('[data-sug]');
const resEl = $('[data-res]');
const btnBasicos = $('[data-basicos]');
const BASICOS = new Set(['sal', 'aceite de oliva', 'agua'].map(clave));

// Todos los ingredientes conocidos (forma en que aparecen en las recetas)
const pool = new Map();
for (const r of recetas) for (const id of [...r.i, ...r.io]) if (!pool.has(clave(id))) pool.set(clave(id), id);
const poolLista = [...pool.values()].sort((a, b) => a.localeCompare(b, 'es'));

let estado = { tengo: [], basicos: true };
try { estado = { ...estado, ...JSON.parse(localStorage.getItem('nevera')) }; } catch {}
const desdeURL = new URLSearchParams(location.search).get('i');
if (desdeURL) {
  for (const x of desdeURL.split(',').map((s) => s.trim()).filter(Boolean)) añadir(x, false);
  history.replaceState(null, '', location.pathname);
}
let sel = 0;
let sugActual = [];

function guardar() {
  try { localStorage.setItem('nevera', JSON.stringify(estado)); } catch {}
}

function añadir(texto, pintarYa = true) {
  const t = texto.trim().replace(/\s+/g, ' ');
  if (!t) return;
  const nombre = pool.get(clave(t)) || t.toLowerCase();
  if (!estado.tengo.some((x) => clave(x) === clave(nombre))) estado.tengo.push(nombre);
  if (pintarYa) { input.value = ''; pintar(); guardar(); }
}

function quitar(nombre) {
  estado.tengo = estado.tengo.filter((x) => x !== nombre);
  pintar();
  guardar();
}

function pintarTags() {
  tagsEl.replaceChildren(
    ...estado.tengo.map((n) => {
      const li = document.createElement('li');
      li.className = 'etiqueta-ing';
      li.append(n);
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Quitar ' + n);
      b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';
      b.addEventListener('click', (e) => { e.stopPropagation(); quitar(n); input.focus(); });
      li.append(b);
      return li;
    })
  );
}

function pintarSug() {
  const q = norm(input.value);
  const tengo = new Set(estado.tengo.map(clave));
  sugActual = q
    ? poolLista
        .filter((p) => !tengo.has(clave(p)) && !(estado.basicos && BASICOS.has(clave(p))) && norm(p).includes(q))
        .sort((a, b) => norm(a).indexOf(q) - norm(b).indexOf(q) || a.length - b.length)
        .slice(0, 5)
    : [];
  sel = Math.min(sel, Math.max(0, sugActual.length - 1));
  sugEl.hidden = sugActual.length === 0;
  input.setAttribute('aria-expanded', sugActual.length ? 'true' : 'false');
  sugEl.replaceChildren(
    ...sugActual.map((p, n) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.id = 'sug-' + n;
      li.setAttribute('aria-selected', n === sel ? 'true' : 'false');
      const b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.innerHTML = '<svg class="ico" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>';
      const at = norm(p).indexOf(q);
      const span = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = p.slice(at, at + q.length);
      span.append(p.slice(0, at), strong, p.slice(at + q.length));
      b.append(span);
      b.addEventListener('mousedown', (e) => e.preventDefault());
      b.addEventListener('click', () => { añadir(p); input.focus(); });
      li.append(b);
      return li;
    })
  );
  if (sugActual.length) input.setAttribute('aria-activedescendant', 'sug-' + sel);
  else input.removeAttribute('aria-activedescendant');
}

function miniatura(r) {
  const c = cats[r.c[0]];
  const span = document.createElement('span');
  span.className = 'thumb thumb-s';
  if (r.foto) {
    const img = document.createElement('img');
    img.src = r.foto;
    img.alt = '';
    img.loading = 'lazy';
    span.append(img);
  } else {
    span.style.background = `var(--${c.f}-soft)`;
    span.style.color = `var(--${c.f}-ink)`;
    span.innerHTML = `<svg class="motivo" width="34" height="34" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${c.d}"></path></svg>`;
  }
  return span;
}

function pintarRes() {
  const tengo = new Set(estado.tengo.map(clave));
  const res = recetas
    .map((r) => {
      const need = r.i.filter((x) => !(estado.basicos && BASICOS.has(clave(x))));
      const got = need.filter((x) => tengo.has(clave(x)));
      const miss = need.filter((x) => !tengo.has(clave(x)));
      return { r, need, got, miss };
    })
    .filter((x) => x.got.length > 0)
    .sort((a, b) => b.got.length / b.need.length - a.got.length / a.need.length || b.got.length - a.got.length || a.miss.length - b.miss.length);

  $('[data-res-label]').textContent = estado.tengo.length ? (res.length === 1 ? '1 receta' : res.length + ' recetas') : '';
  const vacio = $('[data-res-vacio]');
  vacio.hidden = res.length > 0;
  vacio.textContent = estado.tengo.length
    ? 'Con eso aún no sale nada del cuaderno. Prueba a añadir algo más.'
    : 'Añade un par de ingredientes y empezamos a buscar.';

  resEl.replaceChildren(
    ...res.map(({ r, need, got, miss }) => {
      const a = document.createElement('a');
      const completa = miss.length === 0;
      a.className = 'tarjeta-n' + (completa ? ' completa' : '');
      a.href = r.u;
      const cab = document.createElement('div');
      cab.className = 'tarjeta-n-cab';
      const txt = document.createElement('div');
      txt.style.cssText = 'flex:1;min-width:0';
      txt.innerHTML = '<div class="tarjeta-n-t"></div><div class="tarjeta-n-m"></div>';
      txt.firstChild.textContent = r.t;
      txt.lastChild.textContent = cats[r.c[0]].n + ' · ' + r.tl;
      cab.append(miniatura(r), txt);
      const pie = document.createElement('div');
      pie.style.cssText = 'display:flex;flex-direction:column;gap:8px';
      const fila = document.createElement('div');
      fila.className = 'tarjeta-n-fila';
      const tienes = document.createElement('span');
      tienes.className = 'tienes';
      tienes.textContent = `Tienes ${got.length} de ${need.length}`;
      fila.append(tienes);
      if (completa) {
        const ya = document.createElement('span');
        ya.className = 'ya';
        ya.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>Puedes hacerla ya';
        fila.append(ya);
      }
      const segs = document.createElement('div');
      segs.className = 'segs';
      segs.setAttribute('aria-hidden', 'true');
      for (let n = 0; n < need.length; n++) {
        const s = document.createElement('span');
        if (n < got.length) s.className = 'on';
        segs.append(s);
      }
      pie.append(fila, segs);
      if (!completa) {
        const p = document.createElement('p');
        p.className = 'falta';
        const b = document.createElement('b');
        b.textContent = 'Te falta: ';
        p.append(b, miss.length > 3 ? miss.slice(0, 3).join(', ') + ' y ' + (miss.length - 3) + ' más' : miss.join(', '));
        pie.append(p);
      }
      a.append(cab, pie);
      return a;
    })
  );
}

function pintar() {
  pintarTags();
  pintarSug();
  pintarRes();
  btnBasicos.setAttribute('aria-pressed', estado.basicos ? 'true' : 'false');
}

caja.addEventListener('click', (e) => { if (e.target === caja || e.target === tagsEl) input.focus(); });
input.addEventListener('input', () => {
  if (input.value.includes(',')) {
    const partes = input.value.split(',');
    input.value = partes.pop();
    partes.forEach((p) => añadir(p, false));
    pintar();
    guardar();
    return;
  }
  sel = 0;
  pintarSug();
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' && sugActual.length) { e.preventDefault(); sel = (sel + 1) % sugActual.length; pintarSug(); }
  else if (e.key === 'ArrowUp' && sugActual.length) { e.preventDefault(); sel = (sel - 1 + sugActual.length) % sugActual.length; pintarSug(); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    if (sugActual.length) añadir(sugActual[sel]);
    else if (input.value.trim()) añadir(input.value);
  } else if (e.key === 'Escape') { input.value = ''; pintarSug(); }
  else if (e.key === 'Backspace' && !input.value && estado.tengo.length) quitar(estado.tengo[estado.tengo.length - 1]);
});
input.addEventListener('blur', () => setTimeout(() => { sugEl.hidden = true; input.setAttribute('aria-expanded', 'false'); }, 120));
input.addEventListener('focus', pintarSug);
btnBasicos.addEventListener('click', () => { estado.basicos = !estado.basicos; pintar(); guardar(); });
$('[data-vaciar]').addEventListener('click', () => { estado.tengo = []; input.value = ''; pintar(); guardar(); input.focus(); });

pintar();
guardar();

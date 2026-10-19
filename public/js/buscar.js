// Buscador tolerante a erratas, todo en el navegador.
import { norm, claveIngrediente } from './comun.js';

const { cats, recetas } = JSON.parse(document.getElementById('indice').textContent);
const base = document.body.dataset.base;
const $ = (s) => document.querySelector(s);
const q = $('[data-q]');
const borrar = $('[data-borrar]');

const VACIAS = new Set(['de', 'la', 'el', 'con', 'y', 'en', 'a', 'al', 'los', 'las', 'del', 'para', 'un', 'una', 'unos', 'unas', 'o', 'sin']);
const palabras = (s) => norm(s).split(/[^a-z0-9ñ]+/).filter((w) => w && !VACIAS.has(w));

function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let min = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      min = Math.min(min, cur[j]);
    }
    if (min > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

// Índice de palabras por campo
const idx = recetas.map((r) => ({
  r,
  campos: [
    { peso: 4, nombre: 'titulo', w: palabras(r.t) },
    { peso: 3, nombre: 'tipo', w: r.c.flatMap((c) => palabras(cats[c].n)) },
    { peso: 3, nombre: 'variante', w: r.vn.flatMap(palabras) },
    { peso: 2, nombre: 'ingrediente', w: [...new Set([...r.v.flatMap((v) => [...v.i, ...v.io]), ...r.n].flatMap(palabras))] },
    { peso: 2, nombre: 'etiqueta', w: r.e.flatMap(palabras) },
    { peso: 1, nombre: 'descripcion', w: palabras(r.x) }
  ]
}));

function parecido(word, t) {
  if (word === t) return 1;
  if (claveIngrediente(word) === claveIngrediente(t)) return 0.95;
  if (t.length >= 2 && word.startsWith(t)) return 0.85;
  if (t.length >= 4) {
    const max = t.length >= 7 ? 2 : 1;
    const w = word.length > t.length + max ? word.slice(0, t.length + 1) : word;
    if (lev(w, t, max) <= max) return 0.7;
  }
  return 0;
}

function puntuar(entry, tokens) {
  let total = 0;
  let todos = true;
  const por = new Set();
  const marcas = new Set();
  for (const t of tokens) {
    let best = 0;
    let campo = null;
    for (const c of entry.campos) {
      for (const w of c.w) {
        const s = parecido(w, t) * c.peso;
        if (s > best) { best = s; campo = c.nombre; }
        if (c.nombre === 'titulo' && parecido(w, t) > 0) marcas.add(w);
      }
    }
    if (best === 0) todos = false;
    else por.add(campo);
    total += best;
  }
  return { total, todos, por, marcas };
}

function buscar(texto) {
  const tokens = palabras(texto);
  if (!tokens.length) return { tokens, res: [], parecidas: [] };
  const puntuados = idx.map((e) => ({ e, ...puntuar(e, tokens) })).filter((x) => x.total > 0);
  const res = puntuados.filter((x) => x.todos).sort((a, b) => b.total - a.total);
  const parecidas = res.length ? [] : puntuados.sort((a, b) => b.total - a.total).slice(0, 3);
  return { tokens, res, parecidas };
}

function marcarTitulo(titulo, marcas) {
  const frag = document.createDocumentFragment();
  for (const parte of titulo.split(/(\s+)/)) {
    const w = norm(parte).replace(/[^a-z0-9ñ]/g, '');
    if (w && marcas.has(w)) {
      const m = document.createElement('mark');
      m.textContent = parte;
      frag.append(m);
    } else frag.append(parte);
  }
  return frag;
}

function fila(x, mini = false) {
  const r = x.e.r;
  const c = cats[r.c[0]];
  const a = document.createElement('a');
  a.className = 'fila';
  a.href = r.u;
  const th = document.createElement('span');
  th.className = 'thumb' + (mini ? ' thumb-s' : '');
  if (r.foto) th.innerHTML = `<img src="${r.foto}" alt="" loading="lazy">`;
  else {
    th.style.background = `var(--${c.f}-soft)`;
    th.style.color = `var(--${c.f}-ink)`;
    th.innerHTML = `<svg class="motivo" width="${mini ? 34 : 42}" height="${mini ? 34 : 42}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${c.d}"></path></svg>`;
  }
  const txt = document.createElement('span');
  txt.className = 'fila-txt';
  const t = document.createElement('span');
  t.className = 'fila-titulo';
  t.append(marcarTitulo(r.t, x.marcas || new Set()));
  const m = document.createElement('span');
  m.className = 'fila-meta';
  m.textContent = mini ? `${c.n} · ${r.tl}` : `${r.tl} · ${r.r} rac. · ${r.d}`;
  txt.append(t, m);
  if (!mini && x.por && !x.por.has('titulo') && x.por.has('ingrediente')) {
    const p = document.createElement('span');
    p.className = 'res-por';
    p.textContent = 'Lleva lo que buscas entre sus ingredientes';
    txt.append(p);
  }
  a.append(th, txt);
  return a;
}

function chip(texto, href) {
  const a = document.createElement('a');
  a.className = 'chip';
  a.textContent = texto;
  a.href = href;
  return a;
}

function pintar() {
  const texto = q.value;
  borrar.hidden = !texto;
  const { tokens, res, parecidas } = buscar(texto);
  const hay = tokens.length > 0;
  $('[data-inicio]').hidden = hay;
  $('[data-res-wrap]').hidden = !hay || !res.length;
  $('[data-vacio]').hidden = !hay || res.length > 0;
  if (hay && res.length) {
    $('[data-res-n]').textContent = res.length === 1 ? '1 receta' : res.length + ' recetas';
    $('[data-res]').replaceChildren(...res.map((x) => fila(x)));
  } else if (hay) {
    // Sugerencias: palabras sueltas que sí dan resultado y tipos de plato parecidos
    const prueba = [];
    for (const t of tokens) if (tokens.length > 1 && buscar(t).res.length) prueba.push(chip(t, '?q=' + encodeURIComponent(t)));
    for (const [slug, c] of Object.entries(cats)) {
      const tiene = recetas.some((r) => r.c.includes(slug));
      if (tiene && tokens.some((t) => palabras(c.n).some((w) => parecido(w, t) > 0))) prueba.push(chip(c.n, base + 'categoria/' + slug + '/'));
    }
    if (!prueba.length) {
      for (const [slug, c] of Object.entries(cats).filter(([s]) => recetas.some((r) => r.c.includes(s))).slice(0, 3)) {
        prueba.push(chip(c.n, base + 'categoria/' + slug + '/'));
      }
    }
    $('[data-prueba-wrap]').hidden = !prueba.length;
    $('[data-prueba]').replaceChildren(...prueba.slice(0, 5));
    $('[data-parecidas-wrap]').hidden = !parecidas.length;
    $('[data-parecidas]').replaceChildren(...parecidas.map((x) => fila(x, true)));
  }
  const url = texto.trim() ? '?q=' + encodeURIComponent(texto.trim()) : location.pathname;
  history.replaceState(null, '', url);
}

$('[data-form]').addEventListener('submit', (e) => {
  e.preventDefault();
  q.blur();
});
q.addEventListener('input', pintar);
borrar.addEventListener('click', () => { q.value = ''; pintar(); q.focus(); });

q.value = new URLSearchParams(location.search).get('q') || '';
pintar();

#!/usr/bin/env node
// Genera la web estática en /dist a partir de /recetas, /public y las vistas.
// Uso: node scripts/build.mjs   (BASE_PATH=/chup-chup/ por defecto)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { cargarRecetas, RecetaError } from './lib/recetas.mjs';
import { CATEGORIAS } from './lib/categorias.mjs';
import { crearContexto } from './lib/vistas/comun.mjs';
import { vistaInicio } from './lib/vistas/inicio.mjs';
import { vistaCategoria } from './lib/vistas/categoria.mjs';
import { vistaReceta } from './lib/vistas/receta.mjs';
import { vistaCocina } from './lib/vistas/cocina.mjs';
import { vistaNevera } from './lib/vistas/nevera.mjs';
import { vistaBuscar, vista404 } from './lib/vistas/buscar.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const PUBLIC = path.join(RAIZ, 'public');
const RECETAS = path.join(RAIZ, 'recetas');

let base = process.env.BASE_PATH ?? '/chup-chup/';
if (!base.startsWith('/')) base = '/' + base;
if (!base.endsWith('/')) base += '/';

function listar(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? listar(p) : [p];
  });
}

function hashDe(files) {
  const h = crypto.createHash('sha256');
  for (const f of files.sort()) h.update(f).update(fs.readFileSync(f));
  return h.digest('hex').slice(0, 10);
}

function escribir(rel, contenido) {
  const p = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, String(contenido));
}

function main() {
  const t0 = Date.now();
  let recetas;
  try {
    recetas = cargarRecetas(RECETAS);
  } catch (e) {
    if (e instanceof RecetaError) {
      console.error('\n✗ ' + e.message + '\n');
      process.exit(1);
    }
    throw e;
  }
  const sitio = JSON.parse(fs.readFileSync(path.join(RAIZ, 'sitio.json'), 'utf8'));
  const version = hashDe([
    ...listar(PUBLIC),
    ...listar(RECETAS),
    ...listar(path.join(RAIZ, 'scripts')),
    path.join(RAIZ, 'sitio.json')
  ]);
  const ctx = crearContexto({ base, sitio, version });

  fs.rmSync(DIST, { recursive: true, force: true });
  fs.cpSync(PUBLIC, DIST, { recursive: true });
  if (fs.existsSync(path.join(RECETAS, 'fotos'))) {
    fs.cpSync(path.join(RECETAS, 'fotos'), path.join(DIST, 'fotos'), { recursive: true });
  }

  escribir('index.html', vistaInicio(ctx, recetas));
  escribir('recetas/index.html', vistaCategoria(ctx, recetas, null));
  for (const c of CATEGORIAS) escribir(`categoria/${c.slug}/index.html`, vistaCategoria(ctx, recetas, c.slug));
  for (const r of recetas) {
    escribir(`receta/${r.slug}/index.html`, vistaReceta(ctx, r));
    escribir(`receta/${r.slug}/cocina/index.html`, vistaCocina(ctx, r));
  }
  escribir('nevera/index.html', vistaNevera(ctx, recetas));
  escribir('buscar/index.html', vistaBuscar(ctx, recetas));
  escribir('404.html', vista404(ctx));
  escribir('.nojekyll', '');

  escribir(
    'manifest.webmanifest',
    JSON.stringify(
      {
        name: sitio.nombre,
        short_name: sitio.nombre,
        description: sitio.descripcion,
        lang: sitio.idioma,
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F5EFE4',
        theme_color: '#F5EFE4',
        icons: [
          { src: base + 'iconos/icon-192.png?v=2', sizes: '192x192', type: 'image/png' },
          { src: base + 'iconos/icon-512.png?v=2', sizes: '512x512', type: 'image/png' },
          { src: base + 'iconos/icon-maskable-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        shortcuts: [
          { name: '¿Qué tengo en la nevera?', short_name: 'Nevera', url: base + 'nevera/' },
          { name: 'Buscar', url: base + 'buscar/' }
        ]
      },
      null,
      2
    )
  );

  // Service worker: precarga páginas y recursos (las fotos se guardan al verlas)
  const precache = listar(DIST)
    .map((f) => path.relative(DIST, f).split(path.sep).join('/'))
    .filter((f) => !f.startsWith('fotos/') && f !== '.nojekyll')
    .map((f) => base + f.replace(/(^|\/)index\.html$/, '$1'));
  const sw = fs
    .readFileSync(path.join(RAIZ, 'scripts', 'sw.template.js'), 'utf8')
    .replace('__VERSION__', version)
    .replace('__BASE__', base)
    .replace('"__PRECACHE__"', JSON.stringify(precache));
  escribir('sw.js', sw);

  console.log(`✓ ${recetas.length} recetas · ${precache.length} archivos · base ${base} · ${Date.now() - t0} ms`);
}

main();

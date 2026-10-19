import { html, raw, icono } from '../html.mjs';
import { marca, buscador } from './comun.mjs';

const FUENTES =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Source+Sans+3:ital,wght@0,400..700;1,400..700&display=swap';

function tabbar(ctx, seccion) {
  const item = (id, href, label, ico) =>
    html`<a href="${ctx.u(href)}"${seccion === id ? raw(' aria-current="page"') : ''}>${icono(ico)}${label}</a>`;
  return html`<nav class="tabbar" aria-label="Principal">
    ${item('recetas', '', 'Recetas', 'libro')}
    ${item('nevera', 'nevera/', 'Nevera', 'nevera')}
    ${item('buscar', 'buscar/', 'Buscar', 'buscar')}
  </nav>`;
}

function topbar(ctx, seccion) {
  const item = (id, href, label) =>
    html`<a href="${ctx.u(href)}"${seccion === id ? raw(' aria-current="page"') : ''}>${label}</a>`;
  return html`<header class="topbar">
    <div class="topbar-in">
      <a class="topbar-marca" href="${ctx.u('')}">${marca(ctx)}</a>
      <nav aria-label="Principal">
        ${item('recetas', '', 'Recetas')}
        ${item('nevera', 'nevera/', 'Nevera')}
      </nav>
      ${seccion === 'buscar' ? '' : buscador(ctx, { grande: false, id: 'q-top' })}
    </div>
  </header>`;
}

export function layout(ctx, { titulo, descripcion, seccion, cuerpo, clase = '', scripts = [], cocina = false, canonical = '' }) {
  const t = titulo ? `${titulo} · ${ctx.sitio.nombre}` : `${ctx.sitio.nombre} · ${ctx.sitio.lema}`;
  const desc = descripcion || ctx.sitio.descripcion;
  return html`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${titulo || ctx.sitio.nombre}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="${canonical ? 'article' : 'website'}">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5EFE4">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1C1916">
<meta name="color-scheme" content="light dark">
<link rel="manifest" href="${ctx.u('manifest.webmanifest')}">
<link rel="icon" href="${ctx.u('iconos/favicon.svg')}" type="image/svg+xml">
<link rel="icon" href="${ctx.u('iconos/favicon-32.png')}" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${ctx.u('iconos/apple-touch-icon.png')}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="${ctx.sitio.nombre}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FUENTES}">
<link rel="stylesheet" href="${ctx.u('css/app.css?v=' + ctx.version)}">
<script type="module" src="${ctx.u('js/app.js?v=' + ctx.version)}"></script>
${scripts.map((s) => html`<script type="module" src="${ctx.u('js/' + s + '?v=' + ctx.version)}"></script>`)}
</head>
<body class="${clase}" data-base="${ctx.u('')}">
${cocina ? '' : topbar(ctx, seccion)}
${cuerpo}
${cocina ? '' : tabbar(ctx, seccion)}
</body>
</html>
`;
}

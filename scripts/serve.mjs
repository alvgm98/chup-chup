#!/usr/bin/env node
// Servidor local para ver la web como en GitHub Pages: node scripts/serve.mjs [puerto]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const BASE = process.env.BASE_PATH || '/chup-chup/';
const PUERTO = Number(process.argv[2]) || 4321;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif'
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/') { res.writeHead(302, { Location: BASE }); return res.end(); }
    let f = null;
    if (url.startsWith(BASE)) {
      f = path.join(DIST, url.slice(BASE.length));
      if (!f.startsWith(DIST)) f = null;
      else if (fs.existsSync(f) && fs.statSync(f).isDirectory()) {
        if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
        f = path.join(f, 'index.html');
      }
    }
    if (!f || !fs.existsSync(f)) {
      res.writeHead(404, { 'Content-Type': TIPOS['.html'] });
      return res.end(fs.readFileSync(path.join(DIST, '404.html')));
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  })
  .listen(PUERTO, () => console.log(`→ http://localhost:${PUERTO}${BASE}`));

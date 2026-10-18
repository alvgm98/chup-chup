# Chup-chup

Mi recetario: recetas de casa, apuntadas con calma. Se puede buscar por tipo de plato, por nombre
o por lo que haya en la nevera, y cocinar paso a paso con temporizadores y la pantalla siempre encendida.
Funciona sin conexión y se instala en el móvil como una app.

- Cada receta es un Markdown en [`recetas/`](recetas). El formato está explicado en [`CLAUDE.md`](CLAUDE.md).
- `node scripts/build.mjs` genera la web en `dist/` (sin dependencias, Node 20+).
- `node scripts/serve.mjs` la sirve en http://localhost:4321/chup-chup/.
- Cada push a `main` se publica en GitHub Pages automáticamente.

Diseño original en [`design/`](design), hecho con Claude Design.

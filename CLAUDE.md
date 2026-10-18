# Chup-chup · instrucciones para Claude

Recetario personal publicado en GitHub Pages. Cada receta es un archivo Markdown en `recetas/`.
La web se genera con `node scripts/build.mjs` (Node 20+, **sin dependencias**: no hace falta `npm install`).
Cada `git push` a `main` la publica sola mediante `.github/workflows/deploy.yml`.

## Añadir o editar una receta (lo más habitual)

1. Crea `recetas/<slug>.md` (minúsculas, sin tildes, con guiones: `arroz-con-costillas.md`).
   Copia la estructura de `recetas/_plantilla.md` o de cualquier receta existente.
2. Ejecuta `node scripts/build.mjs`. Si hay un error, el mensaje dice el archivo, el paso y qué falla. Corrígelo hasta que salga `✓`.
3. Haz commit con el mensaje `Receta: <Título>` (o `Receta: editar <Título>`) y `git push` a `main`.
4. En uno o dos minutos está en la web. Si el build fallara en GitHub, la web se queda con la versión anterior.

No cambies nada fuera de `recetas/` al añadir recetas, salvo que el usuario lo pida.

## Formato de receta

```markdown
---
titulo: Lentejas estofadas
descripcion: Una o dos frases con carácter, como en un libro de cocina.
tipo: [legumbres, guisos]          # 1 o más, el primero manda el color y el dibujo
preparacion: 15                    # minutos de trabajo
coccion: 40                        # minutos al fuego/horno (0 si no hay)
raciones: 4
dificultad: facil                  # facil | media | dificil
fecha: 2026-10-18                  # día en que se añade (AAAA-MM-DD)
etiquetas: [cuchara, invierno]     # opcional
foto: lentejas.webp                # opcional, archivo en recetas/fotos/
ingredientes:
  - { id: lentejas, nombre: lentejas pardinas, cantidad: 400, unidad: g }
  - { id: cebolla, nombre: cebolla, plural: cebollas, cantidad: 1 }
  - { id: ajo, nombre: diente de ajo, plural: dientes de ajo, cantidad: 3 }
  - { id: aceite de oliva, nombre: aceite de oliva virgen extra, cantidad: 2, unidad: cda }
  - { id: sal, nombre: Sal, nota: al gusto }
---

## Preparación

1. Lava las [lentejas] y escúrrelas.
2. Sofríe la [cebolla] y el [ajo] con el [aceite]. ⏲ 10 min

## Notas

- **Consejo:** …
- **Variante:** …
- **Se conserva:** …
```

### Tipos (`tipo`)
`carne`, `pescado`, `arroz`, `pasta`, `guisos`, `legumbres`, `verduras`, `sopas-y-cremas`, `ensaladas`,
`masas-y-panes`, `salsas`, `aperitivos`, `postres`. Para añadir uno nuevo hay que tocar `scripts/lib/categorias.mjs`.

### Ingredientes
- `id`: nombre genérico tal como alguien diría que lo tiene en la nevera (`patatas`, `huevos`, `pimiento verde`,
  `aceite de oliva`, `sal`, `agua`). Es lo que usa la búsqueda «¿Qué tengo en la nevera?», así que **reutiliza los ids
  que ya existen en otras recetas** (`grep -h "id:" recetas/*.md | sort | uniq -c`). Debe ser único en la receta;
  si un ingrediente se repite (azúcar para el caramelo y para la masa), usa un calificativo entre paréntesis:
  `azúcar (caramelo)`, que en la Nevera cuenta como `azúcar`.
- `nombre`: cómo se lee en la lista (`patata grande`). `plural` si es contable (`patatas grandes`).
- `cantidad`: número, `1.5`, `1/2` o `½`. Sin cantidad para «al gusto» (usa `nota`).
- `unidad`: `g`, `kg`, `ml`, `l`, `cda`, `cdta`, `pizca`, `vaso`, `taza`, `lata`… (el plural de las comunes es automático).
- `nota` (texto tras una coma: «al gusto», «para servir»), `grupo` («Para la salsa»), `opcional: true`.
- Sal, aceite de oliva y agua usan siempre los ids `sal`, `aceite de oliva` y `agua` (la Nevera puede darlos por hechos).
- Si un valor lleva comas, ponlo entre comillas: `nota: "pelado, en dados"`.

### Pasos
- Lista numerada bajo `## Preparación`. Un paso = una acción clara (es lo que se ve en grande en el modo cocina).
- `[ingrediente]` resalta la palabra y la enlaza a ese ingrediente (sale en «En este paso» con su cantidad escalada).
  Se resuelve por id, nombre o plural, aunque cambie singular/plural. Si es ambiguo o el texto es distinto,
  usa `[texto|id]`, p. ej. `[pimientos|pimiento verde]`. Menciona cada ingrediente al menos una vez, la primera vez que se usa.
- `⏲ 10 min` al **final** de un paso añade un temporizador (`⏲ 1 h 30 min`, `⏲ 45 s`). Solo uno por paso,
  y solo cuando haya que esperar (cocer, reposar, hornear).
- Admite `**negrita**` y `*cursiva*`.

### Notas
Lista bajo `## Notas` con etiqueta en negrita: **Consejo**, **Variante**, **Se conserva**, **Para servir**, **Truco** (otras etiquetas también valen).

### Fotos
Opcionales. Guárdalas en `recetas/fotos/` en WebP, máximo 1600 px de ancho y ~200 KB
(con sharp: `sharp(in).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 })`).
Sin foto, la receta usa el tinte y el dibujo de su tipo: nunca queda un hueco.

## Estilo de las recetas
Español de España, tuteo, frases cortas e imperativas. Descripción evocadora pero breve.
Tiempos realistas. Cantidades para el número de `raciones` indicado.

## Estructura del proyecto
- `recetas/` contenido · `public/` CSS, JS del navegador e iconos · `scripts/` generador · `design/` diseño original (Claude Design)
- `sitio.json`: nombre y lema de la web.
- `node scripts/serve.mjs` sirve `dist/` en http://localhost:4321/chup-chup/ para probar.
- Colores, tipografías y componentes siguen `design/Estilo.dc.html`. Mantén ese lenguaje visual en cualquier cambio.

// Tipos de plato. El orden es el del índice de la portada.
// familia: acc (pimentón), saf (azafrán) u oli (oliva): tiñe el fondo y el motivo.

export const MOTIVOS = {
  arroz: 'M10 34a22 13 0 1 0 44 0a22 13 0 1 0 -44 0M10 34H4M54 34h6M22 31l3 1M31 37l3-1M40 30l3 1M27 40h3M38 41l3-1M33 28l2 2M45 35l2-1M18 37l2 1',
  legumbres: 'M16 20a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M30 15a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M42 24a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M22 32a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M36 36a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M14 44a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M28 48a4 4 0 1 0 8 0a4 4 0 1 0 -8 0M44 46a4 4 0 1 0 8 0a4 4 0 1 0 -8 0',
  carne: 'M39 25c6-7 17-3 15 6s-11 11-17 6L25 49M25 49a3.5 3.5 0 1 1-5 4.5M25 49a3.5 3.5 0 1 0-4.5-5',
  pescado: 'M8 32c9-11 27-13 40 0c-13 13-31 11-40 0zM48 32l9-8v16zM27 26c2 4 2 8 0 12M18 30.5v.5',
  pasta: 'M8 22c6-5 10 5 16 0s10 5 16 0s10 5 16 0M8 32c6-5 10 5 16 0s10 5 16 0s10 5 16 0M8 42c6-5 10 5 16 0s10 5 16 0s10 5 16 0',
  sopa: 'M10 32h44c0 12-10 20-22 20S10 44 10 32zM24 26c-2-3 2-5 0-8M32 26c-2-3 2-5 0-8M40 26c-2-3 2-5 0-8',
  guiso: 'M12 26h40v16a8 8 0 0 1-8 8H20a8 8 0 0 1-8-8zM6 28h6M52 28h6M22 26v-4h20v4M32 22v-5',
  ensalada: 'M10 34h44c0 10-10 18-22 18S10 44 10 34zM22 34c-2-8 4-14 10-14c-1 6-4 11-10 14zM34 34c2-7 9-11 15-9c-3 5-8 8-15 9z',
  pan: 'M10 44c0-14 10-22 22-22s22 8 22 22v4H10zM22 32l4 6M32 30v8M42 32l-4 6',
  salsa: 'M12 30h32c0 10-7 16-16 16S12 40 12 30zM44 30l10-6M22 46l-3 6h18l-3-6M27 24c0-3 3-3 3-6',
  postre: 'M18 46l5-22h18l5 22zM23 28c3 3 5-1 7 2s5-1 7 1s3 0 4-3M10 50h44',
  verdura: 'M14 50C14 26 30 14 50 14c0 22-14 36-36 36zM14 50L40 24M27 37l-7-2M33 31l-1-7',
  aperitivo: 'M14 38a18 8 0 1 0 36 0a18 8 0 1 0 -36 0M14 38v4a18 8 0 0 0 36 0v-4M32 34V14M32 14l4 3'
};

export const CATEGORIAS = [
  { slug: 'carne', nombre: 'Carne', familia: 'acc', motivo: 'carne' },
  { slug: 'pescado', nombre: 'Pescado', familia: 'oli', motivo: 'pescado' },
  { slug: 'arroz', nombre: 'Arroz', familia: 'saf', motivo: 'arroz' },
  { slug: 'pasta', nombre: 'Pasta', familia: 'saf', motivo: 'pasta' },
  { slug: 'guisos', nombre: 'Guisos', familia: 'acc', motivo: 'guiso' },
  { slug: 'legumbres', nombre: 'Legumbres', familia: 'acc', motivo: 'legumbres' },
  { slug: 'verduras', nombre: 'Verduras', familia: 'oli', motivo: 'verdura' },
  { slug: 'sopas-y-cremas', nombre: 'Sopas y cremas', familia: 'saf', motivo: 'sopa' },
  { slug: 'ensaladas', nombre: 'Ensaladas', familia: 'oli', motivo: 'ensalada' },
  { slug: 'masas-y-panes', nombre: 'Masas y panes', familia: 'saf', motivo: 'pan' },
  { slug: 'salsas', nombre: 'Salsas', familia: 'acc', motivo: 'salsa' },
  { slug: 'aperitivos', nombre: 'Aperitivos', familia: 'oli', motivo: 'aperitivo' },
  { slug: 'postres', nombre: 'Postres', familia: 'acc', motivo: 'postre' }
];

export const CAT = Object.fromEntries(CATEGORIAS.map((c) => [c.slug, { ...c, d: MOTIVOS[c.motivo] }]));

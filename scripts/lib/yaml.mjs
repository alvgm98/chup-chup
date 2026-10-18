// Lector mínimo del subconjunto de YAML que usan las recetas.
// Admite: `clave: valor`, listas `[a, b]`, mapas `{ a: 1, b: x }` y
// listas en bloque (`- valor`, `- { ... }` o `- clave: valor` con líneas indentadas).

export class YamlError extends Error {}

function splitTopLevel(s, sep = ',') {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = '';
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue; }
    if (ch === '[' || ch === '{') depth++;
    if (ch === ']' || ch === '}') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (quote) throw new YamlError('Comillas sin cerrar en: ' + s);
  if (cur.trim() !== '') out.push(cur);
  return out;
}

function splitKey(s) {
  // primera aparición de ":" fuera de comillas, seguida de espacio o final
  let quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === ':' && (i === s.length - 1 || s[i + 1] === ' ')) {
      return [s.slice(0, i).trim(), s.slice(i + 1).trim()];
    }
  }
  return null;
}

export function parseValue(raw) {
  const s = raw.trim();
  if (s === '') return null;
  if (s.startsWith('[')) {
    if (!s.endsWith(']')) throw new YamlError('Lista sin cerrar: ' + s);
    return splitTopLevel(s.slice(1, -1)).map((x) => parseValue(x));
  }
  if (s.startsWith('{')) {
    if (!s.endsWith('}')) throw new YamlError('Mapa sin cerrar: ' + s);
    const obj = {};
    for (const part of splitTopLevel(s.slice(1, -1))) {
      const kv = splitKey(part.trim());
      if (!kv) throw new YamlError('Se esperaba "clave: valor" en: ' + part.trim());
      obj[kv[0]] = parseValue(kv[1]);
    }
    return obj;
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  if (s === 'true' || s === 'sí' || s === 'si') return true;
  if (s === 'false' || s === 'no') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  return s;
}

const indentOf = (line) => line.match(/^ */)[0].length;

export function parseYaml(text) {
  const lines = text
    .replace(/\t/g, '  ')
    .split(/\r?\n/)
    .map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => l.trim() !== '' && !l.trim().startsWith('#'));
  const out = {};
  let i = 0;
  while (i < lines.length) {
    const { l, n } = lines[i];
    if (indentOf(l) !== 0) throw new YamlError(`Línea ${n}: indentación inesperada`);
    const kv = splitKey(l.trim());
    if (!kv) throw new YamlError(`Línea ${n}: se esperaba "clave: valor"`);
    const [key, rest] = kv;
    i++;
    if (rest !== '') { out[key] = parseValue(rest); continue; }
    // bloque indentado: lista
    const items = [];
    while (i < lines.length && indentOf(lines[i].l) > 0) {
      const line = lines[i];
      const ind = indentOf(line.l);
      const t = line.l.trim();
      if (!t.startsWith('- ')) throw new YamlError(`Línea ${line.n}: se esperaba un elemento "- "`);
      const body = t.slice(2).trim();
      i++;
      const kv2 = body.startsWith('{') || body.startsWith('[') || body.startsWith('"') ? null : splitKey(body);
      if (!kv2) { items.push(parseValue(body)); continue; }
      const obj = { [kv2[0]]: parseValue(kv2[1]) };
      while (i < lines.length && indentOf(lines[i].l) > ind && !lines[i].l.trim().startsWith('- ')) {
        const kv3 = splitKey(lines[i].l.trim());
        if (!kv3) throw new YamlError(`Línea ${lines[i].n}: se esperaba "clave: valor"`);
        obj[kv3[0]] = parseValue(kv3[1]);
        i++;
      }
      items.push(obj);
    }
    out[key] = items;
  }
  return out;
}

export function splitFrontmatter(src) {
  const m = src.match(/^﻿?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new YamlError('Falta la cabecera entre líneas "---"');
  return { data: parseYaml(m[1]), body: m[2] };
}

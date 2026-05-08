/**
 * Fragrantica CSV → perfumes.json 转换脚本
 *
 * 适配列格式：Name, Brand, Description, Notes, Image URL
 *
 * 用法：
 *   node scripts/import-fragrantica.mjs <path-to-csv> [max-count]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const [, , csvPath, maxCountArg] = process.argv;
if (!csvPath) {
  console.error('用法: node scripts/import-fragrantica.mjs <csv路径> [最大条数]');
  process.exit(1);
}
const MAX_COUNT = maxCountArg ? parseInt(maxCountArg, 10) : Infinity;

// ── familyMap ─────────────────────────────────────────────────────────────────
const familyMap = JSON.parse(
  readFileSync(resolve(ROOT, 'data/familyMap.json'), 'utf-8')
).familyMap;

// ── 族群检测（纯从 notes 关键词推断）────────────────────────────────────────
const FAMILY_RULES = [
  { family: 'Gourmand', keywords: ['vanilla', 'caramel', 'chocolate', 'candy', 'praline', 'honey', 'sugar', 'cookie', 'almond', 'tonka', 'heliotrope'] },
  { family: 'Leather',  keywords: ['leather', 'suede', 'tobacco', 'smoke', 'birch tar', 'castoreum'] },
  { family: 'Aquatic',  keywords: ['aquatic', 'marine', 'sea', 'ocean', 'water', 'seaweed', 'driftwood', 'salt'] },
  { family: 'Citrus',   keywords: ['bergamot', 'lemon', 'lime', 'grapefruit', 'orange peel', 'mandarin', 'yuzu', 'petitgrain'] },
  { family: 'Fougere',  keywords: ['lavender', 'oakmoss', 'coumarin', 'fougere', 'aromatic', 'geranium'] },
  { family: 'Oriental', keywords: ['amber', 'oud', 'incense', 'myrrh', 'frankincense', 'benzoin', 'labdanum', 'resin', 'balsam', 'spice', 'saffron', 'cardamom', 'cinnamon', 'clove', 'pepper'] },
  { family: 'Woody',    keywords: ['sandalwood', 'cedar', 'vetiver', 'patchouli', 'woody', 'wood', 'agarwood', 'guaiac', 'rosewood', 'birch'] },
  { family: 'Floral',   keywords: ['rose', 'jasmine', 'iris', 'peony', 'lily', 'tuberose', 'ylang', 'neroli', 'violet', 'magnolia', 'gardenia', 'carnation'] },
  { family: 'Fresh',    keywords: ['green', 'grass', 'mint', 'basil', 'fig', 'cucumber', 'air', 'clean', 'fresh', 'ozone', 'white musk', 'light musk'] },
];

function detectFamily(notesText) {
  const t = notesText.toLowerCase();
  for (const rule of FAMILY_RULES) {
    if (rule.keywords.some(k => t.includes(k))) return rule.family;
  }
  return 'Fresh';
}

const SUBFAMILY_MAP = {
  Oriental: 'oriental-vanilla',
  Gourmand: 'oriental-gourmand',
  Woody:    'woody-aromatic',
  Floral:   'floral-soft',
  Fresh:    'fresh-green',
  Citrus:   'citrus-aromatic',
  Aquatic:  'aquatic-marine',
  Leather:  'leather-smoky',
  Fougere:  'fougere-classic',
};

// ── moodScores ────────────────────────────────────────────────────────────────
const NOTE_MOOD_MAP = {
  Warm:   ['vanilla', 'amber', 'musk', 'tonka', 'sandalwood', 'incense', 'oud', 'caramel', 'benzoin'],
  Dark:   ['tobacco', 'leather', 'smoke', 'oud', 'vetiver', 'patchouli', 'oakmoss', 'labdanum', 'tar'],
  Spicy:  ['pepper', 'cardamom', 'cinnamon', 'clove', 'ginger', 'saffron', 'nutmeg', 'cumin', 'chili'],
  Sweet:  ['vanilla', 'caramel', 'honey', 'candy', 'praline', 'chocolate', 'sugar', 'heliotrope', 'almond'],
  Fresh:  ['bergamot', 'lemon', 'lime', 'grapefruit', 'mint', 'green', 'aquatic', 'marine', 'ozone'],
  Floral: ['rose', 'jasmine', 'lily', 'iris', 'peony', 'neroli', 'ylang', 'violet', 'magnolia'],
};
const MOOD_ZH = { Warm:'温暖', Dark:'黑暗', Spicy:'辛辣', Sweet:'甜蜜', Fresh:'清新', Floral:'花香' };

function calcMoodScores(notesText) {
  const t = notesText.toLowerCase();
  const scores = {};
  for (const [mood, kws] of Object.entries(NOTE_MOOD_MAP)) {
    const hits = kws.filter(k => t.includes(k)).length;
    scores[mood] = parseFloat(Math.min(1, (hits / kws.length) * 4).toFixed(2));
  }
  if (Object.values(scores).every(v => v === 0)) scores['Fresh'] = 0.3;
  return scores;
}

function getMoodTags(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, v]) => v > 0)
    .map(([k]) => MOOD_ZH[k] || k);
}

// ── intensityCurve ────────────────────────────────────────────────────────────
const BASE_CURVES = {
  Oriental: [0.70, 0.78, 0.82, 0.75, 0.65],
  Gourmand: [0.80, 0.78, 0.72, 0.65, 0.55],
  Woody:    [0.55, 0.65, 0.72, 0.68, 0.60],
  Floral:   [0.72, 0.80, 0.75, 0.62, 0.45],
  Fresh:    [0.85, 0.70, 0.55, 0.40, 0.30],
  Citrus:   [0.90, 0.72, 0.50, 0.35, 0.25],
  Aquatic:  [0.80, 0.68, 0.52, 0.38, 0.28],
  Leather:  [0.65, 0.72, 0.78, 0.75, 0.70],
  Fougere:  [0.68, 0.75, 0.72, 0.65, 0.55],
};

function getIntensityCurve(family, seed) {
  const base = BASE_CURVES[family] || BASE_CURVES.Fresh;
  return base.map((v, i) => {
    const jitter = ((seed.charCodeAt(i % seed.length) % 13) - 6) / 100;
    return parseFloat(Math.max(0.1, Math.min(1.0, v + jitter)).toFixed(2));
  });
}

// ── 从 Description 里尝试提取年份 ────────────────────────────────────────────
function extractYear(desc) {
  const m = (desc || '').match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  return m ? parseInt(m[1], 10) : null;
}

// ── 将 Notes 字符串拆分为三段（前1/3 top，中1/3 heart，后1/3 base）──────────
function splitNotesIntoStages(notesStr) {
  const all = notesStr
    .split(/[,;]/)
    .map(s => s.trim().replace(/^["'\s]+|["'\s]+$/g, ''))
    .filter(Boolean);
  if (all.length === 0) return { topNotes: [], heartNotes: [], baseNotes: [] };
  const third = Math.ceil(all.length / 3);
  return {
    topNotes:   all.slice(0, third),
    heartNotes: all.slice(third, third * 2),
    baseNotes:  all.slice(third * 2),
  };
}

// ── CSV 解析器 ────────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const header = splitRow(lines[0]).map(h => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = splitRow(lines[i]);
    const obj = {};
    header.forEach((h, idx) => { obj[h] = (vals[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function splitRow(line) {
  const result = []; let cur = ''; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
    else cur += ch;
  }
  result.push(cur);
  return result;
}

function makeId(name, brand) {
  return `${name}-${brand}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

// ── 主逻辑 ────────────────────────────────────────────────────────────────────
console.log(`读取 CSV: ${csvPath}`);
const raw = readFileSync(resolve(csvPath), 'utf-8');
const rows = parseCSV(raw);
console.log(`解析行数: ${rows.length}，列名: ${Object.keys(rows[0]).join(', ')}`);

const perfumes = [];
const seenIds = new Set();

for (const row of rows) {
  if (perfumes.length >= MAX_COUNT) break;

  const name  = (row['name'] || '').trim();
  const brand = (row['brand'] || '').trim();
  if (!name || !brand) continue;

  const notesRaw = row['notes'] || '';
  const desc     = row['description'] || '';
  const imageUrl = row['image url'] || row['image_url'] || '';

  const { topNotes, heartNotes, baseNotes } = splitNotesIntoStages(notesRaw);
  const fragranceFamily = detectFamily(notesRaw);
  const subfamilyId     = SUBFAMILY_MAP[fragranceFamily];
  const visualParams    = { ...familyMap[fragranceFamily] };
  const moodScores      = calcMoodScores(notesRaw);
  const moodTags        = getMoodTags(moodScores);
  const year            = extractYear(desc) || 2000;

  let id = makeId(name, brand);
  if (seenIds.has(id)) { id = `${id}-${year}`; }
  if (seenIds.has(id)) continue;
  seenIds.add(id);

  const entry = {
    id,
    name,
    brand,
    year,
    gender: 'unisex',
    fragranceFamily,
    subfamilyId,
    topNotes,
    heartNotes,
    baseNotes,
    moodTags,
    moodScores,
    intensityCurve: getIntensityCurve(fragranceFamily, id),
    visualParams,
  };
  if (imageUrl) entry.imageUrl = imageUrl;

  perfumes.push(entry);
}

const outPath = resolve(ROOT, 'data/perfumes.json');
writeFileSync(outPath, JSON.stringify(perfumes, null, 2), 'utf-8');
console.log(`\n完成！共写入 ${perfumes.length} 条 → ${outPath}`);

const dist = {};
for (const p of perfumes) dist[p.fragranceFamily] = (dist[p.fragranceFamily] || 0) + 1;
console.log('\n族群分布:');
Object.entries(dist).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>
  console.log(`  ${k.padEnd(12)} ${v}`)
);

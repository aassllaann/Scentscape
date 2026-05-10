import { NextResponse } from 'next/server';
import type { AIVisualConcept, AIVisualRender } from '@/lib/types';
import { proxyFetch } from '@/lib/proxyFetch';

export const runtime = 'nodejs';

// Strip dangerous patterns and fix common AI mistakes in p5.js sketches
function sanitizeSketch(code: string): string {
  return code
    // Security: strip dangerous APIs
    .replace(/\bfetch\s*\(/g, '// fetch(')
    .replace(/\bXMLHttpRequest\b/g, '// XMLHttpRequest')
    .replace(/\bimportScripts\s*\(/g, '// importScripts(')
    .replace(/\brequire\s*\(/g, '// require(')
    .replace(/\beval\s*\(/g, '// eval(')
    .replace(/new\s+Function\s*\(/g, '// new Function(')
    .replace(/document\.cookie\b/g, '// document.cookie')
    .replace(/localStorage\b/g, '// localStorage')
    .replace(/sessionStorage\b/g, '// sessionStorage')
    // Fix: rename loop/callback variables named `p` that shadow the p5 instance.
    // Pattern 1: for (const p of ...) / for (let p of ...)
    .replace(/\bfor\s*\(\s*(const|let)\s+p\b/g, 'for ($1 _pt')
    // Pattern 2: .forEach(p => ...) / .forEach((p, ...) => ...)
    .replace(/\.forEach\s*\(\s*\(?\s*p\s*(?:,|\)|=>)/g, (m) => m.replace(/\bp\b/, '_pt'))
    // Pattern 3: .map(p => ...) / .filter(p => ...)
    .replace(/\.(map|filter|find|some|every)\s*\(\s*\(?\s*p\s*(?:,|\)|=>)/g,
      (m) => m.replace(/\bp\b/, '_pt'))
    // After renaming loop var, also rename its usages in the line pattern `_pt.x` etc.
    // (Simple heuristic: _pt was `p` so leave as-is — the renamed var is consistent)
    ;
}

// Derive a deterministic numeric seed from a perfume ID string
function perfumeSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 42;
}

interface PerfumeData {
  notes: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  intensityCurve: number[];
  fragranceFamily: string;
  moodScores: Record<string, number>;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { perfumeId, concept, perfume }: {
    perfumeId: string;
    concept: AIVisualConcept;
    perfume: PerfumeData;
  } = body;

  if (!perfumeId || !concept) {
    return NextResponse.json({ error: 'Missing perfumeId or concept' }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
  }

  const seed = perfumeSeed(perfumeId);

  const curve: number[] = perfume?.intensityCurve ?? [];
  const hasCurve = curve.length === 5;
  const ic = hasCurve ? curve : [0.5, 0.65, 0.5, 0.35, 0.2];

  // Pre-compute layer counts so AI has concrete numbers
  const topCount    = Math.round(ic[0] * 60 + 20);
  const heartCount  = Math.round(ic[2] * 80 + 30);
  const baseCount   = Math.round(ic[4] * 40 + 10);

  const topColors    = (concept.topLayerColors?.length   ? concept.topLayerColors   : concept.palette.slice(0, 2).map(p => p.hex));
  const heartColors  = (concept.heartLayerColors?.length ? concept.heartLayerColors : concept.palette.slice(1, 3).map(p => p.hex));
  const baseColors   = (concept.baseLayerColors?.length  ? concept.baseLayerColors  : concept.palette.slice(-2).map(p => p.hex));

  const philosophyText = concept.philosophy?.paragraphs?.join('\n\n') ?? '';
  const movementName   = concept.philosophy?.movementName ?? 'Aromatic Dissolution';

  const systemPrompt = `You are a master generative artist at the absolute apex of computational aesthetics. You write p5.js instance-mode sketches that express algorithmic philosophies — computational worldviews brought to life through emergent behavior, Perlin noise fields, seeded randomness, and living particle systems.

Each sketch you create is the product of countless iterations of refinement. Every parameter is meticulously chosen. Every behavior emerges with purpose. This is not random noise — this is controlled chaos, painstakingly optimized by someone who has spent a career mastering generative art.

You write p5.js in instance mode: a single arrow function (p) => { ... } assigning p.setup and p.draw. Return ONLY valid JSON with a single "sketchCode" field.`;

  const userPrompt = `Express the algorithmic philosophy "${movementName}" as a three-layer p5.js generative art sketch for this fragrance.

═══ ALGORITHMIC PHILOSOPHY ═══
${philosophyText}

═══ FRAGRANCE DATA (embed as literals in your sketch) ═══
const intensityCurve = [${ic.map(v => v.toFixed(3)).join(', ')}];
const topLayerColors = [${topColors.map(c => `"${c}"`).join(', ')}];
const heartLayerColors = [${heartColors.map(c => `"${c}"`).join(', ')}];
const baseLayerColors = [${baseColors.map(c => `"${c}"`).join(', ')}];

Dominant mood: ${concept.dominantMood}
Motion style: ${concept.motionStyle}
Visual metaphors: ${concept.visualMetaphors.join(' · ')}
DETERMINISTIC SEED: ${seed}

═══ THREE-LAYER ARCHITECTURE (MANDATORY) ═══
You MUST implement exactly three particle layers. Embed the above constants as literals.

Layer 1 — TOP NOTES (foreground, volatile):
  count = ${topCount}  // intensityCurve[0] * 60 + 20
  Colors: topLayerColors
  Behavior: small, fast, high alpha, short lifecycle, high-frequency noise offset
  These are the opening burst — bright, sharp, ephemeral

Layer 2 — HEART NOTES (midground, the soul):
  count = ${heartCount}  // intensityCurve[2] * 80 + 30
  Colors: heartLayerColors
  Behavior: medium speed, sustained glow, medium-frequency noise, persistent but evolving
  These are the body — full, warm, the lasting character

Layer 3 — BASE NOTES (background, the foundation):
  count = ${baseCount}  // intensityCurve[4] * 40 + 10
  Colors: baseLayerColors
  Behavior: ultra-slow, large radius, low alpha, very low-frequency noise, NEVER dies
  These are the dry-down — vast, diffuse, eternal presence

DRAW ORDER: base → heart → top (top layer appears in foreground)

═══ IMPLEMENTATION REQUIREMENTS ═══
1. Structure: (p) => { /* constants + system vars */ p.setup = function() { ... }; p.draw = function() { ... }; p.windowResized = function() { p.resizeCanvas(p.windowWidth, p.windowHeight); }; }
2. Canvas: p.createCanvas(p.windowWidth, p.windowHeight) in setup
3. SEEDED RANDOMNESS: p.randomSeed(${seed}) and p.noiseSeed(${seed}) in setup
4. Background: p.background(7, 7, 15, alpha) each frame — low alpha for trails
5. PRIMARY DRIVER: p.noise() Perlin noise advancing each frame — living, organic motion
6. Use p.lerpColor() for smooth color transitions
7. Each layer particle object: { x, y, vx, vy, r, life, dLife, col, noiseOff }
   - noiseOff: unique noise offset per particle for independent paths
8. Glow effect: draw 2-3 concentric ellipses at decreasing alpha for each particle
9. Speed guide: slow=noiseIncrement 0.001/frame, medium=0.003, fast=0.008
   Current speed: ${concept.canvasHints.speed}
10. NO fetch, NO require, NO eval, NO DOM manipulation — pure p5 instance mode
11. CRITICAL NAMING RULE: NEVER use the variable name "p" for anything except the p5 instance parameter. For particles use "pt" or "particle", for loop vars use "pt", "el", "item". Using "p" as a loop variable shadows the p5 instance and breaks p.noise(), p.fill(), etc.
    BAD:  for (const p of topParticles) { p.noise(...) } // crashes — p is now the particle, not p5
    GOOD: for (const pt of topParticles) { sketch.noise(...) } // OR keep outer ref: const sketch = p;
12. The algorithm must feel like it was refined through countless iterations by a master generative artist — every parameter chosen with deep intentionality

Return: { "sketchCode": "(p) => { ... }" }`;

  try {
    const res = await proxyFetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('DeepSeek render API error:', err);
      return NextResponse.json({ error: 'DeepSeek API error' }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    let parsed: { sketchCode: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('Failed to parse render JSON:', raw.slice(0, 500));
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 422 });
    }

    if (!parsed.sketchCode || typeof parsed.sketchCode !== 'string') {
      return NextResponse.json({ error: 'Missing sketchCode field in AI response' }, { status: 422 });
    }

    const result: AIVisualRender = {
      perfumeId,
      sketchCode: sanitizeSketch(parsed.sketchCode),
      generatedAt: Date.now(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Render route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

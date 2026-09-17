import { NextResponse } from 'next/server';
import type { AIVisualConcept } from '@/lib/types';
import { FAMILY_COLORS } from '@/lib/fragranceData';
import { proxyFetch } from '@/lib/proxyFetch';
import { createFallbackPalette, normalizeLayerColors, normalizePalette } from '@/lib/visualPalette';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const {
    perfumeId, name, brand, year, fragranceFamily,
    notes, topNotes, heartNotes, baseNotes, intensityCurve, moodScores,
  } = body;

  if (!perfumeId || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
  }

  const moodLine = Object.entries(moodScores ?? {})
    .filter(([, v]) => (v as number) > 0.05)
    .map(([k, v]) => `${k}:${((v as number) * 100).toFixed(0)}%`)
    .join(' ');

  const curve: number[] = intensityCurve ?? [];
  const curveDesc = curve.length === 5
    ? `Opening burst: ${curve[0].toFixed(2)} | Rising: ${curve[1].toFixed(2)} | Peak: ${curve[2].toFixed(2)} | Drying: ${curve[3].toFixed(2)} | Dry-down: ${curve[4].toFixed(2)}`
    : 'unavailable';

  const hasStructure = (heartNotes?.length ?? 0) > 0 || (baseNotes?.length ?? 0) > 0;
  const notesSection = hasStructure
    ? `Top Notes: ${(topNotes ?? []).join(', ') || 'none'}
Heart Notes: ${(heartNotes ?? []).join(', ') || 'none'}
Base Notes: ${(baseNotes ?? []).join(', ') || 'none'}`
    : `Notes (full list): ${(notes ?? []).join(', ') || (topNotes ?? []).join(', ') || 'unknown'}
Top/Heart/Base: DERIVE FROM NOTES LIST BY VOLATILITY
  TOP (high volatility, opens first): citrus, bergamot, lemon, grapefruit, pepper, aldehydes, galbanum
  HEART (medium, develops 30–90min): rose, jasmine, iris, lavender, geranium, violet, spices, ylang
  BASE (low volatility, lingers hours): sandalwood, cedar, oud, musk, amber, vanilla, patchouli, vetiver, oakmoss`;

  const systemPrompt = `You are a synesthetic art director and algorithmic philosopher. Given a perfume's olfactory profile, you create both a visual concept AND an algorithmic philosophy for a p5.js generative art piece.

The algorithmic philosophy articulates a computational worldview: how emergent behavior, noise fields, particle dynamics, and mathematical forces express the perfume's soul. It names a generative art movement and describes how the algorithm's process IS the art — beauty lives in execution, not the final frame.

Return ONLY valid JSON matching the exact schema. No markdown, no prose outside JSON.`;

  const userPrompt = `Perfume: "${name}" by ${brand}${year ? ` (${year})` : ''}
Fragrance Family: ${fragranceFamily}
${notesSection}
Intensity Curve (5 time points, 0–1): ${curveDesc}
Mood — ${moodLine || 'balanced'}

Create a visual concept and algorithmic philosophy. Return this exact JSON:
{
  "palette": [
    { "hex": "#RRGGBB", "label": "material name", "weight": 0.0 }
  ],
  "dominantMood": "2-4 word phrase",
  "motionStyle": "one sentence describing movement quality",
  "visualMetaphors": ["metaphor 1", "metaphor 2", "metaphor 3"],
  "canvasHints": {
    "technique": "particles",
    "speed": "slow",
    "density": "medium",
    "backgroundGradient": "radial-gradient(ellipse at 40% 35%, #1a1a2e, #07070f)"
  },
  "description": "1-3句中文诗意描述，唤起嗅觉与视觉的通感",
  "descriptionEn": "same description in English",
  "philosophy": {
    "movementName": "2-3 word generative movement name, e.g. 'Olfactory Dissolution'",
    "paragraphs": [
      "paragraph 1: the computational worldview this fragrance evokes",
      "paragraph 2: how noise fields and randomness manifest its character",
      "paragraph 3: the particle/force dynamics — meticulously crafted, master-level algorithm",
      "paragraph 4: temporal evolution, how intensity curve drives system states",
      "paragraph 5 (optional): emergent complexity and parametric variation"
    ]
  },
  "topLayerColors": ["#hex1", "#hex2"],
  "heartLayerColors": ["#hex1", "#hex2"],
  "baseLayerColors": ["#hex1", "#hex2"]
}

Rules:
- palette: 5-7 unique entries, weights sum to ~1.0
- palette hierarchy: dominant colors total 50-65%, supporting colors 25-40%, accents 5-15%; name the source material in each label
- Treat these as contextual hue ranges, never fixed one-note answers:
  citrus/bergamot→lemon yellow, green-gold, pale tangerine
  rose→petal pink, berry red, dusty mauve
  jasmine→ivory, pale yellow, creamy green
  iris/violet→stone lavender, grey violet, chalk white
  aquatic/mineral→sea-glass green, mist blue, mineral grey
  vetiver/moss→moss green, dry olive, smoky brown
  sandalwood/cedar→honey beige, pale wood, warm ochre
  musk→pearl white, warm grey, skin beige
  oud/leather/tobacco→dark burgundy, resin brown, muted plum, charcoal
  vanilla/gourmand→cream, pale gold, toasted beige, caramel
- Shift colors according to combinations: citrus/green makes them cooler and clearer; vanilla/amber warmer and creamier; oud/leather/incense darker and smokier; musk/iris softer and less saturated; aquatic/mineral cooler and more transparent
- Choose colors that remain visibly distinct after screen blending, blur, and overlap; avoid several colors that differ only in lightness
- canvasHints.technique: floral→aurora or organic; oriental/gourmand→smoke or crystals; aquatic→waves; citrus→particles; woody→smoke; leather→organic; fresh→particles or waves
- topLayerColors: use exact hex values from palette for volatile/opening materials (citrus, pepper, aldehydes, bergamot)
- heartLayerColors: use exact hex values from palette for mid-volatility materials (floral, spice, green)
- baseLayerColors: use exact hex values from palette for persistent materials (wood, musk, resin, amber)
- Every palette color must appear in at least one layer array
- backgroundGradient must use hex values from your palette
- philosophy.paragraphs: 4-5 paragraphs total; emphasize that the final algorithm is meticulously crafted, refined through countless iterations, master-level generative art`;

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
        temperature: 0.82,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('DeepSeek concept API error:', err);
      return NextResponse.json({ error: 'DeepSeek API error' }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';

    let concept: Omit<AIVisualConcept, 'perfumeId'>;
    try {
      concept = JSON.parse(raw);
    } catch {
      console.error('Failed to parse concept JSON:', raw);
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 422 });
    }

    // Validate palette data before it reaches the canvas.
    concept.palette = normalizePalette(
      concept.palette,
      createFallbackPalette(FAMILY_COLORS[fragranceFamily] ?? '#A38CB9')
    );
    if (!concept.canvasHints) {
      concept.canvasHints = {
        technique: 'particles',
        speed: 'medium',
        density: 'medium',
        backgroundGradient: 'radial-gradient(ellipse at 40% 35%, #1a1a2e, #07070f)',
      };
    }
    if (!concept.description) concept.description = name;
    if (!concept.descriptionEn) concept.descriptionEn = name;
    if (!concept.visualMetaphors) concept.visualMetaphors = [];
    if (!concept.philosophy) concept.philosophy = { movementName: 'Aromatic Drift', paragraphs: [] };
    concept.topLayerColors = normalizeLayerColors(
      concept.topLayerColors,
      concept.palette,
      concept.palette.slice(0, 2).map((color) => color.hex)
    );
    concept.heartLayerColors = normalizeLayerColors(
      concept.heartLayerColors,
      concept.palette,
      concept.palette.slice(1, 4).map((color) => color.hex)
    );
    concept.baseLayerColors = normalizeLayerColors(
      concept.baseLayerColors,
      concept.palette,
      concept.palette.slice(-2).map((color) => color.hex)
    );

    const assignedColors = new Set([
      ...concept.topLayerColors,
      ...concept.heartLayerColors,
      ...concept.baseLayerColors,
    ]);
    concept.heartLayerColors.push(
      ...concept.palette.map((color) => color.hex).filter((hex) => !assignedColors.has(hex))
    );

    const result: AIVisualConcept = { perfumeId, ...concept };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Concept route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

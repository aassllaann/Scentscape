import { NextResponse } from 'next/server';
import type { AIVisualConcept } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json();
  const { perfumeId, name, brand, year, fragranceFamily, topNotes, heartNotes, baseNotes, moodScores } = body;

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

  const systemPrompt = `You are a synesthetic art director. Given a perfume's olfactory profile, you translate it into a structured visual concept for a canvas animation.
Return ONLY valid JSON matching the exact schema. No markdown. No code. No prose outside JSON.`;

  const userPrompt = `Perfume: "${name}" by ${brand}${year ? ` (${year})` : ''}
Fragrance Family: ${fragranceFamily}
Top Notes: ${(topNotes ?? []).join(', ') || 'unknown'}
Heart Notes: ${(heartNotes ?? []).join(', ') || 'none'}
Base Notes: ${(baseNotes ?? []).join(', ') || 'none'}
Mood — ${moodLine || 'balanced'}

Create a visual concept. Return this exact JSON:
{
  "palette": [
    { "hex": "#RRGGBB", "label": "material name", "weight": 0.0 },
    ...
  ],
  "dominantMood": "2-4 word phrase",
  "motionStyle": "one sentence describing movement quality",
  "visualMetaphors": ["metaphor 1", "metaphor 2", "metaphor 3"],
  "canvasHints": {
    "technique": "particles" or "waves" or "smoke" or "aurora" or "crystals" or "organic",
    "speed": "slow" or "medium" or "fast",
    "density": "sparse" or "medium" or "dense",
    "backgroundGradient": "a valid CSS radial-gradient or linear-gradient string using hex colors from palette"
  },
  "description": "1-3句中文诗意描述，唤起嗅觉与视觉的通感",
  "descriptionEn": "same description in English"
}

Rules:
- palette: 3-5 entries, weights sum to ~1.0
- Derive hex colors from actual note materials: bergamot→#C8D976, rose→#E8A0A8, oud→#4A1A0E, vetiver→#7A6B3A, iris→#8B7BA8, jasmine→#F5EAB4, sandalwood→#C8A97A, musk→#D4B8A0, vanilla→#E8D5A3, cedar→#8B6645, bergamot→#D4E87A, amber→#C8773A, patchouli→#5A3E28
- Technique guide: floral→aurora or organic; oriental/gourmand→smoke or crystals; aquatic→waves; citrus→particles; woody→smoke; leather→organic; fresh→particles or waves
- backgroundGradient must use hex values from your palette`;

  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
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
        temperature: 0.8,
        max_tokens: 700,
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

    // Validate and fill defaults
    if (!concept.palette || !Array.isArray(concept.palette)) concept.palette = [];
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

    const result: AIVisualConcept = { perfumeId, ...concept };
    return NextResponse.json(result);
  } catch (err) {
    console.error('Concept route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

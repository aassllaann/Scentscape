import { NextResponse } from 'next/server';
import type { AIVisualConcept, AIVisualRender } from '@/lib/types';

export const runtime = 'nodejs';

// Strip external script tags for safety (keep inline only)
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[^>]+src\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\bfetch\s*\(/g, '// fetch(')
    .replace(/\bXMLHttpRequest\b/g, '// XMLHttpRequest')
    .replace(/\bimportScripts\s*\(/g, '// importScripts(');
}

export async function POST(request: Request) {
  const body = await request.json();
  const { perfumeId, concept }: { perfumeId: string; concept: AIVisualConcept } = body;

  if (!perfumeId || !concept) {
    return NextResponse.json({ error: 'Missing perfumeId or concept' }, { status: 400 });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY not configured' }, { status: 500 });
  }

  const paletteDesc = concept.palette
    .map((p) => `${p.label} (${p.hex}, prominence ${Math.round(p.weight * 100)}%)`)
    .join(', ');

  const systemPrompt = `You are a creative canvas animation programmer specializing in generative art.
Given a detailed visual concept, you write a complete, self-contained HTML page with a looping canvas animation.
The code runs in a sandboxed iframe — no external resources (no CDNs, no fetch, no XMLHttpRequest).
Return ONLY valid JSON with a single "html" field containing the complete HTML.`;

  const userPrompt = `Create a full-screen animated canvas visualization for this concept:

PALETTE: ${paletteDesc}
DOMINANT MOOD: ${concept.dominantMood}
MOTION STYLE: ${concept.motionStyle}
VISUAL METAPHORS: ${concept.visualMetaphors.join(', ')}
TECHNIQUE: ${concept.canvasHints.technique}
SPEED: ${concept.canvasHints.speed}
DENSITY: ${concept.canvasHints.density}
BACKGROUND: ${concept.canvasHints.backgroundGradient}

Write a complete HTML page with these requirements:
1. Canvas fills 100vw × 100vh, body/html margin:0, overflow:hidden
2. Background starts as: ${concept.canvasHints.backgroundGradient}
3. Use requestAnimationFrame with timestamp delta for smooth 60fps animation — no setInterval
4. Use ONLY the palette hex colors provided: ${concept.palette.map((p) => p.hex).join(', ')}
5. Implement the "${concept.canvasHints.technique}" technique faithfully:
   - particles: floating glowing dots with bloom, Brownian motion, fade in/out
   - waves: layered sinusoidal wave bands flowing across canvas
   - smoke: layered semi-transparent bezier curves drifting upward
   - aurora: horizontal sinusoidal light bands slowly sweeping with color shifts
   - crystals: rotating geometric polygon facets refracting palette colors
   - organic: blob-like flowing forms with perlin-approximated movement
6. Motion speed "${concept.canvasHints.speed}": slow=very gentle drift, medium=relaxed, fast=energetic
7. Density "${concept.canvasHints.density}": sparse=few elements+negative space, medium=balanced, dense=layered richness
8. Evoke these visual metaphors through the animation: ${concept.visualMetaphors.join('; ')}
9. No external scripts, no fonts, no images, no fetch — purely self-contained vanilla JS
10. Initialize canvas size to window.innerWidth × window.innerHeight, handle resize

Return: { "html": "<complete HTML from <!DOCTYPE html> to </html>" }

The animation must be visually stunning and directly evoke the mood: "${concept.dominantMood}"`;

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
        temperature: 0.7,
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

    let parsed: { html: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('Failed to parse render JSON:', raw.slice(0, 500));
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 422 });
    }

    if (!parsed.html || typeof parsed.html !== 'string') {
      return NextResponse.json({ error: 'Missing html field in AI response' }, { status: 422 });
    }

    const result: AIVisualRender = {
      perfumeId,
      html: sanitizeHtml(parsed.html),
      generatedAt: Date.now(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('Render route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

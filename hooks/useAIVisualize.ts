'use client';

import { useState, useCallback } from 'react';
import type { Perfume, AIVisualConcept, AIVisualRender, AIVisualResult } from '@/lib/types';

export type VisualizePhase =
  | 'idle'
  | 'conceiving'
  | 'concept-ready'
  | 'rendering'
  | 'done'
  | 'error';

const CACHE_KEY = 'scentscape_ai_visual_v1';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function readCache(): Record<string, AIVisualResult> {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, AIVisualResult>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage full — silently skip
  }
}

function getCached(perfumeId: string): AIVisualResult | null {
  const cache = readCache();
  const entry = cache[perfumeId];
  if (!entry) return null;
  if (Date.now() - entry.render.generatedAt > CACHE_TTL) return null;
  return entry;
}

function setCached(perfumeId: string, result: AIVisualResult) {
  const cache = readCache();
  writeCache({ ...cache, [perfumeId]: result });
}

export function useAIVisualize() {
  const [phase, setPhase] = useState<VisualizePhase>('idle');
  const [concept, setConcept] = useState<AIVisualConcept | null>(null);
  const [render, setRender] = useState<AIVisualRender | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visualize = useCallback(async (perfume: Perfume) => {
    // Check cache first
    const cached = getCached(perfume.id);
    if (cached) {
      setConcept(cached.concept);
      setRender(cached.render);
      setError(null);
      setPhase('done');
      return;
    }

    setError(null);
    setConcept(null);
    setRender(null);

    // ── Phase 1: Agent 1 (Creative Director) ─────────────────────────────────
    setPhase('conceiving');
    try {
      const conceptRes = await fetch('/api/visualize/concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeId: perfume.id,
          name: perfume.name,
          brand: perfume.brand,
          year: perfume.year,
          fragranceFamily: perfume.fragranceFamily,
          topNotes: perfume.topNotes ?? [],
          heartNotes: perfume.heartNotes ?? [],
          baseNotes: perfume.baseNotes ?? [],
          moodScores: perfume.moodScores ?? {},
        }),
      });

      if (!conceptRes.ok) {
        const err = await conceptRes.json().catch(() => ({ error: `HTTP ${conceptRes.status}` }));
        throw new Error(err.error ?? `Concept API error ${conceptRes.status}`);
      }

      const conceptData: AIVisualConcept = await conceptRes.json();
      setConcept(conceptData);
      setPhase('concept-ready');

      // ── Phase 2: Agent 2 (Canvas Painter) ──────────────────────────────────
      setPhase('rendering');

      const renderRes = await fetch('/api/visualize/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeId: perfume.id,
          concept: conceptData,
        }),
      });

      if (!renderRes.ok) {
        const err = await renderRes.json().catch(() => ({ error: `HTTP ${renderRes.status}` }));
        throw new Error(err.error ?? `Render API error ${renderRes.status}`);
      }

      const renderData: AIVisualRender = await renderRes.json();
      setRender(renderData);
      setPhase('done');

      // Cache the complete result
      setCached(perfume.id, { concept: conceptData, render: renderData });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setPhase('error');
    }
  }, []);

  const dismiss = useCallback(() => {
    setConcept(null);
    setRender(null);
    setError(null);
    setPhase('idle');
  }, []);

  return { phase, concept, render, error, visualize, dismiss };
}

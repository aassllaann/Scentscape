'use client';

import { useState, useCallback } from 'react';
import type { Perfume, AIVisualConcept } from '@/lib/types';

export type VisualizePhase =
  | 'idle'
  | 'conceiving'
  | 'done'
  | 'error';

const CACHE_KEY = 'scentscape_ai_visual_v3';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

interface ConceptCache {
  concept: AIVisualConcept;
  cachedAt: number;
}

function readCache(): Record<string, ConceptCache> {
  try {
    return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, ConceptCache>) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // sessionStorage full — silently skip
  }
}

function getCached(perfumeId: string): AIVisualConcept | null {
  const cache = readCache();
  const entry = cache[perfumeId];
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > CACHE_TTL) return null;
  return entry.concept;
}

function setCached(perfumeId: string, concept: AIVisualConcept) {
  const cache = readCache();
  writeCache({ ...cache, [perfumeId]: { concept, cachedAt: Date.now() } });
}

export function useAIVisualize() {
  const [phase, setPhase] = useState<VisualizePhase>('idle');
  const [concept, setConcept] = useState<AIVisualConcept | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visualize = useCallback(async (perfume: Perfume) => {
    const cached = getCached(perfume.id);
    if (cached) {
      setConcept(cached);
      setError(null);
      setPhase('done');
      return;
    }

    setError(null);
    setConcept(null);
    setPhase('conceiving');

    try {
      const res = await fetch('/api/visualize/concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeId: perfume.id,
          name: perfume.name,
          brand: perfume.brand,
          year: perfume.year,
          fragranceFamily: perfume.fragranceFamily,
          notes: perfume.notes ?? [],
          topNotes: perfume.topNotes ?? [],
          heartNotes: perfume.heartNotes ?? [],
          baseNotes: perfume.baseNotes ?? [],
          intensityCurve: perfume.intensityCurve ?? [],
          moodScores: perfume.moodScores ?? {},
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `Concept API error ${res.status}`);
      }

      const conceptData: AIVisualConcept = await res.json();
      setConcept(conceptData);
      setCached(perfume.id, conceptData);
      setPhase('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setPhase('error');
    }
  }, []);

  const dismiss = useCallback(() => {
    setConcept(null);
    setError(null);
    setPhase('idle');
  }, []);

  return { phase, concept, error, visualize, dismiss };
}

'use client';

import { useMemo } from 'react';
import { useSelectedPerfume } from '@/lib/store';
import { getMoodBackground, getTextColorClass } from '@/lib/utils';
import type { VisualParams } from '@/lib/types';
import familyMapData from '@/data/familyMap.json';

const DEFAULT_VISUAL_PARAMS: VisualParams = familyMapData.familyMap.Fresh as VisualParams;

export function useTextColor() {
  const perfume = useSelectedPerfume();
  const vp = perfume?.visualParams ?? DEFAULT_VISUAL_PARAMS;
  return getTextColorClass(vp.warmth);
}

export default function MoodCanvas() {
  const perfume = useSelectedPerfume();
  const vp = perfume?.visualParams ?? DEFAULT_VISUAL_PARAMS;
  const background = useMemo(() => getMoodBackground(vp), [vp]);

  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background,
        transition: 'background 2s ease',
      }}
    >
      {vp.texture === 'grainy' && (
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.12] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      )}
      {vp.texture === 'crystalline' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `repeating-linear-gradient(
              30deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.08) 40px,
              rgba(255,255,255,0.08) 41px
            ), repeating-linear-gradient(
              -30deg,
              transparent,
              transparent 40px,
              rgba(255,255,255,0.08) 40px,
              rgba(255,255,255,0.08) 41px
            )`,
          }}
        />
      )}
    </div>
  );
}

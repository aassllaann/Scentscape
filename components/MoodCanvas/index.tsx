'use client';

import { useMemo, useState, useEffect } from 'react';
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

// 双层交叉淡入淡出，绕过 CSS 无法在不同 gradient 类型间插值的限制
function useCrossFadeLayers(background: string) {
  const [layers, setLayers] = useState<{ a: string; b: string; active: 'a' | 'b' }>({
    a: background,
    b: background,
    active: 'a',
  });

  useEffect(() => {
    setLayers((prev) => {
      if (prev.active === 'a') {
        return { a: prev.a, b: background, active: 'b' };
      } else {
        return { a: background, b: prev.b, active: 'a' };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [background]);

  return layers;
}

export default function MoodCanvas() {
  const perfume = useSelectedPerfume();
  const vp = perfume?.visualParams ?? DEFAULT_VISUAL_PARAMS;
  const background = useMemo(() => getMoodBackground(vp), [vp]);
  const layers = useCrossFadeLayers(background);

  const textureOverlay = vp.texture === 'grainy' ? (
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
  ) : vp.texture === 'crystalline' ? (
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
  ) : null;

  return (
    <div className="fixed inset-0 z-0">
      {/* 底层：旧背景（淡出） */}
      <div
        className="absolute inset-0"
        style={{
          background: layers.a,
          opacity: layers.active === 'a' ? 1 : 0,
          transition: 'opacity 2s ease',
        }}
      />
      {/* 顶层：新背景（淡入） */}
      <div
        className="absolute inset-0"
        style={{
          background: layers.b,
          opacity: layers.active === 'b' ? 1 : 0,
          transition: 'opacity 2s ease',
        }}
      />
      {/* 纹理叠加层，始终在最上方 */}
      {textureOverlay}
    </div>
  );
}

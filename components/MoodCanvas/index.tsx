'use client';

import { useMemo } from 'react';
import { useSelectedPerfume } from '@/lib/store';
import { getMoodBackground } from '@/lib/utils';

export default function MoodCanvas() {
  const perfume = useSelectedPerfume();
  const background = useMemo(() => perfume ? getMoodBackground(perfume.visualParams) : 'transparent', [perfume]);

  const textureOverlay = perfume?.visualParams.texture === 'grainy' ? (
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
  ) : perfume?.visualParams.texture === 'crystalline' ? (
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
    <div className="fixed inset-0 z-0 bg-[var(--page-bg)]">
      <div
        className="absolute inset-0"
        style={{
          background,
          opacity: perfume ? 0.18 : 0,
          transition: 'opacity 0.8s ease',
        }}
      />
      {/* 纹理叠加层，始终在最上方 */}
      {textureOverlay}
    </div>
  );
}

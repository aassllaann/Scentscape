'use client';

import { useRef, useState, useCallback } from 'react';
import { useAppDispatch, useSelectedFamily, useSelectedPerfume } from '@/lib/store';
import type { Perfume } from '@/lib/types';
import {
  useFragranceWheel,
  FAMILY_LABELS,
  FAMILY_COLORS,
} from './useFragranceWheel';

interface Props {
  perfumes: Perfume[];
}

interface TooltipState {
  visible: boolean;
  family: string;
  x: number;
  y: number;
}

export default function FragranceWheel({ perfumes }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dispatch = useAppDispatch();
  const selectedFamily = useSelectedFamily();
  const selectedPerfume = useSelectedPerfume();

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    family: '',
    x: 0,
    y: 0,
  });

  const handleFamilyHover = useCallback(
    (family: string | null, x: number, y: number) => {
      if (family) {
        setTooltip({ visible: true, family, x, y });
      } else {
        setTooltip((t) => ({ ...t, visible: false }));
      }
    },
    []
  );

  const handleFamilyClick = useCallback(
    (family: string) => {
      dispatch({ type: 'SET_FAMILY', payload: family });
      dispatch({ type: 'SET_PERFUME', payload: null });
    },
    [dispatch]
  );

  useFragranceWheel(svgRef, {
    perfumes,
    selectedFamily,
    selectedPerfume,
    onFamilyHover: handleFamilyHover,
    onFamilyClick: handleFamilyClick,
  });

  // 当前悬停族群的香水（最多3支）
  const previewPerfumes = tooltip.visible
    ? perfumes
        .filter((p) => p.fragranceFamily === tooltip.family)
        .slice(0, 3)
    : [];

  return (
    <div className="relative flex items-center justify-center w-full flex-1">
      <svg
        ref={svgRef}
        className="w-full h-full max-w-[420px] max-h-[420px]"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.4))' }}
      />

      {/* Hover Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-30 pointer-events-none"
          style={{
            left: tooltip.x + 16,
            top: tooltip.y - 20,
          }}
        >
          <div
            className="rounded-xl px-3 py-2 shadow-xl min-w-[140px]"
            style={{
              background: 'rgba(15,15,15,0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${FAMILY_COLORS[tooltip.family]}44`,
            }}
          >
            <div
              className="text-xs font-bold mb-1.5"
              style={{ color: FAMILY_COLORS[tooltip.family] }}
            >
              {FAMILY_LABELS[tooltip.family]}
            </div>
            {previewPerfumes.map((p) => (
              <div key={p.id} className="text-xs text-white/70 leading-5">
                {p.name}
                <span className="text-white/40 ml-1">{p.brand}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useState, useCallback } from 'react';
import { useAppDispatch, useSelectedFamily, useSelectedSubfamily } from '@/lib/store';
import { FAMILY_ORDER, FAMILY_LABELS, FAMILY_COLORS, SUBFAMILY_LABELS } from '@/lib/fragranceData';
import type { SlimPreview } from '@/lib/perfumeServer';
import { useFragranceWheel } from './useFragranceWheel';

interface Props {
  familyPreviews: Record<string, SlimPreview[]>;
  subfamilyPreviews: Record<string, SlimPreview[]>;
}

interface TooltipState {
  visible: boolean;
  family: string;
  subfamilyId?: string;
  x: number;
  y: number;
}

export default function FragranceWheel({ familyPreviews, subfamilyPreviews }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dispatch = useAppDispatch();
  const selectedFamily = useSelectedFamily();
  const selectedSubfamily = useSelectedSubfamily();

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    family: '',
    x: 0,
    y: 0,
  });

  const handleFamilyHover = useCallback(
    (family: string | null, x: number, y: number, subfamilyId?: string) => {
      if (family) {
        setTooltip({ visible: true, family, subfamilyId, x, y });
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

  const handleSubfamilyClick = useCallback(
    (family: string, subfamilyId: string) => {
      dispatch({ type: 'SET_FAMILY', payload: family });
      dispatch({ type: 'SET_SUBFAMILY', payload: subfamilyId });
      dispatch({ type: 'SET_PERFUME', payload: null });
    },
    [dispatch]
  );

  useFragranceWheel(svgRef, {
    selectedFamily,
    selectedSubfamily,
    onFamilyHover: handleFamilyHover,
    onFamilyClick: handleFamilyClick,
    onSubfamilyClick: handleSubfamilyClick,
  });

  // 悬停时预览该香调/细分下的香水（最多3支）
  const previewPerfumes = tooltip.visible
    ? (tooltip.subfamilyId
        ? (subfamilyPreviews[tooltip.subfamilyId] ?? familyPreviews[tooltip.family] ?? [])
        : (familyPreviews[tooltip.family] ?? []))
    : [];

  return (
    <div className="wheel-region">
      <div className="wheel-controls">
        <span>拖动或滚动查看</span>
        <button
          type="button"
          onClick={() => svgRef.current?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))}
        >
          重置视图
        </button>
      </div>
      <div className="wheel-stage">
        <svg
          ref={svgRef}
          className="fragrance-wheel"
          style={{ overflow: 'visible', cursor: 'grab' }}
          role="group"
          aria-label="Interactive fragrance family wheel"
        />

        {tooltip.visible && (
          <div
            className="fixed z-30 pointer-events-none"
            style={{ left: tooltip.x + 16, top: tooltip.y - 20 }}
          >
            <div
              className="rounded-xl px-3 py-2 shadow-xl min-w-[150px]"
              style={{
                background: 'rgba(15,15,15,0.88)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${FAMILY_COLORS[tooltip.family]}55`,
              }}
            >
              <div className="text-xs font-bold leading-5" style={{ color: FAMILY_COLORS[tooltip.family] }}>
                {FAMILY_LABELS[tooltip.family]}
              </div>

              {tooltip.subfamilyId && (
                <div className="text-[10px] mb-1.5 opacity-80" style={{ color: FAMILY_COLORS[tooltip.family] }}>
                  {SUBFAMILY_LABELS[tooltip.subfamilyId]}
                </div>
              )}
              {!tooltip.subfamilyId && <div className="mb-1" />}

              {previewPerfumes.map((p) => (
                <div key={p.id} className="text-xs text-white/70 leading-5">
                  {p.name}<span className="text-white/40 ml-1">{p.brand}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="family-shortcuts" aria-label="Fragrance families">
        {FAMILY_ORDER.map((family) => (
          <button
            key={family}
            type="button"
            aria-pressed={selectedFamily === family}
            onClick={() => handleFamilyClick(family)}
          >
            <span style={{ background: FAMILY_COLORS[family] }} aria-hidden="true" />
            {FAMILY_LABELS[family]}
          </button>
        ))}
      </div>
    </div>
  );
}

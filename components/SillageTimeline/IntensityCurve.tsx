'use client';

import { getIntensityAtProgress } from '@/lib/utils';

interface Props {
  curve: number[];
  progress: number;
  primaryColor: string;
}

const WIDTH = 400;
const HEIGHT = 60;
const PADDING = { x: 10, y: 8 };

function curveToPoints(curve: number[]): string {
  if (curve.length < 2) return '';
  return curve
    .map((v, i) => {
      const x = PADDING.x + (i / (curve.length - 1)) * (WIDTH - PADDING.x * 2);
      const y = HEIGHT - PADDING.y - v * (HEIGHT - PADDING.y * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

export default function IntensityCurve({ curve, progress, primaryColor }: Props) {
  const points = curveToPoints(curve);
  const intensity = getIntensityAtProgress(progress, curve);

  const dotX = PADDING.x + (progress / 100) * (WIDTH - PADDING.x * 2);
  const dotY = HEIGHT - PADDING.y - intensity * (HEIGHT - PADDING.y * 2);
  const lineX = dotX;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: 60 }}
        preserveAspectRatio="none"
      >
        {/* 背景格线 */}
        <line
          x1={PADDING.x}
          y1={PADDING.y}
          x2={PADDING.x}
          y2={HEIGHT - PADDING.y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <line
          x1={PADDING.x}
          y1={HEIGHT - PADDING.y}
          x2={WIDTH - PADDING.x}
          y2={HEIGHT - PADDING.y}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* 强度曲线 */}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke={primaryColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
          />
        )}

        {/* 曲线下面积填充 */}
        {points && (
          <polygon
            points={`${PADDING.x},${HEIGHT - PADDING.y} ${points} ${WIDTH - PADDING.x},${HEIGHT - PADDING.y}`}
            fill={primaryColor}
            fillOpacity="0.12"
          />
        )}

        {/* 游标竖线 */}
        <line
          x1={lineX}
          y1={PADDING.y}
          x2={lineX}
          y2={HEIGHT - PADDING.y}
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* 当前位置指示点 */}
        <circle
          cx={dotX}
          cy={dotY}
          r="4"
          fill="white"
          style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))' }}
        />
      </svg>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSelectedPerfume, useTimelineProgress, useAppDispatch } from '@/lib/store';
import IntensityCurve from './IntensityCurve';
import TimelineSlider from './TimelineSlider';
import NoteCards from './NoteCards';

export default function SillageTimeline() {
  const perfume = useSelectedPerfume();
  const globalProgress = useTimelineProgress();
  const dispatch = useAppDispatch();

  // 本地 state 用于拖动时的即时响应，mouseup 后同步到 context
  const [localProgress, setLocalProgress] = useState(globalProgress);

  const handleChange = (value: number) => {
    setLocalProgress(value);
    dispatch({ type: 'SET_PROGRESS', payload: value });
  };

  if (!perfume) return null;

  const progress = localProgress;

  return (
    <div className="space-y-3">
      {/* 强度曲线 */}
      <IntensityCurve
        curve={perfume.intensityCurve}
        progress={progress}
        primaryColor={perfume.visualParams.primaryColor}
      />

      {/* 时间轴滑块 */}
      <TimelineSlider value={progress} onChange={handleChange} />

      {/* 成分卡片 */}
      <div className="pt-2">
        <NoteCards perfume={perfume} progress={progress} />
      </div>
    </div>
  );
}

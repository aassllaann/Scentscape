'use client';

import { useState, useEffect } from 'react';
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

  // 切换香水时重置本地进度
  useEffect(() => {
    setLocalProgress(0);
  }, [perfume?.id]);

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
        {perfume.topNotes?.length || perfume.heartNotes?.length || perfume.baseNotes?.length ? (
          <NoteCards perfume={perfume} progress={progress} />
        ) : perfume.notes?.length ? (
          /* 降级：仅有平铺 notes，不区分前中后调 */
          <div className="flex flex-wrap gap-1.5">
            {perfume.notes.map((note) => (
              <span
                key={note}
                className="text-xs text-white/60 bg-white/8 border border-white/10 rounded-full px-2.5 py-0.5"
              >
                {note}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 italic">暂无调性数据</p>
        )}
      </div>
    </div>
  );
}

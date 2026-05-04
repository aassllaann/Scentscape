import type { NoteStageResult, Perfume, VisualParams } from './types';

/**
 * 根据时间轴进度（0–100）计算各阶段香调的可见度
 * 非线性分段：前调 0–30，过渡 30–45，中调 45–75，过渡 75–85，后调 85–100
 */
export function getNotesByProgress(progress: number, perfume: Perfume): NoteStageResult {
  const p = Math.max(0, Math.min(100, progress));

  let topOpacity = 0;
  let heartOpacity = 0;
  let baseOpacity = 0;

  if (p <= 30) {
    topOpacity = 1;
  } else if (p <= 45) {
    const t = (p - 30) / 15;
    topOpacity = 1 - t;
    heartOpacity = t;
  } else if (p <= 75) {
    heartOpacity = 1;
  } else if (p <= 85) {
    const t = (p - 75) / 10;
    heartOpacity = 1 - t;
    baseOpacity = t;
  } else {
    baseOpacity = 1;
  }

  const threshold = 0.05;

  return {
    topNotes: topOpacity >= threshold
      ? perfume.topNotes.map(note => ({ note, opacity: topOpacity }))
      : [],
    heartNotes: heartOpacity >= threshold
      ? perfume.heartNotes.map(note => ({ note, opacity: heartOpacity }))
      : [],
    baseNotes: baseOpacity >= threshold
      ? perfume.baseNotes.map(note => ({ note, opacity: baseOpacity }))
      : [],
  };
}

/**
 * 根据 visualParams 生成 CSS background 字符串
 */
export function getMoodBackground(vp: VisualParams): string {
  const { primaryColor, accentColor, texture } = vp;

  switch (texture) {
    case 'smooth':
      return `radial-gradient(ellipse at 30% 40%, ${accentColor}88 0%, ${primaryColor} 100%)`;
    case 'grainy':
      return `radial-gradient(circle at 50% 50%, ${accentColor}66 0%, ${primaryColor}dd 60%, ${primaryColor} 100%)`;
    case 'crystalline':
      return `linear-gradient(135deg, ${accentColor}44 0%, ${primaryColor}cc 50%, ${accentColor}22 100%)`;
    default:
      return `radial-gradient(ellipse at 30% 40%, ${accentColor}88 0%, ${primaryColor} 100%)`;
  }
}

/**
 * 5点强度曲线插值，progress 0–100，返回 0–1 强度值
 */
export function getIntensityAtProgress(progress: number, curve: number[]): number {
  if (curve.length === 0) return 0;
  if (curve.length === 1) return curve[0];

  const p = Math.max(0, Math.min(100, progress));
  const segments = curve.length - 1;
  const segmentSize = 100 / segments;
  const segIndex = Math.min(Math.floor(p / segmentSize), segments - 1);
  const t = (p - segIndex * segmentSize) / segmentSize;

  return curve[segIndex] * (1 - t) + curve[segIndex + 1] * t;
}

/**
 * 根据 warmth 判断前景文字颜色
 */
export function getTextColorClass(warmth: number): string {
  return warmth >= 0.5 ? 'text-white' : 'text-gray-900';
}

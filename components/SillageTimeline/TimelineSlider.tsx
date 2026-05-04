'use client';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const TIME_LABELS = [
  { position: 0, label: '0' },
  { position: 30, label: '30min' },
  { position: 45, label: '中调' },
  { position: 75, label: '后调' },
  { position: 85, label: '+6h' },
  { position: 100, label: '∞' },
];

export default function TimelineSlider({ value, onChange }: Props) {
  return (
    <div className="w-full px-1">
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        aria-label="香水时间轴"
      />
      {/* 时间标签 */}
      <div className="relative mt-1 h-5">
        {TIME_LABELS.map(({ position, label }) => (
          <span
            key={position}
            className="absolute text-[10px] text-white/40 -translate-x-1/2"
            style={{ left: `${position}%` }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

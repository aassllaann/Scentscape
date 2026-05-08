'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useSelectedPerfume, useSelectedFamily, useAppDispatch } from '@/lib/store';
import { useTextColor } from '@/components/MoodCanvas';
import SillageTimeline from '@/components/SillageTimeline';
import type { Perfume } from '@/lib/types';

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full text-white/40 text-sm gap-2 px-6 text-center"
    >
      <span className="text-3xl mb-2">✦</span>
      <p>点击香调轮选择香调族群</p>
      <p>或在上方搜索香水名称</p>
    </motion.div>
  );
}

function FamilyList({
  family,
  perfumes,
}: {
  family: string;
  perfumes: Perfume[];
}) {
  const dispatch = useAppDispatch();
  const familyPerfumes = perfumes.filter((p) => p.fragranceFamily === family);

  return (
    <motion.div
      key={`family-${family}`}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white/90 font-semibold text-base">{family}</h2>
        <p className="text-white/40 text-xs mt-0.5">{familyPerfumes.length} 支香水</p>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
        {familyPerfumes.map((p) => (
          <button
            key={p.id}
            className="w-full text-left rounded-lg px-3 py-2.5 transition-colors hover:bg-white/10 group"
            onClick={() => dispatch({ type: 'SET_PERFUME', payload: p })}
          >
            <div className="text-sm text-white/85 font-medium group-hover:text-white transition-colors">
              {p.name}
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              {p.brand} · {p.year}
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {p.visualParams.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] text-white/50 bg-white/8 rounded-full px-2 py-0.5"
                >
                  {kw}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function PerfumeView({ perfume }: { perfume: Perfume }) {
  const dispatch = useAppDispatch();
  const textColor = useTextColor();

  return (
    <motion.div
      key={`perfume-${perfume.id}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      {/* 返回按钮 */}
      <button
        className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors mx-5 mt-4 w-fit"
        onClick={() =>
          dispatch({ type: 'SET_PERFUME', payload: null })
        }
      >
        ← 返回列表
      </button>

      {/* 香水信息头部 */}
      <div className="px-5 pt-3 pb-4">
        <h2 className={`text-xl font-bold ${textColor} leading-tight`}>
          {perfume.name}
        </h2>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-white/60 text-sm">{perfume.brand}</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/40 text-xs">{perfume.year}</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/40 text-xs">{perfume.gender}</span>
        </div>

        {/* 情绪关键词 */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {perfume.visualParams.keywords.map((kw) => (
            <span
              key={kw}
              className="text-xs px-2.5 py-1 rounded-full"
              style={{
                background: `${perfume.visualParams.accentColor}33`,
                border: `1px solid ${perfume.visualParams.accentColor}66`,
                color: perfume.visualParams.warmth > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </div>

      {/* 滚动区：描述 + 香调 + 时间轴 + 情绪标签 */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-5">

        {/* 香调成分 */}
        {perfume.notes && perfume.notes.length > 0 && (
          <div>
            <div className="text-xs text-white/40 mb-2 font-medium tracking-wide uppercase">Notes</div>
            <div className="flex flex-wrap gap-1.5">
              {perfume.notes.map((note) => (
                <span
                  key={note}
                  className="text-xs rounded-full px-2.5 py-0.5"
                  style={{
                    background: `${perfume.visualParams.accentColor}22`,
                    border: `1px solid ${perfume.visualParams.accentColor}55`,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 描述文字 */}
        {perfume.description && (
          <div>
            <div className="text-xs text-white/40 mb-2 font-medium tracking-wide uppercase">Description</div>
            <p className="text-xs text-white/60 leading-relaxed">
              {perfume.description}
            </p>
          </div>
        )}

        {/* 时间轴 */}
        <div>
          <div className="text-xs text-white/40 mb-3 font-medium">香气时间轴</div>
          <SillageTimeline />
        </div>

        {/* 情绪标签 */}
        {perfume.moodTags.length > 0 && (
          <div>
            <div className="text-xs text-white/40 mb-2 font-medium">情绪标签</div>
            <div className="flex flex-wrap gap-1.5">
              {perfume.moodTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-white/50 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface Props {
  perfumes: Perfume[];
}

export default function PerfumeDetail({ perfumes }: Props) {
  const selectedPerfume = useSelectedPerfume();
  const selectedFamily = useSelectedFamily();

  const showEmpty = !selectedFamily && !selectedPerfume;
  const showFamily = selectedFamily && !selectedPerfume;
  const showPerfume = !!selectedPerfume;

  return (
    <aside
      className="relative flex flex-col w-[380px] flex-shrink-0 h-full overflow-hidden"
      style={{
        background: 'rgba(0,0,0,0.35)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <AnimatePresence mode="wait">
        {showEmpty && <EmptyState key="empty" />}
        {showFamily && (
          <FamilyList key={`family-${selectedFamily}`} family={selectedFamily} perfumes={perfumes} />
        )}
        {showPerfume && (
          <PerfumeView key={`perfume-${selectedPerfume.id}`} perfume={selectedPerfume} />
        )}
      </AnimatePresence>
    </aside>
  );
}

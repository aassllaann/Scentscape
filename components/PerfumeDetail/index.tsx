'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import {
  useSelectedPerfume, useSelectedFamily, useSelectedSubfamily, useAppDispatch,
} from '@/lib/store';
import SillageTimeline from '@/components/SillageTimeline';
import {
  FAMILY_LABELS, FAMILY_COLORS, SUBFAMILY_LABELS,
} from '@/lib/fragranceData';
import AIVisualOverlay from '@/components/AIVisualOverlay';
import { useAIVisualize, type VisualizePhase } from '@/hooks/useAIVisualize';
import type { Perfume } from '@/lib/types';

const LIST_LIMIT = 120;

const GENDER_LABEL: Record<string, string> = {
  masculine: 'MASCULIN', feminine: 'FÉMININ', unisex: 'MIXTE',
};

const MOOD_META = [
  { key: 'Warm',  label: 'CHALEUR' },
  { key: 'Sweet', label: 'DOUCEUR' },
  { key: 'Floral',label: 'FLORAL'  },
  { key: 'Fresh', label: 'FRAÎCH.' },
  { key: 'Spicy', label: 'ÉPICÉ'   },
  { key: 'Dark',  label: 'OBSCUR'  },
];

// ── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 mb-3"
      style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.2em', color: 'var(--text-muted)' }}
    >
      <span>{children}</span>
      <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
    </div>
  );
}

// ── Mood bars ────────────────────────────────────────────────────────────────
function MoodBars({ scores }: { scores: Record<string, number> }) {
  const active = MOOD_META.filter((m) => (scores[m.key] ?? 0) >= 0.12);
  if (!active.length) return null;
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
      {active.map(({ key, label }) => {
        const val = scores[key] ?? 0;
        const pct = Math.round(val * 100);
        return (
          <div key={key} className="flex items-center gap-2">
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--text-muted)', width: 44, flexShrink: 0 }}>
              {label}
            </span>
            <div className="flex-1 h-px relative" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div
                className="absolute top-0 left-0 h-full"
                style={{ width: `${pct}%`, background: 'var(--gold)', opacity: 0.7 }}
              />
            </div>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '8px', color: 'var(--text-muted)', width: 20, textAlign: 'right', flexShrink: 0 }}>
              {pct}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Note tag ─────────────────────────────────────────────────────────────────
function NoteTag({ note, color }: { note: string; color: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-data)',
        fontSize: '10px',
        color: 'var(--text-primary)',
        background: `${color}28`,
        border: `1px solid ${color}55`,
        borderRadius: '3px',
        padding: '2px 8px',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
      }}
    >
      {note}
    </span>
  );
}

// ── Note structure ────────────────────────────────────────────────────────────
function NoteStructure({ perfume }: { perfume: Perfume }) {
  const { topNotes, heartNotes, baseNotes } = perfume;
  const isStructured = (heartNotes?.length ?? 0) > 0 || (baseNotes?.length ?? 0) > 0;

  if (isStructured) {
    const rows = [
      { key: 'TÊTE',   notes: topNotes   ?? [], dot: '#a8d8ea' },
      { key: 'CŒUR',  notes: heartNotes ?? [], dot: '#f9c784' },
      { key: 'FOND',   notes: baseNotes  ?? [], dot: '#c8a882' },
    ];
    return (
      <div className="space-y-3">
        {rows.filter(r => r.notes.length > 0).map(({ key, notes, dot }) => (
          <div key={key} className="flex items-start gap-3">
            <div
              className="flex items-center gap-1.5 flex-shrink-0 pt-0.5"
              style={{ width: 36 }}
            >
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: dot }} />
              <span style={{ fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '0.14em', color: 'var(--text-muted)' }}>
                {key}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {notes.map((n) => <NoteTag key={n} note={n} color={dot} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const flat = topNotes ?? [];
  if (!flat.length) {
    return (
      <p style={{ fontFamily: 'var(--font-data)', fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
        données indisponibles
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {flat.map((n) => <NoteTag key={n} note={n} color="#c9a96e" />)}
      </div>
      <p className="mt-2" style={{ fontFamily: 'var(--font-data)', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
        ※ hiérarchie non disponible
      </p>
    </div>
  );
}

// ── Perfume list row ──────────────────────────────────────────────────────────
function PerfumeRow({ perfume, accentColor }: { perfume: Perfume; accentColor: string }) {
  const dispatch = useAppDispatch();
  return (
    <button
      className="w-full text-left group"
      style={{ padding: '10px 12px', borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.04)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      onClick={() => dispatch({ type: 'SET_PERFUME', payload: perfume })}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="truncate"
          style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontStyle: 'italic', color: 'var(--text-primary)' }}
        >
          {perfume.name}
        </span>
        {perfume.year ? (
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', color: 'var(--text-secondary)', flexShrink: 0, letterSpacing: '0.1em' }}>
            {perfume.year}
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.13em', color: 'var(--text-secondary)' }}>
          {perfume.brand.toUpperCase()}
        </span>
        {perfume.gender && (
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '8px', color: accentColor, opacity: 0.85, letterSpacing: '0.1em' }}>
            {GENDER_LABEL[perfume.gender] ?? perfume.gender}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full px-8 text-center"
    >
      <div
        style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--gold)', opacity: 0.25, lineHeight: 1, marginBottom: '1.5rem', fontStyle: 'italic' }}
      >
        ✦
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '17px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
        点击香调轮探索
      </p>
      <p className="label-caps mt-2" style={{ letterSpacing: '0.18em', lineHeight: 2 }}>
        或在上方搜索香水名称
      </p>
      <div className="mt-8 flex gap-1.5 opacity-20">
        {['东方','木质','花香','柑橘','水生'].map((t) => (
          <span key={t} style={{ fontFamily: 'var(--font-data)', fontSize: '8px', letterSpacing: '0.15em', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '2px', padding: '2px 6px' }}>
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ── Family list ───────────────────────────────────────────────────────────────
function FamilyList({ family }: { family: string }) {
  const color = FAMILY_COLORS[family] ?? '#888';
  const label = FAMILY_LABELS[family] ?? family;
  const [data, setData] = useState<{ total: number; items: Perfume[] } | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/perfumes?family=${encodeURIComponent(family)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [family]);

  return (
    <motion.div
      key={`family-${family}`}
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="label-caps" style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>香调族群</div>
        <h2 className="font-display mt-1" style={{ fontSize: '24px', fontStyle: 'italic', color }}>
          {label}
        </h2>
        <p className="label-caps mt-1" style={{ color: 'var(--text-muted)' }}>
          {data ? (
            <>
              {data.total.toLocaleString()} fragrances
              {data.total > LIST_LIMIT && ` · 显示前 ${LIST_LIMIT}`}
            </>
          ) : '…'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {data?.items.map((p) => <PerfumeRow key={p.id} perfume={p} accentColor={color} />)}
      </div>
    </motion.div>
  );
}

// ── Subfamily list ────────────────────────────────────────────────────────────
function SubfamilyList({ family, subfamilyId }: { family: string; subfamilyId: string }) {
  const dispatch = useAppDispatch();
  const color = FAMILY_COLORS[family] ?? '#888';
  const familyLabel = FAMILY_LABELS[family] ?? family;
  const subLabel = SUBFAMILY_LABELS[subfamilyId] ?? subfamilyId;
  const [data, setData] = useState<{ total: number; items: Perfume[] } | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/perfumes?subfamily=${encodeURIComponent(subfamilyId)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [subfamilyId]);

  return (
    <motion.div
      key={`subfamily-${subfamilyId}`}
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col h-full"
    >
      <div className="px-5 pt-4 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <button
          className="flex items-center gap-1.5 mb-3 transition-opacity hover:opacity-100"
          style={{ opacity: 0.75 }}
          onClick={() => dispatch({ type: 'SET_SUBFAMILY', payload: null })}
        >
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', color }}>←</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.16em', color }}>
            {familyLabel.toUpperCase()}
          </span>
        </button>
        <div className="label-caps" style={{ color: 'var(--text-muted)' }}>细分香调</div>
        <h2 className="font-display mt-1" style={{ fontSize: '22px', fontStyle: 'italic', color }}>
          {subLabel}
        </h2>
        <p className="label-caps mt-1" style={{ color: 'var(--text-muted)' }}>
          {data ? (
            <>
              {data.total.toLocaleString()} fragrances
              {data.total > LIST_LIMIT && ` · 显示前 ${LIST_LIMIT}`}
            </>
          ) : '…'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {data?.items.map((p) => <PerfumeRow key={p.id} perfume={p} accentColor={color} />)}
      </div>
    </motion.div>
  );
}

// ── AI Visualize Button ───────────────────────────────────────────────────────
const AI_BTN_LABELS: Record<string, string> = {
  idle:       '✦  VISUALISER L\'ESSENCE',
  conceiving: 'ANALYSE DES NOTES…',
  done:       '▶  REJOUER LA VISION',
  error:      '↺  RÉESSAYER',
};

function AIVisualButton({ phase, onVisualize }: { phase: VisualizePhase; onVisualize: () => void }) {
  const isLoading = phase === 'conceiving';
  const isActive  = phase === 'done';

  return (
    <button
      onClick={isLoading ? undefined : onVisualize}
      disabled={isLoading}
      style={{
        width: '100%',
        padding: '11px 14px',
        background: isActive ? 'rgba(201,169,110,0.08)' : 'rgba(201,169,110,0.04)',
        border: `1px solid ${isLoading ? 'rgba(201,169,110,0.12)' : 'rgba(201,169,110,0.28)'}`,
        borderRadius: '3px',
        cursor: isLoading ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'border-color 0.2s, background 0.2s',
        fontFamily: 'var(--font-data)',
        fontSize: '9px',
        letterSpacing: '0.22em',
        color: isLoading ? 'var(--text-muted)' : 'var(--gold)',
      }}
      onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = 'rgba(201,169,110,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isActive ? 'rgba(201,169,110,0.08)' : 'rgba(201,169,110,0.04)'; }}
    >
      {isLoading && <span className="ai-spinner" />}
      {AI_BTN_LABELS[phase] ?? AI_BTN_LABELS.idle}
    </button>
  );
}

// ── Perfume view (centered modal) ─────────────────────────────────────────────
function PerfumeView({ perfume }: { perfume: Perfume }) {
  const dispatch = useAppDispatch();
  const selectedSubfamily = useSelectedSubfamily();
  const selectedFamily    = useSelectedFamily();
  const { phase, concept, error: aiError, visualize, dismiss } = useAIVisualize();

  const familyColor  = selectedFamily ? (FAMILY_COLORS[selectedFamily] ?? '#888') : 'var(--gold)';
  const familyLabel  = selectedFamily ? (FAMILY_LABELS[selectedFamily] ?? selectedFamily) : null;
  const subLabel     = selectedSubfamily ? (SUBFAMILY_LABELS[selectedSubfamily] ?? selectedSubfamily) : null;
  const backLabel    = subLabel ?? familyLabel ?? '返回';

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: '88vh' }}>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <button
          className="flex items-center gap-1.5 transition-opacity hover:opacity-100"
          style={{ opacity: 0.72 }}
          onClick={() => dispatch({ type: 'SET_PERFUME', payload: null })}
        >
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', color: familyColor }}>←</span>
          <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.15em', color: familyColor }}>
            {backLabel.toUpperCase()}
          </span>
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_PERFUME', payload: null })}
          className="transition-opacity hover:opacity-100"
          style={{ opacity: 0.3, fontFamily: 'var(--font-data)', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* 香水头部 */}
      <div className="px-6 pt-5 pb-4 flex-shrink-0">
        {/* 品牌 */}
        <div style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.22em', color: familyColor, opacity: 0.8 }}>
          {perfume.brand.toUpperCase()}
        </div>
        {/* 名称 */}
        <h2
          className="font-display mt-1 leading-tight"
          style={{ fontSize: '28px', fontStyle: 'italic', color: 'var(--text-primary)' }}
        >
          {perfume.name}
        </h2>
        {/* 元数据行 */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {perfume.year ? (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.14em', color: 'var(--text-secondary)' }}>
              {perfume.year}
            </span>
          ) : null}
          {perfume.year && perfume.gender && (
            <span style={{ color: 'var(--text-muted)' }}>·</span>
          )}
          {perfume.gender && (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.14em', color: 'var(--text-secondary)' }}>
              {GENDER_LABEL[perfume.gender] ?? perfume.gender}
            </span>
          )}
          {perfume.subfamilyId && (
            <>
              <span style={{ color: 'var(--text-muted)' }}>·</span>
              <span
                style={{
                  fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.12em',
                  color: familyColor, background: `${familyColor}18`,
                  border: `1px solid ${familyColor}30`, borderRadius: '2px',
                  padding: '1px 6px',
                }}
              >
                {SUBFAMILY_LABELS[perfume.subfamilyId] ?? perfume.subfamilyId}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 滚动内容区 */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

        {/* 气息特征 */}
        {perfume.moodScores && Object.keys(perfume.moodScores).length > 0 && (
          <div>
            <SectionLabel>CARACTÈRE</SectionLabel>
            <MoodBars scores={perfume.moodScores} />
          </div>
        )}

        {/* 香调结构 */}
        <div>
          <SectionLabel>
            {((perfume.heartNotes?.length ?? 0) > 0 || (perfume.baseNotes?.length ?? 0) > 0)
              ? 'COMPOSITION — TÊTE · CŒUR · FOND'
              : 'COMPOSITION'}
          </SectionLabel>
          <NoteStructure perfume={perfume} />
        </div>

        {/* 简介（非空才显示） */}
        {perfume.description && (
          <div>
            <SectionLabel>DESCRIPTION</SectionLabel>
            <p style={{ fontFamily: 'var(--font-data)', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {perfume.description}
            </p>
          </div>
        )}

        {/* AI 视觉幻境 */}
        <div>
          <SectionLabel>VISION SYNESTHÉSIQUE</SectionLabel>
          <AIVisualButton phase={phase} onVisualize={() => visualize(perfume)} />
          {aiError && (
            <p style={{ fontFamily: 'var(--font-data)', fontSize: '9px', color: '#c0392b', marginTop: 6, letterSpacing: '0.08em' }}>
              {aiError}
            </p>
          )}
        </div>

        {/* 香气时间轴 */}
        <div>
          <SectionLabel>SILLAGE · DURÉE</SectionLabel>
          <SillageTimeline />
        </div>
      </div>

      {/* AI 全屏视觉叠层 */}
      <AnimatePresence>
        {phase !== 'idle' && phase !== 'error' && (
          <AIVisualOverlay
            phase={phase}
            concept={concept}
            perfumeName={`${perfume.name}  —  ${perfume.brand}`}
            onClose={dismiss}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function PerfumeDetail() {
  const selectedPerfume    = useSelectedPerfume();
  const selectedFamily     = useSelectedFamily();
  const selectedSubfamily  = useSelectedSubfamily();
  const dispatch           = useAppDispatch();

  const showEmpty     = !selectedFamily;
  const showSubfamily = !!selectedFamily && !!selectedSubfamily;
  const showFamily    = !!selectedFamily && !selectedSubfamily;

  return (
    <>
      {/* 右侧列表面板 */}
      <aside
        className="relative flex flex-col flex-shrink-0 h-full overflow-hidden"
        style={{
          width: 320,
          background: 'rgba(7,7,15,0.5)',
          borderLeft: '1px solid var(--glass-border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <AnimatePresence mode="wait">
          {showEmpty    && <EmptyState key="empty" />}
          {showFamily   && <FamilyList   key={`fam-${selectedFamily}`}    family={selectedFamily} />}
          {showSubfamily && <SubfamilyList key={`sub-${selectedSubfamily}`} family={selectedFamily!} subfamilyId={selectedSubfamily} />}
        </AnimatePresence>
      </aside>

      {/* 居中浮层 */}
      <AnimatePresence>
        {selectedPerfume && (
          <motion.div
            key="overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* 遮罩 */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => dispatch({ type: 'SET_PERFUME', payload: null })}
            />
            {/* 卡片 */}
            <motion.div
              className="relative z-10 w-full overflow-hidden"
              style={{
                maxWidth: 480,
                maxHeight: '88vh',
                background: 'rgba(6,6,12,0.97)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.26, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <PerfumeView key={`pv-${selectedPerfume.id}`} perfume={selectedPerfume} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

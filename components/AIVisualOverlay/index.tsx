'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIVisualConcept } from '@/lib/types';
import type { VisualizePhase } from '@/hooks/useAIVisualize';

interface Props {
  phase: VisualizePhase;
  concept: AIVisualConcept | null;
  perfumeName: string;
  onClose: () => void;
}

const FONT_DATA: React.CSSProperties = { fontFamily: 'var(--font-data)', letterSpacing: '0.12em' };
const FONT_DISPLAY: React.CSSProperties = { fontFamily: 'var(--font-display)', fontStyle: 'italic' };

// ── Seeded PRNG (Mulberry32) ───────────────────────────────────────────────────
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let z = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    z = (z + Math.imul(z ^ (z >>> 7), 61 | z)) ^ z;
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').padEnd(6, '0');
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Lift dark colors so they remain luminous (not muddy)
function liftColor([r, g, b]: [number, number, number], lift = 0.35): [number, number, number] {
  return [
    Math.min(255, r + (255 - r) * lift) | 0,
    Math.min(255, g + (255 - g) * lift) | 0,
    Math.min(255, b + (255 - b) * lift) | 0,
  ];
}

// ── Aura Canvas ───────────────────────────────────────────────────────────────
//
// Full-screen atmospheric visualization:
// Large, overlapping radial-gradient auras floating in Lissajous paths.
// Rendered at ×0.2 scale on an offscreen canvas → upscaled to fill the screen.
// CSS filter: blur + saturate adds the final dreamy, gauze-like finish.
// ──────────────────────────────────────────────────────────────────────────────
function AuraCanvas({ concept }: { concept: AIVisualConcept }) {
  const wrapRef   = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d')!;

    // Seeded PRNG
    const seedNum = concept.perfumeId
      .split('')
      .reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
    const rand = mulberry32(Math.abs(seedNum) || 42);

    // Collect colors from all three note layers
    const topHex   = concept.topLayerColors?.length   ? concept.topLayerColors   : concept.palette.slice(0, 2).map(p => p.hex);
    const heartHex = concept.heartLayerColors?.length ? concept.heartLayerColors : concept.palette.slice(1, 3).map(p => p.hex);
    const baseHex  = concept.baseLayerColors?.length  ? concept.baseLayerColors  : concept.palette.slice(-2).map(p => p.hex);

    // Lift all colors to avoid muddiness; base notes get less lift (stay deeper)
    const topRgbs   = topHex.map(h => liftColor(hexToRgb(h), 0.45));
    const heartRgbs = heartHex.map(h => liftColor(hexToRgb(h), 0.30));
    const baseRgbs  = baseHex.map(h => liftColor(hexToRgb(h), 0.15));
    const allRgbs   = [...topRgbs, ...heartRgbs, ...baseRgbs];

    // ── Background color: deeply tinted average of base notes ────────────────
    const bgR = (baseRgbs.reduce((s, c) => s + c[0], 0) / baseRgbs.length * 0.08) | 0;
    const bgG = (baseRgbs.reduce((s, c) => s + c[1], 0) / baseRgbs.length * 0.08) | 0;
    const bgB = (baseRgbs.reduce((s, c) => s + c[2], 0) / baseRgbs.length * 0.08) | 0;

    // ── Aura blob layout ──────────────────────────────────────────────────────
    // Grid: 3 × 3 cells. Blobs fill cells with random offsets so every corner
    // is covered and there are no gaps.
    type AuraBlob = {
      cellX: number; cellY: number;        // grid cell coords (0–1)
      wanderX: number; wanderY: number;    // wander amplitude (normalized)
      freqX: number; freqY: number;        // Lissajous freq
      phX: number; phY: number;            // initial phase
      speed: number;                       // rad/frame
      r: number;                           // base radius (normalized to shorter side)
      pulseAmp: number; pulsePhase: number; // breathing
      rgb: [number, number, number];
      alpha: number;
    };

    const GRID_COLS = 3;
    const GRID_ROWS = 3;
    const blobs: AuraBlob[] = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const i = row * GRID_COLS + col;
        blobs.push({
          // Center of grid cell
          cellX: (col + 0.5) / GRID_COLS + (rand() - 0.5) * 0.18,
          cellY: (row + 0.5) / GRID_ROWS + (rand() - 0.5) * 0.14,
          wanderX: 0.10 + rand() * 0.12,
          wanderY: 0.08 + rand() * 0.10,
          freqX: 1 + (rand() < 0.5 ? 1 : 2),
          freqY: 1 + (rand() < 0.5 ? 2 : 1),
          phX:  rand() * Math.PI * 2,
          phY:  rand() * Math.PI * 2,
          speed: 0.0028 + rand() * 0.0022,
          // Large enough to span well beyond a single cell → guaranteed overlap
          r:    0.45 + rand() * 0.20,
          pulseAmp:   0.04 + rand() * 0.06,
          pulsePhase: rand() * Math.PI * 2,
          rgb:   allRgbs[i % allRgbs.length],
          alpha: 0.55 + rand() * 0.25,
        });
      }
    }

    // ── Offscreen canvas at 1/5 resolution ───────────────────────────────────
    const SCALE = 5;
    let RW = Math.ceil(W / SCALE);
    let RH = Math.ceil(H / SCALE);
    const off = document.createElement('canvas');
    off.width = RW; off.height = RH;
    const oc = off.getContext('2d')!;

    let t = 0;
    let frameId: number;

    function frame() {
      // ── Fill background (tinted base color — never pure black) ──────────────
      oc.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
      oc.fillRect(0, 0, RW, RH);

      // ── Draw aura blobs with 'screen' blending for luminous mixing ───────────
      oc.globalCompositeOperation = 'screen';

      for (const b of blobs) {
        const bT  = t * b.speed;
        const cx  = (b.cellX + b.wanderX * Math.sin(b.freqX * bT + b.phX)) * RW;
        const cy  = (b.cellY + b.wanderY * Math.sin(b.freqY * bT + b.phY)) * RH;
        const sr  = Math.min(RW, RH);
        const rad = sr * b.r * (1 + b.pulseAmp * Math.sin(t * 0.007 + b.pulsePhase));

        const g = oc.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const [r, gr, bl] = b.rgb;
        g.addColorStop(0.00, `rgba(${r},${gr},${bl},${b.alpha})`);
        g.addColorStop(0.35, `rgba(${r},${gr},${bl},${b.alpha * 0.70})`);
        g.addColorStop(0.65, `rgba(${r},${gr},${bl},${b.alpha * 0.28})`);
        g.addColorStop(1.00, `rgba(${r},${gr},${bl},0)`);

        oc.beginPath();
        oc.arc(cx, cy, rad, 0, Math.PI * 2);
        oc.fillStyle = g;
        oc.fill();
      }

      // ── Veil: soft white mist layer (薄纱 / gauze effect) ────────────────────
      oc.globalCompositeOperation = 'source-over';
      const veil = oc.createRadialGradient(RW * 0.5, RH * 0.42, 0, RW * 0.5, RH * 0.5, Math.hypot(RW, RH) * 0.65);
      veil.addColorStop(0.00, 'rgba(255,255,255,0.10)');
      veil.addColorStop(0.50, 'rgba(255,255,255,0.04)');
      veil.addColorStop(1.00, 'rgba(255,255,255,0.00)');
      oc.fillStyle = veil;
      oc.fillRect(0, 0, RW, RH);

      // ── Upscale to main canvas ───────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0, W, H);

      t++;
      frameId = requestAnimationFrame(frame);
    }

    frame();

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      RW = Math.ceil(W / SCALE);
      RH = Math.ceil(H / SCALE);
      off.width = RW; off.height = RH;
    };
    window.addEventListener('resize', onResize);

    return () => { cancelAnimationFrame(frameId); window.removeEventListener('resize', onResize); };
  }, [concept]);

  return (
    // Wrapper: scale slightly beyond viewport so CSS blur edges never show
    <div
      ref={wrapRef}
      className="absolute"
      style={{
        inset: '-8%',           // bleed past all edges
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          filter: 'blur(32px) saturate(1.15) brightness(1.05)',
        }}
      />
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export default function AIVisualOverlay({ phase, concept, perfumeName, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isLoading = phase === 'conceiving';

  // Derive a tinted background from palette (avoids jarring pure black)
  const bgColor = concept?.baseLayerColors?.[0]
    ?? concept?.palette?.[concept.palette.length - 1]?.hex
    ?? '#07070f';

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ background: bgColor + '22' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Aura visual */}
      <AnimatePresence>
        {concept && (
          <motion.div
            key="aura"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
          >
            <AuraCanvas concept={concept} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="absolute inset-0 flex flex-col justify-between p-8" style={{ pointerEvents: 'none' }}>

        {/* Close button */}
        <div className="flex justify-end" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={onClose}
            style={{
              ...FONT_DATA, fontSize: '16px',
              color: 'rgba(245,240,232,0.60)',
              background: 'rgba(0,0,0,0.30)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '3px',
              width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(245,240,232,0.95)'; e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(245,240,232,0.60)'; e.currentTarget.style.background = 'rgba(0,0,0,0.30)'; }}
          >×</button>
        </div>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading"
              className="flex-1 flex flex-col items-center justify-center gap-5"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="ai-spinner-lg" />
              <p style={{ ...FONT_DISPLAY, fontSize: '19px', color: 'rgba(245,240,232,0.80)' }}>
                {perfumeName}
              </p>
              <p style={{ ...FONT_DATA, fontSize: '8px', color: 'var(--gold)', letterSpacing: '0.25em' }}>
                ANALYSE DES NOTES OLFACTIVES…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info panel */}
        <AnimatePresence>
          {concept && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.7, delay: 0.6, ease: 'easeOut' }}
              style={{
                background: 'rgba(0,0,0,0.28)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '6px',
                padding: '20px 24px',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                {concept.palette.map((p) => (
                  <div key={p.hex} title={p.label} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: p.hex, flexShrink: 0,
                    boxShadow: `0 0 8px ${p.hex}`,
                  }} />
                ))}
              </div>

              <p style={{ ...FONT_DISPLAY, fontSize: '17px', color: 'rgba(255,255,255,0.90)', marginBottom: 8, lineHeight: 1.35 }}>
                {perfumeName}
              </p>
              <p style={{ ...FONT_DATA, fontSize: '11px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.8, letterSpacing: '0.05em' }}>
                {concept.description}
              </p>
              <p style={{ ...FONT_DATA, fontSize: '10px', color: 'rgba(255,255,255,0.30)', lineHeight: 1.65, marginTop: 6, fontStyle: 'italic' }}>
                {concept.descriptionEn}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span style={{
                  ...FONT_DATA, fontSize: '8px', letterSpacing: '0.2em',
                  color: 'var(--gold)', background: 'rgba(201,169,110,0.12)',
                  border: '1px solid rgba(201,169,110,0.25)', borderRadius: '2px', padding: '2px 8px',
                }}>
                  {concept.dominantMood.toUpperCase()}
                </span>
                {concept.philosophy?.movementName && (
                  <span style={{ ...FONT_DATA, fontSize: '8px', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.14em', fontStyle: 'italic' }}>
                    {concept.philosophy.movementName}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

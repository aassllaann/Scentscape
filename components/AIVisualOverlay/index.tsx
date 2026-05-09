'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIVisualConcept, AIVisualRender } from '@/lib/types';
import type { VisualizePhase } from '@/hooks/useAIVisualize';

interface Props {
  phase: VisualizePhase;
  concept: AIVisualConcept | null;
  render: AIVisualRender | null;
  perfumeName: string;
  onClose: () => void;
}

const FONT_DATA: React.CSSProperties = { fontFamily: 'var(--font-data)', letterSpacing: '0.12em' };
const FONT_DISPLAY: React.CSSProperties = { fontFamily: 'var(--font-display)', fontStyle: 'italic' };

// ── Hex → RGB ─────────────────────────────────────────────────────────────────
function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ── Speed multiplier ──────────────────────────────────────────────────────────
function speedFactor(s: 'slow' | 'medium' | 'fast') {
  return s === 'slow' ? 0.35 : s === 'fast' ? 1.8 : 1.0;
}

// ── Density count ─────────────────────────────────────────────────────────────
function densityCount(d: 'sparse' | 'medium' | 'dense', base: number) {
  return Math.round(base * (d === 'sparse' ? 0.45 : d === 'dense' ? 1.8 : 1.0));
}

// ── Preview Canvas: renders a dynamic animation from concept hints ────────────
function PreviewCanvas({ concept }: { concept: AIVisualConcept }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startAnimation = useCallback((canvas: HTMLCanvasElement, concept: AIVisualConcept) => {
    const ctx = canvas.getContext('2d')!;
    const { technique, speed, density } = concept.canvasHints;
    const colors = concept.palette.map((p) => p.hex);
    const sf = speedFactor(speed);
    let frameId = 0;
    let t = 0;

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ── particles ──────────────────────────────────────────────────────────────
    if (technique === 'particles') {
      const count = densityCount(density, 80);
      const particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1.5 + Math.random() * 4,
        vx: (Math.random() - 0.5) * sf,
        vy: (Math.random() - 0.5) * sf,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: Math.random(),
        dLife: (0.003 + Math.random() * 0.005) * sf,
      }));

      function draw() {
        ctx.fillStyle = 'rgba(7,7,15,0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy; p.life += p.dLife;
          if (p.life > 1) { p.life = 0; p.x = Math.random() * canvas.width; p.y = Math.random() * canvas.height; }
          const opacity = Math.sin(p.life * Math.PI);
          const [r, g, b] = hexRgb(p.color);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.shadowColor = p.color; ctx.shadowBlur = p.r * 4;
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity * 0.85})`;
          ctx.fill();
          ctx.shadowBlur = 0;
          if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        }
        t += 0.008 * sf;
        frameId = requestAnimationFrame(draw);
      }
      draw();
    }

    // ── waves ─────────────────────────────────────────────────────────────────
    else if (technique === 'waves') {
      const bands = densityCount(density, 6);

      function draw() {
        ctx.fillStyle = 'rgba(7,7,15,0.25)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < bands; i++) {
          const color = colors[i % colors.length];
          const [r, g, b] = hexRgb(color);
          const phase = (i / bands) * Math.PI * 2;
          const freq  = 0.004 + i * 0.001;
          const amp   = (canvas.height * 0.06) + i * 8;
          const yBase = canvas.height * (0.2 + (i / bands) * 0.65);
          const opacity = 0.12 + (i % 2) * 0.08;
          ctx.beginPath();
          ctx.moveTo(0, yBase);
          for (let x = 0; x <= canvas.width; x += 3) {
            const y = yBase + Math.sin(x * freq + t * sf + phase) * amp
                             + Math.sin(x * freq * 1.7 + t * sf * 0.6 + phase) * amp * 0.4;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(canvas.width, canvas.height);
          ctx.lineTo(0, canvas.height);
          ctx.closePath();
          ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
          ctx.fill();
        }
        t += 0.012 * sf;
        frameId = requestAnimationFrame(draw);
      }
      draw();
    }

    // ── aurora ────────────────────────────────────────────────────────────────
    else if (technique === 'aurora') {
      const bands = densityCount(density, 5);

      function draw() {
        ctx.fillStyle = 'rgba(7,7,15,0.12)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < bands; i++) {
          const color = colors[i % colors.length];
          const [r, g, b] = hexRgb(color);
          const yCenter = canvas.height * (0.15 + (i / bands) * 0.6);
          const amp = canvas.height * (0.06 + Math.sin(t * 0.3 + i) * 0.03);
          const grad = ctx.createLinearGradient(0, yCenter - amp * 2, 0, yCenter + amp * 2);
          grad.addColorStop(0,   `rgba(${r},${g},${b},0)`);
          grad.addColorStop(0.4, `rgba(${r},${g},${b},0.18)`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b},0.28)`);
          grad.addColorStop(0.6, `rgba(${r},${g},${b},0.18)`);
          grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.moveTo(0, yCenter);
          for (let x = 0; x <= canvas.width; x += 4) {
            const turbulence = Math.sin(x * 0.003 + t * sf + i * 1.3)
                             + Math.sin(x * 0.007 + t * sf * 0.7 + i) * 0.4;
            ctx.lineTo(x, yCenter + turbulence * amp);
          }
          ctx.lineTo(canvas.width, yCenter + amp * 2);
          ctx.lineTo(0, yCenter + amp * 2);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }
        t += 0.006 * sf;
        frameId = requestAnimationFrame(draw);
      }
      draw();
    }

    // ── smoke ─────────────────────────────────────────────────────────────────
    else if (technique === 'smoke') {
      const layers = densityCount(density, 7);
      type Puff = { x: number; y: number; radius: number; opacity: number; vx: number; vy: number; color: string };
      const puffs: Puff[] = Array.from({ length: layers * 3 }, (_, i) => ({
        x: canvas.width * (0.2 + Math.random() * 0.6),
        y: canvas.height * (0.5 + Math.random() * 0.5),
        radius: 40 + Math.random() * 80,
        opacity: 0.04 + Math.random() * 0.06,
        vx: (Math.random() - 0.5) * 0.3 * sf,
        vy: -(0.3 + Math.random() * 0.5) * sf,
        color: colors[i % colors.length],
      }));

      function draw() {
        ctx.fillStyle = 'rgba(7,7,15,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const p of puffs) {
          p.x += p.vx + Math.sin(t * 0.5 + p.y * 0.01) * 0.4;
          p.y += p.vy;
          p.radius += 0.2 * sf;
          p.opacity -= 0.0003 * sf;
          if (p.opacity <= 0 || p.y < -p.radius) {
            p.x = canvas.width * (0.2 + Math.random() * 0.6);
            p.y = canvas.height + p.radius;
            p.radius = 40 + Math.random() * 60;
            p.opacity = 0.04 + Math.random() * 0.05;
          }
          const [r, g, b] = hexRgb(p.color);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0,   `rgba(${r},${g},${b},${p.opacity})`);
          grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
        t += 0.01 * sf;
        frameId = requestAnimationFrame(draw);
      }
      draw();
    }

    // ── crystals ──────────────────────────────────────────────────────────────
    else if (technique === 'crystals') {
      const count = densityCount(density, 12);
      type Crystal = { x: number; y: number; size: number; angle: number; dAngle: number; color: string; opacity: number };
      const crystals: Crystal[] = Array.from({ length: count }, (_, i) => ({
        x: canvas.width  * (0.1 + Math.random() * 0.8),
        y: canvas.height * (0.1 + Math.random() * 0.8),
        size: 20 + Math.random() * 60,
        angle: Math.random() * Math.PI * 2,
        dAngle: (Math.random() - 0.5) * 0.008 * sf,
        color: colors[i % colors.length],
        opacity: 0.08 + Math.random() * 0.15,
      }));

      function drawPoly(x: number, y: number, sides: number, size: number, angle: number) {
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = angle + (i / sides) * Math.PI * 2;
          const px = x + Math.cos(a) * size;
          const py = y + Math.sin(a) * size;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
      }

      function draw() {
        ctx.fillStyle = 'rgba(7,7,15,0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const c of crystals) {
          c.angle += c.dAngle;
          const [r, g, b] = hexRgb(c.color);
          const pulse = 0.8 + 0.2 * Math.sin(t * sf * 1.2 + c.x * 0.01);
          ctx.save();
          drawPoly(c.x, c.y, 6, c.size * pulse, c.angle);
          ctx.fillStyle = `rgba(${r},${g},${b},${c.opacity})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${r},${g},${b},${c.opacity * 1.5})`;
          ctx.lineWidth = 1;
          ctx.stroke();
          // inner facet
          drawPoly(c.x, c.y, 6, c.size * 0.45 * pulse, c.angle + 0.5);
          ctx.fillStyle = `rgba(${r},${g},${b},${c.opacity * 0.6})`;
          ctx.fill();
          ctx.restore();
        }
        t += 0.01 * sf;
        frameId = requestAnimationFrame(draw);
      }
      draw();
    }

    // ── organic (default) ─────────────────────────────────────────────────────
    else {
      const blobs = densityCount(density, 5);
      type Blob = { x: number; y: number; r: number; phase: number; color: string };
      const blobArr: Blob[] = Array.from({ length: blobs }, (_, i) => ({
        x: canvas.width  * (0.15 + (i / blobs) * 0.7),
        y: canvas.height * (0.2  + Math.random() * 0.6),
        r: (Math.min(canvas.width, canvas.height) * 0.15) + Math.random() * 80,
        phase: Math.random() * Math.PI * 2,
        color: colors[i % colors.length],
      }));

      function draw() {
        ctx.fillStyle = 'rgba(7,7,15,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (const b of blobArr) {
          const [r, g, b2] = hexRgb(b.color);
          const wobble = 1 + 0.12 * Math.sin(t * sf + b.phase);
          const cx = b.x + 20 * Math.sin(t * sf * 0.4 + b.phase);
          const cy = b.y + 15 * Math.cos(t * sf * 0.3 + b.phase * 1.3);
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * wobble);
          grad.addColorStop(0,   `rgba(${r},${g},${b2},0.14)`);
          grad.addColorStop(0.5, `rgba(${r},${g},${b2},0.06)`);
          grad.addColorStop(1,   `rgba(${r},${g},${b2},0)`);
          ctx.beginPath();
          ctx.arc(cx, cy, b.r * wobble, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
        t += 0.008 * sf;
        frameId = requestAnimationFrame(draw);
      }
      draw();
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return startAnimation(canvas, concept);
  }, [concept, startAnimation]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export default function AIVisualOverlay({ phase, concept, render, perfumeName, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isLoading = phase === 'conceiving' || phase === 'concept-ready' || phase === 'rendering';

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ background: '#07070f' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Layer 1: Built-in dynamic canvas (plays as soon as concept is ready) */}
      <AnimatePresence>
        {concept && !render && (
          <motion.div
            key="preview-canvas"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
          >
            <PreviewCanvas concept={concept} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layer 2: AI-generated iframe (fades in over preview canvas) */}
      <AnimatePresence>
        {render && (
          <motion.iframe
            key="canvas-iframe"
            srcDoc={render.html}
            sandbox="allow-scripts"
            className="absolute inset-0 w-full h-full border-0"
            title="AI Fragrance Visualization"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          />
        )}
      </AnimatePresence>

      {/* HUD layer */}
      <div className="absolute inset-0 flex flex-col justify-between p-8" style={{ pointerEvents: 'none' }}>

        {/* Top-right: close */}
        <div className="flex justify-end" style={{ pointerEvents: 'auto' }}>
          <button
            onClick={onClose}
            style={{
              ...FONT_DATA,
              fontSize: '16px',
              color: 'rgba(245,240,232,0.55)',
              background: 'rgba(7,7,15,0.5)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '3px',
              width: 32, height: 32,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(245,240,232,0.9)'; e.currentTarget.style.background = 'rgba(7,7,15,0.8)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(245,240,232,0.55)'; e.currentTarget.style.background = 'rgba(7,7,15,0.5)'; }}
          >
            ×
          </button>
        </div>

        {/* Center spinner (only while conceiving, before any visual) */}
        {phase === 'conceiving' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ pointerEvents: 'none' }}>
            <span className="ai-spinner-lg" />
            <p style={{ ...FONT_DATA, fontSize: '9px', color: 'var(--gold)', letterSpacing: '0.25em' }}>
              ANALYSE DES NOTES OLFACTIVES…
            </p>
          </div>
        )}

        {/* Bottom: info panel */}
        <AnimatePresence>
          {concept && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.5 }}
              style={{
                background: 'rgba(7,7,15,0.72)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '4px',
                padding: '18px 22px',
              }}
            >
              {/* Palette dots */}
              <div className="flex items-center gap-2 mb-4">
                {concept.palette.map((p) => (
                  <div
                    key={p.hex}
                    title={p.label}
                    style={{
                      width: 8, height: 8,
                      borderRadius: '50%',
                      background: p.hex,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${p.hex}88`,
                    }}
                  />
                ))}
                {isLoading && <span className="ai-spinner" style={{ marginLeft: 8 }} />}
                {isLoading && (
                  <span style={{ ...FONT_DATA, fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                    {phase === 'rendering' ? 'GÉNÉRATION VISUELLE…' : 'TRAITEMENT…'}
                  </span>
                )}
              </div>

              <p style={{ ...FONT_DISPLAY, fontSize: '17px', color: 'rgba(245,240,232,0.88)', marginBottom: 8, lineHeight: 1.3 }}>
                {perfumeName}
              </p>
              <p style={{ ...FONT_DATA, fontSize: '11px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.75, letterSpacing: '0.05em' }}>
                {concept.description}
              </p>
              <p style={{ ...FONT_DATA, fontSize: '10px', color: 'rgba(245,240,232,0.28)', lineHeight: 1.65, marginTop: 6, fontStyle: 'italic' }}>
                {concept.descriptionEn}
              </p>

              <div className="mt-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  ...FONT_DATA, fontSize: '8px', letterSpacing: '0.2em',
                  color: 'var(--gold)', background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.2)', borderRadius: '2px', padding: '2px 8px',
                }}>
                  {concept.dominantMood.toUpperCase()}
                </span>
                <span style={{ ...FONT_DATA, fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
                  {concept.canvasHints.technique.toUpperCase()}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

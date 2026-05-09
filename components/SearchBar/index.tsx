'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Perfume } from '@/lib/types';
import { useAppDispatch } from '@/lib/store';
import { FAMILY_LABELS } from '@/components/FragranceWheel/useFragranceWheel';

interface Props {
  perfumes: Perfume[];
}

export default function SearchBar({ perfumes }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length > 0
    ? perfumes.filter((p) => {
        const q = query.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      }).slice(0, 7)
    : [];

  const selectPerfume = useCallback(
    (perfume: Perfume) => {
      dispatch({ type: 'SET_PERFUME', payload: perfume });
      dispatch({ type: 'SET_FAMILY', payload: perfume.fragranceFamily });
      setQuery('');
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [dispatch]
  );

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); selectPerfume(results[activeIndex]); }
    else if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIndex(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="按名称或品牌搜索…"
          className="w-full outline-none"
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: '12px',
            color: 'var(--text-primary)',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            padding: '9px 36px 9px 14px',
            letterSpacing: '0.04em',
            transition: 'border-color 0.2s ease, background 0.2s ease',
          }}
          onFocusCapture={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--gold-dim)';
            (e.target as HTMLInputElement).style.background = 'rgba(201,169,110,0.06)';
          }}
          onBlurCapture={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--glass-border)';
            (e.target as HTMLInputElement).style.background = 'var(--glass)';
          }}
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ color: 'var(--gold-dim)', fontSize: '14px', opacity: 0.7 }}
        >
          ✦
        </span>
      </div>

      {isOpen && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 overflow-hidden z-40"
          style={{
            background: 'rgba(7,7,15,0.96)',
            border: '1px solid var(--glass-border)',
            borderRadius: '6px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          {results.map((perfume, i) => (
            <button
              key={perfume.id}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
              style={{
                background: i === activeIndex ? 'rgba(201,169,110,0.08)' : 'transparent',
                borderBottom: i < results.length - 1 ? '1px solid var(--glass-border)' : 'none',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => { e.preventDefault(); selectPerfume(perfume); }}
            >
              <div className="min-w-0">
                <div
                  className="truncate"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontStyle: 'italic', color: 'var(--text-primary)' }}
                >
                  {perfume.name}
                </div>
                <div className="label-caps mt-0.5" style={{ letterSpacing: '0.14em' }}>
                  {perfume.brand}
                </div>
              </div>
              <div
                className="ml-3 flex-shrink-0 px-2 py-0.5 rounded"
                style={{
                  background: 'var(--gold-faint)',
                  border: '1px solid rgba(201,169,110,0.2)',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-data)',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                }}
              >
                {FAMILY_LABELS[perfume.fragranceFamily] ?? perfume.fragranceFamily}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Perfume } from '@/lib/types';
import { useAppDispatch } from '@/lib/store';

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
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
        );
      }).slice(0, 8)
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

  // 点击外部关闭
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

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectPerfume(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="搜索香水名称或品牌…"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none text-white/90 placeholder:text-white/30"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
          ⌕
        </span>
      </div>

      {/* 下拉结果 */}
      {isOpen && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-40"
          style={{
            background: 'rgba(15,15,20,0.92)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {results.map((perfume, i) => (
            <button
              key={perfume.id}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
              style={{
                background: i === activeIndex ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectPerfume(perfume);
              }}
            >
              <div>
                <div className="text-sm text-white/90 font-medium">{perfume.name}</div>
                <div className="text-xs text-white/40">{perfume.brand}</div>
              </div>
              <span className="text-[10px] text-white/30 ml-2 flex-shrink-0">
                {perfume.fragranceFamily}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

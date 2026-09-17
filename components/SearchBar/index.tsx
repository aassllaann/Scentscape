'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Perfume } from '@/lib/types';
import { useAppDispatch } from '@/lib/store';
import { FAMILY_LABELS } from '@/lib/fragranceData';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
type SearchPage = { total: number; items: Perfume[]; hasMore: boolean };

const QUICK_LIMIT = 7;
const PAGE_SIZE = 40;

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [results, setResults] = useState<Perfume[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (term: string, offset = 0, append = false, limit = QUICK_LIMIT) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setIsOpen(true);

    try {
      const response = await fetch(`/api/perfumes?q=${encodeURIComponent(term)}&offset=${offset}&limit=${limit}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Search request failed');
      const page = await response.json() as SearchPage;
      setResults((current) => append
        ? Array.from(new Map([...current, ...page.items].map((item) => [item.id, item])).values())
        : page.items);
      setTotal(page.total);
      setHasMore(page.hasMore);
      setStatus('success');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setStatus('error');
    }
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (!term) return;
    const timer = setTimeout(() => void search(term), 200);
    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, search]);

  const selectPerfume = useCallback((perfume: Perfume) => {
    dispatch({ type: 'SET_PERFUME', payload: perfume });
    dispatch({ type: 'SET_FAMILY', payload: perfume.fragranceFamily });
    setQuery('');
    setIsOpen(false);
    setActiveIndex(-1);
    setResults([]);
  }, [dispatch]);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectPerfume(results[activeIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="search"
          value={query}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="perfume-search-results"
          aria-activedescendant={activeIndex >= 0 ? `perfume-result-${results[activeIndex]?.id}` : undefined}
          aria-autocomplete="list"
          onChange={(event) => {
            const value = event.target.value;
            abortRef.current?.abort();
            setQuery(value);
            setActiveIndex(-1);
            setShowAll(false);
            setStatus(value.trim() ? 'loading' : 'idle');
            setIsOpen(Boolean(value.trim()));
            if (!value.trim()) { setResults([]); setTotal(0); setHasMore(false); }
          }}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="按名称或品牌搜索…"
          className="w-full outline-none"
          style={{
            fontFamily: 'var(--font-data)', fontSize: '16px', color: 'var(--text-primary)',
            background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '6px',
            padding: '12px 42px 12px 16px', letterSpacing: '0.04em',
            transition: 'border-color 0.2s ease, background 0.2s ease',
          }}
          onFocusCapture={(event) => {
            event.currentTarget.style.borderColor = 'var(--gold-dim)';
            event.currentTarget.style.background = 'rgba(201,169,110,0.06)';
          }}
          onBlurCapture={(event) => {
            event.currentTarget.style.borderColor = 'var(--glass-border)';
            event.currentTarget.style.background = 'var(--glass)';
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ color: 'var(--gold-dim)', fontSize: '14px', opacity: 0.7 }}>✦</span>
      </div>

      {isOpen && (
        <div id="perfume-search-results" role="listbox" aria-label="Perfume search results" className="absolute top-full left-0 right-0 mt-1 overflow-y-auto z-40" style={{ maxHeight: 'min(70vh, 560px)', background: 'rgba(250,247,241,0.97)', border: '1px solid var(--glass-border)', borderRadius: '6px', backdropFilter: 'blur(20px)', boxShadow: '0 18px 48px rgba(75,60,43,0.16)' }}>
          {status === 'loading' && !results.length && <SearchMessage>正在搜索…</SearchMessage>}
          {status === 'error' && <SearchMessage>搜索暂时不可用。<button type="button" className="result-action" onClick={() => void search(query.trim(), 0, false, showAll ? PAGE_SIZE : QUICK_LIMIT)}>重试</button></SearchMessage>}
          {status === 'success' && !results.length && <SearchMessage>没有找到匹配的香水。</SearchMessage>}

          {results.map((perfume, index) => (
            <button
              id={`perfume-result-${perfume.id}`}
              role="option"
              aria-selected={index === activeIndex}
              key={perfume.id}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors"
              style={{ background: index === activeIndex ? 'var(--gold-faint)' : 'transparent', borderBottom: '1px solid var(--glass-border)' }}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => { event.preventDefault(); selectPerfume(perfume); }}
            >
              <div className="min-w-0">
                <div className="truncate" style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontStyle: 'italic', color: 'var(--text-primary)' }}>{perfume.name}</div>
                <div className="label-caps mt-0.5" style={{ letterSpacing: '0.14em' }}>{perfume.brand}</div>
              </div>
              <div className="ml-3 flex-shrink-0 px-2 py-0.5 rounded" style={{ background: 'var(--gold-faint)', border: '1px solid var(--glass-border)', color: 'var(--gold)', fontFamily: 'var(--font-data)', fontSize: '9px', letterSpacing: '0.12em' }}>
                {FAMILY_LABELS[perfume.fragranceFamily] ?? perfume.fragranceFamily}
              </div>
            </button>
          ))}

          {status === 'success' && total > results.length && !showAll && (
            <button type="button" className="result-action w-full" onMouseDown={(event) => event.preventDefault()} onClick={() => { setShowAll(true); void search(query.trim(), 0, false, PAGE_SIZE); }}>
              查看全部 {total.toLocaleString()} 条结果
            </button>
          )}
          {status === 'success' && showAll && hasMore && (
            <button type="button" className="result-action w-full" onMouseDown={(event) => event.preventDefault()} onClick={() => void search(query.trim(), results.length, true, PAGE_SIZE)}>
              加载更多 · 已显示 {results.length.toLocaleString()} / {total.toLocaleString()}
            </button>
          )}
          {status === 'loading' && results.length > 0 && <SearchMessage>正在加载更多…</SearchMessage>}
        </div>
      )}
    </div>
  );
}

function SearchMessage({ children }: { children: React.ReactNode }) {
  return <div className="search-message">{children}</div>;
}

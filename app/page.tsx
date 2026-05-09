'use client';

import FragranceWheel from '@/components/FragranceWheel';
import PerfumeDetail from '@/components/PerfumeDetail';
import SearchBar from '@/components/SearchBar';
import perfumesData from '@/data/perfumes.json';
import type { Perfume } from '@/lib/types';

const perfumes = perfumesData as unknown as Perfume[];

export default function Home() {
  return (
    <div className="flex h-full overflow-hidden">
      {/* 左列：标题 + 搜索 + 香调轮 */}
      <div className="flex flex-col flex-1 px-6 py-5 gap-4 min-w-0">

        {/* 标题组 */}
        <header className="flex-shrink-0 flex items-end justify-between">
          <div>
            <h1
              className="font-display leading-none tracking-wide"
              style={{ fontSize: '2.2rem', fontStyle: 'italic', color: 'var(--text-primary)' }}
            >
              Scentscape
            </h1>
            <p className="label-caps mt-1.5" style={{ letterSpacing: '0.22em' }}>
              Olfactory Atlas · {perfumes.length.toLocaleString()} fragrances
            </p>
          </div>

          {/* 装饰刻度线 */}
          <div className="flex items-end gap-0.5 pb-1 opacity-20">
            {[16,10,14,8,12,6,10].map((h, i) => (
              <div
                key={i}
                className="w-px rounded-full"
                style={{ height: h, background: 'var(--gold)' }}
              />
            ))}
          </div>
        </header>

        {/* 黄金分割线 */}
        <div className="flex-shrink-0 h-px" style={{ background: 'var(--glass-border)' }} />

        {/* 搜索栏 */}
        <div className="flex-shrink-0">
          <SearchBar perfumes={perfumes} />
        </div>

        {/* 香调轮 */}
        <FragranceWheel perfumes={perfumes} />
      </div>

      {/* 右侧详情面板 */}
      <PerfumeDetail perfumes={perfumes} />
    </div>
  );
}

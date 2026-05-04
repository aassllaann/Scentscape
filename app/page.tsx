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
      {/* 左列：搜索 + 香调轮 */}
      <div className="flex flex-col flex-1 p-5 gap-4 min-w-0">
        {/* 标题 */}
        <div className="flex-shrink-0">
          <h1 className="text-white/90 text-lg font-bold tracking-wide">Scentscape</h1>
          <p className="text-white/40 text-xs mt-0.5">将嗅觉体验转化为可见的视觉语言</p>
        </div>

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

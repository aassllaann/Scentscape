// Server-only utility — loads and caches perfume data in memory.
// Never import this from client components.
import path from 'path';
import fs from 'fs';
import type { Perfume } from './types';
import { FAMILY_ORDER, SUBFAMILIES } from './fragranceData';

let _cache: Perfume[] | null = null;

export function getPerfumes(): Perfume[] {
  if (!_cache) {
    const filePath = path.join(process.cwd(), 'data', 'perfumes.json');
    _cache = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Perfume[];
  }
  return _cache;
}

export type SlimPreview = { id: string; name: string; brand: string };

let _previews: { family: Record<string, SlimPreview[]>; subfamily: Record<string, SlimPreview[]> } | null = null;

export function getPreviews() {
  if (!_previews) {
    const perfumes = getPerfumes();
    const family: Record<string, SlimPreview[]> = {};
    const subfamily: Record<string, SlimPreview[]> = {};

    for (const fam of FAMILY_ORDER) {
      family[fam] = perfumes
        .filter((p) => p.fragranceFamily === fam)
        .slice(0, 3)
        .map(({ id, name, brand }) => ({ id, name, brand }));
    }

    for (const subs of Object.values(SUBFAMILIES)) {
      for (const sub of subs) {
        subfamily[sub.id] = perfumes
          .filter((p) => p.subfamilyId === sub.id)
          .slice(0, 3)
          .map(({ id, name, brand }) => ({ id, name, brand }));
      }
    }

    _previews = { family, subfamily };
  }
  return _previews;
}

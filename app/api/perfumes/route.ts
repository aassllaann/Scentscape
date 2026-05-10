import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPerfumes } from '@/lib/perfumeServer';

export const runtime = 'nodejs';

const LIST_LIMIT = 120;
const SEARCH_LIMIT = 7;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q         = searchParams.get('q');
  const family    = searchParams.get('family');
  const subfamily = searchParams.get('subfamily');

  const perfumes = getPerfumes();

  // Search by name / brand
  if (q !== null) {
    const query = q.toLowerCase().trim();
    if (!query) return NextResponse.json([]);
    const results = perfumes
      .filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      )
      .slice(0, SEARCH_LIMIT);
    return NextResponse.json(results);
  }

  // Subfamily listing
  if (subfamily) {
    const all = perfumes.filter((p) => p.subfamilyId === subfamily);
    return NextResponse.json({ total: all.length, items: all.slice(0, LIST_LIMIT) });
  }

  // Family listing
  if (family) {
    const all = perfumes.filter((p) => p.fragranceFamily === family);
    return NextResponse.json({ total: all.length, items: all.slice(0, LIST_LIMIT) });
  }

  return NextResponse.json({ error: 'Provide q, family, or subfamily param' }, { status: 400 });
}

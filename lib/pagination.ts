export const PAGE_SIZE = 40;
export const MAX_PAGE_SIZE = 120;

function readInteger(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export function paginate<T>(items: T[], searchParams: URLSearchParams, defaultLimit = PAGE_SIZE) {
  const offset = readInteger(searchParams.get('offset'), 0, 0, items.length);
  const limit = readInteger(searchParams.get('limit'), defaultLimit, 1, MAX_PAGE_SIZE);
  const pageItems = items.slice(offset, offset + limit);

  return {
    total: items.length,
    items: pageItems,
    offset,
    limit,
    hasMore: offset + pageItems.length < items.length,
  };
}

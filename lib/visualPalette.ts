import type { AIColorStop } from './types';

const HEX = /^#[0-9A-F]{6}$/;

function canonicalHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hex = value.toUpperCase();
  return HEX.test(hex) ? hex : null;
}

function mixHex(from: string, to: string, amount: number): string {
  const channels = (hex: string) => hex.slice(1).match(/../g)!.map((part) => parseInt(part, 16));
  return `#${channels(from).map((value, index) =>
    Math.round(value + (channels(to)[index] - value) * amount).toString(16).padStart(2, '0')
  ).join('')}`.toUpperCase();
}

export function createFallbackPalette(baseHex = '#A38CB9'): AIColorStop[] {
  const base = canonicalHex(baseHex) ?? '#A38CB9';
  return [
    { hex: base, label: 'family core', weight: 0.5 },
    { hex: mixHex(base, '#FFF8EC', 0.42), label: 'luminous veil', weight: 0.3 },
    { hex: mixHex(base, '#3B3028', 0.35), label: 'dry-down shadow', weight: 0.2 },
  ];
}

export function normalizePalette(value: unknown, fallback: AIColorStop[]): AIColorStop[] {
  const colors = new Map<string, AIColorStop>();

  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object') continue;
      const color = item as Record<string, unknown>;
      const hex = canonicalHex(color.hex);
      const weight = Number(color.weight);
      if (!hex || !Number.isFinite(weight) || weight <= 0) continue;

      const existing = colors.get(hex);
      if (existing) {
        existing.weight += weight;
      } else {
        colors.set(hex, {
          hex,
          label: typeof color.label === 'string' && color.label.trim() ? color.label.trim() : 'olfactory color',
          weight,
        });
      }
    }
  }

  const palette = [...colors.values()].slice(0, 7);
  const usable = palette.length >= 3 ? palette : fallback;
  const total = usable.reduce((sum, color) => sum + color.weight, 0);
  return usable.map((color) => ({ ...color, weight: color.weight / total }));
}

export function normalizeLayerColors(value: unknown, palette: AIColorStop[], fallback: string[]): string[] {
  const paletteColors = new Map(palette.map((color) => [color.hex.toUpperCase(), color.hex]));
  const colors = Array.isArray(value)
    ? value.map(canonicalHex).filter((hex): hex is string => !!hex && paletteColors.has(hex))
    : [];
  return [...new Set(colors.length ? colors : fallback)];
}

export function allocatePaletteColors(palette: AIColorStop[], total = 9): AIColorStop[] {
  if (total <= 0 || palette.length === 0) return [];

  const colors = [...palette].sort((a, b) => b.weight - a.weight).slice(0, total);
  const counts = colors.map(() => 1);
  const remaining = total - colors.length;
  const weightTotal = colors.reduce((sum, color) => sum + color.weight, 0);
  const shares = colors.map((color) => remaining * color.weight / weightTotal);

  shares.forEach((share, index) => { counts[index] += Math.floor(share); });
  const left = total - counts.reduce((sum, count) => sum + count, 0);
  const remainderOrder = shares
    .map((share, index) => ({ index, remainder: share - Math.floor(share), weight: colors[index].weight }))
    .sort((a, b) => b.remainder - a.remainder || b.weight - a.weight);

  for (let index = 0; index < left; index++) counts[remainderOrder[index].index]++;
  return colors.flatMap((color, index) => Array.from({ length: counts[index] }, () => color));
}

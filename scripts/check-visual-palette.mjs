import assert from 'node:assert/strict';
import {
  allocatePaletteColors,
  createFallbackPalette,
  normalizePalette,
} from '../lib/visualPalette.ts';

const palette = normalizePalette([
  { hex: '#AABBCC', label: 'dominant', weight: 0.5 },
  { hex: '#aabbcc', label: 'duplicate', weight: 0.1 },
  { hex: '#CC8844', label: 'support', weight: 0.3 },
  { hex: '#774466', label: 'accent', weight: 0.1 },
  { hex: 'invalid', label: 'invalid', weight: 1 },
], createFallbackPalette());

assert.equal(palette.length, 3);
assert.ok(Math.abs(palette.reduce((sum, color) => sum + color.weight, 0) - 1) < 1e-9);

const allocation = allocatePaletteColors(palette, 9);
assert.equal(allocation.length, 9);
assert.equal(new Set(allocation.map((color) => color.hex)).size, 3);
assert.ok(allocation.filter((color) => color.hex === '#AABBCC').length > allocation.filter((color) => color.hex === '#774466').length);

console.log('Visual palette checks passed.');

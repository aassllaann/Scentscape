import assert from 'node:assert/strict';
import { paginate } from '../lib/pagination.ts';

const records = Array.from({ length: 95 }, (_, id) => id);
const first = paginate(records, new URLSearchParams('limit=40'));
const last = paginate(records, new URLSearchParams('offset=80&limit=40'));
const invalid = paginate(records, new URLSearchParams('offset=-4&limit=999'));
const defaultPage = paginate(records, new URLSearchParams());

assert.deepEqual(first.items, records.slice(0, 40));
assert.equal(first.hasMore, true);
assert.deepEqual(last.items, records.slice(80));
assert.equal(last.hasMore, false);
assert.equal(invalid.offset, 0);
assert.equal(invalid.limit, 120);
assert.equal(defaultPage.items.length, 40);

console.log('Pagination check passed.');

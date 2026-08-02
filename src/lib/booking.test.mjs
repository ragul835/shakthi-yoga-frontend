import assert from 'node:assert/strict';
import test from 'node:test';
import { isClassFull } from './booking.ts';

test('treats a group class at capacity as full', () => {
  assert.equal(isClassFull({ type: 'GROUP', status: 'ACTIVE', currentEnrollment: 10, maxCapacity: 10 }), true);
  assert.equal(isClassFull({ type: 'GROUP', status: 'ACTIVE', currentEnrollment: 9, maxCapacity: 10 }), false);
});

test('honors an explicit full status', () => {
  assert.equal(isClassFull({ type: 'ONE_ON_ONE', status: 'FULL' }), true);
});

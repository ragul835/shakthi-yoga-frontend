import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserPassStatus } from './pass.ts';

const now = new Date('2026-08-02T00:00:00.000Z');

test('marks a zero-balance class pass as completed', () => {
  assert.equal(getUserPassStatus({ remainingClasses: 0, expiresAt: null, isActive: false }, now), 'completed');
});

test('distinguishes active and expired passes', () => {
  assert.equal(getUserPassStatus({ remainingClasses: 2, expiresAt: '2026-08-10T00:00:00.000Z', isActive: true }, now), 'active');
  assert.equal(getUserPassStatus({ remainingClasses: 2, expiresAt: '2026-08-01T00:00:00.000Z', isActive: true }, now), 'expired');
});

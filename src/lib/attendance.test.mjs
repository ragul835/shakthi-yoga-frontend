import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatAttendanceDate,
  getLocalDateInputValue,
  getMakeupCreditExpiry,
  getMakeupCreditStatus,
  isMakeupCreditAvailable,
  mergeAttendanceRecords,
} from './attendance.ts';

test('merges saved attendance with every enrolled student', () => {
  const result = mergeAttendanceRecords(
    [{ enrollmentId: 'one', attended: true, enrollment: { user: { name: 'Ada', email: 'ada@example.com' } } }],
    [
      { id: 'one', user: { name: 'Ada', email: 'ada@example.com' } },
      { id: 'two', user: { name: 'Grace', email: 'grace@example.com' } },
    ],
  );

  assert.deepEqual(result, [
    { enrollmentId: 'one', studentName: 'Ada', studentEmail: 'ada@example.com', attended: true },
    { enrollmentId: 'two', studentName: 'Grace', studentEmail: 'grace@example.com', attended: null },
  ]);
});

test('preserves saved records when enrollment data is incomplete', () => {
  const result = mergeAttendanceRecords(
    [{ enrollmentId: 'one', attended: false, enrollment: { user: { name: 'Ada', email: 'ada@example.com' } } }],
    [],
  );

  assert.equal(result[0]?.studentName, 'Ada');
  assert.equal(result[0]?.attended, false);
});

test('formats a date using local calendar fields', () => {
  const localDate = new Date(2026, 0, 2, 23, 30);
  assert.equal(getLocalDateInputValue(localDate), '2026-01-02');
});

test('displays stored attendance dates without a timezone day shift', () => {
  assert.equal(formatAttendanceDate('2026-01-02T00:00:00.000Z'), 'Jan 2, 2026');
});

test('makeup credits expire exactly 30 days after the missed session', () => {
  const credit = { id: 'credit', sessionDate: '2026-07-01T00:00:00.000Z', attended: false, makeupUsed: false };
  assert.equal(getMakeupCreditExpiry(credit.sessionDate)?.toISOString(), '2026-07-31T00:00:00.000Z');
  assert.equal(isMakeupCreditAvailable(credit, new Date('2026-07-30T23:59:59.000Z')), true);
  assert.equal(isMakeupCreditAvailable(credit, new Date('2026-07-31T00:00:01.000Z')), false);
});

test('reports available, used, expired, and non-applicable credit history states', () => {
  const now = new Date('2026-08-02T00:00:00.000Z');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-07-20T00:00:00.000Z', attended: false, makeupUsed: false }, now), 'available');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-07-20T00:00:00.000Z', attended: false, makeupUsed: true }, now), 'used');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-06-01T00:00:00.000Z', attended: false, makeupUsed: false }, now), 'expired');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-07-20T00:00:00.000Z', attended: true, makeupUsed: false }, now), 'not-applicable');
});

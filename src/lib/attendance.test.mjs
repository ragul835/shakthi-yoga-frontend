import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatAttendanceDate,
  getLocalDateInputValue,
  getMakeupCreditExpiry,
  getMakeupCreditStatus,
  getAvailableMakeupCredits,
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

test('makeup credits remain valid through the end of the absence calendar month', () => {
  const credit = { id: 'credit', sessionDate: '2026-08-05T00:00:00.000Z', attended: false, makeupUsed: false };
  assert.equal(getMakeupCreditExpiry(credit.sessionDate)?.toISOString(), '2026-08-31T23:59:59.999Z');
  assert.equal(isMakeupCreditAvailable(credit, new Date('2026-08-31T23:59:59.999Z')), true);
  assert.equal(isMakeupCreditAvailable(credit, new Date('2026-09-01T00:00:00.000Z')), false);
});

test('used, attended, and expired makeup credits cannot be booked', () => {
  const now = new Date('2026-08-06T12:00:00.000Z');
  assert.equal(isMakeupCreditAvailable({ id: 'used', sessionDate: '2026-08-05T00:00:00.000Z', makeupUsed: true }, now), false);
  assert.equal(isMakeupCreditAvailable({ id: 'present', sessionDate: '2026-08-05T00:00:00.000Z', attended: true }, now), false);
  assert.equal(isMakeupCreditAvailable({ id: 'expired', sessionDate: '2026-07-31T00:00:00.000Z' }, now), false);
});

test('available makeup credit responses exclude used credits and malformed data', () => {
  const now = new Date('2026-08-06T00:00:00.000Z');
  const available = { id: 'available', sessionDate: '2026-08-05T00:00:00.000Z', attended: false, makeupUsed: false };
  const used = { id: 'used', sessionDate: '2026-08-04T00:00:00.000Z', attended: false, makeupUsed: true };

  assert.deepEqual(getAvailableMakeupCredits({ data: [available, used, null] }, now), [available]);
  assert.deepEqual(getAvailableMakeupCredits([], now), []);
  assert.deepEqual(getAvailableMakeupCredits({ data: null }, now), []);
});

test('a same-local-day UTC attendance date is not rejected as future', () => {
  const beforeUtcMidnight = new Date('2026-08-05T20:35:00.000Z');
  assert.equal(isMakeupCreditAvailable({ id: 'same-day', sessionDate: '2026-08-06T00:00:00.000Z' }, beforeUtcMidnight), true);
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-08-06T00:00:00.000Z', makeupUsed: false, attended: false }, beforeUtcMidnight), 'available');
});

test('calendar-month expiry handles short months, leap years, and month-end absences', () => {
  assert.equal(getMakeupCreditExpiry('2028-02-10T00:00:00.000Z')?.toISOString(), '2028-02-29T23:59:59.999Z');
  assert.equal(getMakeupCreditExpiry('2027-02-10T00:00:00.000Z')?.toISOString(), '2027-02-28T23:59:59.999Z');
  assert.equal(getMakeupCreditExpiry('2026-04-30T18:30:00.000Z')?.toISOString(), '2026-04-30T23:59:59.999Z');
  assert.equal(getMakeupCreditExpiry('not-a-date'), null);
});

test('reports available, used, expired, and non-applicable credit history states', () => {
  const now = new Date('2026-08-02T00:00:00.000Z');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-08-01T00:00:00.000Z', attended: false, makeupUsed: false }, now), 'available');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-07-20T00:00:00.000Z', attended: false, makeupUsed: true }, now), 'used');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-06-01T00:00:00.000Z', attended: false, makeupUsed: false }, now), 'expired');
  assert.equal(getMakeupCreditStatus({ sessionDate: '2026-08-01T00:00:00.000Z', attended: true, makeupUsed: false }, now), 'not-applicable');
});

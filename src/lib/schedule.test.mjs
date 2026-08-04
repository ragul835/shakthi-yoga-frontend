import test from 'node:test';
import assert from 'node:assert/strict';
import { getClassDateDisplay } from './schedule.ts';

test('formats an exact class date without UTC date drift', () => {
  assert.deepEqual(getClassDateDisplay('2026-08-09', '9:00 AM'), {
    dateStr: 'Sun, Aug 9, 2026', month: 'Aug', day: '09',
  });
});

test('converts a legacy weekday to its next studio calendar date', () => {
  const now = new Date('2026-08-05T03:00:00.000Z'); // Aug 4, 8 PM in Los Angeles
  assert.deepEqual(getClassDateDisplay('Monday', '9:00 AM', now), {
    dateStr: 'Mon, Aug 10, 2026', month: 'Aug', day: '10',
  });
});

test('uses next week when today\'s studio class time has passed', () => {
  const now = new Date('2026-08-03T19:00:00.000Z'); // Monday noon in Los Angeles
  assert.equal(getClassDateDisplay('Monday', '9:00 AM', now).dateStr, 'Mon, Aug 10, 2026');
});

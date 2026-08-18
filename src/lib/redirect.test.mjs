import test from 'node:test';
import assert from 'node:assert/strict';
import { getSafePostLoginPath } from './redirect.ts';

test('allows safe internal redirects', () => {
  assert.equal(getSafePostLoginPath('/classes?level=beginner', false), '/classes?level=beginner');
  assert.equal(getSafePostLoginPath('/admin/classes', true), '/admin/classes');
});

test('rejects external, malformed, and unauthorized redirects', () => {
  for (const redirect of ['https://evil.example', '//evil.example', '/%2F%2Fevil.example', '/\\evil.example', '%E0%A4%A']) {
    assert.equal(getSafePostLoginPath(redirect, false), null);
  }
  assert.equal(getSafePostLoginPath('/admin', false), null);
  assert.equal(getSafePostLoginPath('/admin/users', false), null);
});

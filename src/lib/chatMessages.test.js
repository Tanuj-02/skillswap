import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessages, shouldApplyMessages } from './chatMessages.js';

test('ignores a late response for a conversation that is no longer active', () => {
  assert.equal(shouldApplyMessages(2, 1), false);
  assert.equal(shouldApplyMessages(2, 2), true);
});

test('deduplicates a sent message returned by a later poll', () => {
  const sent = { id: 10, content: 'hello', createdAt: '2026-11-01T10:00:00Z' };
  const polled = [{ ...sent }, { id: 11, content: 'reply', createdAt: '2026-11-01T10:01:00Z' }];
  assert.deepEqual(mergeMessages([sent], polled).map((message) => message.id), [10, 11]);
});

test('keeps a newly sent message when a stale poll returns an older page', () => {
  const sent = { id: 10, content: 'new', createdAt: '2026-11-01T10:02:00Z' };
  const old = { id: 9, content: 'old', createdAt: '2026-11-01T10:00:00Z' };
  assert.deepEqual(mergeMessages([sent], [old]).map((message) => message.id), [9, 10]);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { aiErrorMessage, aiJobPhase } from './aiSession.js';

test('AI job phases include slow, failed, and empty results', () => {
  assert.equal(aiJobPhase(null), 'empty');
  assert.equal(aiJobPhase({ status: 'QUEUED' }), 'pending');
  assert.equal(aiJobPhase({ status: 'RUNNING' }), 'pending');
  assert.equal(aiJobPhase({ status: 'FAILED' }), 'failed');
  assert.equal(aiJobPhase({ status: 'SUCCEEDED', summary: '', questions: [] }), 'invalid');
  assert.equal(aiJobPhase({ status: 'SUCCEEDED', summary: 'Summary', questions: ['A?', 'B?', 'C?'] }), 'ready');
});

test('authorization and generation limits show specific messages', () => {
  assert.match(aiErrorMessage({ response: { status: 403 } }), /access/);
  assert.match(aiErrorMessage({ response: { status: 429 } }), /limit/);
});

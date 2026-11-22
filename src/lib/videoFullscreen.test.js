import test from 'node:test';
import assert from 'node:assert/strict';
import { enterVideoFullscreen } from './videoFullscreen.js';

test('opens a ready video with the standard fullscreen API', async () => {
  let calls = 0;
  await enterVideoFullscreen({ srcObject: {}, requestFullscreen: async () => { calls += 1; } });
  assert.equal(calls, 1);
});

test('uses the video fullscreen fallback when needed', async () => {
  let calls = 0;
  await enterVideoFullscreen({ srcObject: {}, webkitEnterFullscreen: () => { calls += 1; } });
  assert.equal(calls, 1);
});

test('does not request fullscreen before a video stream exists', async () => {
  await assert.rejects(enterVideoFullscreen({ requestFullscreen: async () => {} }), /not ready/);
});

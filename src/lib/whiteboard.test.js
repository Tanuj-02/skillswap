import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBoardOperations, visibleStrokes, contiguousSequence, sampleStrokePoints } from './whiteboard.js';

const stroke = (sequenceNumber, operationId) => ({
  sequenceNumber, operationId, type: 'STROKE', points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  color: '#112233', width: 3,
});

test('merges catch-up and live operations in sequence without duplicates', () => {
  const merged = mergeBoardOperations([stroke(1, 'a'), stroke(3, 'c')],
    [stroke(2, 'b'), stroke(3, 'c')]);
  assert.deepEqual(merged.map(op => op.sequenceNumber), [1, 2, 3]);
  assert.equal(contiguousSequence(merged), 3);
});

test('does not skip a missing sequence after an early live event', () => {
  assert.equal(contiguousSequence([stroke(1, 'a'), stroke(3, 'c')]), 1);
});

test('replays erase and clear while preserving later strokes', () => {
  const operations = [
    stroke(1, 'a'), stroke(2, 'b'),
    { sequenceNumber: 3, operationId: 'erase', type: 'ERASE', targetOperationId: 'a' },
    { sequenceNumber: 4, operationId: 'clear', type: 'CLEAR' },
    stroke(5, 'c'),
  ];
  assert.deepEqual(visibleStrokes(operations).map(op => op.operationId), ['c']);
});

test('starts catch-up at a recovered projection version and detects a gap', () => {
  assert.equal(contiguousSequence([stroke(42, 'a'), stroke(43, 'b')], 41), 43);
  assert.equal(contiguousSequence([stroke(43, 'b')], 41), 41);
});

test('applies tail events over snapshot strokes', () => {
  const seed = [stroke(1, 'a'), stroke(2, 'b')];
  const tail = [
    { sequenceNumber: 3, operationId: 'e', type: 'ERASE', targetOperationId: 'a' },
    stroke(4, 'c'),
  ];
  assert.deepEqual(visibleStrokes(tail, seed).map(op => op.operationId), ['b', 'c']);
});

test('keeps shapes and text through reload and erases either item', () => {
  const seed = [
    { sequenceNumber: 1, operationId: 'rectangle', type: 'SHAPE', shape: 'RECTANGLE' },
    { sequenceNumber: 2, operationId: 'caption', type: 'TEXT', text: 'A concept' },
  ];
  const tail = [{ sequenceNumber: 3, operationId: 'erase', type: 'ERASE', targetOperationId: 'rectangle' }];
  assert.deepEqual(visibleStrokes(tail, seed).map(item => item.operationId), ['caption']);
});

test('samples a long stroke without losing its endpoint', () => {
  const points = Array.from({ length: 400 }, (_, index) => ({ x: index / 399, y: 0.5 }));
  const sampled = sampleStrokePoints(points);
  assert.equal(sampled.length, 256);
  assert.deepEqual(sampled[0], points[0]);
  assert.deepEqual(sampled.at(-1), points.at(-1));
});

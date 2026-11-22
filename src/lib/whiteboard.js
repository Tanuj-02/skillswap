export function mergeBoardOperations(current, incoming) {
  const byId = new Map();
  for (const operation of [...current, ...incoming]) {
    if (operation?.operationId && Number.isInteger(operation.sequenceNumber)) {
      byId.set(operation.operationId, operation);
    }
  }
  return [...byId.values()].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

export function contiguousSequence(operations, baseSequence = 0) {
  let sequence = baseSequence;
  for (const operation of [...operations].sort((a, b) => a.sequenceNumber - b.sequenceNumber)) {
    if (operation.sequenceNumber === sequence + 1) sequence += 1;
    else if (operation.sequenceNumber > sequence + 1) break;
  }
  return sequence;
}

export function visibleStrokes(operations, seed = []) {
  const strokes = new Map();
  for (const stroke of seed) strokes.set(stroke.operationId, stroke);
  for (const operation of [...operations].sort((a, b) => a.sequenceNumber - b.sequenceNumber)) {
    if (operation.type === 'STROKE') strokes.set(operation.operationId, operation);
    if (operation.type === 'ERASE') strokes.delete(operation.targetOperationId);
    if (operation.type === 'CLEAR') strokes.clear();
  }
  return [...strokes.values()];
}

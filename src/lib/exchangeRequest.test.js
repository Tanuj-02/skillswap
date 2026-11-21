import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeExchangeRequest, serializeExchangeRequest } from './exchangeRequest.js';

test('sends only the fields accepted by the backend request DTO', () => {
  assert.deepEqual(serializeExchangeRequest({
    receiverId: 'peer-2', message: 'Swap?', selectedTeach: 'Java', selectedLearn: 'React',
    senderId: 'spoofed', offeredSkills: ['wrong'], askingSkills: ['wrong'],
  }), {
    receiverId: 'peer-2', message: 'Swap?', canTeach: ['Java'], wantToLearn: ['React'],
  });
});

test('rejects a request without both selected skills', () => {
  assert.throws(() => serializeExchangeRequest({ receiverId: 'peer-2', selectedTeach: '', selectedLearn: 'React' }));
});

test('shows the skills saved on the request rather than profile skills', () => {
  const request = normalizeExchangeRequest({
    id: 4, status: 'PENDING', canTeach: ['Java'], wantToLearn: ['React'],
    sender: { id: 'u1', name: 'A', skills: { canTeach: ['Python'], wantsToLearn: ['Go'] } },
  });
  assert.deepEqual(request.offeredSkills, ['Java']);
  assert.deepEqual(request.askingSkills, ['React']);
  assert.equal(request.status, 'Pending');
});

test('identifies the recipient on a sent request', () => {
  const request = normalizeExchangeRequest({
    status: 'REJECTED', canTeach: ['Java'], wantToLearn: ['React'],
    receiver: { id: 'u2', name: 'Peer', username: 'peer' },
  });
  assert.equal(request.receiverName, 'Peer');
  assert.equal(request.receiverUserName, 'peer');
  assert.equal(request.status, 'Rejected');
});

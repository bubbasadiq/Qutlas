import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { verifyPaystackSignature } from '../app/lib/payments.ts';

test('accepts a valid Paystack HMAC signature', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'QUT-123' } });
  const secret = 'local-test-secret';
  const signature = createHmac('sha512', secret).update(body).digest('hex');

  assert.equal(verifyPaystackSignature(body, signature, secret), true);
});

test('rejects tampered payloads and malformed signatures', () => {
  const secret = 'local-test-secret';
  const signature = createHmac('sha512', secret).update('original').digest('hex');

  assert.equal(verifyPaystackSignature('modified', signature, secret), false);
  assert.equal(verifyPaystackSignature('original', 'not-a-signature', secret), false);
  assert.equal(verifyPaystackSignature('original', signature, ''), false);
});
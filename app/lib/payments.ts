import { createHmac, timingSafeEqual } from 'node:crypto';

export type PaymentInitialization = {
  reference: string;
  authorizationUrl: string;
};

export interface PaymentGateway {
  readonly provider: string;
  initialize(input: { reference: string; email: string; amountMinor: string; currency: string; callbackUrl: string; orderId: string }): Promise<PaymentInitialization>;
}

export class PaymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentConfigurationError';
  }
}

class PaystackGateway implements PaymentGateway {
  readonly provider = 'paystack';
  private readonly secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async initialize(input: { reference: string; email: string; amountMinor: string; currency: string; callbackUrl: string; orderId: string }) {
    if (input.currency !== 'NGN') throw new PaymentConfigurationError('Paystack checkout is configured for NGN orders only.');
    const amount = BigInt(input.amountMinor);
    if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new PaymentConfigurationError('Order amount is outside the payment provider limits.');
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference: input.reference,
        email: input.email,
        amount: Number(amount),
        currency: input.currency,
        callback_url: input.callbackUrl,
        metadata: { order_id: input.orderId },
      }),
    });
    const result: unknown = await response.json().catch(() => null);
    if (!response.ok || typeof result !== 'object' || result === null || !('status' in result) || result.status !== true ||
      !('data' in result) || typeof result.data !== 'object' || result.data === null ||
      !('authorization_url' in result.data) || typeof result.data.authorization_url !== 'string' ||
      !('reference' in result.data) || typeof result.data.reference !== 'string') {
      throw new Error('Payment provider did not initialize the transaction.');
    }
    return { reference: result.data.reference, authorizationUrl: result.data.authorization_url };
  }
}

export function getPaymentGateway(): PaymentGateway | null {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  return secretKey ? new PaystackGateway(secretKey) : null;
}

export function verifyPaystackSignature(payload: string, signature: string, secretKey: string) {
  if (!/^[0-9a-f]{128}$/i.test(signature) || !secretKey) return false;
  const expected = createHmac('sha512', secretKey).update(payload).digest();
  const provided = Buffer.from(signature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
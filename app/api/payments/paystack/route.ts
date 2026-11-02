import { NextResponse } from 'next/server';
import { getPaymentGateway, verifyPaystackSignature } from '../../../lib/payments';
import { createAdminClient } from '../../../lib/supabase-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || getPaymentGateway()?.provider !== 'paystack') {
    return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });
  }

  const body = await request.text();
  if (body.length > 128 * 1024) return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 });
  const signature = request.headers.get('x-paystack-signature') ?? '';
  if (!verifyPaystackSignature(body, signature, secretKey)) {
    return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(body) as unknown;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload.' }, { status: 400 });
  }
  if (typeof event !== 'object' || event === null || !('event' in event) || event.event !== 'charge.success' ||
    !('data' in event) || typeof event.data !== 'object' || event.data === null) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const data = event.data as Record<string, unknown>;
  if (data.status !== 'success' || typeof data.reference !== 'string' || typeof data.amount !== 'number' || typeof data.currency !== 'string') {
    return NextResponse.json({ error: 'Payment event is incomplete.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: payment, error: lookupError } = await admin
    .from('qutlas_payments')
    .select('id, provider_reference, amount_minor, currency, status')
    .eq('provider', 'paystack')
    .eq('provider_reference', data.reference)
    .maybeSingle();
  if (lookupError || !payment) return NextResponse.json({ error: 'Payment reference not found.' }, { status: 404 });
  if (String(payment.amount_minor) !== String(data.amount) || payment.currency !== data.currency) {
    return NextResponse.json({ error: 'Payment amount or currency does not match the order.' }, { status: 409 });
  }
  if (payment.status === 'succeeded') return NextResponse.json({ received: true, duplicate: true });

  const { data: confirmation, error: confirmationError } = await admin.rpc('qutlas_confirm_payment', {
    p_provider_reference: data.reference,
    p_amount_minor: data.amount,
    p_currency: data.currency,
    p_provider_payload: {
      event: 'charge.success',
      reference: data.reference,
      amount: data.amount,
      currency: data.currency,
      transaction_id: typeof data.id === 'number' ? data.id : null,
      paid_at: typeof data.paid_at === 'string' ? data.paid_at : null,
    },
  });
  if (confirmationError) {
    console.error('Verified payment could not be applied to order:', confirmationError);
    return NextResponse.json({ error: 'Payment confirmation could not be recorded.' }, { status: 503 });
  }

  return NextResponse.json({ received: true, confirmed: confirmation?.confirmed === true });
}
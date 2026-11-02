import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getPaymentGateway, PaymentConfigurationError } from '../../../../lib/payments';
import { authenticateRequest, createAdminClient } from '../../../../lib/supabase-server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authentication = await authenticateRequest(request);
  if (!authentication.ok) return authentication.response;
  if (!authentication.user.email || !authentication.user.email_confirmed_at) {
    return NextResponse.json({ error: 'Confirm your account email before paying.' }, { status: 403 });
  }

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid order reference.' }, { status: 400 });
  const gateway = getPaymentGateway();
  if (!gateway) return NextResponse.json({ error: 'Payment provider is not configured.' }, { status: 503 });

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from('qutlas_orders')
    .select('id, reference, customer_id, customer_email, status, payment_status, total_minor, currency')
    .eq('id', id)
    .eq('customer_id', authentication.user.id)
    .maybeSingle();
  if (orderError || !order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  if (order.status !== 'pending_payment' || !['unpaid', 'pending'].includes(order.payment_status)) {
    return NextResponse.json({ error: 'This order is not awaiting payment.' }, { status: 409 });
  }

  const { data: existing, error: paymentLookupError } = await admin
    .from('qutlas_payments')
    .select('id, status, provider_reference, provider_payload')
    .eq('order_id', order.id)
    .eq('provider', gateway.provider)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (paymentLookupError) return NextResponse.json({ error: 'Payment record is unavailable.' }, { status: 503 });
  if (existing?.status === 'succeeded') return NextResponse.json({ error: 'This order is already paid.' }, { status: 409 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!siteUrl) return NextResponse.json({ error: 'Payment return URL is not configured.' }, { status: 503 });

  const reference = existing?.provider_reference || `QUT-${order.reference}-${randomUUID().slice(0, 8).toUpperCase()}`;
  let paymentId = existing?.id;
  if (!existing) {
    const { data: payment, error: insertError } = await admin.from('qutlas_payments').insert({
      order_id: order.id,
      provider: gateway.provider,
      provider_reference: reference,
      amount_minor: order.total_minor,
      currency: order.currency,
      status: 'created',
      idempotency_key: `paystack:${order.id}`,
    }).select('id').single();
    if (insertError) {
      console.error('Payment attempt could not be created:', insertError);
      return NextResponse.json({ error: 'Payment attempt could not be created.' }, { status: 503 });
    }
    paymentId = payment.id;
  } else {
    const payload = typeof existing.provider_payload === 'object' && existing.provider_payload !== null
      ? existing.provider_payload as Record<string, unknown>
      : {};
    if (existing.status === 'pending' && typeof payload.authorization_url === 'string') {
      return NextResponse.json({ authorizationUrl: payload.authorization_url, reference });
    }
  }

  try {
    const initialized = await gateway.initialize({
      reference,
      email: order.customer_email,
      amountMinor: String(order.total_minor),
      currency: order.currency,
      callbackUrl: `${siteUrl}/account?payment=${encodeURIComponent(reference)}`,
      orderId: order.id,
    });
    await admin.from('qutlas_payments').update({
      status: 'pending',
      provider_reference: initialized.reference,
      provider_payload: { authorization_url: initialized.authorizationUrl },
      updated_at: new Date().toISOString(),
    }).eq('id', paymentId);
    await admin.from('qutlas_orders').update({ payment_status: 'pending', payment_provider: gateway.provider }).eq('id', order.id);
    return NextResponse.json(initialized, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Payment provider initialization failed:', error);
    const message = error instanceof PaymentConfigurationError ? error.message : 'Payment provider could not initialize checkout.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
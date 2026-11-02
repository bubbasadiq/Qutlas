'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useShopCart } from '../ShopCart';
import { formatMinorCurrency } from '../ShopCart';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';

type FulfilmentQuote = { chargeMinor: string; currency: string };
type SubmittedOrder = { id: string; reference: string; totalMinor: string; currency: string };

export default function CheckoutPage() {
  const { lines, subtotalMinor, taxMinor, totalMinor, currency, error: cartError, update, remove, clear } = useShopCart();
  const [submitted, setSubmitted] = useState<SubmittedOrder | null>(null);
  const [session, setSession] = useState<{ accessToken: string; email: string } | null>(null);
  const [method, setMethod] = useState<'delivery' | 'collection'>('delivery');
  const [regionCode, setRegionCode] = useState('');
  const [fulfilment, setFulfilment] = useState<FulfilmentQuote | null>(null);
  const [fulfilmentError, setFulfilmentError] = useState('Enter a region to check configured fulfilment options.');
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const submissionRef = useRef<{ fingerprint: string; key: string } | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      const current = data.session;
      setSession(current?.user.email ? { accessToken: current.access_token, email: current.user.email } : null);
    });
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, current) => {
      setSession(current?.user.email ? { accessToken: current.access_token, email: current.user.email } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!regionCode.trim()) {
      setFulfilment(null);
      setFulfilmentError('Enter a region to check configured fulfilment options.');
      return;
    }
    const controller = new AbortController();
    setFulfilment(null);
    setFulfilmentError('Checking configured fulfilment…');
    void fetch(`/api/fulfilment?method=${method}&regionCode=${encodeURIComponent(regionCode.trim())}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok || typeof result !== 'object' || result === null || !('chargeMinor' in result) || typeof result.chargeMinor !== 'string' || !('currency' in result) || typeof result.currency !== 'string') {
          throw new Error(typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string' ? result.error : 'Fulfilment is unavailable.');
        }
        setFulfilment({ chargeMinor: result.chargeMinor, currency: result.currency });
        setFulfilmentError('');
      })
      .catch((quoteError: unknown) => {
        if (controller.signal.aborted) return;
        setFulfilmentError(quoteError instanceof Error ? quoteError.message : 'Fulfilment is unavailable.');
      });
    return () => controller.abort();
  }, [method, regionCode]);

  const checkoutTotal = subtotalMinor !== null && taxMinor !== null && totalMinor !== null && fulfilment && currency === fulfilment.currency
    ? (BigInt(subtotalMinor) + BigInt(taxMinor) + BigInt(fulfilment.chargeMinor)).toString()
    : null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || lines.length === 0 || !session || !checkoutTotal || !currency || !fulfilment) return;

    setBusy(true);
    setError('');

    try {
      const form = new FormData(event.currentTarget);
      const payload = {
        customer: {
          name: String(form.get('name') ?? ''),
          phone: String(form.get('phone') ?? ''),
        },
        fulfilment: {
          method,
          regionCode: regionCode.trim(),
          address: {
            addressLine: String(form.get('addressLine') ?? ''),
            city: String(form.get('city') ?? ''),
          },
        },
        items: lines.map(({ variant, quantity }) => ({ variantId: variant.id, quantity })),
      };
      const fingerprint = JSON.stringify(payload);
      if (!submissionRef.current || submissionRef.current.fingerprint !== fingerprint) {
        submissionRef.current = { fingerprint, key: globalThis.crypto.randomUUID() };
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionRef.current.key,
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => null);
      const resultRecord = typeof result === 'object' && result !== null
        ? result as Record<string, unknown>
        : {};

      if (!response.ok) {
        setError(typeof resultRecord.error === 'string' ? resultRecord.error : 'We could not create your order. Your cart is still saved.');
        return;
      }
      if (typeof resultRecord.reference !== 'string' || !resultRecord.reference) {
        setError('The server did not return an order reference. Your cart is still saved.');
        return;
      }
      if (typeof resultRecord.id !== 'string' || !resultRecord.id) {
        setError('The server did not return an order ID. Your cart is still saved.');
        return;
      }

      setSubmitted({
        id: resultRecord.id,
        reference: resultRecord.reference,
        totalMinor: typeof resultRecord.totalMinor === 'string' ? resultRecord.totalMinor : checkoutTotal,
        currency: typeof resultRecord.currency === 'string' ? resultRecord.currency : currency,
      });
      submissionRef.current = null;
      clear();
    } catch {
      setError('We could not reach Qutlas. Your cart is still saved. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }

  async function beginPayment() {
    if (!submitted || !session || paymentBusy) return;
    setPaymentBusy(true);
    setPaymentError('');
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(submitted.id)}/payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok || typeof result !== 'object' || result === null || !('authorizationUrl' in result) || typeof result.authorizationUrl !== 'string') {
        throw new Error(typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Secure payment could not be started.');
      }
      window.location.assign(result.authorizationUrl);
    } catch (paymentStartError) {
      setPaymentError(paymentStartError instanceof Error ? paymentStartError.message : 'Secure payment could not be started.');
    } finally {
      setPaymentBusy(false);
    }
  }

  if (submitted) {
    return (
      <main className="checkout-page">
        <div className="checkout-success">
          <p className="eyebrow">Order created · payment pending</p>
          <h1>Your order is awaiting payment.</h1>
          <p>Reference <strong>{submitted.reference}</strong>. Order total: <strong>{formatMinorCurrency(submitted.totalMinor, submitted.currency)}</strong>. No payment is marked successful until a payment provider confirms it.</p>
          {paymentError && <p className="form-error" role="alert">{paymentError}</p>}
          <button className="primary-button" type="button" disabled={paymentBusy} onClick={() => void beginPayment()}>{paymentBusy ? 'Opening secure payment…' : 'Continue to secure payment'}</button>
          <Link className="primary-button" href="/account">View your account</Link>
        </div>
      </main>
    );
  }

  if (!lines.length) {
    return (
      <main className="checkout-page">
        <div className="empty-cart">
          <p className="eyebrow">Your cart</p>
          <h1>Nothing here yet.</h1>
          <p>Browse currently priced products to start an order.</p>
          <Link className="primary-button" href="/shop">Browse products</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-heading">
        <p className="eyebrow">Checkout</p>
        <h1>Review your order.</h1>
        <p>Prices and stock are revalidated on the server before the order is created.</p>
      </div>

      {!session && <p className="checkout-note">Sign in with a confirmed customer account to place an order. <Link href="/account">Sign in or create an account</Link>.</p>}

      <div className="checkout-grid">
        <section className="cart-panel" aria-labelledby="cart-title">
          <h2 id="cart-title">Items</h2>
          {lines.map(({ product, variant, quantity, totalMinor: lineTotalMinor }) => (
              <div className="cart-line" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>{variant.sku} · {variant.name} · {formatMinorCurrency(lineTotalMinor, variant.price.currency)}</small>
                </div>
                <div className="quantity-control">
                  <input
                    aria-label={`Quantity for ${product.name} ${variant.name}`}
                    type="number"
                    min={variant.minimumQuantity}
                    max={variant.maximumQuantity ?? undefined}
                    step={variant.quantityStep}
                    value={quantity}
                    onChange={(event) => { void update(variant.id, event.target.value); }}
                  />
                </div>
                <strong>{formatMinorCurrency(lineTotalMinor, variant.price.currency)}</strong>
                <button className="remove-line" type="button" onClick={() => remove(variant.id)}>Remove</button>
              </div>
            ))}
          {cartError && <p className="form-error" role="alert">{cartError}</p>}
          <div className="cart-total">
            <span>Items subtotal</span>
            <strong>{subtotalMinor && currency ? formatMinorCurrency(subtotalMinor, currency) : 'Unavailable'}</strong>
          </div>
          <div className="cart-total"><span>Tax</span><strong>{taxMinor && currency ? formatMinorCurrency(taxMinor, currency) : 'Unavailable'}</strong></div>
          <div className="cart-total"><span>Fulfilment</span><strong>{fulfilment && currency === fulfilment.currency ? formatMinorCurrency(fulfilment.chargeMinor, fulfilment.currency) : 'Unavailable'}</strong></div>
          <div className="cart-total"><span>Order total</span><strong>{checkoutTotal && currency ? formatMinorCurrency(checkoutTotal, currency) : 'Unavailable'}</strong></div>
          {fulfilmentError && <p className="checkout-note" role="status">{fulfilmentError}</p>}
        </section>

        <form className="checkout-form" onSubmit={submit}>
          <h2>Contact and fulfilment</h2>
          {session && <p>Signed in as {session.email}</p>}
          <label>Full name<input name="name" required autoComplete="name" maxLength={200} /></label>
          <label>Phone number<input name="phone" required autoComplete="tel" maxLength={50} /></label>
          <label>Fulfilment method<select value={method} onChange={(event) => setMethod(event.target.value as 'delivery' | 'collection')}><option value="delivery">Delivery</option><option value="collection">Collection</option></select></label>
          <label>Region code or name<input required value={regionCode} onChange={(event) => setRegionCode(event.target.value)} placeholder="As configured by Qutlas" maxLength={20} /></label>
          {method === 'delivery' ? <>
            <label>Delivery address<input name="addressLine" required maxLength={300} autoComplete="street-address" /></label>
            <label>City<input name="city" required maxLength={120} autoComplete="address-level2" /></label>
          </> : <label>Collection notes<input name="addressLine" maxLength={300} placeholder="Optional collection details" /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy || !session || !checkoutTotal || !fulfilment}>
            {busy ? 'Creating order…' : 'Place order'}
          </button>
          <small className="checkout-note">Orders are created as unpaid. Payment status changes only after a verified provider confirmation.</small>
        </form>
      </div>
    </main>
  );
}

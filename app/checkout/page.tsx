'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { useShopCart } from '../ShopCart';

type SubmissionPayload = {
  details: Record<string, unknown>;
  files: never[];
};

function formatPrice(value: number) {
  return `₦${value.toLocaleString('en-NG')}`;
}

export default function CheckoutPage() {
  const { lines, total, update, remove, clear } = useShopCart();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submissionRef = useRef<{ fingerprint: string; key: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || lines.length === 0) return;

    setBusy(true);
    setError('');

    try {
      const form = new FormData(event.currentTarget);
      const supportedMaterials = new Set(['steel', 'wood', 'granite']);
      const distinctMaterials = new Set(lines.map(({ product }) => product.material));
      const firstMaterial = lines[0]?.product.material;
      const material = distinctMaterials.size === 1 && firstMaterial && supportedMaterials.has(firstMaterial)
        ? firstMaterial
        : 'unsure';

      const payload: SubmissionPayload = {
        details: {
          material,
          startMode: 'description',
          need: 'material',
          itemName: 'Qutlas shop order',
          description: lines.map(({ product, quantity }) =>
            `${quantity} × ${product.name} (${product.code}); unit price and availability to be confirmed`,
          ).join('\n'),
          specs: {
            order_type: 'catalogue_order_request',
            item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
            pricing: 'to_be_confirmed',
            payment: 'not_collected',
          },
          quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
          quantityUnit: 'items',
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          location: String(form.get('location') ?? ''),
          delivery: String(form.get('delivery') ?? 'delivery'),
          contactMethod: 'email',
        },
        files: [],
      };

      // Reuse the key only when retrying the exact same payload.
      // If the customer edits their details or cart, the request gets a new key.
      const fingerprint = JSON.stringify(payload);
      if (!submissionRef.current || submissionRef.current.fingerprint !== fingerprint) {
        submissionRef.current = {
          fingerprint,
          key: globalThis.crypto.randomUUID(),
        };
      }

      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': submissionRef.current.key,
        },
        body: JSON.stringify(payload),
      });

      const result: unknown = await response.json().catch(() => null);
      const resultRecord = typeof result === 'object' && result !== null
        ? result as Record<string, unknown>
        : {};

      if (!response.ok) {
        setError(typeof resultRecord.error === 'string'
          ? resultRecord.error
          : 'We could not submit your order request. Your cart is still saved. Please try again.');
        return;
      }

      if (typeof resultRecord.reference !== 'string' || !resultRecord.reference) {
        setError('The server did not return an order reference. Your cart is still saved. Please retry.');
        return;
      }

      setSubmitted(resultRecord.reference);
      submissionRef.current = null;
      clear();
    } catch {
      setError('We could not reach Qutlas. Your cart is still saved. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <main className="checkout-page">
        <div className="checkout-success">
          <p className="eyebrow">Order request received</p>
          <h1>We have your order request.</h1>
          <p>Your reference is <strong>{submitted}</strong>. No payment has been taken. Availability, specification, pricing and delivery still require review and confirmation. Keep this reference for follow-up.</p>
          <Link className="primary-button" href="/shop">Continue shopping <span aria-hidden="true">↗</span></Link>
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
          <p>Browse the Qutlas catalogue to add materials, hardware and components to an order request.</p>
          <Link className="primary-button" href="/shop">Browse the catalogue <span aria-hidden="true">↗</span></Link>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-heading">
        <p className="eyebrow">Order request</p>
        <h1>Review your selection.</h1>
        <p>Submit your items and delivery details. Qutlas will confirm availability and pricing before you commit to a purchase.</p>
      </div>

      <div className="checkout-grid">
        <section className="cart-panel" aria-labelledby="cart-title">
          <h2 id="cart-title">Your selection</h2>
          {lines.map(({ product, quantity }) => {
            const hasVerifiedPrice = product.status === 'verified' && typeof product.price === 'number';
            return (
              <div className="cart-line" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <small>{product.code} · {hasVerifiedPrice ? `${formatPrice(product.price!)} per unit` : 'Price on request'}</small>
                </div>
                <div className="quantity-control">
                  <button type="button" aria-label={`Decrease ${product.name}`} onClick={() => update(product.id, quantity - 1)}>−</button>
                  <input
                    aria-label={`Quantity for ${product.name}`}
                    type="number"
                    min="1"
                    max="999"
                    value={quantity}
                    onChange={(event) => update(product.id, Math.max(1, Number(event.target.value) || 1))}
                  />
                  <button type="button" aria-label={`Increase ${product.name}`} onClick={() => update(product.id, quantity + 1)}>+</button>
                </div>
                <strong>{hasVerifiedPrice ? formatPrice(product.price! * quantity) : 'Quote required'}</strong>
                <button className="remove-line" type="button" onClick={() => remove(product.id)}>Remove</button>
              </div>
            );
          })}
          <div className="cart-total">
            <span>{total === null ? 'Total' : 'Verified subtotal'}</span>
            <strong>{total === null ? 'Confirmed after review' : formatPrice(total)}</strong>
          </div>
          <p className="checkout-note">No payment is collected at this stage. Prices, stock, specifications and delivery are confirmed before a quotation is accepted.</p>
        </section>

        <form className="checkout-form" onSubmit={submit}>
          <h2>Contact and delivery details</h2>
          <label>Full name<input name="name" required autoComplete="name" maxLength={200} /></label>
          <label>Email<input name="email" type="email" required autoComplete="email" maxLength={320} /></label>
          <label>Phone number<input name="phone" required autoComplete="tel" maxLength={50} /></label>
          <label>Delivery location<input name="location" required placeholder="City, area and address" autoComplete="street-address" maxLength={300} /></label>
          <label>Delivery preference<select name="delivery" defaultValue="delivery"><option value="delivery">Deliver to this address</option><option value="pickup">I will arrange collection</option></select></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Submitting request…' : 'Submit order request'} <span aria-hidden="true">↗</span>
          </button>
          <small className="checkout-note">This is an order request, not a paid order. Payment integration will be added after quotation and fulfilment steps are defined.</small>
        </form>
      </div>
    </main>
  );
}

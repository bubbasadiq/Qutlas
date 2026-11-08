'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import { formatMinorCurrency } from '../ShopCart';
import styles from './account.module.css';

type CustomerOrder = {
  id: string;
  reference: string;
  status: string;
  payment_status: string;
  currency: string;
  total_minor: string;
  created_at: string;
  qutlas_order_items: { name_snapshot: string; quantity: string; unit: string }[];
};

export default function AccountPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [signUp, setSignUp] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Customer accounts are not configured.');
      return;
    }

    client.auth.getSession().then(({ data }) => setUserEmail(data.session?.user.email ?? null));
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      if (!session) setOrders([]);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    async function loadOrders() {
      const client = getSupabaseBrowserClient();
      const { data } = await client!.auth.getSession();
      const response = await fetch('/api/account/orders', {
        headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
        cache: 'no-store',
      });
      const result: unknown = await response.json().catch(() => null);
      if (cancelled) return;
      if (!response.ok) {
        setError(typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Order history is unavailable.');
        return;
      }
      setOrders(Array.isArray(result) ? result as CustomerOrder[] : []);
      setError('');
    }
    void loadOrders();
    return () => { cancelled = true; };
  }, [userEmail]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (signUp) {
        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice('Check your email to confirm your account, then sign in.');
        } else {
          const { error: metadataError } = await client.auth.updateUser({ data: { full_name: fullName.trim() } });
          if (metadataError) throw metadataError;
          const profileResponse = await fetch('/api/account/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
            body: JSON.stringify({ fullName: fullName.trim() }),
          });
          if (!profileResponse.ok) throw new Error('Your account was created, but the customer profile could not be saved.');
          setUserEmail(data.user?.email ?? email);
          setNotice('Your account is ready.');
        }
      } else {
        const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        if (!data.session) throw new Error('Sign-in did not create a session.');
        const profileResponse = await fetch('/api/account/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
          body: JSON.stringify({ fullName: data.user.user_metadata.full_name ?? '' }),
        });
        if (!profileResponse.ok) throw new Error('Signed in, but your customer profile could not be loaded.');
        setUserEmail(data.user.email ?? email);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Account request failed.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (client) await client.auth.signOut();
    setUserEmail(null);
    setOrders([]);
  }

  return (
    <main className={styles.accountPage}>
      <section className={styles.accountShell}>
        {userEmail ? <>
          <div className={styles.accountHeading}><h1>Your orders</h1><p>{userEmail}</p><button className={styles.secondaryButton} type="button" onClick={signOut}>Sign out</button></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!orders.length && !error ? <p className={styles.accountEmpty}>No orders are associated with this account yet.</p> : <div className={styles.accountOrders}>{orders.map((order) => <article className={styles.accountOrder} key={order.id}>
            <header className={styles.orderHeader}><div><strong>{order.reference}</strong><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleDateString('en-NG')}</time></div><span>{order.status.replace(/_/g, ' ')}</span></header>
            <ul>{order.qutlas_order_items.map((item, index) => <li key={`${order.id}-${index}`}>{item.name_snapshot} · {item.quantity} {item.unit}</li>)}</ul>
            <footer className={styles.orderFooter}><span>Payment: {order.payment_status.replace(/_/g, ' ')}</span><strong>{formatMinorCurrency(order.total_minor, order.currency)}</strong></footer>
          </article>)}</div>}
        </> : <>
          <div className={styles.accountHeading}><h1>{signUp ? 'Create your account.' : 'Sign in to Qutlas.'}</h1></div>
          <form className={styles.accountForm} onSubmit={submit}>
            {signUp && <label>Full name<input required autoComplete="name" maxLength={200} value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>}
            <label>Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>Password<input type="password" autoComplete={signUp ? 'new-password' : 'current-password'} required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Please wait…' : signUp ? 'Create account' : 'Sign in'}</button>
          </form>
          <button className={styles.modeToggle} type="button" onClick={() => { setSignUp(!signUp); setError(''); setNotice(''); }}>{signUp ? 'Already have an account? Sign in' : 'New to Qutlas? Create an account'}</button>
        </>}
      </section>
    </main>
  );
}
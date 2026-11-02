'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabase-browser';
import styles from './admin.module.css';

type Field = { key: string; label: string; type?: 'text' | 'number' | 'boolean' | 'json' | 'date' | 'email' | 'select'; options?: string[]; required?: boolean };
type Module = { key: string; label: string; roles: string[]; fields: Field[]; create?: boolean };
type Row = Record<string, unknown>;

const modules: Module[] = [
  { key: 'categories', label: 'Categories', roles: ['catalogue_manager'], fields: [{ key: 'slug', label: 'Slug', required: true }, { key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description' }, { key: 'is_active', label: 'Active', type: 'boolean' }, { key: 'sort_order', label: 'Sort order', type: 'number' }] },
  { key: 'materials', label: 'Materials', roles: ['catalogue_manager'], fields: [{ key: 'category_id', label: 'Category ID', required: true }, { key: 'slug', label: 'Slug', required: true }, { key: 'name', label: 'Name', required: true }, { key: 'grade', label: 'Grade' }, { key: 'pricing_unit', label: 'Pricing unit', required: true }, { key: 'specification', label: 'Specifications JSON', type: 'json' }, { key: 'standard_stock_size', label: 'Standard stock JSON', type: 'json' }, { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'archived'] }] },
  { key: 'products', label: 'Products', roles: ['catalogue_manager'], fields: [{ key: 'category_id', label: 'Category ID', required: true }, { key: 'material_id', label: 'Material ID' }, { key: 'slug', label: 'Slug', required: true }, { key: 'sku', label: 'SKU', required: true }, { key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description' }, { key: 'attributes', label: 'Attributes JSON', type: 'json' }, { key: 'status', label: 'Status', type: 'select', options: ['draft', 'incomplete', 'awaiting_cost', 'awaiting_pricing', 'active', 'out_of_stock', 'unavailable', 'archived'] }] },
  { key: 'variants', label: 'Variants', roles: ['catalogue_manager'], fields: [{ key: 'product_id', label: 'Product ID', required: true }, { key: 'sku', label: 'SKU', required: true }, { key: 'name', label: 'Name', required: true }, { key: 'pricing_unit', label: 'Pricing unit', required: true }, { key: 'minimum_quantity', label: 'Minimum quantity', type: 'number' }, { key: 'maximum_quantity', label: 'Maximum quantity', type: 'number' }, { key: 'quantity_step', label: 'Quantity step', type: 'number' }, { key: 'attributes', label: 'Attributes JSON', type: 'json' }, { key: 'is_active', label: 'Active', type: 'boolean' }] },
  { key: 'suppliers', label: 'Suppliers', roles: ['pricing_manager'], fields: [{ key: 'name', label: 'Supplier name', required: true }, { key: 'contact_name', label: 'Contact name' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'phone', label: 'Phone' }, { key: 'location', label: 'Location' }, { key: 'supplied_categories', label: 'Categories JSON array', type: 'json' }, { key: 'delivery_terms', label: 'Delivery terms' }, { key: 'notes', label: 'Notes' }] },
  { key: 'supplier-prices', label: 'Supplier prices', roles: ['pricing_manager'], create: true, fields: [{ key: 'supplier_id', label: 'Supplier ID', required: true }, { key: 'variant_id', label: 'Variant ID', required: true }, { key: 'cost_minor', label: 'Cost in minor units', type: 'number', required: true }, { key: 'currency', label: 'Currency code', required: true }, { key: 'pricing_unit', label: 'Pricing unit', required: true }, { key: 'source', label: 'Cost source', required: true }, { key: 'effective_at', label: 'Effective date', type: 'date', required: true }, { key: 'valid_until', label: 'Valid until', type: 'date' }, { key: 'notes', label: 'Notes' }] },
  { key: 'pricing-rules', label: 'Pricing rules', roles: ['pricing_manager'], create: true, fields: [{ key: 'variant_id', label: 'Variant ID', required: true }, { key: 'supplier_price_id', label: 'Supplier price ID', required: true }, { key: 'pricing_unit', label: 'Pricing unit', required: true }, { key: 'wastage_bps', label: 'Wastage (basis points)', type: 'number' }, { key: 'processing_minor_per_unit', label: 'Processing / unit (minor)', type: 'number' }, { key: 'labour_minor_per_unit', label: 'Labour / unit (minor)', type: 'number' }, { key: 'setup_minor', label: 'Setup (minor)', type: 'number' }, { key: 'margin_bps', label: 'Margin (basis points)', type: 'number', required: true }, { key: 'tax_bps', label: 'Tax (basis points)', type: 'number' }, { key: 'minimum_job_minor', label: 'Minimum job (minor)', type: 'number' }, { key: 'effective_at', label: 'Effective date', type: 'date', required: true }, { key: 'valid_until', label: 'Valid until', type: 'date' }, { key: 'notes', label: 'Notes' }] },
  { key: 'inventory', label: 'Inventory', roles: ['inventory_manager'], create: false, fields: [] },
  { key: 'inventory-movements', label: 'Stock movements', roles: ['inventory_manager'], create: false, fields: [] },
  { key: 'orders', label: 'Orders', roles: ['order_manager', 'production_manager'], create: false, fields: [{ key: 'production_assignee', label: 'Production assignee user ID' }, { key: 'fulfilment_details', label: 'Fulfilment JSON', type: 'json' }, { key: 'internal_notes', label: 'Internal notes' }] },
  { key: 'enquiries', label: 'Enquiries', roles: ['customer_support'], create: false, fields: [{ key: 'status', label: 'Status', type: 'select', options: ['new', 'reviewing', 'quoted', 'approved', 'in_production', 'completed', 'cancelled'] }] },
  { key: 'customers', label: 'Customers', roles: ['customer_support'], create: false, fields: [{ key: 'full_name', label: 'Full name' }, { key: 'phone', label: 'Phone' }, { key: 'company_name', label: 'Company' }] },
  { key: 'lab-submissions', label: 'Qutters Lab', roles: ['customer_support'], create: false, fields: [{ key: 'status', label: 'Status', type: 'select', options: ['new', 'reviewing', 'contacted', 'accepted', 'declined', 'closed'] }, { key: 'assignee', label: 'Assignee user ID' }, { key: 'internal_notes', label: 'Internal notes' }] },
  { key: 'promotions', label: 'Promotions', roles: ['catalogue_manager'], fields: [{ key: 'name', label: 'Name', required: true }, { key: 'code', label: 'Code' }, { key: 'discount_type', label: 'Discount type', type: 'select', options: ['fixed_minor', 'basis_points'] }, { key: 'discount_value', label: 'Discount value', type: 'number', required: true }, { key: 'currency', label: 'Currency' }, { key: 'starts_at', label: 'Starts at', type: 'date', required: true }, { key: 'ends_at', label: 'Ends at', type: 'date' }, { key: 'is_active', label: 'Active', type: 'boolean' }, { key: 'conditions', label: 'Conditions JSON', type: 'json' }] },
  { key: 'content-pages', label: 'Content', roles: ['catalogue_manager'], fields: [{ key: 'slug', label: 'Slug', required: true }, { key: 'title', label: 'Title', required: true }, { key: 'body', label: 'Content JSON', type: 'json' }, { key: 'status', label: 'Status', type: 'select', options: ['draft', 'published', 'archived'] }] },
  { key: 'fulfilment-rules', label: 'Fulfilment rules', roles: ['order_manager'], fields: [{ key: 'method', label: 'Method', type: 'select', options: ['delivery', 'collection'], required: true }, { key: 'region_code', label: 'Region code or *', required: true }, { key: 'charge_minor', label: 'Charge in minor units', type: 'number', required: true }, { key: 'currency', label: 'Currency code', required: true }, { key: 'effective_at', label: 'Effective date', type: 'date', required: true }, { key: 'valid_until', label: 'Valid until', type: 'date' }, { key: 'is_active', label: 'Active', type: 'boolean' }] },
  { key: 'staff', label: 'Staff access', roles: ['super_admin'], fields: [{ key: 'user_id', label: 'Auth user ID', required: true }, { key: 'role', label: 'Role', type: 'select', options: ['super_admin', 'catalogue_manager', 'pricing_manager', 'inventory_manager', 'order_manager', 'customer_support', 'production_manager', 'reporting'], required: true }] },
  { key: 'audit-log', label: 'Audit log', roles: ['super_admin', 'reporting'], create: false, fields: [] },
];

const metrics = [
  ['paid_revenue_minor', 'Paid revenue'],
  ['average_paid_order_minor', 'Average paid order'],
  ['products_awaiting_pricing', 'Products awaiting pricing'],
  ['low_stock_count', 'Low stock'],
  ['pending_enquiries', 'New enquiries'],
  ['pending_lab_submissions', 'New Lab submissions'],
] as const;

function valueForForm(value: unknown, type?: Field['type']) {
  if (value === null || value === undefined) return '';
  if (type === 'json' || typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

async function adminApi(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
    cache: 'no-store',
  });
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
      ? result.error
      : 'The admin request failed.';
    throw new Error(message);
  }
  return result;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [overview, setOverview] = useState<Row | null>(null);
  const [activeKey, setActiveKey] = useState('overview');
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [nextStatuses, setNextStatuses] = useState<Record<string, string>>({});
  const [inventoryDrafts, setInventoryDrafts] = useState<Record<string, { type: string; quantity: string; reference: string; notes: string }>>({});
  const [previewQuantities, setPreviewQuantities] = useState<Record<string, string>>({});
  const [pricePreviews, setPricePreviews] = useState<Record<string, Row>>({});
  const [orderPriceSnapshots, setOrderPriceSnapshots] = useState<Record<string, Row[]>>({});

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError('Staff sign-in is not configured.');
      return;
    }
    client.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ''));
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setToken(session?.access_token ?? ''));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void adminApi(token, '/api/admin/overview').then((result) => {
      if (cancelled || typeof result !== 'object' || result === null) return;
      setOverview(result as Row);
      setRoles(Array.isArray((result as Row).roles) ? (result as Row).roles as string[] : []);
      setError('');
    }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Dashboard is unavailable.');
    });
    return () => { cancelled = true; };
  }, [token]);

  const activeModule = modules.find((item) => item.key === activeKey);

  useEffect(() => {
    if (!token || !activeModule) return;
    let cancelled = false;
    setRows([]);
    setEditing(null);
    void adminApi(token, `/api/admin/${activeModule.key}?limit=100`).then((result) => {
      if (!cancelled) setRows(Array.isArray(result) ? result as Row[] : []);
    }).catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Records could not be loaded.');
    });
    return () => { cancelled = true; };
  }, [token, activeModule]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client || busy) return;
    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Staff sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  function beginEdit(row: Row | null) {
    setEditing(row);
    setNotice('');
    setValues(Object.fromEntries((activeModule?.fields ?? []).map((field) => [field.key, valueForForm(row?.[field.key], field.type)])));
  }

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeModule || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload: Row = {};
      for (const field of activeModule.fields) {
        const value = values[field.key] ?? '';
        if (!value.trim()) continue;
        if (field.type === 'json') payload[field.key] = JSON.parse(value);
        else if (field.type === 'number') payload[field.key] = Number(value);
        else if (field.type === 'boolean') payload[field.key] = value === 'true';
        else payload[field.key] = value;
      }
      const id = editing?.id ?? editing?.user_id;
      await adminApi(token, editing ? `/api/admin/${activeModule.key}?id=${encodeURIComponent(String(id))}` : `/api/admin/${activeModule.key}`, {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      setNotice(editing ? 'Record updated.' : 'Record created.');
      beginEdit(null);
      const result = await adminApi(token, `/api/admin/${activeModule.key}?limit=100`);
      setRows(Array.isArray(result) ? result as Row[] : []);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Record could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function approveRule(id: string) {
    setBusy(true);
    setError('');
    try {
      await adminApi(token, `/api/admin/pricing-rules/${encodeURIComponent(id)}/approve`, { method: 'POST' });
      setNotice('Pricing rule approved.');
      const result = await adminApi(token, '/api/admin/pricing-rules?limit=100');
      setRows(Array.isArray(result) ? result as Row[] : []);
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : 'Pricing rule could not be approved.');
    } finally {
      setBusy(false);
    }
  }

  async function previewRule(id: string) {
    setError('');
    try {
      const rule = rows.find((item) => String(item.id) === id);
      const supplierPriceId = rule?.supplier_price_id;
      const variantId = rule?.variant_id;
      if (typeof supplierPriceId !== 'string' || typeof variantId !== 'string') {
        throw new Error('The saved rule is missing a supplier cost or product variant.');
      }
      const result = await adminApi(token, `/api/admin/pricing-rules/${encodeURIComponent(id)}/preview`, {
        method: 'POST',
        body: JSON.stringify({ quantity: previewQuantities[id] || '1', supplierPriceId, variantId }),
      });
      setPricePreviews((current) => ({ ...current, [id]: result as Row }));
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Price preview failed.');
    }
  }

  async function changeOrderStatus(id: string, status: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await adminApi(token, `/api/admin/orders/${encodeURIComponent(id)}/status`, { method: 'POST', body: JSON.stringify({ status }) });
      setNotice('Order status updated and recorded.');
      const result = await adminApi(token, '/api/admin/orders?limit=100');
      setRows(Array.isArray(result) ? result as Row[] : []);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Order status could not be updated.');
    } finally {
      setBusy(false);
    }
  }

  async function adjustInventory(id: string) {
    const draft = inventoryDrafts[id];
    if (!draft || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await adminApi(token, `/api/admin/inventory/${encodeURIComponent(id)}/adjust`, { method: 'POST', body: JSON.stringify(draft) });
      setNotice('Inventory movement recorded.');
      const result = await adminApi(token, '/api/admin/inventory?limit=100');
      setRows(Array.isArray(result) ? result as Row[] : []);
      setInventoryDrafts((current) => ({ ...current, [id]: { ...current[id], quantity: '', reference: '', notes: '' } }));
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : 'Inventory movement could not be recorded.');
    } finally {
      setBusy(false);
    }
  }

  async function revokeStaffRole(userId: string, role: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await adminApi(token, `/api/admin/staff?userId=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`, { method: 'DELETE' });
      setNotice('Staff role revoked.');
      const result = await adminApi(token, '/api/admin/staff?limit=100');
      setRows(Array.isArray(result) ? result as Row[] : []);
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : 'Staff role could not be revoked.');
    } finally {
      setBusy(false);
    }
  }

  async function loadOrderPricing(id: string) {
    try {
      const result = await adminApi(token, `/api/admin/orders/${encodeURIComponent(id)}/pricing`);
      setOrderPriceSnapshots((current) => ({ ...current, [id]: Array.isArray(result) ? result as Row[] : [] }));
    } catch (pricingError) {
      setError(pricingError instanceof Error ? pricingError.message : 'Order price snapshot is unavailable.');
    }
  }

  function exportRows() {
    if (!rows.length || !activeModule) return;
    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    const escapeCell = (value: unknown) => `"${display(value).replace(/"/g, '""')}"`;
    const csv = [columns, ...rows.map((row) => columns.map((column) => display(row[column])))].map((line) => line.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `qutlas-${activeModule.key}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (client) await client.auth.signOut();
    setToken('');
    setRoles([]);
    setOverview(null);
  }

  const visibleModules = modules.filter((item) => roles.includes('super_admin') || item.roles.some((role) => roles.includes(role)));

  if (!token) return <main className={styles.adminPage}><section className={styles.signIn}>
    <p className="eyebrow">Qutlas operations</p><h1>Staff sign in</h1><p>Access is limited to accounts with an assigned staff role.</p>
    <form onSubmit={signIn}><label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className={styles.error} role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>
  </section></main>;

  return <main className={styles.adminPage}>
    <header className={styles.topbar}><div><p className="eyebrow">Qutlas operations</p><h1>Admin</h1></div><button type="button" className={styles.signOut} onClick={signOut}>Sign out</button></header>
    <div className={styles.workspace}>
      <nav className={styles.sidebar} aria-label="Admin sections"><button className={activeKey === 'overview' ? styles.activeNav : ''} onClick={() => setActiveKey('overview')}>Overview</button>{visibleModules.map((item) => <button key={item.key} className={activeKey === item.key ? styles.activeNav : ''} onClick={() => setActiveKey(item.key)}>{item.label}</button>)}</nav>
      <section className={styles.content}>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {activeKey === 'overview' ? <>
          <div className={styles.sectionHeading}><div><p className="eyebrow">Live operations</p><h2>Overview</h2></div><button className={styles.refresh} onClick={() => { setOverview(null); void adminApi(token, '/api/admin/overview').then((result) => setOverview(result as Row)).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Dashboard unavailable.')); }}>Refresh</button></div>
          {!overview ? <p>Loading live metrics…</p> : <>
            <div className={styles.metrics}>{metrics.map(([key, label]) => <article key={key}><span>{label}</span><strong>{String(overview[key] ?? '0')}</strong></article>)}</div>
            <section className={styles.statusSection}><h3>Orders by status</h3><dl>{Object.entries((overview.order_statuses as Row) ?? {}).map(([status, count]) => <div key={status}><dt>{status.replace(/_/g, ' ')}</dt><dd>{String(count)}</dd></div>)}</dl></section>
            <section className={styles.statusSection}><h3>Top sellers</h3>{Array.isArray(overview.top_products) && overview.top_products.length ? <ul>{(overview.top_products as Row[]).map((product, index) => <li key={`${product.sku_snapshot}-${index}`}>{String(product.name_snapshot)} · {String(product.quantity)} · {String(product.revenue_minor)} minor units</li>)}</ul> : <p>No paid order data yet.</p>}</section>
          </>}
        </> : activeModule ? <>
          <div className={styles.sectionHeading}><div><p className="eyebrow">Management</p><h2>{activeModule.label}</h2></div><div className={styles.sectionActions}>{rows.length > 0 && <button className={styles.refresh} onClick={exportRows}>Export CSV</button>}{activeModule.create !== false && <button className={styles.refresh} onClick={() => beginEdit(null)}>New record</button>}</div></div>
          <div className={styles.recordsLayout}>
            <div className={styles.records}>
              {!rows.length ? <p>No records found.</p> : rows.map((row) => {
                const id = String(row.id ?? row.user_id ?? row.reference ?? '');
                const title = String(row.name ?? row.full_name ?? row.reference ?? row.sku ?? row.slug ?? id);
                return <article className={styles.record} key={id}>
                  <div className={styles.recordHeading}><div><h3>{title}</h3><small>{String(row.status ?? row.role ?? row.email ?? id)}</small></div>{!['supplier-prices', 'pricing-rules', 'staff', 'inventory', 'inventory-movements'].includes(activeModule.key) && <button type="button" onClick={() => beginEdit(row)}>Edit</button>}</div>
                  <dl>{Object.entries(row).filter(([key]) => !['id', 'created_at', 'updated_at', 'password_hash'].includes(key)).slice(0, 8).map(([key, value]) => <div key={key}><dt>{key.replace(/_/g, ' ')}</dt><dd>{display(value)}</dd></div>)}</dl>
                  {activeModule.key === 'inventory' && <div className={styles.inventoryControl}>
                    <select aria-label={`Movement type for ${title}`} value={inventoryDrafts[id]?.type ?? 'receipt'} onChange={(event) => setInventoryDrafts((current) => ({ ...current, [id]: { type: event.target.value, quantity: current[id]?.quantity ?? '', reference: current[id]?.reference ?? '', notes: current[id]?.notes ?? '' } }))}><option value="receipt">Receive stock</option><option value="damage">Mark damaged</option><option value="adjustment">Correct balance</option></select>
                    <input aria-label={`Quantity for ${title}`} type="number" step="0.000001" value={inventoryDrafts[id]?.quantity ?? ''} onChange={(event) => setInventoryDrafts((current) => ({ ...current, [id]: { type: current[id]?.type ?? 'receipt', quantity: event.target.value, reference: current[id]?.reference ?? '', notes: current[id]?.notes ?? '' } }))} placeholder="Quantity" />
                    <input aria-label={`Reference for ${title}`} value={inventoryDrafts[id]?.reference ?? ''} onChange={(event) => setInventoryDrafts((current) => ({ ...current, [id]: { type: current[id]?.type ?? 'receipt', quantity: current[id]?.quantity ?? '', reference: event.target.value, notes: current[id]?.notes ?? '' } }))} placeholder="Reference" />
                    <input aria-label={`Notes for ${title}`} value={inventoryDrafts[id]?.notes ?? ''} onChange={(event) => setInventoryDrafts((current) => ({ ...current, [id]: { type: current[id]?.type ?? 'receipt', quantity: current[id]?.quantity ?? '', reference: current[id]?.reference ?? '', notes: event.target.value } }))} placeholder="Reason for movement" required />
                    <button className={styles.approve} type="button" disabled={busy || !inventoryDrafts[id]?.quantity} onClick={() => void adjustInventory(id)}>Record movement</button>
                  </div>}
                  {activeModule.key === 'pricing-rules' && <div className={styles.inventoryControl}>
                    <input aria-label={`Preview quantity for ${title}`} type="number" min="0.000001" step="0.000001" value={previewQuantities[id] ?? ''} onChange={(event) => setPreviewQuantities((current) => ({ ...current, [id]: event.target.value }))} placeholder="Preview quantity" />
                    <button className={styles.approve} type="button" onClick={() => void previewRule(id)}>Calculate price</button>
                    {pricePreviews[id] && <pre className={styles.pricePreview}>{JSON.stringify(pricePreviews[id], null, 2)}</pre>}
                  </div>}
                  {activeModule.key === 'orders' && <div className={styles.orderStatusControl}><select aria-label={`Next status for order ${title}`} value={nextStatuses[id] ?? ''} onChange={(event) => setNextStatuses((current) => ({ ...current, [id]: event.target.value }))}><option value="">Change status</option>{({
                    pending_payment: ['cancelled'],
                    payment_confirmed: ['confirmed'],
                    confirmed: ['awaiting_production'],
                    awaiting_production: ['in_production'],
                    in_production: ['quality_check'],
                    quality_check: ['in_production', 'ready_for_dispatch'],
                    ready_for_dispatch: ['dispatched'],
                    dispatched: ['delivered'],
                  }[String(row.status)] ?? []).map((status) => <option value={status} key={status}>{status.replace(/_/g, ' ')}</option>)}</select><button type="button" className={styles.approve} disabled={busy || !nextStatuses[id]} onClick={() => void changeOrderStatus(id, nextStatuses[id])}>Update status</button></div>}
                  {activeModule.key === 'orders' && roles.includes('pricing_manager') && <div className={styles.orderStatusControl}><button type="button" className={styles.refresh} onClick={() => void loadOrderPricing(id)}>View internal price snapshot</button>{orderPriceSnapshots[id]?.map((snapshot, index) => <pre className={styles.pricePreview} key={`${id}-${index}`}>{JSON.stringify(snapshot.pricing_snapshot, null, 2)}</pre>)}</div>}
                  {activeModule.key === 'pricing-rules' && row.is_approved === false && <button type="button" className={styles.approve} disabled={busy} onClick={() => void approveRule(id)}>Approve pricing rule</button>}
                  {activeModule.key === 'staff' && typeof row.user_id === 'string' && typeof row.role === 'string' && <button type="button" className={styles.approve} disabled={busy} onClick={() => void revokeStaffRole(row.user_id as string, row.role as string)}>Revoke {row.role}</button>}
                </article>;
              })}
            </div>
            {editing !== null || activeModule.create !== false ? <form className={styles.editor} onSubmit={saveRecord}>
              <h3>{editing ? 'Edit record' : 'New record'}</h3>
              {activeModule.fields.map((field) => <label key={field.key}>{field.label}{field.type === 'boolean' ? <select value={values[field.key] ?? 'false'} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}><option value="true">Yes</option><option value="false">No</option></select> : field.type === 'select' ? <select required={field.required} value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}><option value="">Select</option>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}</select> : field.type === 'json' ? <textarea required={field.required} rows={5} value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} placeholder="{}" /> : <input required={field.required} type={field.type ?? 'text'} value={values[field.key] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} />}</label>)}
              <div className={styles.editorActions}><button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>{editing && <button type="button" onClick={() => beginEdit(null)}>Cancel</button>}</div>
            </form> : null}
          </div>
        </> : <p>Choose an admin section.</p>}
      </section>
    </div>
  </main>;
}
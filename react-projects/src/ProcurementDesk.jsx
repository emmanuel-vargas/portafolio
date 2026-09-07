import React, { useEffect, useState } from 'react';
import { advanceOrder, makeOrder, ordersToCSV, transitions } from './domain';
import { Badge, Intro, Metric, money, Panel } from './shared';

const storageKey = 'ev-procurement-demo-v1';
const dueDate = days => { const date = new Date(); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
function seed() { return [
  { id: 'PO-1001', supplier: 'Nordic Components', item: 'Temperature sensors', quantity: 24, price: 38.5, due: dueDate(4), status: 'Ordered' },
  { id: 'PO-1002', supplier: 'Delta Packaging', item: 'Protective shipping kits', quantity: 120, price: 4.8, due: dueDate(-2), status: 'Approved' },
  { id: 'PO-1003', supplier: 'Atlas Electronics', item: 'Control modules', quantity: 8, price: 126, due: dueDate(8), status: 'Draft' },
  { id: 'PO-1004', supplier: 'Nordic Components', item: 'Connector assemblies', quantity: 60, price: 12, due: dueDate(-5), status: 'Received' },
  { id: 'PO-1005', supplier: 'Workshop Supply', item: 'Calibration fixtures', quantity: 3, price: 240, due: dueDate(2), status: 'Ordered' },
]; }
function loadOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(saved) || saved.length > 500) return seed();
    const ids = new Set();
    return saved.map(order => {
      if (!order || typeof order.id !== 'string' || ids.has(order.id) || !Object.hasOwn(transitions, order.status)) throw Error('Invalid saved data');
      ids.add(order.id);
      return { ...makeOrder({ ...order, price: order.price }, order.id), status: order.status };
    });
  } catch { return seed(); }
}
export default function ProcurementDesk() {
  const [orders, setOrders] = useState(loadOrders);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier: '', item: '', quantity: '1', price: '', due: dueDate(7) });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('Changes are saved in this browser only. All suppliers and orders are fictitious.');
  const [storageError, setStorageError] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(orders)); setStorageError(false); } catch { setStorageError(true); } }, [orders]);
  const filtered = orders.filter(order => (status === 'All' || order.status === status) && `${order.id} ${order.supplier} ${order.item}`.toLowerCase().includes(search.toLowerCase()));
  const outstanding = orders.filter(o => o.status !== 'Received'), late = outstanding.filter(o => o.due < dueDate(0));
  function update(order, next) { setOrders(current => current.map(o => o.id === order.id ? advanceOrder(o, next) : o)); setNotice(`${order.id} moved to ${next}.`); }
  function submit(event) {
    event.preventDefault();
    try {
      if (orders.length >= 500) throw Error('This demo supports up to 500 orders. Reset the demo to start again.');
      const max = Math.max(1000, ...orders.map(o => Number(o.id.replace('PO-', '')) || 0));
      const order = makeOrder(form, `PO-${max + 1}`);
      setOrders(current => [order, ...current]); setShowForm(false); setError(''); setForm({ supplier: '', item: '', quantity: '1', price: '', due: dueDate(7) });setSearch('');setStatus('All');setNotice(`${order.id} created as Draft.`);
    } catch(e) { setError(e.message); }
  }
  function exportCSV() {
    const url = URL.createObjectURL(new Blob(['\uFEFF' + ordersToCSV(filtered)], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'procurement-demo.csv'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice(`Exported ${filtered.length} visible orders as CSV.`);
  }
  return <>
    <Intro eyebrow="03 / BUSINESS PROCESS AUTOMATION" title="Procurement Desk" description="Keep purchasing organized, from the first draft to final receipt."><button onClick={exportCSV} disabled={!filtered.length}>Export CSV ↓</button><button className="primary" onClick={() => { setShowForm(!showForm); setError(''); }}>{showForm ? 'Close form' : '+ New order'}</button></Intro>
    <div className="metrics four"><Metric label="OPEN COMMITMENT" value={money(outstanding.reduce((s, o) => s + o.price * o.quantity, 0))} detail="All unreceived orders"/><Metric label="AWAITING APPROVAL" value={orders.filter(o => o.status === 'Draft').length} detail="Draft purchase orders"/><Metric label="IN TRANSIT" value={orders.filter(o => o.status === 'Ordered').length} detail="Ordered, awaiting receipt" tone="green"/><Metric label="OVERDUE" value={late.length} detail="Past delivery date, not received" tone="amber"/></div>
    {showForm && <Panel title="Create purchase order" meta="Starts as Draft"><form onSubmit={submit} className="order-form"><label>Supplier<input autoFocus required maxLength={80} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}/></label><label>Item description<input required maxLength={120} value={form.item} onChange={e => setForm({ ...form, item: e.target.value })}/></label><label>Quantity<input required type="number" min="1" max="100000" step="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })}/></label><label>Unit price (EUR)<input required type="number" min="0.01" max="1000000" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}/></label><label>Expected delivery<input required type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })}/></label><div className="form-action"><button type="submit" className="primary">Create draft</button><button type="button" onClick={() => setShowForm(false)}>Cancel</button></div>{error && <p role="alert" className="error">{error}</p>}</form></Panel>}
    <div className="flow-strip"><span><i>1</i> Draft</span><b>→</b><span><i>2</i> Approved</span><b>→</b><span><i>3</i> Ordered</span><b>→</b><span><i>4</i> Received</span></div>
    <Panel title="Purchase orders" meta={`${filtered.length} of ${orders.length} orders`}><div className="table-filters"><label className="search-label"><span className="sr-only">Search orders</span><input placeholder="Search order, supplier or item…" value={search} onChange={e => setSearch(e.target.value)}/></label><label><span className="sr-only">Filter status</span><select value={status} onChange={e => setStatus(e.target.value)}>{['All', ...Object.keys(transitions)].map(s => <option key={s}>{s}</option>)}</select></label></div><div className="table-wrap"><table><thead><tr><th>Order / supplier</th><th>Item</th><th>Total</th><th>Expected</th><th>Status</th><th>Next step</th></tr></thead><tbody>{filtered.map(order => <tr key={order.id}><td><strong className="mono">{order.id}</strong><small>{order.supplier}</small></td><td>{order.item}<small>{order.quantity} × {money(order.price)}</small></td><td className="amount">{money(order.quantity * order.price)}</td><td>{order.due}{order.status !== 'Received' && order.due < dueDate(0) && <small className="late">Overdue</small>}</td><td><Badge>{order.status}</Badge></td><td>{transitions[order.status].map(next => <button className="small-button" aria-label={`${next === 'Approved' ? 'Approve' : next === 'Ordered' ? 'Mark ordered' : 'Receive'} ${order.id}`} key={next} onClick={() => update(order, next)}>{next === 'Approved' ? 'Approve →' : next === 'Ordered' ? 'Mark ordered →' : 'Receive →'}</button>)}{order.status === 'Received' && <span className="muted">Complete ✓</span>}</td></tr>)}</tbody></table>{!filtered.length && <div className="empty"><h3>No matching orders</h3><p>Try another search or status filter.</p><button onClick={() => { setSearch(''); setStatus('All'); }}>Clear filters</button></div>}</div></Panel>
    <p className="notice" role="status">{notice}</p>{storageError && <p role="alert" className="error">Browser storage is unavailable. Changes will only last for this session.</p>}
    <div className="reset-row">{confirmReset ? <><span>Replace all local demo orders with the sample set?</span><button className="danger" onClick={() => { setOrders(seed()); setConfirmReset(false); setSearch(''); setStatus('All'); setNotice('Sample orders restored.'); }}>Confirm reset</button><button onClick={() => setConfirmReset(false)}>Cancel</button></> : <button className="text-button" onClick={() => setConfirmReset(true)}>Reset demo data</button>}</div>
  </>;
}

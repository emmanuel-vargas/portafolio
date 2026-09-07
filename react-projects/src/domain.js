export const sampleOrder = {
  order_id: 'DEMO-1042', customer: 'Northwind Workshop',
  items: [{ sku: 'SENSOR-A', quantity: 4, unit_price: 38.5 }, { sku: 'CABLE-B', quantity: 12, unit_price: 6 }],
};

export function transformOrder(raw, currency = 'EUR') {
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error('Invalid JSON. Check commas, quotes and brackets.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('The payload must be a JSON object.');
  if (typeof data.order_id !== 'string' || !data.order_id.trim()) throw new Error('order_id must be a non-empty string.');
  if (typeof data.customer !== 'string' || !data.customer.trim()) throw new Error('customer must be a non-empty string.');
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100) throw new Error('Provide between 1 and 100 order items.');
  if (!['EUR', 'USD'].includes(currency)) throw new Error('Unsupported currency.');
  const lines = data.items.map((item, index) => {
    if (!item || typeof item.sku !== 'string' || !item.sku.trim()) throw new Error(`Item ${index + 1}: sku is required.`);
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100000) throw new Error(`Item ${index + 1}: quantity must be an integer from 1 to 100000.`);
    if (typeof item.unit_price !== 'number' || !Number.isFinite(item.unit_price) || item.unit_price < 0 || item.unit_price > 1000000) throw new Error(`Item ${index + 1}: unit_price must be a number from 0 to 1000000.`);
    return { productCode: item.sku.trim(), units: item.quantity, unitPrice: Math.round(item.unit_price * 100) / 100 };
  });
  const totalCents = lines.reduce((sum, line) => sum + Math.round(line.unitPrice * 100) * line.units, 0);
  return { externalId: data.order_id.trim(), customerName: data.customer.trim(), currency, lines, total: totalCents / 100 };
}

export function deliveryResult(mode, attempt) {
  if (mode === 'reject') return { status: 'Rejected', code: 422, message: 'Simulated destination rejected the payload. Change the destination behavior before trying again.' };
  if (mode === 'recover' && attempt === 1) return { status: 'Retry needed', code: 503, message: 'Simulated destination unavailable. Retry this delivery to recover.' };
  return { status: 'Delivered', code: 201, message: 'Simulated destination accepted the order.' };
}

export const transitions = { Draft: ['Approved'], Approved: ['Ordered'], Ordered: ['Received'], Received: [] };
export function advanceOrder(order, next) {
  if (!transitions[order.status]?.includes(next)) throw new Error('This status transition is not allowed.');
  return { ...order, status: next };
}
export function makeOrder(form, id) {
  const quantity = Number(form.quantity), price = Number(form.price);
  if (!form.supplier?.trim() || !form.item?.trim()) throw new Error('Supplier and item are required.');
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100000) throw new Error('Quantity must be an integer from 1 to 100000.');
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) throw new Error('Unit price must be greater than zero and no more than 1,000,000.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.due) || new Date(`${form.due}T00:00:00Z`).toISOString().slice(0, 10) !== form.due) throw new Error('Choose a valid delivery date.');
  return { id, supplier: form.supplier.trim(), item: form.item.trim(), quantity, price: Math.round(price * 100) / 100, due: form.due, status: 'Draft' };
}
export function csvCell(value) {
  let text = String(value);
  // Prevent spreadsheet formula execution when user-entered fields are exported.
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export function ordersToCSV(orders) {
  const rows = [['Order', 'Supplier', 'Item', 'Quantity', 'Unit price EUR', 'Total EUR', 'Due date', 'Status'], ...orders.map(o => [o.id, o.supplier, o.item, o.quantity, o.price.toFixed(2), (o.quantity * o.price).toFixed(2), o.due, o.status])];
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

export const initialMachines = [
  { id: 'cell-a', name: 'Assembly A', product: 'Sensor modules', target: 80, total: 384, rejected: 8, history: [62, 68, 71, 65, 74, 78, 73, 77, 70, 75, 79, 76] },
  { id: 'cell-b', name: 'Assembly B', product: 'Control units', target: 60, total: 260, rejected: 5, history: [45, 48, 53, 51, 46, 56, 52, 58, 54, 50, 56, 55] },
  { id: 'cell-c', name: 'Packaging', product: 'Finished kits', target: 100, total: 492, rejected: 6, history: [87, 90, 84, 93, 89, 95, 91, 87, 94, 92, 96, 90] },
];
export function tickMachines(machines, stoppedId = null, random = Math.random) {
  return machines.map(machine => {
    const rate = machine.id === stoppedId ? 0 : Math.round(machine.target * (.7 + random() * .3));
    const produced = Math.round(rate / 6); // Every tick represents ten simulated minutes.
    const rejected = produced > 0 && random() > .85 ? 1 : 0;
    return { ...machine, total: machine.total + produced, rejected: machine.rejected + rejected, history: [...machine.history.slice(-11), rate] };
  });
}
export function machineMetrics(machines) {
  const total = machines.reduce((s, m) => s + m.total, 0), rejected = machines.reduce((s, m) => s + m.rejected, 0);
  const rate = machines.reduce((s, m) => s + m.history.at(-1), 0), target = machines.reduce((s, m) => s + m.target, 0);
  return { total, rejected, quality: total ? (total - rejected) / total * 100 : 100, performance: target ? rate / target * 100 : 0, rate, target };
}

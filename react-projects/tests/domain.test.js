import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceOrder, csvCell, deliveryResult, initialMachines, machineMetrics, makeOrder, ordersToCSV, sampleOrder, tickMachines, transformOrder } from '../src/domain.js';

test('maps a source contract and calculates totals in integer cents', () => {
  const result = transformOrder(JSON.stringify(sampleOrder));
  assert.equal(result.externalId, 'DEMO-1042'); assert.equal(result.total, 226); assert.equal(result.lines[0].units, 4);
  assert.equal(transformOrder(JSON.stringify({ ...sampleOrder, items: [{ sku: 'X', quantity: 3, unit_price: .1 }] })).total, .3);
});
test('rejects malformed input instead of coercing quantities or accepting empty orders', () => {
  for (const raw of ['{', 'null', '[]', JSON.stringify({ ...sampleOrder, items: [] }), JSON.stringify({ ...sampleOrder, items: [{ sku: 'X', quantity: '3', unit_price: 1 }] })]) assert.throws(() => transformOrder(raw));
});
test('simulated outage recovers on retry; rejection stays rejected', () => {
  assert.equal(deliveryResult('recover', 1).code, 503); assert.equal(deliveryResult('recover', 2).code, 201); assert.equal(deliveryResult('reject', 3).code, 422);
});
test('purchase workflow cannot skip approval or reopen a received order', () => {
  const draft = { status: 'Draft', id: 'PO-1' };
  assert.throws(() => advanceOrder(draft, 'Received'));
  const received = advanceOrder(advanceOrder(advanceOrder(draft, 'Approved'), 'Ordered'), 'Received');
  assert.throws(() => advanceOrder(received, 'Draft')); assert.equal(draft.status, 'Draft');
});
test('order validation rejects negative values and impossible dates', () => {
  const form = { supplier: ' Demo ', item: 'Sensor', quantity: '2', price: '10.25', due: '2026-10-01' };
  assert.equal(makeOrder(form, 'PO-1').supplier, 'Demo');
  for (const change of [{ quantity: '-1' }, { price: 'NaN' }, { due: '2026-02-30' }, { supplier: '' }]) assert.throws(() => makeOrder({ ...form, ...change }, 'PO-1'));
});
test('CSV escapes quotes and neutralizes spreadsheet formulas', () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""'); assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.match(ordersToCSV([{ id: 'PO-1', supplier: '=HYPERLINK("x")', item: 'Test', quantity: 2, price: 3, due: '2026-10-01', status: 'Draft' }]), /6\.00/);
});
test('a stopped cell produces no units and samples remain bounded', () => {
  const next = tickMachines(initialMachines, 'cell-a', () => .5);
  assert.equal(next[0].total, initialMachines[0].total); assert.equal(next[0].history.at(-1), 0); assert.equal(next[0].history.length, 12);
  assert.ok(next[1].total > initialMachines[1].total); assert.equal(initialMachines[0].history.at(-1), 76);
  assert.ok(machineMetrics(next).performance < machineMetrics(initialMachines).performance);
});

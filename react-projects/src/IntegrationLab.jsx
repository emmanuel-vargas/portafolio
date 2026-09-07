import React, { useRef, useState } from 'react';
import { deliveryResult, sampleOrder, transformOrder } from './domain';
import { Badge, Intro, Metric, Panel } from './shared';

export default function IntegrationLab() {
  const [raw, setRaw] = useState(JSON.stringify(sampleOrder, null, 2));
  const [currency, setCurrency] = useState('EUR');
  const [mode, setMode] = useState('recover');
  const [output, setOutput] = useState(null);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState('Load the sample payload, then validate and transform it.');
  const count = useRef(0);
  function invalidate() { setOutput(null); setError(''); }
  function validate() {
    try { setOutput(transformOrder(raw, currency)); setError(''); setMessage('Schema validated. The transformed order is ready to send.'); }
    catch (e) { setOutput(null); setError(e.message); setMessage('Validation failed. Correct the source payload and try again.'); }
  }
  function send() {
    if (!output) return;
    const result = deliveryResult(mode, 1);
    const job = { id: ++count.current, order: output.externalId, payload: output, attempt: 1, time: new Date().toLocaleTimeString(), ...result };
    setJobs(previous => [job, ...previous].slice(0, 20)); setMessage(result.message);
  }
  function retry(job) {
    const attempt = job.attempt + 1, result = deliveryResult(mode, attempt);
    setJobs(previous => previous.map(entry => entry.id === job.id ? { ...entry, ...result, attempt } : entry));
    setMessage(result.message);
  }
  return <>
    <Intro eyebrow="01 / SYSTEMS INTEGRATION" title="Integration Lab" description="Turn inconsistent order data into a predictable integration contract.">
      <button onClick={() => { setRaw(JSON.stringify(sampleOrder, null, 2)); invalidate(); setMessage('Sample payload restored.'); }}>Load sample</button>
    </Intro>
    <div className="metrics"><Metric label="DELIVERY ATTEMPTS" value={jobs.reduce((n, j) => n + j.attempt, 0)} detail="Current session"/><Metric label="DELIVERED" value={jobs.filter(j => j.status === 'Delivered').length} detail="Simulated HTTP 201" tone="green"/><Metric label="NEEDS ATTENTION" value={jobs.filter(j => j.status !== 'Delivered').length} detail="Retry or adjust destination" tone="amber"/></div>
    <div className="flow-strip"><span><i>1</i> Source JSON</span><b>→</b><span><i>2</i> Validate &amp; map</span><b>→</b><span><i>3</i> Simulated destination</span></div>
    <div className="two-col">
      <Panel title="Source payload" meta="Editable JSON"><label className="sr-only" htmlFor="payload">Source order JSON</label><textarea id="payload" className="code-editor" value={raw} onChange={e => { setRaw(e.target.value); invalidate(); }} spellCheck="false" maxLength={30000}/><div className="panel-controls"><label>Output currency<select value={currency} onChange={e => { setCurrency(e.target.value); invalidate(); }}><option>EUR</option><option>USD</option></select></label><button className="primary" onClick={validate}>Validate &amp; transform →</button></div><p className="hint">Currency labels the payload; it does not convert prices. Quantities must be positive integers.</p></Panel>
      <Panel title="Destination contract" meta={output ? 'Schema valid' : 'Awaiting validation'}><div className="output-code">{output ? <pre>{JSON.stringify(output, null, 2)}</pre> : <div className="empty"><span>⟷</span><h3>A clear contract starts here.</h3><p>Validate the source to preview field mapping,<br/>line items and calculated totals.</p><code>order_id → externalId<br/>customer → customerName<br/>items → lines</code></div>}</div><div className="panel-controls"><label>Destination behavior<select value={mode} onChange={e => setMode(e.target.value)}><option value="recover">503 first attempt, then recover</option><option value="success">Always accept (201)</option><option value="reject">Always reject (422)</option></select></label><button className="primary" disabled={!output} onClick={send}>Send to simulator</button></div></Panel>
    </div>
    {error && <p className="error" role="alert">{error}</p>}<p className="notice" role="status">{message}</p>
    <Panel title="Delivery activity" meta="Latest 20 deliveries"><div className="table-wrap"><table><thead><tr><th>Delivery</th><th>Order</th><th>Response</th><th>Attempts</th><th>Status</th><th>Action</th></tr></thead><tbody>{jobs.map(job => <tr key={job.id}><td className="mono">DEL-{String(job.id).padStart(3, '0')}<small>{job.time}</small></td><td>{job.order}</td><td className="mono">HTTP {job.code}</td><td>{job.attempt}</td><td><Badge>{job.status}</Badge></td><td>{job.status !== 'Delivered' ? <button className="small-button" onClick={() => retry(job)}>Retry delivery {job.id}</button> : <span className="muted">Complete</span>}</td></tr>)}</tbody></table>{!jobs.length && <p className="table-empty">No deliveries yet. Transform a payload and send it to the simulator.</p>}</div></Panel>
  </>;
}

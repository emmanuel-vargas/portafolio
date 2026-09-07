import React, { useEffect, useState } from 'react';
import { initialMachines, machineMetrics, tickMachines } from './domain';
import { Badge, Intro, Metric, Panel } from './shared';

function Trend({ history, target, name }) {
  const points = history.map((value, i) => `${24 + i * 48},${160 - value / target * 120}`).join(' ');
  return <svg viewBox="0 0 580 190" role="img" aria-label={`${name}: last ${history.length} samples, current rate ${history.at(-1)} units per hour, target ${target}`}><defs><linearGradient id={`fill-${name.replaceAll(' ', '-')}`} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#8dc8be" stopOpacity=".24"/><stop offset="1" stopColor="#8dc8be" stopOpacity="0"/></linearGradient></defs>{[40, 80, 120, 160].map(y => <line key={y} x1="24" x2="552" y1={y} y2={y} stroke="#2d393c" strokeDasharray="4 5"/>)}<polygon points={`24,160 ${points} 552,160`} fill={`url(#fill-${name.replaceAll(' ', '-')})`}/><polyline fill="none" stroke="#8dc8be" strokeWidth="3" strokeLinejoin="round" points={points}/><text x="24" y="184" fill="#a5b6ba" fontSize="11">12 samples ago</text><text x="510" y="184" fill="#a5b6ba" fontSize="11">Now</text></svg>;
}
export default function ProductionPulse() {
  const [machines, setMachines] = useState(initialMachines);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState('all');
  const [threshold, setThreshold] = useState(75);
  const [stopped, setStopped] = useState(null);
  const [ticks, setTicks] = useState(0);
  const [acknowledged, setAcknowledged] = useState([]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => { setMachines(current => tickMachines(current, stopped)); setTicks(n => n + 1); }, 2000);
    return () => clearInterval(timer);
  }, [running, stopped]);
  const visible = machines.filter(m => filter === 'all' || m.id === filter), metrics = machineMetrics(visible);
  const alerts = visible.filter(m => m.history.at(-1) / m.target * 100 < threshold);
  useEffect(() => {
    const active = machines.filter(m => m.history.at(-1) / m.target * 100 < threshold).map(m => m.id);
    setAcknowledged(previous => previous.filter(id => active.includes(id)));
  }, [machines, threshold]);
  function toggleStop() {
    if (stopped) { setStopped(null); setMachines(current => tickMachines(current)); }
    else { setStopped('cell-a'); setMachines(current => tickMachines(current, 'cell-a')); setAcknowledged(previous => previous.filter(id => id !== 'cell-a')); }
    setTicks(n => n + 1);
  }
  return <>
    <Intro eyebrow="02 / MANUFACTURING INTELLIGENCE" title="Production Pulse" description="A live simulation of connected work cells. See a disruption, trace its impact."><button onClick={() => { setMachines(initialMachines); setTicks(0); setStopped(null); setRunning(false); setAcknowledged([]); }}>Reset simulation</button><button className="primary" onClick={() => setRunning(!running)}>{running ? 'Pause simulation' : 'Start simulation'}</button></Intro>
    <div className="toolbar"><label>Work cell<select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All work cells</option>{machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label><span className="simulation-state"><i className={running ? 'live-dot' : 'paused-dot'}/>{running ? 'Simulation running' : 'Simulation paused'} · +{ticks * 10} simulated minutes</span></div>
    <div className="metrics four"><Metric label="TOTAL OUTPUT" value={metrics.total.toLocaleString()} detail={`${metrics.rejected} rejected units`}/><Metric label="CURRENT RATE" value={`${metrics.rate}/h`} detail={`Combined target ${metrics.target}/h`}/><Metric label="RATE VS. TARGET" value={`${metrics.performance.toFixed(1)}%`} detail="Current throughput / target" tone="green"/><Metric label="QUALITY" value={`${metrics.quality.toFixed(1)}%`} detail="Accepted units / total output" tone="green"/></div>
    <div className="two-col production-layout"><Panel title="Throughput trends" meta="Units per hour · 12 samples">{visible.map(machine => <div className="trend" key={machine.id}><div className="trend-heading"><div><h3>{machine.name}</h3><p>{machine.product}</p></div><div><strong>{machine.history.at(-1)}<small> / {machine.target} u/h</small></strong><Badge>{machine.history.at(-1) === 0 ? 'Stopped' : 'Running'}</Badge></div></div><Trend history={machine.history} target={machine.target} name={machine.name}/></div>)}</Panel>
      <div className="stack-panels"><Panel title="Scenario controls" meta="Try a disruption"><p className="panel-copy">Stop Assembly A to see its rate fall to zero. Restore it to resume output.</p><button className={stopped ? 'primary wide' : 'danger wide'} onClick={toggleStop}>{stopped ? 'Restore Assembly A' : 'Simulate Assembly A stop'}</button><label className="range-label">Alert below {threshold}% of target<input aria-label="Alert threshold" type="range" min="40" max="95" step="5" value={threshold} onChange={e => setThreshold(Number(e.target.value))}/></label><p className="hint">Every 2 seconds represents 10 simulated minutes. This is generated data, not a factory connection.</p></Panel>
      <Panel title="Active alerts" meta={`${alerts.length} conditions`}>{alerts.length ? alerts.map(machine => <div className="alert-card" key={machine.id}><Badge>{machine.history.at(-1) === 0 ? 'Stopped' : 'Below target'}</Badge><h3>{machine.name}</h3><p>{machine.history.at(-1)} u/h · below {threshold}% of target</p><button className="small-button" disabled={acknowledged.includes(machine.id)} onClick={() => setAcknowledged(previous => [...previous, machine.id])}>{acknowledged.includes(machine.id) ? 'Acknowledged' : `Acknowledge ${machine.name}`}</button></div>) : <div className="healthy"><span>✓</span><h3>All clear</h3><p>Selected cells are above the alert threshold.</p></div>}</Panel></div>
    </div>
  </>;
}

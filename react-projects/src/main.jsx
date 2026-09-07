import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import IntegrationLab from './IntegrationLab';
import ProductionPulse from './ProductionPulse';
import ProcurementDesk from './ProcurementDesk';
import './styles.css';

const pages = [
  { id: 'integration', name: 'Integration Lab', icon: '⟷', subtitle: 'APIs & data contracts', component: IntegrationLab },
  { id: 'production', name: 'Production Pulse', icon: '▥', subtitle: 'Monitoring & simulation', component: ProductionPulse },
  { id: 'procurement', name: 'Procurement Desk', icon: '▤', subtitle: 'Workflows & tracking', component: ProcurementDesk },
];
function App() {
  const [route, setRoute] = useState(location.hash.slice(1) || 'integration');
  useEffect(() => { const handle = () => { setRoute(location.hash.slice(1) || 'integration'); window.scrollTo(0, 0); }; window.addEventListener('hashchange', handle); return () => window.removeEventListener('hashchange', handle); }, []);
  const page = pages.find(p => p.id === route);
  useEffect(() => { document.title = `${page?.name || 'Demo not found'} | Emmanuel Vargas`; }, [page]);
  const Component = page?.component;
  return <><a href="#content" className="skip" onClick={e => { e.preventDefault(); document.getElementById('content').focus(); }}>Skip to content</a><aside className="sidebar"><a className="brand" href="../index.html">ev<span>.</span> <span className="brand-label">ENGINEERING STUDIO</span></a><div className="sidebar-caption">INTERACTIVE PROJECTS</div><nav aria-label="Project navigation">{pages.map(p => <a href={`#${p.id}`} key={p.id} aria-current={route === p.id || (!route && p.id === 'integration') ? 'page' : undefined}><span className="nav-icon">{p.icon}</span><span><strong>{p.name}</strong><small>{p.subtitle}</small></span></a>)}</nav><div className="sidebar-bottom"><p>Designed to connect.<br/>Built to explore.</p><a href="../index.html#personal-projects">← Back to portfolio</a><a href="https://github.com/emmanuel-vargas/portafolio/tree/main/react-projects" target="_blank" rel="noopener noreferrer">View React source ↗</a></div></aside><div className="workspace"><header className="topbar"><span>Emmanuel Vargas <span className="slash">/</span> <strong>{page?.name || 'Unknown project'}</strong></span><span className="demo-tag"><i/> Interactive demo · synthetic data</span></header><main id="content" tabIndex="-1">{Component ? <Component key={page.id}/> : <div className="empty"><h1>Demo not found</h1><p>Choose one of the projects in the navigation.</p><a className="button primary" href="#integration">Open Integration Lab</a></div>}<footer className="app-footer"><span>React · JavaScript · Vite</span><span>Portfolio demonstration. No external systems are connected.</span></footer></main></div></>;
}

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="empty"><h1>The demo could not load.</h1><p>Reload the page to try again.</p><button onClick={() => location.reload()}>Reload demo</button><a href="../index.html">Back to portfolio</a></main> : this.props.children; }
}
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);

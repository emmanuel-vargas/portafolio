import React from 'react';

export const money = amount => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR' }).format(amount);
export function Metric({ label, value, detail, tone = '' }) {
  return <div className={`metric ${tone}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}
export function Badge({ children }) { return <span className={`badge ${String(children).toLowerCase().replaceAll(' ', '-')}`}>{children}</span>; }
export function Panel({ title, meta, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><h2>{title}</h2>{meta && <span>{meta}</span>}</div>{children}</section>;
}
export function Intro({ eyebrow, title, description, children }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div><div className="intro-actions">{children}</div></div>;
}

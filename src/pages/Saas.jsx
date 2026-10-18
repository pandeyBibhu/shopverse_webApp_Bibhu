import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
const CATS = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports'];
export function SaasHome() {
  return <div className="page"><h2>ShopVerse Commerce Cloud</h2><p>Launch your own online store in minutes (SaaS demo).</p>
    <div className="grid">{[['free', 'Free', '3 products'], ['pro', 'Pro', '10 products']].map(([k, n, d]) => <div className="card" key={k} data-testid={'plan-' + k}><h3>{n}</h3><p>{d}</p>
      <Link to={'/saas/signup?plan=' + k}><button className="primary" data-testid={'choose-' + k}>Choose {n}</button></Link></div>)}</div>
    <p><Link to="/login" data-testid="saas-login">Already a merchant? Login</Link> · <Link to="/store/demo-store" data-testid="demo-store-link">View demo store</Link></p></div>;
}
export function SaasSignup() {
  const plan = new URLSearchParams(location.search).get('plan') || 'free'; const [f, setF] = useState({ name: '', email: '', password: '', storeName: '', plan }); const [e, setE] = useState('');
  const { signIn } = useApp(); const nav = useNavigate(); const ch = k => x => setF({ ...f, [k]: x.target.value });
  const go = async () => { try { signIn(await api('/saas/signup', { method: 'POST', body: f })); nav('/saas/dashboard'); } catch (x) { setE(x.message); } };
  return <div className="page narrow"><h2>Create your store</h2>
    {[['name', 'Your name'], ['email', 'Email'], ['password', 'Password'], ['storeName', 'Store name']].map(([k, l]) =>
      <label key={k}>{l}<input data-testid={'su-' + k} type={k === 'password' ? 'password' : 'text'} value={f[k]} onChange={ch(k)} /></label>)}
    <label>Plan<select data-testid="su-plan" value={f.plan} onChange={ch('plan')}><option value="free">Free</option><option value="pro">Pro</option></select></label>
    {e && <div className="error" data-testid="su-error">{e}</div>}<button className="primary" data-testid="su-submit" onClick={go}>Create store</button></div>;
}
export function SaasDashboard() {
  const [s, setS] = useState(null); const [tab, setTab] = useState('settings'); const [err, setErr] = useState('');
  const [p, setP] = useState({ name: '', category: 'Home', price: '', stock: '' }); const [r, setR] = useState({ name: '', percent: '', category: 'ALL' }); const { notify } = useApp();
  const load = () => api('/saas/store').then(setS); useEffect(() => { load(); }, []);
  const run = async (fn, msg) => { setErr(''); try { await fn(); if (msg) notify(msg); load(); } catch (e) { setErr(e.message); } };
  if (!s) return <div className="page">Loading...</div>;
  return <div className="page"><h2>Merchant Console: <span data-testid="store-title">{s.storeName}</span></h2>
    <div className="muted">Plan: <b data-testid="plan-badge">{s.plan}</b> · Products {s.products.length}/{s.limit} · Status: <b data-testid="store-status">{s.published ? 'PUBLISHED' : 'DRAFT'}</b></div>
    <div className="tabs">{[['settings', 'Store Settings'], ['products', 'Catalog'], ['rules', 'Price Rules'], ['publish', 'Publish']].map(([k, l]) =>
      <button key={k} className={tab === k ? 'active' : ''} data-testid={'saas-tab-' + k} onClick={() => { setTab(k); setErr(''); }}>{l}</button>)}</div>
    {err && <div className="error" data-testid="saas-error">{err}</div>}
    {tab === 'settings' && <div><label>Store name<input data-testid="st-name" value={s.storeName} onChange={e => setS({ ...s, storeName: e.target.value })} /></label>
      <label>Theme<select data-testid="st-theme" value={s.theme} onChange={e => setS({ ...s, theme: e.target.value })}><option>light</option><option>dark</option></select></label>
      <label>Currency<select data-testid="st-currency" value={s.currency} onChange={e => setS({ ...s, currency: e.target.value })}><option>INR</option><option>USD</option><option>EUR</option></select></label>
      <button className="primary" data-testid="st-save" onClick={() => run(() => api('/saas/store', { method: 'PUT', body: s }), 'Settings saved')}>Save settings</button>
      <button data-testid="upgrade-btn" disabled={s.plan === 'pro'} onClick={() => run(() => api('/saas/store/upgrade', { method: 'POST', body: { plan: 'pro' } }), 'Upgraded to Pro')}>Upgrade to Pro</button></div>}
    {tab === 'products' && <div><div className="row">
      <input data-testid="sp-name" placeholder="Name" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} />
      <select data-testid="sp-category" value={p.category} onChange={e => setP({ ...p, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
      <input data-testid="sp-price" type="number" placeholder="Price" value={p.price} onChange={e => setP({ ...p, price: e.target.value })} />
      <input data-testid="sp-stock" type="number" placeholder="Stock" value={p.stock} onChange={e => setP({ ...p, stock: e.target.value })} />
      <button className="primary" data-testid="sp-add" onClick={() => run(() => api('/saas/store/products', { method: 'POST', body: p }), 'Product added')}>Add</button></div>
      <table data-testid="saas-products"><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>
        {s.products.map(x => <tr key={x.id} data-testid="saas-product-row"><td>{x.name}</td><td>{x.category}</td><td>{x.price}</td><td>{x.stock}</td>
          <td><button data-testid="sp-delete" onClick={() => run(() => api('/saas/store/products/' + x.id, { method: 'DELETE' }))}>Delete</button></td></tr>)}</tbody></table></div>}
    {tab === 'rules' && <div><div className="row"><input data-testid="rl-name" placeholder="Rule name" value={r.name} onChange={e => setR({ ...r, name: e.target.value })} />
      <input data-testid="rl-percent" type="number" placeholder="% off" value={r.percent} onChange={e => setR({ ...r, percent: e.target.value })} />
      <select data-testid="rl-category" value={r.category} onChange={e => setR({ ...r, category: e.target.value })}><option value="ALL">ALL</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
      <button className="primary" data-testid="rl-add" onClick={() => run(() => api('/saas/store/rules', { method: 'POST', body: r }), 'Rule added')}>Add rule</button></div>
      <ul data-testid="rules-list">{s.rules.map(x => <li key={x.id} data-testid="rule-item">{x.name}: {x.percent}% off ({x.category}) <button data-testid="rl-delete" onClick={() => run(() => api('/saas/store/rules/' + x.id, { method: 'DELETE' }))}>x</button></li>)}</ul></div>}
    {tab === 'publish' && <div><p>Publishing needs at least one catalog product. Your storefront URL: <code data-testid="store-url">/store/{s.slug}</code></p>
      <label className="inline"><input type="checkbox" data-testid="publish-toggle" checked={s.published} onChange={e => run(() => api('/saas/store/publish', { method: 'POST', body: { published: e.target.checked } }), e.target.checked ? 'Store published' : 'Store unpublished')} /> Published</label>
      {s.published && <p><Link to={'/store/' + s.slug} data-testid="open-store">Open storefront</Link></p>}</div>}</div>;
}
export function Storefront() {
  const { slug } = useParams(); const [d, setD] = useState(null); const [e, setE] = useState('');
  useEffect(() => { api('/saas/public/' + slug).then(setD).catch(x => setE(x.message)); }, [slug]);
  if (e) return <div className="page" data-testid="store-error">{e}</div>; if (!d) return <div className="page">Loading...</div>;
  return <div className={'page store ' + d.theme} data-testid="storefront"><h2 data-testid="sf-title">{d.storeName}</h2>
    <div className="grid">{d.products.map(p => <div className="card" key={p.id} data-testid="sf-product"><b>{p.name}</b><div className="muted">{p.category}</div>
      {p.discount > 0 && <s data-testid="sf-old">{d.currency} {p.price}</s>}<div className="price" data-testid="sf-price">{d.currency} {p.finalPrice}</div>
      {p.discount > 0 && <span className="badge" data-testid="sf-discount">{p.discount}% OFF</span>}</div>)}</div></div>;
}

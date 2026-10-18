import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
export const Thumb = ({ name }) => <div className="thumb">{name[0]}</div>;
export default function Shop() {
  const [q, setQ] = useState({ search: '', category: '', sort: '', max: 10000, page: 1 });
  const [data, setData] = useState({ items: [], total: 0, pages: 1 }); const [cats, setCats] = useState([]);
  const { user, refreshCart, notify } = useApp(); const nav = useNavigate();
  useEffect(() => { api('/categories').then(setCats); }, []);
  useEffect(() => { api('/products?' + new URLSearchParams({ ...q, limit: 8 })).then(setData); }, [q]);
  const set = o => setQ({ ...q, page: 1, ...o });
  const add = async p => {
    if (!user) return nav('/login');
    try { await api('/cart', { method: 'POST', body: { productId: p.id, qty: 1 } }); refreshCart(); notify(`${p.name} added to cart`); } catch (e) { notify(e.message, 'error'); }
  };
  const wish = async p => {
    if (!user) return nav('/login');
    try { await api('/wishlist', { method: 'POST', body: { productId: p.id } }); notify(`${p.name} added to wishlist`); } catch (e) { notify(e.message, 'error'); }
  };
  return <div className="page"><div className="layout">
    <aside className="filters" data-testid="filters"><h3>Filters</h3>
      <label>Category<select data-testid="category-select" value={q.category} onChange={e => set({ category: e.target.value })}>
        <option value="">All</option>{cats.map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Max price: <b data-testid="price-label">₹{q.max}</b>
        <input type="range" data-testid="price-slider" min="300" max="10000" step="100" value={q.max} onChange={e => set({ max: e.target.value })} /></label>
      <fieldset><legend>Sort by</legend>
        {[['', 'Relevance'], ['price_asc', 'Price: Low to High'], ['price_desc', 'Price: High to Low'], ['rating', 'Rating']].map(([v, l]) =>
          <label key={v} className="inline"><input type="radio" name="sort" data-testid={'sort-' + (v || 'default')} checked={q.sort === v} onChange={() => set({ sort: v })} /> {l}</label>)}
      </fieldset></aside>
    <section><input className="search" data-testid="search-input" placeholder="Search products..." value={q.search} onChange={e => set({ search: e.target.value })} />
      <p data-testid="result-count">{data.total} products found</p>
      {data.items.length === 0 && <div data-testid="no-results">No products match your filters.</div>}
      <div className="grid" data-testid="product-grid">{data.items.map(p => <div className="card" key={p.id} data-testid="product-card">
        <Thumb name={p.name} /><Link to={'/product/' + p.id} data-testid="product-name" title={p.description}>{p.name}</Link>
        <div className="muted">{p.category} · ⭐ {p.rating}</div><div className="price" data-testid="product-price">₹{p.price}</div>
        <div className={p.stock < 10 ? 'low' : 'muted'}>{p.stock < 10 ? `Only ${p.stock} left!` : 'In stock'}</div>
        <button className="primary" data-testid="add-to-cart" onClick={() => add(p)}>Add to Cart</button>
        <button data-testid="add-to-wishlist" onClick={() => wish(p)}>♡ Wishlist</button></div>)}</div>
      <div className="pager" data-testid="pagination">
        <button data-testid="prev-page" disabled={q.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })}>Prev</button>
        <span data-testid="page-info">Page {q.page} of {data.pages}</span>
        <button data-testid="next-page" disabled={q.page >= data.pages} onClick={() => setQ({ ...q, page: q.page + 1 })}>Next</button></div>
    </section></div></div>;
}

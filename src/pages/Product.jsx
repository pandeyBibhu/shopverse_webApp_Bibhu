import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
import { Thumb } from './Shop.jsx';
export default function Product() {
  const { id } = useParams(); const [p, setP] = useState(null); const [qty, setQty] = useState(1); const [tab, setTab] = useState('desc');
  const [revs, setRevs] = useState([]); const [rv, setRv] = useState({ rating: '5', comment: '' }); const [rerr, setRerr] = useState('');
  const { user, refreshCart, notify } = useApp(); const nav = useNavigate();
  const load = () => { api('/products/' + id).then(setP).catch(() => setP(false)); api(`/products/${id}/reviews`).then(setRevs); };
  useEffect(load, [id]);
  if (p === false) return <div className="page" data-testid="product-missing">Product not found</div>;
  if (!p) return <div className="page">Loading...</div>;
  const add = async go => {
    if (!user) return nav('/login');
    try { await api('/cart', { method: 'POST', body: { productId: p.id, qty } }); refreshCart(); notify('Added to cart'); if (go) nav('/cart'); } catch (e) { notify(e.message, 'error'); }
  };
  const wish = async () => {
    if (!user) return nav('/login');
    try { await api('/wishlist', { method: 'POST', body: { productId: p.id } }); notify('Added to wishlist'); } catch (e) { notify(e.message, 'error'); }
  };
  const submitReview = async () => { setRerr('');
    try { await api(`/products/${id}/reviews`, { method: 'POST', body: rv }); notify('Review submitted'); setRv({ rating: '5', comment: '' }); load(); } catch (e) { setRerr(e.message); } };
  return <div className="page"><div className="detail"><Thumb name={p.name} />
    <div><h2 data-testid="pd-name">{p.name}</h2><div className="muted">{p.category} · ⭐ <span data-testid="pd-rating">{p.rating}</span> ({p.reviewCount} reviews)</div>
      <div className="price big" data-testid="pd-price">₹{p.price}</div><div data-testid="pd-stock">Stock: {p.stock}</div>
      <label>Qty <input type="number" min="1" max={p.stock} data-testid="qty-input" value={qty} onChange={e => setQty(+e.target.value)} /></label>
      <div><button className="primary" data-testid="pd-add" onClick={() => add(false)}>Add to Cart</button>
        <button data-testid="pd-buy" onClick={() => add(true)}>Buy Now</button>
        <button data-testid="pd-wishlist" onClick={wish}>♡ Add to Wishlist</button></div></div></div>
    <div className="tabs" data-testid="pd-tabs">{[['desc', 'Description'], ['specs', 'Specifications'], ['reviews', 'Reviews']].map(([k, l]) =>
      <button key={k} className={tab === k ? 'active' : ''} data-testid={'tab-' + k} onClick={() => setTab(k)}>{l}</button>)}</div>
    <div className="tabpanel" data-testid="tab-content">{tab === 'desc' && p.description}
      {tab === 'specs' && <table><tbody><tr><td>Brand</td><td>ShopVerse</td></tr><tr><td>Warranty</td><td>1 year</td></tr></tbody></table>}
      {tab === 'reviews' && <div data-testid="reviews-panel"><p data-testid="avg-rating">Rated {p.rating} / 5 from {revs.length} review(s)</p>
        {user?.role === 'customer' && <div data-testid="review-form"><label>Rating<select data-testid="rv-rating" value={rv.rating} onChange={e => setRv({ ...rv, rating: e.target.value })}>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}</select></label>
          <label>Comment<textarea data-testid="rv-comment" value={rv.comment} onChange={e => setRv({ ...rv, comment: e.target.value })} /></label>
          {rerr && <div className="error" data-testid="rv-error">{rerr}</div>}
          <button className="primary" data-testid="rv-submit" onClick={submitReview}>Submit review</button></div>}
        {revs.length === 0 && <p data-testid="no-reviews">No reviews yet.</p>}
        <ul data-testid="review-list">{revs.map(r => <li key={r.id} data-testid="review-item">⭐ {r.rating} <b>{r.userName}</b>: {r.comment}</li>)}</ul></div>}</div></div>;
}

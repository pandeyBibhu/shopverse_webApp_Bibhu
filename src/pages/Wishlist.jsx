import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
export default function Wishlist() {
  const [items, setItems] = useState([]); const { refreshCart, notify } = useApp();
  useEffect(() => { api('/wishlist').then(setItems); }, []);
  const remove = async id => setItems(await api('/wishlist/' + id, { method: 'DELETE' }));
  const move = async id => { try { const d = await api(`/wishlist/${id}/move-to-cart`, { method: 'POST' }); setItems(d.wishlist); refreshCart(); notify('Moved to cart'); } catch (e) { notify(e.message, 'error'); } };
  return <div className="page"><h2>My Wishlist</h2>{items.length === 0 ? <div data-testid="empty-wishlist">Your wishlist is empty. <Link to="/">Browse products</Link></div> :
    <table data-testid="wishlist-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead><tbody>
      {items.map(p => <tr key={p.id} data-testid="wishlist-row"><td><Link to={'/product/' + p.id}>{p.name}</Link></td><td>₹{p.price}</td><td>{p.stock}</td>
        <td><button className="primary" data-testid="wl-move" onClick={() => move(p.id)}>Move to cart</button><button data-testid="wl-remove" onClick={() => remove(p.id)}>Remove</button></td></tr>)}</tbody></table>}</div>;
}

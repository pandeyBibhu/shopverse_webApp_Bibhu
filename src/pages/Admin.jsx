import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
const empty = { name: '', category: 'Electronics', price: '', stock: '', description: '' };
export default function Admin() {
  const [tab, setTab] = useState('dash'); const [stats, setStats] = useState({}); const [prods, setProds] = useState([]); const [orders, setOrders] = useState([]); const [users, setUsers] = useState([]); const [rets, setRets] = useState([]); const [revs, setRevs] = useState([]);
  const [form, setForm] = useState(null); const [err, setErr] = useState(''); const [filter, setFilter] = useState(''); const { notify } = useApp();
  const load = () => { api('/admin/stats').then(setStats); api('/products?limit=500').then(d => setProds(d.items)); api('/admin/orders').then(setOrders); api('/admin/users').then(setUsers); api('/admin/returns').then(setRets); api('/admin/reviews').then(setRevs); };
  useEffect(load, []);
  const save = async () => { setErr(''); try {
    await api(form.id ? '/admin/products/' + form.id : '/admin/products', { method: form.id ? 'PUT' : 'POST', body: form });
    notify(form.id ? 'Product updated' : 'Product created'); setForm(null); load(); } catch (e) { setErr(e.message); } };
  const del = async p => { if (!window.confirm('Delete ' + p.name + '?')) return; await api('/admin/products/' + p.id, { method: 'DELETE' }); notify('Product deleted'); load(); };
  const status = async (id, s) => { try { await api(`/admin/orders/${id}/status`, { method: 'PUT', body: { status: s } }); notify('Status updated'); load(); } catch (e) { notify(e.message, 'error'); } };
  const retAct = async (id, st) => { try { await api('/admin/returns/' + id, { method: 'PUT', body: { status: st } }); notify('Return ' + st.toLowerCase()); load(); } catch (e) { notify(e.message, 'error'); } };
  const delRev = async id => { if (!window.confirm('Delete this review?')) return; await api('/admin/reviews/' + id, { method: 'DELETE' }); notify('Review deleted'); load(); };
  const ch = k => e => setForm({ ...form, [k]: e.target.value });
  return <div className="page"><h2>Admin Panel</h2>
    <div className="tabs">{[['dash', 'Dashboard'], ['prods', 'Products'], ['orders', 'Orders'], ['returns', 'Returns'], ['reviews', 'Reviews'], ['users', 'Users']].map(([k, l]) =>
      <button key={k} className={tab === k ? 'active' : ''} data-testid={'admin-tab-' + k} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'dash' && <div className="stats" data-testid="admin-stats">{[['users', 'Users'], ['products', 'Products'], ['orders', 'Orders'], ['revenue', 'Revenue (₹)'], ['refunds', 'Refunds (₹)'], ['pendingReturns', 'Pending returns'], ['reviews', 'Reviews'], ['lowStock', 'Low stock']].map(([k, l]) =>
      <div className="stat" key={k}><div className="muted">{l}</div><b data-testid={'stat-' + k}>{stats[k]}</b></div>)}</div>}
    {tab === 'prods' && <div><button className="primary" data-testid="add-product-btn" onClick={() => setForm(empty)}>+ Add Product</button>
      <input className="search" data-testid="admin-product-search" placeholder="Filter by name" value={filter} onChange={e => setFilter(e.target.value)} />
      <table data-testid="admin-products-table"><thead><tr><th>ID</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
        {prods.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())).map(p => <tr key={p.id} data-testid="admin-product-row"><td>{p.id}</td><td>{p.name}</td><td>{p.category}</td><td>₹{p.price}</td><td>{p.stock}</td>
          <td><button data-testid="edit-product" onClick={() => setForm(p)}>Edit</button><button data-testid="delete-product" onClick={() => del(p)}>Delete</button></td></tr>)}</tbody></table></div>}
    {tab === 'orders' && <table data-testid="admin-orders-table"><thead><tr><th>ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Change</th></tr></thead><tbody>
      {orders.map(o => <tr key={o.id} data-testid="admin-order-row"><td>{o.id}</td><td>{o.userEmail}</td><td>₹{o.total}</td><td data-testid="admin-order-status">{o.status}</td>
        <td><select data-testid="status-select" value="" onChange={e => e.target.value && status(o.id, e.target.value)}><option value="">Select...</option>
          {['SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>}
    {tab === 'returns' && <table data-testid="admin-returns-table"><thead><tr><th>ID</th><th>Order</th><th>Customer</th><th>Item</th><th>Reason</th><th>Status</th><th>Refund</th><th>Actions</th></tr></thead><tbody>
      {rets.map(r => <tr key={r.id} data-testid="admin-return-row"><td>{r.id}</td><td>{r.orderId}</td><td>{r.userEmail}</td><td>{r.productName} x{r.qty}</td><td>{r.reason}</td>
        <td data-testid="admin-return-status">{r.status}</td><td>₹{r.refundAmount}</td><td>
          {r.status === 'REQUESTED' && <><button data-testid="approve-return" onClick={() => retAct(r.id, 'APPROVED')}>Approve</button><button data-testid="reject-return" onClick={() => retAct(r.id, 'REJECTED')}>Reject</button></>}
          {r.status === 'APPROVED' && <button data-testid="refund-return" onClick={() => retAct(r.id, 'REFUNDED')}>Issue refund</button>}</td></tr>)}</tbody></table>}
    {tab === 'reviews' && <table data-testid="admin-reviews-table"><thead><tr><th>ID</th><th>Product</th><th>User</th><th>Rating</th><th>Comment</th><th></th></tr></thead><tbody>
      {revs.map(r => <tr key={r.id} data-testid="admin-review-row"><td>{r.id}</td><td>{r.productName}</td><td>{r.userName}</td><td>{r.rating}</td><td>{r.comment}</td>
        <td><button data-testid="delete-review" onClick={() => delRev(r.id)}>Delete</button></td></tr>)}</tbody></table>}
    {tab === 'users' && <table data-testid="admin-users-table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
      {users.map(u => <tr key={u.id} data-testid="admin-user-row"><td>{u.id}</td><td>{u.name}</td><td>{u.email}</td><td>{u.role}</td></tr>)}</tbody></table>}
    {form && <div className="modal-bg"><div className="modal" role="dialog" data-testid="product-modal"><h3>{form.id ? 'Edit' : 'Add'} Product</h3>
      <label>Name<input data-testid="pf-name" value={form.name} onChange={ch('name')} /></label>
      <label>Category<select data-testid="pf-category" value={form.category} onChange={ch('category')}>{['Electronics', 'Fashion', 'Home', 'Books', 'Sports'].map(c => <option key={c}>{c}</option>)}</select></label>
      <label>Price<input type="number" data-testid="pf-price" value={form.price} onChange={ch('price')} /></label>
      <label>Stock<input type="number" data-testid="pf-stock" value={form.stock} onChange={ch('stock')} /></label>
      <label>Description<textarea data-testid="pf-desc" value={form.description} onChange={ch('description')} /></label>
      {err && <div className="error" data-testid="pf-error">{err}</div>}
      <button className="primary" data-testid="pf-save" onClick={save}>Save</button><button data-testid="pf-cancel" onClick={() => { setForm(null); setErr(''); }}>Cancel</button></div></div>}</div>;
}

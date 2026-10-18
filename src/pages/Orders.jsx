import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
export function Cart() {
  const [c, setC] = useState({ items: [], subtotal: 0 }); const { refreshCart, notify } = useApp();
  const load = () => api('/cart').then(setC).then(refreshCart); useEffect(() => { load(); }, []);
  const upd = async (pid, qty) => { try { setC(await api('/cart/' + pid, { method: 'PUT', body: { qty } })); refreshCart(); } catch (e) { notify(e.message, 'error'); } };
  const del = async pid => { setC(await api('/cart/' + pid, { method: 'DELETE' })); refreshCart(); };
  return <div className="page"><h2>Shopping Cart</h2>
    {c.items.length === 0 ? <div data-testid="empty-cart">Your cart is empty. <Link to="/">Continue shopping</Link></div> :
      <><table data-testid="cart-table"><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th><th></th></tr></thead>
        <tbody>{c.items.map(i => <tr key={i.productId} data-testid="cart-row"><td data-testid="cart-name">{i.product.name}</td><td>₹{i.product.price}</td>
          <td><button data-testid="qty-minus" disabled={i.qty <= 1} onClick={() => upd(i.productId, i.qty - 1)}>-</button>
            <span data-testid="cart-qty" className="qty">{i.qty}</span><button data-testid="qty-plus" onClick={() => upd(i.productId, i.qty + 1)}>+</button></td>
          <td data-testid="cart-subtotal">₹{i.subtotal}</td><td><button data-testid="remove-item" onClick={() => del(i.productId)}>Remove</button></td></tr>)}</tbody></table>
        <h3 data-testid="cart-total">Subtotal: ₹{c.subtotal}</h3><Link to="/checkout"><button className="primary" data-testid="checkout-btn">Proceed to Checkout</button></Link></>}</div>;
}
export function Checkout() {
  const [step, setStep] = useState(1); const [cart, setCart] = useState({ items: [], subtotal: 0 }); const [err, setErr] = useState('');
  const [a, setA] = useState({ name: '', line: '', city: '', pin: '', phone: '' }); const [pay, setPay] = useState(''); const [date, setDate] = useState('');
  const [code, setCode] = useState(''); const [cp, setCp] = useState(null); const [done, setDone] = useState(null); const [gift, setGift] = useState(false);
  const { refreshCart } = useApp(); const nav = useNavigate();
  useEffect(() => { api('/cart').then(setCart); }, []);
  const ch = k => e => setA({ ...a, [k]: e.target.value });
  const next = () => { setErr('');
    if (step === 1 && (!a.name || !a.line || !a.city || !/^\d{6}$/.test(a.pin))) return setErr('Enter name, address, city and a 6-digit pin');
    if (step === 2 && !pay) return setErr('Select a payment method'); setStep(step + 1); };
  const applyCoupon = async () => { setErr(''); try { setCp(await api('/coupons/validate', { method: 'POST', body: { code } })); } catch (e) { setCp(null); setErr(e.message); } };
  const place = async () => { try { setDone(await api('/orders', { method: 'POST', body: { address: a, payment: pay, coupon: cp ? code : '', deliveryDate: date } })); refreshCart(); } catch (e) { setErr(e.message); } };
  if (done) return <div className="page" data-testid="order-success"><h2>🎉 Order placed!</h2><p>Order ID: <b data-testid="order-id">{done.id}</b></p>
    <p>Total paid: ₹{done.total}</p><button data-testid="view-orders" onClick={() => nav('/orders')}>View my orders</button></div>;
  const t = cp || { discount: 0, shipping: cart.subtotal >= 999 ? 0 : 49 }; const total = cart.subtotal - t.discount + (cp ? cp.shipping : t.shipping);
  return <div className="page narrow"><h2>Checkout</h2><div className="steps" data-testid="steps">Step {step} of 3: {['Address', 'Payment', 'Review'][step - 1]}</div>
    {step === 1 && <div data-testid="step-address">
      <label>Full name<input data-testid="addr-name" value={a.name} onChange={ch('name')} /></label>
      <label>Address<textarea data-testid="addr-line" value={a.line} onChange={ch('line')} /></label>
      <label>City<input data-testid="addr-city" value={a.city} onChange={ch('city')} /></label>
      <label>Pin code<input data-testid="addr-pin" value={a.pin} onChange={ch('pin')} /></label>
      <label>Phone<input data-testid="addr-phone" value={a.phone} onChange={ch('phone')} /></label>
      <label>Delivery date<input type="date" data-testid="delivery-date" value={date} onChange={e => setDate(e.target.value)} /></label></div>}
    {step === 2 && <div data-testid="step-payment"><fieldset><legend>Payment method</legend>
      {[['COD', 'Cash on Delivery'], ['CARD', 'Credit / Debit Card'], ['UPI', 'UPI']].map(([v, l]) =>
        <label key={v} className="inline"><input type="radio" name="pay" data-testid={'pay-' + v} checked={pay === v} onChange={() => setPay(v)} /> {l}</label>)}</fieldset>
      <label className="inline"><input type="checkbox" data-testid="gift-wrap" checked={gift} onChange={e => setGift(e.target.checked)} /> Gift wrap</label>
      <label>Coupon code<input data-testid="coupon-input" value={code} onChange={e => setCode(e.target.value)} /></label>
      <button data-testid="apply-coupon" onClick={applyCoupon}>Apply</button>{cp && <span className="ok" data-testid="coupon-ok"> Coupon applied: -₹{cp.discount}</span>}</div>}
    {step === 3 && <div data-testid="step-review"><p>Ship to: {a.name}, {a.line}, {a.city} - {a.pin}</p><p>Payment: {pay}</p>
      <p data-testid="rv-subtotal">Subtotal: ₹{cart.subtotal}</p><p data-testid="rv-discount">Discount: ₹{t.discount}</p>
      <p data-testid="rv-shipping">Shipping: ₹{cp ? cp.shipping : t.shipping}</p><h3 data-testid="rv-total">Total: ₹{total}</h3></div>}
    {err && <div className="error" data-testid="checkout-error">{err}</div>}
    <div>{step > 1 && <button data-testid="back-btn" onClick={() => setStep(step - 1)}>Back</button>}
      {step < 3 ? <button className="primary" data-testid="next-btn" onClick={next}>Next</button> : <button className="primary" data-testid="place-order" onClick={place}>Place Order</button>}</div></div>;
}
export function Orders() {
  const [o, setO] = useState([]); const [rets, setRets] = useState([]); const { notify } = useApp();
  const [rf, setRf] = useState(null); const [err, setErr] = useState('');
  const load = () => { api('/orders').then(setO); api('/returns').then(setRets); }; useEffect(() => { load(); }, []);
  const cancel = async id => { if (!window.confirm('Cancel this order?')) return; try { await api(`/orders/${id}/cancel`, { method: 'POST' }); notify('Order cancelled'); load(); } catch (e) { notify(e.message, 'error'); } };
  const startReturn = r => setRf({ orderId: r.id, items: r.items, productId: r.items[0].productId, reason: 'Damaged item', note: '' });
  const submitReturn = async () => { setErr(''); try {
    await api(`/orders/${rf.orderId}/returns`, { method: 'POST', body: { productId: rf.productId, reason: rf.note ? `${rf.reason}: ${rf.note}` : rf.reason } });
    notify('Return requested'); setRf(null); load(); } catch (e) { setErr(e.message); } };
  return <div className="page"><h2>My Orders</h2>{o.length === 0 ? <div data-testid="no-orders">No orders yet.</div> :
    <table data-testid="orders-table"><thead><tr><th>ID</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>
      {o.map(r => <tr key={r.id} data-testid="order-row"><td>{r.id}</td><td>{r.items.map(i => `${i.name} x${i.qty}`).join(', ')}</td><td>₹{r.total}</td>
        <td><span className={'status ' + r.status} data-testid="order-status">{r.status}</span></td>
        <td>{r.status === 'PLACED' && <button data-testid="cancel-order" onClick={() => cancel(r.id)}>Cancel</button>}
          {r.status === 'DELIVERED' && <button data-testid="return-order" onClick={() => startReturn(r)}>Return item</button>}</td></tr>)}</tbody></table>}
    {rf && <div className="tabpanel" data-testid="return-form"><h3>Return request - order {rf.orderId}</h3>
      <label>Item<select data-testid="rt-item" value={rf.productId} onChange={e => setRf({ ...rf, productId: +e.target.value })}>{rf.items.map(i => <option key={i.productId} value={i.productId}>{i.name}</option>)}</select></label>
      <label>Reason<select data-testid="rt-reason" value={rf.reason} onChange={e => setRf({ ...rf, reason: e.target.value })}>
        {['Damaged item', 'Wrong item delivered', 'No longer needed', 'Other'].map(x => <option key={x}>{x}</option>)}</select></label>
      <label>Notes (optional)<textarea data-testid="rt-note" value={rf.note} onChange={e => setRf({ ...rf, note: e.target.value })} /></label>
      {err && <div className="error" data-testid="rt-error">{err}</div>}
      <button className="primary" data-testid="rt-submit" onClick={submitReturn}>Submit return</button><button data-testid="rt-cancel" onClick={() => { setRf(null); setErr(''); }}>Close</button></div>}
    <h2>My Returns</h2>{rets.length === 0 ? <div data-testid="no-returns">No returns yet.</div> :
    <table data-testid="returns-table"><thead><tr><th>ID</th><th>Order</th><th>Item</th><th>Reason</th><th>Status</th><th>Refund</th></tr></thead><tbody>
      {rets.map(r => <tr key={r.id} data-testid="return-row"><td>{r.id}</td><td>{r.orderId}</td><td>{r.productName}</td><td>{r.reason}</td>
        <td data-testid="return-status">{r.status}</td><td data-testid="return-refund">₹{r.refundAmount}</td></tr>)}</tbody></table>}</div>;
}

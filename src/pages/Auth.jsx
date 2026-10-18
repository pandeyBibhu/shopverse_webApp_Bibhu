import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../ctx.jsx';
const home = r => (r === 'admin' ? '/admin' : r === 'merchant' ? '/saas/dashboard' : '/');
export function Login() {
  const [f, setF] = useState({ email: '', password: '' }); const [e, setE] = useState(''); const [show, setShow] = useState(false);
  const { signIn } = useApp(); const nav = useNavigate();
  const submit = async ev => { ev.preventDefault(); setE('');
    try { const d = await api('/auth/login', { method: 'POST', body: f }); signIn(d); nav(home(d.user.role)); } catch (x) { setE(x.message); } };
  return <div className="page narrow"><h2>Login</h2>
    <form onSubmit={submit} data-testid="login-form">
      <label>Email<input id="email" data-testid="login-email" value={f.email} onChange={x => setF({ ...f, email: x.target.value })} /></label>
      <label>Password<input id="password" data-testid="login-password" type={show ? 'text' : 'password'} value={f.password} onChange={x => setF({ ...f, password: x.target.value })} /></label>
      <label className="inline"><input type="checkbox" data-testid="show-password" checked={show} onChange={x => setShow(x.target.checked)} /> Show password</label>
      {e && <div className="error" data-testid="login-error">{e}</div>}
      <button type="submit" data-testid="login-submit" className="primary">Login</button>
    </form>
    <p>New here? <Link to="/register">Create an account</Link></p>
    <p className="hint">Demo: user@shop.com / User@123 | admin@shop.com / Admin@123 | merchant@saas.com / Merchant@123</p></div>;
}
export function Register() {
  const [f, setF] = useState({ name: '', email: '', password: '', terms: false }); const [e, setE] = useState('');
  const { signIn } = useApp(); const nav = useNavigate();
  const submit = async ev => { ev.preventDefault(); setE('');
    if (!f.terms) return setE('Please accept the terms');
    try { signIn(await api('/auth/register', { method: 'POST', body: f })); nav('/'); } catch (x) { setE(x.message); } };
  return <div className="page narrow"><h2>Register</h2>
    <form onSubmit={submit} data-testid="register-form">
      <label>Name<input data-testid="reg-name" value={f.name} onChange={x => setF({ ...f, name: x.target.value })} /></label>
      <label>Email<input data-testid="reg-email" value={f.email} onChange={x => setF({ ...f, email: x.target.value })} /></label>
      <label>Password<input data-testid="reg-password" type="password" value={f.password} onChange={x => setF({ ...f, password: x.target.value })} /></label>
      <label className="inline"><input type="checkbox" data-testid="reg-terms" checked={f.terms} onChange={x => setF({ ...f, terms: x.target.checked })} /> I accept the terms</label>
      {e && <div className="error" data-testid="register-error">{e}</div>}
      <button type="submit" data-testid="register-submit" className="primary">Sign up</button>
    </form></div>;
}

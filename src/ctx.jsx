import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
const Ctx = createContext();
export const useApp = () => useContext(Ctx);
export function Provider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const refreshCart = useCallback(() => {
    if (user?.role !== 'customer') return setCartCount(0);
    api('/cart').then(c => setCartCount(c.items.reduce((s, i) => s + i.qty, 0))).catch(() => {});
  }, [user]);
  useEffect(refreshCart, [refreshCart]);
  const signIn = d => { localStorage.setItem('token', d.token); localStorage.setItem('user', JSON.stringify(d.user)); setUser(d.user); };
  const signOut = () => { localStorage.clear(); setUser(null); setCartCount(0); };
  return <Ctx.Provider value={{ user, signIn, signOut, cartCount, refreshCart, notify }}>
    {children}
    {toast && <div data-testid="toast" className={'toast ' + toast.type} role="alert">{toast.msg}</div>}
  </Ctx.Provider>;
}

import React from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Provider, useApp } from './ctx.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import { Cart, Checkout, Orders } from './pages/Orders.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Wishlist from './pages/Wishlist.jsx';
import WebElements, { WebElementsChild } from './pages/WebElements.jsx';
import Admin from './pages/Admin.jsx';
import { SaasHome, SaasSignup, SaasDashboard, Storefront } from './pages/Saas.jsx';

function Guard({ role, children }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <div className="page" data-testid="forbidden"><h2>403 - Access denied</h2></div>;
  return children;
}
function Nav() {
  const { user, signOut, cartCount } = useApp(); const nav = useNavigate();
  return <header className="nav" data-testid="navbar">
    <Link to="/" className="brand" data-testid="nav-home">ShopVerse</Link>
    <nav>
      <Link to="/" data-testid="nav-shop">Shop</Link>
      <Link to="/saas" data-testid="nav-saas">SaaS</Link>
      <Link to="/webelements" data-testid="nav-webelements">WebElements</Link>
      {user?.role === 'customer' && <><Link to="/orders" data-testid="nav-orders">My Orders</Link>
        <Link to="/wishlist" data-testid="nav-wishlist">Wishlist</Link>
        <Link to="/cart" data-testid="nav-cart">Cart <span className="badge" data-testid="cart-count">{cartCount}</span></Link></>}
      {user?.role === 'admin' && <Link to="/admin" data-testid="nav-admin">Admin</Link>}
      {user?.role === 'merchant' && <Link to="/saas/dashboard" data-testid="nav-merchant">My Store</Link>}
      {user ? <><span data-testid="nav-user">Hi, {user.name}</span>
        <button data-testid="logout-btn" onClick={() => { signOut(); nav('/login'); }}>Logout</button></>
        : <><Link to="/login" data-testid="nav-login">Login</Link><Link to="/register" data-testid="nav-register">Register</Link></>}
    </nav>
  </header>;
}
export default function App() {
  return <Provider><Nav /><Routes>
    <Route path="/" element={<Shop />} />
    <Route path="/product/:id" element={<Product />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/cart" element={<Guard role="customer"><Cart /></Guard>} />
    <Route path="/checkout" element={<Guard role="customer"><Checkout /></Guard>} />
    <Route path="/wishlist" element={<Guard role="customer"><Wishlist /></Guard>} />
    <Route path="/orders" element={<Guard role="customer"><Orders /></Guard>} />
    <Route path="/admin" element={<Guard role="admin"><Admin /></Guard>} />
    <Route path="/saas" element={<SaasHome />} />
    <Route path="/saas/signup" element={<SaasSignup />} />
    <Route path="/saas/dashboard" element={<Guard role="merchant"><SaasDashboard /></Guard>} />
    <Route path="/store/:slug" element={<Storefront />} />
    <Route path="/webelements" element={<WebElements />} />
    <Route path="/webelements/child" element={<WebElementsChild />} />
    <Route path="*" element={<div className="page" data-testid="not-found"><h2>404 - Page not found</h2></div>} />
  </Routes></Provider>;
}

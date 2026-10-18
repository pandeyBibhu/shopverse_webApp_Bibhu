// ShopVerse API - Express + built-in SQLite (node:sqlite, needs Node 22.5+). Data file: server/shopverse.db
const express = require('express'), cors = require('cors'), path = require('path');
const { DatabaseSync } = require('node:sqlite');
const D = new DatabaseSync(process.env.DB_FILE || path.join(__dirname, 'shopverse.db'));
const app = express(); app.use(cors(), express.json());
const q = (sql, ...p) => D.prepare(sql).all(...p), one = (sql, ...p) => D.prepare(sql).get(...p), run = (sql, ...p) => D.prepare(sql).run(...p);
const tx = fn => { D.exec('BEGIN'); try { const r = fn(); D.exec('COMMIT'); return r; } catch (e) { D.exec('ROLLBACK'); throw e; } };

const CATS = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports'];
const NAMES = {
  Electronics: ['Wireless Headphones', 'Smart Watch', 'Bluetooth Speaker', '4K Monitor', 'Gaming Mouse'],
  Fashion: ['Denim Jacket', 'Running Shoes', 'Leather Wallet', 'Sunglasses', 'Cotton T-Shirt'],
  Home: ['Coffee Maker', 'Desk Lamp', 'Air Purifier', 'Cookware Set', 'Vacuum Cleaner'],
  Books: ['JavaScript Guide', 'Testing Handbook', 'Clean Code', 'Sci-Fi Novel', 'Cooking Basics'],
  Sports: ['Yoga Mat', 'Dumbbell Set', 'Cricket Bat', 'Football', 'Cycling Helmet']
};
const COUPONS = { SAVE10: { type: 'pct', v: 10 }, FLAT200: { type: 'flat', v: 200 } };
const PLANS = { free: 3, pro: 10 };
const TABLES = ['users', 'tokens', 'products', 'cart', 'orders', 'order_items', 'tenants', 'tenant_products', 'tenant_rules', 'reviews', 'wishlist', 'returns'];

function init() {
  D.exec(`
  CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,email TEXT UNIQUE,password TEXT,role TEXT);
  CREATE TABLE IF NOT EXISTS tokens(token TEXT PRIMARY KEY,user_id INTEGER);
  CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,category TEXT,price INTEGER,rating REAL,stock INTEGER,description TEXT);
  CREATE TABLE IF NOT EXISTS cart(user_id INTEGER,product_id INTEGER,qty INTEGER,PRIMARY KEY(user_id,product_id));
  CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,user_email TEXT,address TEXT,payment TEXT,delivery_date TEXT,subtotal INTEGER,discount INTEGER,shipping INTEGER,total INTEGER,status TEXT,created_at TEXT,delivered_at TEXT);
  CREATE TABLE IF NOT EXISTS order_items(order_id INTEGER,product_id INTEGER,name TEXT,qty INTEGER,price INTEGER);
  CREATE TABLE IF NOT EXISTS tenants(id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id INTEGER,slug TEXT UNIQUE,store_name TEXT,theme TEXT,currency TEXT,plan TEXT,published INTEGER);
  CREATE TABLE IF NOT EXISTS tenant_products(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER,name TEXT,category TEXT,price INTEGER,stock INTEGER);
  CREATE TABLE IF NOT EXISTS tenant_rules(id INTEGER PRIMARY KEY AUTOINCREMENT,tenant_id INTEGER,name TEXT,percent INTEGER,category TEXT);
  CREATE TABLE IF NOT EXISTS reviews(id INTEGER PRIMARY KEY AUTOINCREMENT,product_id INTEGER,user_id INTEGER,user_name TEXT,rating INTEGER,comment TEXT,created_at TEXT,UNIQUE(product_id,user_id));
  CREATE TABLE IF NOT EXISTS wishlist(user_id INTEGER,product_id INTEGER,PRIMARY KEY(user_id,product_id));
  CREATE TABLE IF NOT EXISTS returns(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,product_id INTEGER,product_name TEXT,qty INTEGER,user_id INTEGER,user_email TEXT,reason TEXT,status TEXT,refund_amount INTEGER,created_at TEXT);`);
  if (one('SELECT COUNT(*) n FROM users').n) return;
  tx(() => {
    [['Admin User', 'admin@shop.com', 'Admin@123', 'admin'], ['Test User', 'user@shop.com', 'User@123', 'customer'], ['Demo Merchant', 'merchant@saas.com', 'Merchant@123', 'merchant']]
      .forEach(u => run('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)', ...u));
    let id = 1;
    CATS.forEach(c => NAMES[c].forEach(n => { run('INSERT INTO products(name,category,price,rating,stock,description) VALUES(?,?,?,?,?,?)', n, c, 299 + ((id * 371) % 9000),
      +(3 + ((id * 7) % 20) / 10).toFixed(1), 5 + ((id * 3) % 30), `${n} - a high quality ${c.toLowerCase()} product.`); id++; }));
    run("INSERT INTO tenants(owner_id,slug,store_name,theme,currency,plan,published) VALUES(3,'demo-store','Demo Store','light','INR','free',0)");
    run("INSERT INTO tenant_products(tenant_id,name,category,price,stock) VALUES(1,'Sample Mug','Home',499,20)");
    run("INSERT OR REPLACE INTO sqlite_sequence(name,seq) VALUES('orders',1000)");
  });
}
init();
const err = (res, code, error) => res.status(code).json({ error });
const pub = u => ({ id: u.id, name: u.name, email: u.email, role: u.role });
const auth = roles => (req, res, next) => {
  const u = one('SELECT u.* FROM tokens t JOIN users u ON u.id=t.user_id WHERE t.token=?', (req.headers.authorization || '').replace('Bearer ', ''));
  if (!u) return err(res, 401, 'Unauthorized');
  if (roles && !roles.includes(u.role)) return err(res, 403, 'Forbidden');
  req.user = u; next();
};
const login = (u, res) => { const t = Math.random().toString(36).slice(2) + Date.now(); run('INSERT INTO tokens VALUES(?,?)', t, u.id); res.json({ token: t, user: pub(u) }); };
const now = () => new Date().toISOString();

app.post('/api/reset', (q_, r) => { TABLES.forEach(t => D.exec('DROP TABLE IF EXISTS ' + t)); D.exec("DELETE FROM sqlite_sequence"); init(); r.json({ ok: true }); });
app.get('/api/health', (q_, r) => r.json({ status: 'UP', db: 'sqlite' }));

// ---- AUTH ----
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return err(res, 400, 'All fields are required');
  if (!/^\S+@\S+\.\S+$/.test(email)) return err(res, 400, 'Invalid email');
  if (password.length < 6) return err(res, 400, 'Password must be at least 6 characters');
  if (one('SELECT 1 x FROM users WHERE email=?', email)) return err(res, 409, 'Email already registered');
  const id = run("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'customer')", name, email, password).lastInsertRowid; login(one('SELECT * FROM users WHERE id=?', id), res);
});
app.post('/api/auth/login', (req, res) => {
  const u = one('SELECT * FROM users WHERE email=? AND password=?', req.body.email ?? '', req.body.password ?? '');
  if (!u) return err(res, 401, 'Invalid email or password'); login(u, res);
});
app.get('/api/auth/me', auth(), (rq, r) => r.json(pub(rq.user)));

// ---- PRODUCTS ----
app.get('/api/categories', (rq, r) => r.json(CATS));
app.get('/api/products', (req, res) => {
  const { search = '', category = '', sort = '', max = 100000, page = 1, limit = 8 } = req.query;
  const order = { price_asc: 'price ASC', price_desc: 'price DESC', rating: 'rating DESC' }[sort] || 'id ASC';
  const w = "name LIKE ? AND (?='' OR category=?) AND price<=?", a = ['%' + search + '%', category, category, +max];
  const total = one(`SELECT COUNT(*) n FROM products WHERE ${w}`, ...a).n, pages = Math.max(1, Math.ceil(total / limit));
  res.json({ items: q(`SELECT * FROM products WHERE ${w} ORDER BY ${order} LIMIT ? OFFSET ?`, ...a, +limit, (page - 1) * limit), total, pages, page: +page });
});
app.get('/api/products/:id', (req, res) => {
  const p = one('SELECT p.*,(SELECT COUNT(*) FROM reviews r WHERE r.product_id=p.id) reviewCount FROM products p WHERE id=?', +req.params.id); p ? res.json(p) : err(res, 404, 'Product not found');
});

// ---- REVIEWS (only after a DELIVERED order containing the product) ----
const revOut = r => ({ id: r.id, productId: r.product_id, userName: r.user_name, rating: r.rating, comment: r.comment, createdAt: r.created_at });
app.get('/api/products/:id/reviews', (req, res) => res.json(q('SELECT * FROM reviews WHERE product_id=? ORDER BY id DESC', +req.params.id).map(revOut)));
app.post('/api/products/:id/reviews', auth(['customer']), (req, res) => {
  const pid = +req.params.id, { rating, comment = '' } = req.body;
  if (!one('SELECT 1 x FROM products WHERE id=?', pid)) return err(res, 404, 'Product not found');
  if (!Number.isInteger(+rating) || rating < 1 || rating > 5) return err(res, 400, 'Rating must be between 1 and 5');
  if (comment.trim().length < 5) return err(res, 400, 'Comment must be at least 5 characters');
  if (!one("SELECT 1 x FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.user_id=? AND i.product_id=? AND o.status='DELIVERED'", req.user.id, pid)) return err(res, 403, 'Only customers who received this product can review it');
  if (one('SELECT 1 x FROM reviews WHERE product_id=? AND user_id=?', pid, req.user.id)) return err(res, 409, 'You have already reviewed this product');
  const id = run('INSERT INTO reviews(product_id,user_id,user_name,rating,comment,created_at) VALUES(?,?,?,?,?,?)', pid, req.user.id, req.user.name, +rating, comment.trim(), now()).lastInsertRowid;
  rate(pid); res.status(201).json(revOut(one('SELECT * FROM reviews WHERE id=?', id)));
});
const rate = pid => run('UPDATE products SET rating=COALESCE((SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id=?),rating) WHERE id=?', pid, pid);
const delReview = (req, res) => {
  const r = one('SELECT * FROM reviews WHERE id=?', +req.params.id); if (!r) return err(res, 404, 'Review not found');
  if (req.user.role !== 'admin' && r.user_id !== req.user.id) return err(res, 403, 'Forbidden');
  run('DELETE FROM reviews WHERE id=?', r.id); rate(r.product_id); res.json({ ok: true });
};
app.delete('/api/reviews/:id', auth(['customer']), delReview);

// ---- WISHLIST ----
const wish = uid => q('SELECT p.* FROM wishlist w JOIN products p ON p.id=w.product_id WHERE w.user_id=? ORDER BY w.rowid', uid);
app.get('/api/wishlist', auth(['customer']), (rq, r) => r.json(wish(rq.user.id)));
app.post('/api/wishlist', auth(['customer']), (req, res) => {
  const pid = +req.body.productId; if (!one('SELECT 1 x FROM products WHERE id=?', pid)) return err(res, 404, 'Product not found');
  if (one('SELECT 1 x FROM wishlist WHERE user_id=? AND product_id=?', req.user.id, pid)) return err(res, 409, 'Already in wishlist');
  run('INSERT INTO wishlist VALUES(?,?)', req.user.id, pid); res.status(201).json(wish(req.user.id));
});
app.delete('/api/wishlist/:pid', auth(['customer']), (req, res) => { run('DELETE FROM wishlist WHERE user_id=? AND product_id=?', req.user.id, +req.params.pid); res.json(wish(req.user.id)); });
app.post('/api/wishlist/:pid/move-to-cart', auth(['customer']), (req, res) => {
  const pid = +req.params.pid; if (!one('SELECT 1 x FROM wishlist WHERE user_id=? AND product_id=?', req.user.id, pid)) return err(res, 404, 'Not in wishlist');
  const e = addToCart(req.user.id, pid, 1); if (e) return err(res, 400, e);
  run('DELETE FROM wishlist WHERE user_id=? AND product_id=?', req.user.id, pid); res.json({ wishlist: wish(req.user.id), cart: cartView(req.user.id) });
});

// ---- CART ----
const cartView = uid => {
  const items = q('SELECT c.product_id productId,c.qty,p.name,p.price,p.stock,p.category FROM cart c JOIN products p ON p.id=c.product_id WHERE c.user_id=? ORDER BY c.rowid', uid)
    .map(r => ({ productId: r.productId, qty: r.qty, product: { id: r.productId, name: r.name, price: r.price, stock: r.stock, category: r.category }, subtotal: r.price * r.qty }));
  return { items, subtotal: items.reduce((s, i) => s + i.subtotal, 0) };
};
const addToCart = (uid, pid, qty) => {
  const p = one('SELECT * FROM products WHERE id=?', pid); if (!p) return 'Product not found';
  const nq = (one('SELECT qty FROM cart WHERE user_id=? AND product_id=?', uid, pid)?.qty || 0) + qty; if (nq > p.stock) return `Only ${p.stock} in stock`;
  run('INSERT INTO cart VALUES(?,?,?) ON CONFLICT(user_id,product_id) DO UPDATE SET qty=?', uid, pid, qty, nq);
};
app.get('/api/cart', auth(), (rq, r) => r.json(cartView(rq.user.id)));
app.post('/api/cart', auth(['customer']), (req, res) => {
  const qty = +(req.body.qty ?? 1); if (!(qty >= 1)) return err(res, 400, 'Invalid quantity');
  const e = addToCart(req.user.id, +req.body.productId, qty); if (e) return err(res, e === 'Product not found' ? 404 : 400, e); res.json(cartView(req.user.id));
});
app.put('/api/cart/:pid', auth(), (req, res) => {
  const pid = +req.params.pid, p = one('SELECT * FROM products WHERE id=?', pid);
  if (!one('SELECT 1 x FROM cart WHERE user_id=? AND product_id=?', req.user.id, pid)) return err(res, 404, 'Not in cart');
  if (!(req.body.qty >= 1)) return err(res, 400, 'Invalid quantity'); if (req.body.qty > p.stock) return err(res, 400, `Only ${p.stock} in stock`);
  run('UPDATE cart SET qty=? WHERE user_id=? AND product_id=?', +req.body.qty, req.user.id, pid); res.json(cartView(req.user.id));
});
app.delete('/api/cart/:pid', auth(), (req, res) => { run('DELETE FROM cart WHERE user_id=? AND product_id=?', req.user.id, +req.params.pid); res.json(cartView(req.user.id)); });

// ---- COUPON + ORDERS ----
const calc = (sub, code) => {
  const c = COUPONS[(code || '').toUpperCase()]; const discount = c ? (c.type === 'pct' ? Math.round(sub * c.v / 100) : Math.min(c.v, sub)) : 0;
  const shipping = sub - discount >= 999 ? 0 : 49; return { discount, shipping, total: sub - discount + shipping, valid: !!c };
};
const orderOut = o => ({ id: o.id, userId: o.user_id, userEmail: o.user_email, address: JSON.parse(o.address), payment: o.payment, deliveryDate: o.delivery_date, subtotal: o.subtotal,
  discount: o.discount, shipping: o.shipping, total: o.total, status: o.status, createdAt: o.created_at, deliveredAt: o.delivered_at,
  items: q('SELECT product_id productId,name,qty,price FROM order_items WHERE order_id=?', o.id) });
app.post('/api/coupons/validate', auth(), (req, res) => { const r = calc(cartView(req.user.id).subtotal, req.body.code); r.valid ? res.json(r) : err(res, 400, 'Invalid coupon'); });
app.post('/api/orders', auth(['customer']), (req, res) => {
  const { address = {}, payment, coupon, deliveryDate } = req.body; const cv = cartView(req.user.id);
  if (!cv.items.length) return err(res, 400, 'Cart is empty');
  if (!address.name || !address.line || !address.city || !/^\d{6}$/.test(address.pin || '')) return err(res, 400, 'Valid address with 6-digit pin is required');
  if (!['COD', 'CARD', 'UPI'].includes(payment)) return err(res, 400, 'Select a payment method');
  for (const i of cv.items) if (i.qty > i.product.stock) return err(res, 400, `${i.product.name} is out of stock`);
  const t = calc(cv.subtotal, coupon);
  const id = tx(() => {
    const oid = run('INSERT INTO orders(user_id,user_email,address,payment,delivery_date,subtotal,discount,shipping,total,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      req.user.id, req.user.email, JSON.stringify(address), payment, deliveryDate || null, cv.subtotal, t.discount, t.shipping, t.total, 'PLACED', now()).lastInsertRowid;
    cv.items.forEach(i => { run('INSERT INTO order_items VALUES(?,?,?,?,?)', oid, i.productId, i.product.name, i.qty, i.product.price); run('UPDATE products SET stock=stock-? WHERE id=?', i.qty, i.productId); });
    run('DELETE FROM cart WHERE user_id=?', req.user.id); return oid;
  });
  res.status(201).json(orderOut(one('SELECT * FROM orders WHERE id=?', id)));
});
app.get('/api/orders', auth(['customer']), (rq, r) => r.json(q('SELECT * FROM orders WHERE user_id=? ORDER BY id DESC', rq.user.id).map(orderOut)));
const restock = oid => q('SELECT product_id,qty FROM order_items WHERE order_id=?', oid).forEach(i => run('UPDATE products SET stock=stock+? WHERE id=?', i.qty, i.product_id));
app.post('/api/orders/:id/cancel', auth(['customer']), (req, res) => {
  const o = one('SELECT * FROM orders WHERE id=? AND user_id=?', +req.params.id, req.user.id);
  if (!o) return err(res, 404, 'Order not found'); if (o.status !== 'PLACED') return err(res, 400, 'Only PLACED orders can be cancelled');
  tx(() => { restock(o.id); run("UPDATE orders SET status='CANCELLED' WHERE id=?", o.id); }); res.json(orderOut(one('SELECT * FROM orders WHERE id=?', o.id)));
});

// ---- RETURNS & REFUNDS (DELIVERED orders only, within 7 days) ----
const retOut = r => ({ id: r.id, orderId: r.order_id, productId: r.product_id, productName: r.product_name, qty: r.qty, userEmail: r.user_email, reason: r.reason, status: r.status, refundAmount: r.refund_amount, createdAt: r.created_at });
app.post('/api/orders/:id/returns', auth(['customer']), (req, res) => {
  const o = one('SELECT * FROM orders WHERE id=? AND user_id=?', +req.params.id, req.user.id); if (!o) return err(res, 404, 'Order not found');
  if (o.status !== 'DELIVERED') return err(res, 400, 'Only delivered orders can be returned');
  if (Date.now() - new Date(o.delivered_at).getTime() > 7 * 864e5) return err(res, 400, 'Return window (7 days) has expired');
  const it = one('SELECT * FROM order_items WHERE order_id=? AND product_id=?', o.id, +req.body.productId); if (!it) return err(res, 404, 'Item not in this order');
  if (!req.body.reason || req.body.reason.trim().length < 3) return err(res, 400, 'Reason is required');
  if (one("SELECT 1 x FROM returns WHERE order_id=? AND product_id=? AND status<>'REJECTED'", o.id, it.product_id)) return err(res, 409, 'A return already exists for this item');
  const id = run("INSERT INTO returns(order_id,product_id,product_name,qty,user_id,user_email,reason,status,refund_amount,created_at) VALUES(?,?,?,?,?,?,?,'REQUESTED',0,?)",
    o.id, it.product_id, it.name, it.qty, req.user.id, req.user.email, req.body.reason.trim(), now()).lastInsertRowid;
  res.status(201).json(retOut(one('SELECT * FROM returns WHERE id=?', id)));
});
app.get('/api/returns', auth(['customer']), (rq, r) => r.json(q('SELECT * FROM returns WHERE user_id=? ORDER BY id DESC', rq.user.id).map(retOut)));

// ---- ADMIN ----
const adm = auth(['admin']);
app.get('/api/admin/stats', adm, (rq, r) => r.json({ users: one('SELECT COUNT(*) n FROM users').n, products: one('SELECT COUNT(*) n FROM products').n, orders: one('SELECT COUNT(*) n FROM orders').n,
  revenue: (one("SELECT COALESCE(SUM(total),0) s FROM orders WHERE status<>'CANCELLED'").s) - one('SELECT COALESCE(SUM(refund_amount),0) s FROM returns').s,
  refunds: one('SELECT COALESCE(SUM(refund_amount),0) s FROM returns').s, pendingReturns: one("SELECT COUNT(*) n FROM returns WHERE status='REQUESTED'").n,
  lowStock: one('SELECT COUNT(*) n FROM products WHERE stock<10').n, reviews: one('SELECT COUNT(*) n FROM reviews').n }));
app.get('/api/admin/users', adm, (rq, r) => r.json(q('SELECT id,name,email,role FROM users')));
app.get('/api/admin/orders', adm, (rq, r) => r.json(q('SELECT * FROM orders ORDER BY id DESC').map(orderOut)));
app.put('/api/admin/orders/:id/status', adm, (req, res) => {
  const o = one('SELECT * FROM orders WHERE id=?', +req.params.id); if (!o) return err(res, 404, 'Order not found');
  const flow = { PLACED: ['SHIPPED', 'CANCELLED'], SHIPPED: ['DELIVERED'], DELIVERED: [], CANCELLED: [] }, s = req.body.status;
  if (!flow[o.status].includes(s)) return err(res, 400, `Cannot move ${o.status} to ${s}`);
  tx(() => { if (s === 'CANCELLED') restock(o.id); run('UPDATE orders SET status=?,delivered_at=? WHERE id=?', s, s === 'DELIVERED' ? now() : o.delivered_at, o.id); });
  res.json(orderOut(one('SELECT * FROM orders WHERE id=?', o.id)));
});
app.get('/api/admin/returns', adm, (rq, r) => r.json(q('SELECT * FROM returns ORDER BY id DESC').map(retOut)));
app.put('/api/admin/returns/:id', adm, (req, res) => {
  const r = one('SELECT * FROM returns WHERE id=?', +req.params.id); if (!r) return err(res, 404, 'Return not found');
  const flow = { REQUESTED: ['APPROVED', 'REJECTED'], APPROVED: ['REFUNDED'], REJECTED: [], REFUNDED: [] }, s = req.body.status;
  if (!flow[r.status]?.includes(s)) return err(res, 400, `Cannot move ${r.status} to ${s}`);
  tx(() => { if (s === 'REFUNDED') { const it = one('SELECT * FROM order_items WHERE order_id=? AND product_id=?', r.order_id, r.product_id);
      run('UPDATE returns SET status=?,refund_amount=? WHERE id=?', s, it.price * it.qty, r.id); run('UPDATE products SET stock=stock+? WHERE id=?', it.qty, it.product_id); }
    else run('UPDATE returns SET status=? WHERE id=?', s, r.id); });
  res.json(retOut(one('SELECT * FROM returns WHERE id=?', r.id)));
});
app.get('/api/admin/reviews', adm, (rq, r) => r.json(q('SELECT r.*,p.name pname FROM reviews r JOIN products p ON p.id=r.product_id ORDER BY r.id DESC').map(x => ({ ...revOut(x), productName: x.pname }))));
app.delete('/api/admin/reviews/:id', adm, delReview);
const pcheck = b => (!b.name ? 'Name is required' : !(+b.price > 0) ? 'Price must be greater than 0' : !(+b.stock >= 0) ? 'Invalid stock' : !CATS.includes(b.category) ? 'Invalid category' : null);
app.post('/api/admin/products', adm, (req, res) => {
  const e = pcheck(req.body); if (e) return err(res, 400, e); const b = req.body;
  const id = run('INSERT INTO products(name,category,price,rating,stock,description) VALUES(?,?,?,4,?,?)', b.name, b.category, +b.price, +b.stock, b.description || '').lastInsertRowid;
  res.status(201).json(one('SELECT * FROM products WHERE id=?', id));
});
app.put('/api/admin/products/:id', adm, (req, res) => {
  const p = one('SELECT * FROM products WHERE id=?', +req.params.id); if (!p) return err(res, 404, 'Product not found');
  const n = { ...p, ...req.body }; const e = pcheck(n); if (e) return err(res, 400, e);
  run('UPDATE products SET name=?,category=?,price=?,stock=?,description=? WHERE id=?', n.name, n.category, +n.price, +n.stock, n.description || '', p.id); res.json(one('SELECT * FROM products WHERE id=?', p.id));
});
app.delete('/api/admin/products/:id', adm, (req, res) => {
  const id = +req.params.id; tx(() => { ['products WHERE id', 'cart WHERE product_id', 'wishlist WHERE product_id', 'reviews WHERE product_id'].forEach(t => run('DELETE FROM ' + t + '=?', id)); }); res.json({ ok: true });
});

// ---- SAAS (multi-tenant storefront builder) ----
const mer = auth(['merchant']);
const tenantOut = t => ({ id: t.id, ownerId: t.owner_id, slug: t.slug, storeName: t.store_name, theme: t.theme, currency: t.currency, plan: t.plan, published: !!t.published, limit: PLANS[t.plan],
  products: q('SELECT id,name,category,price,stock FROM tenant_products WHERE tenant_id=? ORDER BY id', t.id), rules: q('SELECT id,name,percent,category FROM tenant_rules WHERE tenant_id=? ORDER BY id', t.id) });
const tenantOf = (req, res) => { const t = one('SELECT * FROM tenants WHERE owner_id=?', req.user.id); if (!t) err(res, 404, 'No store'); return t; };
const tget = id => tenantOut(one('SELECT * FROM tenants WHERE id=?', id));
app.post('/api/saas/signup', (req, res) => {
  const { name, email, password, storeName, plan = 'free' } = req.body;
  if (!name || !email || !password || !storeName) return err(res, 400, 'All fields are required');
  if (!PLANS[plan]) return err(res, 400, 'Invalid plan'); if (one('SELECT 1 x FROM users WHERE email=?', email)) return err(res, 409, 'Email already registered');
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (one('SELECT 1 x FROM tenants WHERE slug=?', slug)) return err(res, 409, 'Store name already taken');
  const uid = run("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'merchant')", name, email, password).lastInsertRowid;
  run("INSERT INTO tenants(owner_id,slug,store_name,theme,currency,plan,published) VALUES(?,?,?,'light','INR',?,0)", uid, slug, storeName, plan); login(one('SELECT * FROM users WHERE id=?', uid), res);
});
app.get('/api/saas/store', mer, (req, res) => { const t = tenantOf(req, res); t && res.json(tenantOut(t)); });
app.put('/api/saas/store', mer, (req, res) => {
  const t = tenantOf(req, res); if (!t) return; if (!req.body.storeName) return err(res, 400, 'Store name is required');
  run('UPDATE tenants SET store_name=?,theme=?,currency=? WHERE id=?', req.body.storeName, req.body.theme || t.theme, req.body.currency || t.currency, t.id); res.json(tget(t.id));
});
app.post('/api/saas/store/upgrade', mer, (req, res) => { const t = tenantOf(req, res); if (!t) return; if (!PLANS[req.body.plan]) return err(res, 400, 'Invalid plan'); run('UPDATE tenants SET plan=? WHERE id=?', req.body.plan, t.id); res.json(tget(t.id)); });
app.post('/api/saas/store/products', mer, (req, res) => {
  const t = tenantOf(req, res); if (!t) return; const e = pcheck(req.body); if (e) return err(res, 400, e);
  if (one('SELECT COUNT(*) n FROM tenant_products WHERE tenant_id=?', t.id).n >= PLANS[t.plan]) return err(res, 403, `Plan limit reached (${PLANS[t.plan]} products). Upgrade to add more.`);
  const id = run('INSERT INTO tenant_products(tenant_id,name,category,price,stock) VALUES(?,?,?,?,?)', t.id, req.body.name, req.body.category, +req.body.price, +req.body.stock).lastInsertRowid;
  res.status(201).json(one('SELECT id,name,category,price,stock FROM tenant_products WHERE id=?', id));
});
app.delete('/api/saas/store/products/:id', mer, (req, res) => {
  const t = tenantOf(req, res); if (!t) return; run('DELETE FROM tenant_products WHERE id=? AND tenant_id=?', +req.params.id, t.id);
  if (!one('SELECT COUNT(*) n FROM tenant_products WHERE tenant_id=?', t.id).n) run('UPDATE tenants SET published=0 WHERE id=?', t.id); res.json({ ok: true });
});
app.post('/api/saas/store/rules', mer, (req, res) => {
  const t = tenantOf(req, res); if (!t) return; const { name, percent, category } = req.body;
  if (!name || !(+percent > 0 && +percent <= 90)) return err(res, 400, 'Name and percent (1-90) are required');
  if (category !== 'ALL' && !one('SELECT 1 x FROM tenant_products WHERE tenant_id=? AND category=?', t.id, category ?? '')) return err(res, 400, 'No products in that category yet');
  const id = run('INSERT INTO tenant_rules(tenant_id,name,percent,category) VALUES(?,?,?,?)', t.id, name, +percent, category).lastInsertRowid;
  res.status(201).json(one('SELECT id,name,percent,category FROM tenant_rules WHERE id=?', id));
});
app.delete('/api/saas/store/rules/:id', mer, (req, res) => { const t = tenantOf(req, res); if (!t) return; run('DELETE FROM tenant_rules WHERE id=? AND tenant_id=?', +req.params.id, t.id); res.json({ ok: true }); });
app.post('/api/saas/store/publish', mer, (req, res) => {
  const t = tenantOf(req, res); if (!t) return; if (!one('SELECT COUNT(*) n FROM tenant_products WHERE tenant_id=?', t.id).n) return err(res, 400, 'Add at least one product before publishing');
  run('UPDATE tenants SET published=? WHERE id=?', req.body.published !== false ? 1 : 0, t.id); res.json(tget(t.id));
});
app.get('/api/saas/public/:slug', (req, res) => {
  const row = one('SELECT * FROM tenants WHERE slug=?', req.params.slug); if (!row || !row.published) return err(res, 404, 'Store not found or not published');
  const t = tenantOut(row);
  const products = t.products.map(p => { const best = Math.max(0, ...t.rules.filter(r => r.category === 'ALL' || r.category === p.category).map(r => r.percent));
    return { ...p, finalPrice: Math.round(p.price * (100 - best) / 100), discount: best }; });
  res.json({ storeName: t.storeName, theme: t.theme, currency: t.currency, products });
});
app.listen(4000, () => console.log('API running on http://localhost:4000 (SQLite)'));

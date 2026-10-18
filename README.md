<<<<<<< HEAD
# ShopVerse - Cypress Practice Application

A complete e-commerce style web application (React + Node/Express API) built for practising **UI and API test automation with Cypress**. It runs entirely on your laptop, needs no database, and can be reset to a clean state with one API call.

## 1. Setup (about 3 minutes)

**Prerequisites:** **Node.js 22.5 or newer** (check with `node -v`; the API uses Node's built-in SQLite, so there is no database to install) and VS Code.

```bash
cd shopverse
npm install
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:4000/api (the web app also proxies `/api` on port 5173)
- Health check: http://localhost:4000/api/health

Open Cypress: `npm run cy:open` (app must be running in another terminal). A sample spec is in `cypress/e2e/shop.cy.js`.

> Data is stored in a SQLite file, `server/shopverse.db`, created on first start. It **persists across restarts**. Node prints an "ExperimentalWarning: SQLite" message on start; this is harmless. To inspect the data, open the file with the VS Code extension "SQLite Viewer" or the `sqlite3` CLI.

> Note on "API in React": React is only a front-end library and cannot host an API. The API is a small Express (JavaScript) server in `server/index.js`, started together with the React app by the same `npm run dev` command.

## 2. Test accounts

| Role | Email | Password | Lands on |
|---|---|---|---|
| Customer | user@shop.com | User@123 | Shop |
| Admin | admin@shop.com | Admin@123 | /admin |
| SaaS merchant | merchant@saas.com | Merchant@123 | /saas/dashboard |

Coupons: `SAVE10` (10% off), `FLAT200` (Rs 200 off). Shipping is Rs 49 unless the payable amount is Rs 999 or more.

## 3. Resetting data (use this in `beforeEach`)

Data persists in SQLite between runs. Calling `POST http://localhost:4000/api/reset` drops all tables and restores the seed data (25 products, 3 users, 1 demo store, no orders, reviews, returns or wishlists). You can also stop the API and delete `server/shopverse.db`. For a separate test database set the environment variable `DB_FILE`.

## 4. Modules and how they depend on each other

1. **Auth** - register, login, role-based redirect. Customers, admins and merchants see different menus; opening a page of another role shows "403 - Access denied".
2. **Shop (customer)** - search, category dropdown, price slider, sort radio buttons, pagination, product detail with tabs. Adding to cart requires login.
3. **Cart and Checkout** - quantity +/-, remove, 3-step wizard (address, payment and coupon, review), order confirmation. Stock is checked and reduced on order.
4. **My Orders** - order list, status badges, cancel (browser confirm dialog). Cancelling restores stock.
5. **Admin** - Dashboard stats, product CRUD in a modal, order status workflow, user list.
6. **Wishlist** - add from the shop card or product page, move to cart, remove. Duplicates are rejected.
7. **Reviews** - 1-5 star rating plus comment on the product page. Only customers with a DELIVERED order containing the product can review it, once per product. The product rating is recalculated from reviews. Admin can delete reviews.
8. **Returns and refunds** - customers can return an item from a DELIVERED order within 7 days. Admin approves or rejects, then issues the refund. A refund restocks the item and is deducted from dashboard revenue.
9. **SaaS Commerce Cloud (Adobe Commerce-like)** - merchant signup with plan, store settings, catalog, price rules, publish toggle, public storefront.

**Dependency chains worth automating**
- Order must be DELIVERED (by Admin) before the customer can review the product or request a return.
- Return flow: REQUESTED -> APPROVED -> REFUNDED (or REQUESTED -> REJECTED). Refund adds the item back to stock and lowers Admin revenue; Admin dashboard shows pending returns.
- A delivered order can no longer be cancelled; a rejected return can be requested again.
- Admin deletes a product -> it also disappears from carts, wishlists and reviews.
- Customer places order -> Admin sees it -> Admin marks SHIPPED -> customer sees SHIPPED -> cancel is no longer allowed.
- Admin lowers product stock -> Shop shows "Only N left!" -> adding more than stock gives an error.
- Admin deletes a product -> it disappears from Shop.
- Merchant adds product -> adds price rule for its category -> publishes -> storefront shows discounted price.
- Free plan allows 3 products; the 4th is rejected until "Upgrade to Pro".
- A store cannot be published with no products; deleting the last product unpublishes it.
- Price rules can only target categories that already have products.

Order status flow: PLACED -> SHIPPED -> DELIVERED, or PLACED -> CANCELLED. Other transitions return an error.

## 4b. Web elements you can practise on

Text, password (with show/hide checkbox), textarea, number, date picker, range slider, native dropdowns, radio groups, checkboxes, tabs, tables with row actions, pagination, modal dialog, toast alerts (auto-hide after 3s), browser confirm dialogs, multi-step wizard, tooltips (title attribute on product names), disabled buttons, badges, live-updating cart counter, protected routes, 404 page, validation errors, dark/light themed storefront.

## 5. Locators

Every important element has a `data-testid` attribute, for example `cy.get('[data-testid=login-submit]')`. Some inputs also have ids (`#email`, `#password`). Repeated items use the same testid (for example `product-card`, `cart-row`), so use `.eq()`, `.first()` or `.contains()`.

## 6. API reference

Authenticated calls need the header `Authorization: Bearer <token>`. Errors return `{ "error": "message" }` with status 400, 401, 403, 404 or 409.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | - | body: name, email, password |
| POST | /api/auth/login | - | returns token and user |
| GET | /api/auth/me | any | current user |
| GET | /api/categories | - | category list |
| GET | /api/products | - | query: search, category, sort (price_asc, price_desc, rating), max, page, limit |
| GET | /api/products/:id | - | product detail |
| GET | /api/cart | customer | cart with subtotal |
| POST | /api/cart | customer | body: productId, qty |
| PUT | /api/cart/:productId | customer | body: qty |
| DELETE | /api/cart/:productId | customer | remove item |
| POST | /api/coupons/validate | any | body: code |
| POST | /api/orders | customer | body: address {name, line, city, pin (6 digits)}, payment (COD, CARD, UPI), coupon, deliveryDate |
| GET | /api/orders | customer | my orders |
| POST | /api/orders/:id/returns | customer | body: productId, reason (3+ chars); order must be DELIVERED within 7 days |
| GET | /api/returns | customer | my returns |
| GET | /api/products/:id/reviews | - | list reviews |
| POST | /api/products/:id/reviews | customer | body: rating (1-5), comment (5+ chars); needs a delivered order, 403 otherwise, 409 if already reviewed |
| DELETE | /api/reviews/:id | customer | delete own review |
| GET | /api/wishlist | customer | wishlist products |
| POST | /api/wishlist | customer | body: productId (409 if present) |
| DELETE | /api/wishlist/:productId | customer | remove |
| POST | /api/wishlist/:productId/move-to-cart | customer | moves item to cart |
| POST | /api/orders/:id/cancel | customer | only PLACED orders |
| GET | /api/admin/stats | admin | dashboard numbers (users, products, orders, revenue, refunds, pendingReturns, reviews, lowStock) |
| GET | /api/admin/returns | admin | all returns |
| PUT | /api/admin/returns/:id | admin | body: status (APPROVED, REJECTED, REFUNDED) |
| GET | /api/admin/reviews | admin | all reviews |
| DELETE | /api/admin/reviews/:id | admin | delete review |
| GET | /api/admin/users | admin | all users |
| GET | /api/admin/orders | admin | all orders |
| PUT | /api/admin/orders/:id/status | admin | body: status |
| POST | /api/admin/products | admin | body: name, category, price, stock, description |
| PUT | /api/admin/products/:id | admin | update product |
| DELETE | /api/admin/products/:id | admin | delete product |
| POST | /api/saas/signup | - | body: name, email, password, storeName, plan (free or pro) |
| GET | /api/saas/store | merchant | my store |
| PUT | /api/saas/store | merchant | body: storeName, theme, currency |
| POST | /api/saas/store/upgrade | merchant | body: plan |
| POST | /api/saas/store/products | merchant | add catalog product (plan limit applies, 403 when exceeded) |
| DELETE | /api/saas/store/products/:id | merchant | remove product |
| POST | /api/saas/store/rules | merchant | body: name, percent (1-90), category (or ALL) |
| DELETE | /api/saas/store/rules/:id | merchant | remove rule |
| POST | /api/saas/store/publish | merchant | body: published (true or false) |
| GET | /api/saas/public/:slug | - | public storefront data, 404 if not published |
| POST | /api/reset | - | restore seed data |
| GET | /api/health | - | status |

**Database tables** (for DB-level validation): users, tokens, products, cart, orders, order_items, reviews, wishlist, returns, tenants, tenant_products, tenant_rules.

## 7. Cypress tips

- **Fast login:** call `/api/auth/login` with `cy.request`, then set `localStorage` keys `token` and `user` (JSON of the user) before `cy.visit`.
- **Setup via API, verify via UI:** create orders or products with `cy.request`, then assert on the screen (see the Admin test in the sample spec).
- **Confirm dialogs:** Cypress auto-accepts `window.confirm`; use `cy.on('window:confirm', () => false)` to test cancelling.
- **Toasts:** assert `[data-testid=toast]` right after the action; it disappears after 3 seconds.
- **Intercepts:** `cy.intercept('GET', '/api/products*').as('list')` then `cy.wait('@list')`.

## 8. Practice ideas

DB checks after API calls (stock after order, refund after return), review eligibility rules, return-window and status-flow negative tests, wishlist duplicates, negative login, registration validation, filter plus sort plus pagination combinations, coupon rules, stock limits, role-based access via URL, full order lifecycle across customer and admin, SaaS plan limits and publish rules, and API contract tests for every endpoint.

## 9. Project layout

```
server/index.js      API + SQLite schema + seed data (server/shopverse.db is created at runtime)
src/App.jsx          routes, navbar, role guards
src/ctx.jsx          login state, cart count, toast
src/pages/           Shop, Product (reviews), Wishlist, Orders (cart, checkout, orders, returns), Auth, Admin, Saas
cypress/e2e/         sample specs
```
=======
# shopverse_webApp_Bibhu
>>>>>>> a26c1674c8fee5ed0399e7dc2387c7d2bfd2c3e2

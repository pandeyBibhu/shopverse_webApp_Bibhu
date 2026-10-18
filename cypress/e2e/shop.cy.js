const api = Cypress.env('apiUrl');
const loginUI = (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid=login-email]').type(email);
  cy.get('[data-testid=login-password]').type(password);
  cy.get('[data-testid=login-submit]').click();
};
describe('ShopVerse sample tests', () => {
  beforeEach(() => cy.request('POST', `${api}/reset`));

  it('API: login returns token and products list is paged', () => {
    cy.request('POST', `${api}/auth/login`, { email: 'user@shop.com', password: 'User@123' }).then(r => {
      expect(r.status).to.eq(200); expect(r.body.token).to.be.a('string');
    });
    cy.request(`${api}/products?limit=5`).its('body.items').should('have.length', 5);
  });

  it('UI: customer adds product to cart and places an order', () => {
    loginUI('user@shop.com', 'User@123');
    cy.get('[data-testid=nav-user]').should('contain', 'Test User');
    cy.get('[data-testid=search-input]').type('Yoga');
    cy.get('[data-testid=product-card]').should('have.length', 1);
    cy.get('[data-testid=add-to-cart]').click();
    cy.get('[data-testid=cart-count]').should('have.text', '1');
    cy.get('[data-testid=nav-cart]').click();
    cy.get('[data-testid=checkout-btn]').click();
    cy.get('[data-testid=addr-name]').type('Test User');
    cy.get('[data-testid=addr-line]').type('12 MG Road');
    cy.get('[data-testid=addr-city]').type('Bangalore');
    cy.get('[data-testid=addr-pin]').type('560001');
    cy.get('[data-testid=next-btn]').click();
    cy.get('[data-testid=pay-COD]').check();
    cy.get('[data-testid=next-btn]').click();
    cy.get('[data-testid=place-order]').click();
    cy.get('[data-testid=order-success]').should('be.visible');
  });

  it('Admin: ships an order placed by a customer (dependent modules)', () => {
    cy.request('POST', `${api}/auth/login`, { email: 'user@shop.com', password: 'User@123' }).then(({ body }) => {
      const h = { Authorization: `Bearer ${body.token}` };
      cy.request({ method: 'POST', url: `${api}/cart`, headers: h, body: { productId: 1, qty: 1 } });
      cy.request({ method: 'POST', url: `${api}/orders`, headers: h,
        body: { address: { name: 'T', line: 'x', city: 'y', pin: '560001' }, payment: 'COD' } });
    });
    loginUI('admin@shop.com', 'Admin@123');
    cy.get('[data-testid=admin-tab-orders]').click();
    cy.get('[data-testid=status-select]').first().select('SHIPPED');
    cy.get('[data-testid=admin-order-status]').first().should('have.text', 'SHIPPED');
  });

  it('SaaS: merchant cannot publish an empty store; storefront shows discount', () => {
    loginUI('merchant@saas.com', 'Merchant@123');
    cy.get('[data-testid=saas-tab-rules]').click();
    cy.get('[data-testid=rl-name]').type('Summer'); cy.get('[data-testid=rl-percent]').type('20');
    cy.get('[data-testid=rl-add]').click();
    cy.get('[data-testid=saas-tab-publish]').click();
    cy.get('[data-testid=publish-toggle]').check();
    cy.get('[data-testid=store-status]').should('have.text', 'PUBLISHED');
    cy.visit('/store/demo-store');
    cy.get('[data-testid=sf-discount]').should('contain', '20% OFF');
  });

  it('Wishlist: add from product page, then move to cart', () => {
    loginUI('user@shop.com', 'User@123');
    cy.visit('/product/1');
    cy.get('[data-testid=pd-wishlist]').click();
    cy.get('[data-testid=toast]').should('contain', 'wishlist');
    cy.get('[data-testid=nav-wishlist]').click();
    cy.get('[data-testid=wishlist-row]').should('have.length', 1);
    cy.get('[data-testid=wl-move]').click();
    cy.get('[data-testid=empty-wishlist]').should('be.visible');
    cy.get('[data-testid=cart-count]').should('have.text', '1');
  });

  it('Reviews and returns: only possible after delivery, refund restocks item', () => {
    cy.request('POST', `${api}/auth/login`, { email: 'user@shop.com', password: 'User@123' }).then(({ body }) => {
      const u = { Authorization: `Bearer ${body.token}` };
      cy.request('POST', `${api}/auth/login`, { email: 'admin@shop.com', password: 'Admin@123' }).then(({ body: ad }) => {
        const a = { Authorization: `Bearer ${ad.token}` };
        cy.request({ method: 'POST', url: `${api}/cart`, headers: u, body: { productId: 1, qty: 1 } });
        cy.request({ method: 'POST', url: `${api}/orders`, headers: u,
          body: { address: { name: 'T', line: 'x', city: 'y', pin: '560001' }, payment: 'COD' } }).then(({ body: order }) => {
          // review is blocked until the order is delivered
          cy.request({ method: 'POST', url: `${api}/products/1/reviews`, headers: u, failOnStatusCode: false,
            body: { rating: 5, comment: 'Great product' } }).its('status').should('eq', 403);
          ['SHIPPED', 'DELIVERED'].forEach(status => cy.request({ method: 'PUT', url: `${api}/admin/orders/${order.id}/status`, headers: a, body: { status } }));
          cy.request({ method: 'POST', url: `${api}/products/1/reviews`, headers: u, body: { rating: 5, comment: 'Great product' } }).its('status').should('eq', 201);
        });
      });
    });
    loginUI('user@shop.com', 'User@123');
    cy.get('[data-testid=nav-orders]').click();
    cy.get('[data-testid=return-order]').click();
    cy.get('[data-testid=rt-reason]').select('Damaged item');
    cy.get('[data-testid=rt-submit]').click();
    cy.get('[data-testid=return-status]').should('have.text', 'REQUESTED');
    cy.get('[data-testid=logout-btn]').click();
    loginUI('admin@shop.com', 'Admin@123');
    cy.get('[data-testid=admin-tab-returns]').click();
    cy.get('[data-testid=approve-return]').click();
    cy.get('[data-testid=refund-return]').click();
    cy.get('[data-testid=admin-return-status]').should('have.text', 'REFUNDED');
    cy.get('[data-testid=admin-tab-dash]').click();
    cy.get('[data-testid=stat-refunds]').should('not.have.text', '0');
  });

  it('DB persistence: data survives until /reset is called', () => {
    cy.request('POST', `${api}/auth/register`, { name: 'Persist', email: 'persist@x.com', password: 'abcdef' });
    cy.request({ method: 'POST', url: `${api}/auth/register`, failOnStatusCode: false,
      body: { name: 'Persist', email: 'persist@x.com', password: 'abcdef' } }).its('status').should('eq', 409);
    cy.request('POST', `${api}/reset`);
    cy.request('POST', `${api}/auth/register`, { name: 'Persist', email: 'persist@x.com', password: 'abcdef' }).its('status').should('eq', 200);
  });
});

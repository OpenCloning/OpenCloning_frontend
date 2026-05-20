import endpoints from '../../../packages/opencloningdb/src/endpoints';


describe('opencloningdb login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('rejects wrong credentials', () => {
    cy.setInputValue('Email', 'bootstrap@example.com');
    cy.setInputValue('Password', 'wrong-password');
    cy.get('button[type="submit"]').click();
    cy.get('.MuiAlert-message').should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('logs in the bootstrap, sets the workspace and token, and lands on /sequences', () => {
    cy.setInputValue('Email', 'bootstrap@example.com');
    cy.setInputValue('Password', 'password');
    cy.intercept('POST', Cypress.getDbURL(endpoints.authToken)).as('getToken');
    cy.intercept('GET', Cypress.getDbURL(endpoints.sequences, '*')).as('getSequences');
    cy.get('button[type="submit"]').click();
    cy.wait('@getToken').then(({ response: { body: { access_token } } }) => {
      cy.window().its('localStorage').invoke('getItem', 'token').should('equal', access_token);
      cy.wait('@getSequences').then(({ request }) => {
        expect(request.headers).to.have.property('authorization', `Bearer ${access_token}`);
        expect(request.headers).to.have.property('x-workspace-id', '1');
      });
    });
    cy.location('pathname').should('eq', '/sequences');
    cy.contains('Sequences').should('be.visible');
  });

  it('redirects anonymous visits to /login', () => {
    cy.visit('/sequences');
    cy.location('pathname').should('eq', '/login');
  });

  it('after login, returns to the originally requested path and query', () => {
    cy.visit('/lines?uid=crispr_hdr-line');
    cy.location('pathname').should('eq', '/login');
    cy.setInputValue('Email', 'view-only-user@example.com');
    cy.setInputValue('Password', 'password');
    cy.get('button[type="submit"]').click();
    cy.location('pathname').should('eq', '/lines');
    cy.location('search').should('eq', '?uid=crispr_hdr-line');
  });
});

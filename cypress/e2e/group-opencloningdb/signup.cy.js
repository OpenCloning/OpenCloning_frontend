import endpoints from '../../../packages/opencloningdb/src/endpoints';


describe('opencloningdb sign up', () => {
  afterEach(() => {
    cy.resetDB();
  });

  it('shows validation error when passwords do not match', () => {
    cy.visit('/signup');
    cy.setInputValue('Display name', 'E2E User');
    cy.setInputValue('Email', 'e2e-mismatch@example.com');
    cy.setInputValue('Password', 'password-one');
    cy.setInputValue('Confirm password', 'password-two');
    cy.get('button[type="submit"]').click();
    cy.get('.MuiAlert-message').contains('Passwords do not match').should('be.visible');
    cy.location('pathname').should('eq', '/signup');
  });

  it('navigates between login and sign up', () => {
    cy.visit('/login');
    cy.contains('a', 'Sign up').click();
    cy.location('pathname').should('eq', '/signup');
    cy.contains('a', 'Sign in').click();
    cy.location('pathname').should('eq', '/login');
  });

  it('registers a new user and lands on sequences', () => {
    cy.visit('/signup');
    cy.setInputValue('Display name', `E2E Signup`);
    cy.setInputValue('Email', `e2e-signup@example.com`);
    cy.setInputValue('Password', 'password');
    cy.setInputValue('Confirm password', 'password');
    cy.intercept('POST', Cypress.getDbURL(endpoints.authRegister)).as('register');
    cy.intercept('GET', Cypress.getDbURL(endpoints.sequences, '*')).as('getSequences');
    cy.get('button[type="submit"]').click();
    cy.wait('@register').then(({ request }) => {
      expect(request.body).to.include({ email: `e2e-signup@example.com`, display_name: `E2E Signup` });
    });
    cy.wait('@getSequences');
    cy.location('pathname').should('eq', '/sequences');
    cy.contains('Sequences').should('be.visible');
  });
});

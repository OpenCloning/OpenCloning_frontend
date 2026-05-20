import endpoints from '../../../packages/opencloningdb/src/endpoints';

describe('cloning backend', () => {
  it('uses cloning backend auth', () => {
    cy.intercept('GET', 'http://localhost:8000/cloning/version').as('getVersion');
    cy.intercept('POST', Cypress.getDbURL(endpoints.authToken)).as('getToken');
    cy.e2eLogin('/design', 'bootstrap@example.com', 'password');
    cy.wait('@getToken').then(({ response: { body: { access_token } } }) => {
      cy.wait('@getVersion').then(({ request, response: { statusCode } }) => {
        expect(request.headers).to.have.property('authorization', `Bearer ${access_token}`);
        expect(statusCode).to.eq(200);
      });
    });
  });
});

import { setWorkspaceHeader } from '../../packages/opencloningdb/src/common.js';
import endpoints from '../../packages/opencloningdb/src/endpoints';

const DB_URL = 'http://localhost:8001';
const dbUrl = (path) => `${DB_URL}${path}`;
const STUB_FOLDER = 'OpenCloning_backend/stubs/db';

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  );
}

function resolveStub(stubOrName) {
  if (typeof stubOrName === 'string') {
    return cy.getStub(stubOrName);
  }

  return cy.wrap(stubOrName, { log: false });
}

function ensureHeadersMatch(actualHeaders, expectedHeaders) {
  Object.entries(expectedHeaders).forEach(([key, value]) => {
    if (actualHeaders[key] !== value) {
      throw new Error(
        `Header ${key} did not match stub. Expected: ${value}. Actual: ${actualHeaders[key]}`,
      );
    }
  });
}

/**
 * Authenticate against OpenCloningDB and configure the axios client for component tests.
 * @param {string} email
 * @param {string} password
 * @param {number} workspaceId
 */
Cypress.Commands.add('loginToOpenCloningDB', (email, password, workspaceId) => {
  cy.request({
    method: 'POST',
    url: dbUrl(endpoints.authToken),
    form: true,
    body: { username: email, password },
  }).then(({ body }) => {
    localStorage.setItem('token', body.access_token);
    setWorkspaceHeader(workspaceId);
  });
});

Cypress.Commands.add('mockLogin', () => {
  cy.intercept('POST', dbUrl(endpoints.authToken), { statusCode: 200, body: { access_token: 'test_token' } }).as('login');
  cy.intercept('GET', dbUrl(endpoints.authMe), { statusCode: 200, body: {} }).as('authMe');
  cy.intercept('GET', dbUrl(endpoints.workspaces), { statusCode: 200, body: [{ id: 1 }] }).as('workspaces');

});

/**
 * Set up OpenCloningDB client headers for tests without network login.
 * Mirrors testUtils.setupToken + setWorkspaceHeader from unit tests.
 * @param {number} workspaceId
 * @param {string} token
 */
Cypress.Commands.add('setupOpenCloningDBTestAuth', (workspaceId = 1, token = '__TEST_TOKEN__') => {
  localStorage.setItem('token', token);
  setWorkspaceHeader(workspaceId);
});

Cypress.Commands.add('getStub', (name) => {
  return cy.readFile(`${STUB_FOLDER}/${name}.json`);
});

Cypress.Commands.add('interceptOpenCloningDBStub', (stubOrName, options = {}) => {
  const alias = options.alias || 'openCloningDbStub';
  const extraParams = options.extraParams || {};

  return resolveStub(stubOrName).then((stub) => {

    cy.intercept(
      {
        method: stub.method,
        pathname: stub.endpoint,
      },
      (req) => {
        const actualHeaders = normalizeHeaders(req.headers);
        delete actualHeaders.accept;
        const expectedHeaders = normalizeHeaders(stub.headers);
        const stubParams = stub.params || {};
        const expectedParams = { ...stubParams, ...extraParams };
        const actualParams = req.query ?? {};

        expect(actualParams).to.deep.equal(expectedParams);
        ensureHeadersMatch(actualHeaders, expectedHeaders);

        req.reply({
          statusCode: stub.response.status_code,
          body: stub.response.body,
          headers: stub.response.headers,
        });
      },
    ).as(alias);

    return cy.wrap(stub, { log: false });
  });
});


Cypress.Commands.add('e2eLogin', (page, email, password) => {
  cy.visit(page);
  // Split page into pathname and search params
  const url = new URL(page, DB_URL);
  const pathname = url.pathname;
  const searchParams = url.search;
  cy.setInputValue('Email', email);
  cy.setInputValue('Password', password);
  cy.get('button[type="submit"]').click();
  cy.location('pathname').should('eq', pathname);
  cy.location('search').should('eq', searchParams);
});

Cypress.Commands.add('resetDB', () => {
  cy.request({
    method: 'POST',
    url: `${DB_URL}/__test/reset-db`,
    headers: {
      'x-test-reset-token': 'RESET-TOKEN',
    },
    failOnStatusCode: false,
  }).its('status').should('eq', 204);
});

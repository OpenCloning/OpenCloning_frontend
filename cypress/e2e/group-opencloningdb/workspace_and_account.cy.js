import endpoints from '../../../packages/opencloningdb/src/endpoints';

const DB_URL = 'http://localhost:8001';
const dbUrl = (path) => `${DB_URL}${path}`;

describe('workspace and account', () => {
  afterEach(() => {
    cy.resetDB();
  });

  function openAccountMenu() {
    cy.get('[data-testid="opencloningdb-appbar-account"]').click();
  }

  it('opens Manage workspaces from the app bar', () => {
    cy.e2eLogin('/sequences', 'bootstrap@example.com', 'password');
    openAccountMenu();
    cy.contains('Manage workspaces').click();
    cy.location('pathname').should('eq', '/workspace');
    cy.contains('h5', 'Manage workspaces').should('be.visible');
  });

  it('creates a workspace from the workspace page', () => {
    cy.e2eLogin('/workspace', 'bootstrap@example.com', 'password');
    cy.contains('h5', 'Manage workspaces').should('be.visible');
    cy.contains('h6', 'Create workspace').closest('.MuiPaper-root').within(() => {
      cy.setInputValue('Workspace name', 'e2e-created-workspace', 'div');
      cy.get('button').contains('Create').click();
    });
    cy.dbAlertExists('Workspace "e2e-created-workspace" created and activated');
    cy.closeDbAlerts();
    cy.get('.MuiToolbar-root .MuiTypography-caption').contains('e2e-created-workspace').should('exist');
  });

  it('renames the current workspace', () => {
    const newName = 'e2e-renamed';
    cy.e2eLogin('/workspace', 'bootstrap@example.com', 'password');
    cy.contains('h5', 'Manage workspaces').should('be.visible');
    cy.contains('h6', 'Rename current workspace').closest('.MuiPaper-root').within(() => {
      cy.setInputValue('Workspace name', newName, 'div');
      cy.get('button').contains('Rename').click();
    });
    cy.dbAlertExists('Workspace renamed successfully');
    cy.closeDbAlerts();
    cy.get('.MuiToolbar-root .MuiTypography-caption').contains(newName).should('exist');
  });

  it('switches workspace and sends x-workspace-id on the next list request', () => {
    cy.intercept('GET', `${dbUrl(endpoints.workspaces)}*`).as('getWorkspaces');
    cy.e2eLogin('/workspace', 'bootstrap@example.com', 'password');
    cy.wait('@getWorkspaces').then(({ response: { body } }) => {
      cy.contains('h5', 'Manage workspaces').should('be.visible');
      expect(body).to.have.length.greaterThan(0);
      const originalWorkspaceId = body[0].id;
      const originalName = body[0].name;

      cy.intercept('POST', dbUrl(endpoints.postWorkspace)).as('createWorkspace');
      cy.contains('h6', 'Create workspace').closest('.MuiPaper-root').within(() => {
        cy.setInputValue('Workspace name', 'e2e-second-workspace', 'div');
        cy.get('button').contains('Create').click();
      });
      cy.wait('@createWorkspace').then(({ response: { body } }) => {
        const newWorkspaceId = body.id;
        expect(body.name).to.eq('e2e-second-workspace');
        cy.dbAlertExists('Workspace "e2e-second-workspace" created and activated');
        cy.closeDbAlerts();
        cy.get('.MuiToolbar-root .MuiTypography-caption').contains('e2e-second-workspace').should('exist');
        cy.intercept('GET', `${dbUrl(endpoints.sequences)}*`).as('getSequences');
        cy.changeTab('Sequences');
        cy.wait('@getSequences').then(({ request }) => {
          expect(request.headers).to.have.property('x-workspace-id', String(newWorkspaceId));
        });

        cy.get('tbody tr').should('have.length', 0);
      });

      openAccountMenu();
      cy.contains('Switch workspaces').click();
      cy.contains('.MuiDialog-root', 'Switch workspace').find('.MuiSelect-select').click();
      cy.get('ul[role="listbox"] li').contains(originalName).click();
      cy.contains('.MuiDialog-root', 'Switch workspace').contains('button', 'Switch').click();

      cy.intercept('GET', `${dbUrl(endpoints.sequences)}*`).as('getSequencesAfterSwitch');
      // We use visit to trigger new request, otherwise the query cache is used and no request is sent.
      cy.visit('/sequences');
      cy.wait('@getSequencesAfterSwitch').then(({ request }) => {
        expect(request.headers).to.have.property('x-workspace-id', String(originalWorkspaceId));
      });
    });
  });

  it('signs out and clears the token', () => {
    cy.intercept('POST', dbUrl(endpoints.authToken)).as('getToken');
    cy.e2eLogin('/sequences', 'bootstrap@example.com', 'password');
    cy.wait('@getToken').then(({ response: { body: { access_token: accessToken } } }) => {
      cy.window().its('localStorage').invoke('getItem', 'token').should('equal', accessToken);
      openAccountMenu();
      cy.contains('Sign out').click();
      cy.location('pathname').should('eq', '/login');
      cy.window().its('localStorage').invoke('getItem', 'token').should('be.null');
    });
  });

  it('changing workspace clears the design tab', () => {
    cy.e2eLogin('/design', 'bootstrap@example.com', 'password');
    cy.get('.open-cloning', { timeout: 20000 }).should('exist');
    cy.manuallyTypeSequence('AACCCCTTTGGG', true);
    cy.get('li#sequence-1').should('exist');
    openAccountMenu();
    cy.contains('Manage workspaces').click();
    cy.contains('h6', 'Create workspace').closest('.MuiPaper-root').within(() => {
      cy.setInputValue('Workspace name', 'e2e-second-workspace', 'div');
      cy.get('button').contains('Create').click();
    });
    cy.dbAlertExists('Workspace "e2e-second-workspace" created and activated');
    cy.closeDbAlerts();
    cy.get('.MuiToolbar-root .MuiTypography-caption').contains('e2e-second-workspace').should('exist');
    cy.changeTab('Design');
    cy.get('.open-cloning').should('exist');
    cy.get('li#sequence-1').should('not.exist');
  });

  it('logging out clears the design tab', () => {
    cy.e2eLogin('/design', 'view-only-user@example.com', 'password');
    cy.get('.open-cloning', { timeout: 20000 }).should('exist');
    cy.manuallyTypeSequence('AACCCCTTTGGG', true);
    cy.get('li#sequence-1').should('exist');
    openAccountMenu();
    cy.contains('Sign out').click();
    cy.setInputValue('Email', 'view-only-user@example.com');
    cy.setInputValue('Password', 'password');
    cy.get('button[type="submit"]').click();
    cy.changeTab('Design');
    cy.get('.open-cloning').should('exist');
    cy.get('li#sequence-1').should('not.exist');
  });
});

import endpoints from '../../../packages/opencloningdb/src/endpoints';

describe('Actions that can be perfomed by an edit user on the Sequences page', () => {
  afterEach(() => {
    cy.resetDB();
  })
  it('can tag sequences from the table', () => {
    cy.addTagInTableTest('sequences', 'input_entities');
  });
  it('can remove and add tags from the detail page', () => {
    cy.addTagInDetailPageTest('sequences', 'pREX0008', 'example_sequencing');
  });
  it('can add and remove sequencing files from the detail page', () => {
    const sequenceName = 'pREX0008';
    cy.intercept('GET', Cypress.getDbURL(endpoints.sequences, '*')).as('getSequences');
    cy.e2eLogin(`/sequences?name=pREX0008`, 'bootstrap@example.com', 'password');
    cy.wait('@getSequences').then(({ response }) => {
      const sequence = response.body.items.find((item) => item.name === sequenceName);
      cy.intercept('GET', Cypress.getDbURL(endpoints.sequenceSequencingFiles(sequence.id))).as('getSequenceSequencingFiles');
      cy.get('tbody tr button').contains(sequenceName).click();
      cy.wait('@getSequenceSequencingFiles').then(({ response }) => {
        const sequencingFiles = response.body;
        const sequencingFile = sequencingFiles[0];
        cy.intercept('DELETE', Cypress.getDbURL(endpoints.sequenceSequencingFileDelete(sequence.id, sequencingFile.id))).as('deleteSequencingFile');
        cy.get('[data-testid="sequencing-file-row"]').filter(`:contains(${sequencingFile.original_name})`).within(() => {
          cy.get('[aria-label="Delete"]').click();
        });
        cy.wait('@deleteSequencingFile');
        cy.get('[data-testid="sequencing-file-row"]').contains(sequencingFile.original_name).should('not.exist');
        cy.dbAlertExists('Sequencing file deleted successfully');
        cy.closeDbAlerts();
        cy.intercept('POST', Cypress.getDbURL(endpoints.sequenceSequencingFiles(sequence.id))).as('addSequencingFile');
        cy.get('[aria-label="Add sequencing files"]').siblings('input').selectFile('cypress/test_files/dummy_sequencing.fasta', { force: true });
        cy.wait('@addSequencingFile');
        cy.dbAlertExists('Sequencing files submitted successfully');
        cy.get('[data-testid="sequencing-file-row"]').contains('dummy_sequencing.fasta').should('exist');

      });
    });
  });
  it('can add and remove sample UIDs from the detail page', () => {
    const sequenceName = 'pREX0008';
    cy.intercept('GET', Cypress.getDbURL(endpoints.sequences, '*')).as('getSequences');
    cy.e2eLogin(`/sequences?name=pREX0008`, 'bootstrap@example.com', 'password');
    cy.wait('@getSequences').then(({ response }) => {
      const sequence = response.body.items.find((item) => item.name === sequenceName);
      cy.get('tbody tr button').contains(sequenceName).click();
      cy.get('[data-testid="sequence-samples-section"]').contains('cre_lox_recombination-sample').should('not.exist');
      cy.get('[data-testid="sequence-samples-section"]').contains('example_sequencing-sample').should('exist');
      cy.intercept('PATCH', Cypress.getDbURL(endpoints.sequenceSample('cre_lox_recombination-sample'))).as('transferSample');
      cy.get('[aria-label="Transfer UID from another sequence"]').click();
      cy.setAutocompleteValue('Search UIDs', 'cre_lox_recombination-sample', 'body', false);
      cy.contains('Are you sure you want to transfer UID cre_lox_recombination-sample from sequence reconstituted_locus to this one').should('exist');
      cy.contains('Confirm').click();
      cy.wait('@transferSample').then(({ request }) => {
        expect(request.body).to.deep.equal({ sequence_id: sequence.id });
      });
      cy.get('[data-testid="sequence-samples-section"]').contains('cre_lox_recombination-sample').should('exist');
      cy.get('[data-testid="sequence-samples-section"]').contains('example_sequencing-sample').should('exist');
      cy.dbAlertExists('UID transferred successfully');
      cy.closeDbAlerts();

      cy.get('[aria-label="Add new UIDs"]').click();
      cy.get('[data-testid="create-sequence-sample-uid-dialog"]').should('be.visible');
      cy.get('[data-testid="create-sequence-sample-uid-dialog"]').within(() => {
        cy.get('input').type('new_sample_uid');
        cy.get('button').contains('Add another UID').click();
        cy.get('input').last().type('new_sample_uid2');
        cy.get('button').contains('Create').click();
      });

      cy.get('[data-testid="sequence-samples-section"]').contains('new_sample_uid').should('exist');
      cy.get('[data-testid="sequence-samples-section"]').contains('new_sample_uid2').should('exist');
      cy.dbAlertExists('2 sample UID(s) created successfully');
      cy.closeDbAlerts();

      // Can delete it
      cy.get('[data-testid="sample-uid-badge-with-delete"]').contains('new_sample_uid2').within(() => {
        cy.get('svg').click();
      });
      cy.dbAlertExists('UID new_sample_uid2 deleted successfully');
      cy.closeDbAlerts();
      cy.get('[data-testid="sample-uid-badge-with-delete"]').contains('new_sample_uid').should('exist');
      cy.get('[data-testid="sample-uid-badge-with-delete"]').contains('new_sample_uid2').should('not.exist');
    });
  });
  it('can change name but not sequence type in circular sequence', () => {

    cy.e2eLogin(`/sequences?name=pREX0008`, 'bootstrap@example.com', 'password');
    cy.get('tbody tr button').contains('pREX0008').click();
    cy.get('[data-testid="sequence-header"]').within(() => {
      cy.get('[aria-label="Edit name and type"]').click();
      cy.get('input').first().clear()
      cy.get('input').first().type('new_sequence_name');
      cy.get('input').last().should('be.disabled');
      cy.get('button').contains('Save').click();
      cy.contains('new_sequence_name').should('exist');
    });
    cy.dbAlertExists('Sequence updated successfully');

    cy.closeDbAlerts();
  });
  it('can change name and sequence type in linear sequence', () => {
    cy.e2eLogin(`/sequences?name=reconstituted_locus`, 'bootstrap@example.com', 'password');
    cy.get('tbody tr button').contains('reconstituted_locus').click();
    cy.get('[data-testid="sequence-header"]').within(() => {
      cy.contains('Linear DNA').should('exist');
      cy.get('[aria-label="Edit name and type"]').click();
      cy.get('input').first().clear()
      cy.get('input').first().type('new_sequence_name');
      cy.contains('Type').siblings('div').first().click();
    });
    // Plasmid should not be an option
    cy.get('div[role="presentation"]').contains('Plasmid').should('not.exist');
    cy.get('div[role="presentation"]').contains('Allele').click();
    cy.get('[data-testid="sequence-header"]').within(() => {
      cy.get('button').contains('Save').click();
      cy.contains('new_sequence_name').should('exist');
      cy.contains('Allele').should('exist');
      cy.contains('Linear DNA').should('not.exist');
    });
    cy.dbAlertExists('Sequence updated successfully');
    cy.closeDbAlerts();
  });
});

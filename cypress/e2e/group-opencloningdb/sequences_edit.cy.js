import endpoints from '../../../packages/opencloningdb/src/endpoints';

const bulkSequenceFiles = [
  '68164.gb',
  '68165.gb',
  'hello.fasta',
  'pFA6a-3HA-kanMX6.fasta',
  'repeated_1.gb',
  'repeated_2.gb',
].map((file) => `cypress/test_files/bulk_sequence_submit/${file}`);

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
  it('can bulk upload sequences', () => {
    cy.e2eLogin('/sequences', 'bootstrap@example.com', 'password');
    cy.get('button').contains('Bulk Upload').click();
    cy.get('input[type="file"]').selectFile(bulkSequenceFiles, { force: true });
    cy.get('[data-testid="bulk-upload-sequences-modal"]').within(() => {
      cy.get('tr').eq(1).within(() => {
        cy.contains('hello.fasta').should('exist');
        cy.get('[data-testid="CancelIcon"]').should('exist');
      });
      cy.get('tr').eq(2).within(() => {
        cy.contains('pFA6a-3HA-kanMX6.fasta').should('exist');
        cy.get('[data-testid="WarningIcon"]').should('exist');
        cy.contains('Circularized sequence already exists in workspace').should('exist');
        cy.contains('Name already exists in workspace').should('exist');
      });
      cy.get('tr').eq(3).within(() => {
        cy.contains('repeated_1.gb').should('exist');
        cy.get('[data-testid="WarningIcon"]').should('exist');
        cy.contains('Name duplicated in uploaded files').should('exist');
        cy.contains('Sequence duplicated in uploaded files').should('exist');
      });
      cy.get('tr').eq(4).within(() => {
        cy.contains('repeated_2.gb').should('exist');
        cy.get('[data-testid="WarningIcon"]').should('exist');
        cy.contains('Name duplicated in uploaded files').should('exist');
        cy.contains('Sequence duplicated in uploaded files').should('exist');
      });
      cy.get('tr').eq(5).within(() => {
        cy.contains('68164.gb').should('exist');
        cy.get('[data-testid="CheckCircleIcon"]').should('exist');
        cy.get('td').eq(5).should('be.empty');
      });
      cy.get('tr').eq(6).within(() => {
        cy.contains('68165.gb').should('exist');
        cy.get('[data-testid="CheckCircleIcon"]').should('exist');
        cy.get('td').eq(5).should('be.empty');
      });
      cy.intercept('POST', Cypress.getDbURL(endpoints.sequencesBulk, '*')).as('bulkUploadSequences');
      cy.get('button').contains('Import Clear').click();
      cy.wait('@bulkUploadSequences').then(({ response, request }) => {
        cy.wrap(response.body).should('have.length', 2);
        cy.wrap(response.body[0].name).should('equal', 'pPML1_(GB0045)');
        cy.wrap(response.body[1].name).should('equal', 'pNH__(GB0064)');
        cy.wrap(request.query).should('have.property', 'strict', 'true');
      });
      cy.dbAlertExists('Imported 2 sequences successfully');
      cy.closeDbAlerts();
    });
    cy.get('button').contains('Bulk Upload').click();
    cy.get('input[type="file"]').selectFile(bulkSequenceFiles.slice(2), { force: true });
    cy.get('[data-testid="bulk-upload-sequences-modal"]').within(() => {
      cy.get('tr [data-testid="CheckCircleIcon"]').should('not.exist');
      cy.get('tr [data-testid="WarningIcon"]').should('exist');
      cy.get('tr [data-testid="CancelIcon"]').should('exist');
      cy.get('button').contains(/^Import Clear$/).should('be.disabled');
      cy.intercept('POST', Cypress.getDbURL(endpoints.sequencesBulk, '*')).as('bulkUploadSequences2');
      cy.get('button').contains('Import Clear + Warnings').click();
      cy.wait('@bulkUploadSequences2').then(({ response, request }) => {
        cy.wrap(response.body).should('have.length', 3);
        cy.wrap(response.body[0].name).should('equal', 'pFA6a-3HA-kanMX6');
        cy.wrap(response.body[1].name).should('equal', 'pj5_00001');
        cy.wrap(response.body[2].name).should('equal', 'pj5_00001');
        cy.wrap(request.query).should('have.property', 'strict', 'false');
      });
      cy.dbAlertExists('Imported 3 sequences successfully');
      cy.closeDbAlerts();
    });
  });
});

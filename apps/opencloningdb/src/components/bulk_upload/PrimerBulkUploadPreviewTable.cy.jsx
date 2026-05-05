import React from 'react';
import PrimerBulkUploadPreviewTable from './PrimerBulkUploadPreviewTable';

describe('<PrimerBulkUploadPreviewTable />', () => {
  it('shows all issue messages from bulk_upload.js with the right status icon', () => {
    const rows = [
      {
        name: 'clear-primer',
        uid: 'C1',
        sequence: 'ATGC',
      },
      {
        name: 'sequence-invalid',
        uid: 'E1',
        sequence: 'ATGC',
        'sequence_invalid': true,
      },
      {
        name: 'name-exists',
        uid: 'W1',
        sequence: 'GCTA',
        'name_exists': true,
      },
      {
        name: 'sequence-exists',
        uid: 'W2',
        sequence: 'TTAA',
        'sequence_exists': true,
      },
      {
        name: 'uid-exists',
        uid: 'E2',
        sequence: 'CCGG',
        'uid_exists': true,
      },
      {
        name: 'name-duplicated',
        uid: 'W3',
        sequence: 'AGAG',
        'name_duplicated': true,
      },
      {
        name: 'sequence-duplicated',
        uid: 'W4',
        sequence: 'CTCT',
        'sequence_duplicated': true,
      },
      {
        name: 'uid-duplicated',
        uid: 'E3',
        sequence: 'GGCC',
        'uid_duplicated': true,
      },
    ];

    cy.mount(<PrimerBulkUploadPreviewTable rows={rows} />);


    cy.contains('td', 'clear-primer').parent().within(() => {
      cy.get('[data-testid="CheckCircleIcon"]').should('exist');
      cy.get('td').eq(4).should('be.empty');
    });

    cy.contains('td', 'sequence-invalid').parent().within(() => {
      cy.get('[data-testid="CancelIcon"]').should('exist');
      cy.contains('Invalid DNA sequence').should('exist');
    });

    cy.contains('td', 'name-exists').parent().within(() => {
      cy.get('[data-testid="WarningIcon"]').should('exist');
      cy.contains('Name already exists in workspace').should('exist');
    });

    cy.contains('td', 'sequence-exists').parent().within(() => {
      cy.get('[data-testid="WarningIcon"]').should('exist');
      cy.contains('Sequence already exists in workspace').should('exist');
    });

    cy.contains('td', 'uid-exists').parent().within(() => {
      cy.get('[data-testid="CancelIcon"]').should('exist');
      cy.contains('UID already exists in workspace').should('exist');
    });

    cy.contains('td', 'name-duplicated').parent().within(() => {
      cy.get('[data-testid="WarningIcon"]').should('exist');
      cy.contains('Name duplicated in uploaded file').should('exist');
    });

    cy.contains('td', 'sequence-duplicated').parent().within(() => {
      cy.get('[data-testid="WarningIcon"]').should('exist');
      cy.contains('Sequence duplicated in uploaded file').should('exist');
    });

    cy.contains('td', 'uid-duplicated').parent().within(() => {
      cy.get('[data-testid="CancelIcon"]').should('exist');
      cy.contains('UID duplicated in uploaded file').should('exist');
    });
  });

  it('prioritizes error icon when row has warning and error, while showing both issues', () => {
    const rows = [
      {
        name: 'warning-and-error',
        uid: 'E4',
        sequence: 'TTAA',
        'sequence_invalid': true,
        'name_exists': true,
      },
    ];

    cy.mount(<PrimerBulkUploadPreviewTable rows={rows} />);

    cy.contains('td', 'warning-and-error').parent().within(() => {
      cy.get('[data-testid="CancelIcon"]').should('exist');
      cy.contains('Invalid DNA sequence').should('exist');
      cy.contains('Name already exists in workspace').should('exist');
      cy.get('[data-testid="WarningIcon"]').should('not.exist');
    });
  });
});

import React from 'react';
import SequenceSelect from './SequenceSelect';
import { clickMultiSelectOption } from '../../../cypress/e2e/common_functions';

const SEQUENCE_NAME = 'ase1_CDS_PCR';

describe('<SequenceSelect />', () => {
  it('searches for a sequence and shows results', () => {
    cy.setupOpenCloningDBTestAuth();
    const onChangeSpy = cy.spy().as('onChangeSpy');

    cy.interceptOpenCloningDBStub('get_sequences_search_by_name', { alias: 'getSequences' });

    cy.mount(
      <SequenceSelect label="Sequence" onChange={onChangeSpy} multiple={false} />
    );

    cy.get('input').click();
    cy.contains('Type at least').should('exist');
    cy.get('input').type(SEQUENCE_NAME);
    cy.get('.MuiAutocomplete-listbox li', { timeout: 10000 }).should('have.length.greaterThan', 0);

    clickMultiSelectOption('Sequence', RegExp(`^${SEQUENCE_NAME}$`), 'div');

    cy.getStub('get_sequences_search_by_name').then((stub) => {
      const stubSequence = stub.response.body.items.find((sequence) => sequence.name === SEQUENCE_NAME);
      cy.get('@onChangeSpy').should('have.been.calledWith', stubSequence);
    });

    cy.get('input').should('have.value', SEQUENCE_NAME);
  });
});

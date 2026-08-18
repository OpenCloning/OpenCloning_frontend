import React from 'react';
import { Provider } from 'react-redux';
import store from '@opencloning/store';
import { cloningActions } from '@opencloning/store/cloning';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import SourceAnnotation from './SourceAnnotation';

const { setState: setCloningState } = cloningActions;

const config = { backendUrl: 'http://127.0.0.1:8000' };

const sequence = {
  id: 1,
  type: 'TextFileSequence',
  file_content: "LOCUS       name                       5 bp    DNA     linear   UNK 01-JAN-1980\nDEFINITION  description.\nACCESSION   id\nVERSION     id\nKEYWORDS    .\nSOURCE      .\n  ORGANISM  .\n            .\nFEATURES             Location/Qualifiers\nORIGIN\n        1 aaaaa\n//",
  sequence_file_format: 'genbank',
  overhang_crick_3prime: 0,
  overhang_watson_3prime: 0,
};

const primers = [
  { id: 3, name: 'fwd', sequence: 'AACAGCTATGACCATG' },
  { id: 4, name: 'rvs', sequence: 'GTAAAACGACGGCCAGT' },
];

// The tool is set by the source type selector, so it is already on the source here
const mapPrimersSource = { id: 2, type: 'AnnotationSource', annotation_tool: 'primer_binding_sites', input: [{ sequence: 1 }] };
const plannotateSource = { id: 2, type: 'AnnotationSource', annotation_tool: 'plannotate', input: [{ sequence: 1 }] };

function mountComponent({ source = mapPrimersSource, statePrimers = primers, sendPostRequest = () => {} } = {}) {
  store.dispatch(setCloningState({ sequences: [sequence], sources: [source], primers: statePrimers, files: [] }));
  cy.mount(
    <Provider store={store}>
      <ConfigProvider config={config}>
        <SourceAnnotation source={source} requestStatus={{ status: null }} sendPostRequest={sendPostRequest} />
      </ConfigProvider>
    </Provider>,
  );
}

describe('SourceAnnotation', () => {
  it('shows the annealing settings and how many primers will be mapped', () => {
    mountComponent();
    cy.contains('All 2 primers in the Primers tab will be mapped onto this sequence.');
    cy.contains('label', 'Minimal annealing length').should('exist');
    cy.contains('label', 'Mismatches allowed').should('exist');
    cy.contains('button', 'Map primers').should('exist');
  });

  it('submits every primer in the list with the chosen settings', () => {
    const requests = [];
    mountComponent({ sendPostRequest: (payload) => requests.push(payload) });

    cy.contains('label', 'Minimal annealing length').parent().find('input').clear().type('16');
    cy.contains('label', 'Mismatches allowed').parent().find('input').clear().type('2');
    cy.contains('button', 'Map primers').click().then(() => {
      expect(requests).to.have.length(1);
      const [{ endpoint, requestData, config: requestConfig }] = requests;
      expect(endpoint).to.equal('annotate/primer_binding_sites');
      expect(requestData.primers.map((p) => p.name)).to.deep.equal(['fwd', 'rvs']);
      expect(requestData.source.annotation_tool).to.equal('primer_binding_sites');
      expect(requestData.sequence.id).to.equal(1);
      // The melting temperatures use the same settings as the rest of the app
      expect(requestData.settings).to.deep.equal({
        primer_dna_conc: 50,
        primer_salt_monovalent: 50,
        primer_salt_divalent: 1.5,
      });
      expect(requestConfig.params.minimal_annealing).to.equal('16');
      expect(requestConfig.params.allowed_mismatches).to.equal('2');
      // Left empty, so no filtering is asked for
      expect(requestConfig.params).to.not.have.property('minimal_tm');
    });
  });

  it('sends a minimal Tm only when one is given', () => {
    const requests = [];
    mountComponent({ sendPostRequest: (payload) => requests.push(payload) });

    cy.contains('label', 'Minimal Tm').parent().find('input').type('60');
    cy.contains('button', 'Map primers').click().then(() => {
      expect(requests[0].config.params.minimal_tm).to.equal('60');
    });
  });

  it('explains what to do when there are no primers to map', () => {
    mountComponent({ statePrimers: [] });
    cy.contains('Add primers in the Primers tab');
    cy.contains('button', 'Map primers').should('not.exist');
  });

  it('keeps the pLannotate behaviour, without the annealing settings', () => {
    const requests = [];
    mountComponent({ source: plannotateSource, sendPostRequest: (payload) => requests.push(payload) });

    cy.contains('label', 'Minimal annealing length').should('not.exist');
    cy.contains('button', 'Annotate').click().then(() => {
      expect(requests).to.have.length(1);
      const [{ endpoint, requestData }] = requests;
      expect(endpoint).to.equal('annotate/plannotate');
      expect(requestData.primers).to.equal(undefined);
      expect(requestData.source.annotation_tool).to.equal('plannotate');
    });
  });
});

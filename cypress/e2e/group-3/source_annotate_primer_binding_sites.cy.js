import { addSource, changeTab } from '../common_functions';

// This reproduces the workflow a user asked for: import a plasmid and a whole list of
// primers, then map all of them onto the plasmid in a single step. The data is the same
// used in the backend tests: 42 primers, of which 27 bind the plasmid in 29 places.
const testFiles = 'cypress/test_files/primer_binding_sites';

function loadPlasmid() {
  addSource('UploadedFileSource', true);
  cy.get('form.submit-sequence-file input').last().selectFile(
    `${testFiles}/pGreen_0029_GFP_nonSTOP.gb`,
    { force: true },
  );
  cy.get('li[id^="sequence-"]', { timeout: 20000 }).should('have.length', 1);
}

function importPrimersFromFile() {
  changeTab('Primers');
  cy.get('.primer-form-container').contains('Import from file').click();
  cy.get('input[type="file"][accept=".csv,.tsv"]').selectFile(`${testFiles}/primers.tsv`, { force: true });
  cy.get('.import-primers-modal-content').should('exist');
  cy.get('.import-primers-modal-content').contains('button', 'Import').click();
  cy.get('.primer-table-container tbody tr').should('have.length', 42);
  changeTab('Cloning');
}

// 500 nM is the primer concentration the program that produced the reference file uses.
// The other tab panels stay in the DOM, so everything here is scoped to the settings card.
function setPrimerConcentration(value) {
  changeTab('Settings');
  cy.contains('.settings-tab', 'Primer DNA concentration').should('be.visible').within(() => {
    cy.contains('button', 'Edit').click();
    cy.contains('label', 'Primer DNA concentration').parent().find('input')
      .as('concentrationInput');
    cy.get('@concentrationInput').clear();
    cy.get('@concentrationInput').type(String(value));
    cy.contains('button', 'Save').click();
  });
  changeTab('Cloning');
}

// The ids of the sources depend on how many primers were imported, so the annotation
// source is located by its content instead
function selectMapPrimers() {
  addSource('MapPrimers');
}

function annotationSource() {
  return cy.get('li[id^="source-"]').filter(':contains("Annotated")');
}

// Report columns: primer, position, strand, annealing length, mismatches,
//                 Tm (bound), Tm (primer), %GC
// The displayed values are rounded, so they are compared as numbers rather than as text
function expectMeasurements($row, primerName, { bound, primer, gc }) {
  cy.wrap($row).find('td').then(($cells) => {
    expect(Number($cells.eq(5).text()), `${primerName} Tm (bound)`).to.be.closeTo(bound, 0.2);
    expect(Number($cells.eq(6).text()), `${primerName} Tm (primer)`).to.be.closeTo(primer, 0.2);
    if (gc !== undefined) {
      expect(Number($cells.eq(7).text()), `${primerName} %GC`).to.be.closeTo(gc, 0.1);
    }
  });
}

function expectRowMeasurements(primerName, measurements) {
  cy.get('.MuiDialog-root tbody tr').filter(`:contains("${primerName}")`).first()
    .then(($row) => expectMeasurements($row, primerName, measurements));
}

describe('Annotate primer binding sites', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.viewport(1920, 1080);
  });

  it('maps a whole list of primers onto a plasmid in one step', () => {
    loadPlasmid();
    importPrimersFromFile();
    selectMapPrimers();
    cy.contains('button', 'Map primers').click();

    // The output is a new sequence with the primer binding sites annotated
    cy.get('li[id^="sequence-"]', { timeout: 20000 }).should('have.length', 2);
    annotationSource().contains('Annotated 29 primer binding sites');

    // The report lists every site, and the primers that bind nowhere
    annotationSource().contains('button', 'See report').click();
    cy.get('.MuiDialog-root tbody tr').should('have.length', 29);
    cy.get('.MuiDialog-root').contains('15 primers do not bind anywhere');
    // A primer that binds twice is listed twice
    cy.get('.MuiDialog-root tbody tr').filter(':contains("pAF")').should('have.length', 2);
    // A sequencing primer that binds once, on the reverse strand
    cy.get('.MuiDialog-root tbody tr').filter(':contains("M13F")')
      .should('have.length', 1)
      .contains('reverse');
    // A primer with a 5' restriction site anneals over only part of its length
    cy.get('.MuiDialog-root tbody tr').filter(':contains("GFPsense_F")').contains('24 / 30 bp');
    cy.get('body').type('{esc}');

    // The features are visible in the sequence editor of the annotated sequence, which is
    // the sequence produced by the annotation source and so shares its number
    annotationSource().invoke('attr', 'id').then((sourceId) => {
      const outputId = sourceId.replace('source-', 'sequence-');
      cy.get(`li#${outputId} svg[data-testid="VisibilityIcon"]`).first().click();
      changeTab('Sequence');
      // Make sure the editor is showing the annotated sequence and not the input one
      cy.contains('pGreen_0029_GFP_nonSTOP_primers').should('exist');
      cy.get('.veLabelText').contains('M13F').should('exist');
      cy.get('.veLabelText').contains('gfp-genomF').should('exist');
    });
  });

  it('reports when no primer binds the sequence', () => {
    loadPlasmid();
    importPrimersFromFile();
    selectMapPrimers();

    // No primer is 40 bp long, so nothing can anneal over that length
    cy.contains('label', 'Minimal annealing length').parent().find('input')
      .as('annealingInput');
    cy.get('@annealingInput').clear();
    cy.get('@annealingInput').type('40');
    cy.contains('button', 'Map primers').click();

    cy.get('li[id^="sequence-"]', { timeout: 20000 }).should('have.length', 2);
    annotationSource().contains('Annotated 0 primer binding sites');
    annotationSource().contains('button', 'See report').click();
    cy.get('.MuiDialog-root').contains('42 primers do not bind anywhere');
  });
});

describe('Melting temperatures of the binding sites', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.viewport(1920, 1080);
  });

  it('reports the melting temperatures and the GC content of every site', () => {
    loadPlasmid();
    importPrimersFromFile();
    setPrimerConcentration(500);
    selectMapPrimers();
    cy.contains('button', 'Map primers').click();

    cy.get('li[id^="sequence-"]', { timeout: 20000 }).should('have.length', 2);
    annotationSource().contains('Annotated 29 primer binding sites');
    annotationSource().contains('button', 'See report').click();

    // These anneal over their whole length, so the two temperatures are the same, and both
    // they and the GC content match the reference file
    expectRowMeasurements('M13R', { bound: 51.0, primer: 51.0, gc: 43.8 });
    expectRowMeasurements('gfp-genomF', { bound: 63.2, primer: 63.2, gc: 55.0 });
    expectRowMeasurements('M13F', { bound: 58.4, primer: 58.4, gc: 52.9 });

    // pAF binds twice: over its whole length, and over its 3'-most 21 bases. On the second
    // site the 4 unpaired bases count towards neither the duplex Tm nor its GC content
    cy.get('.MuiDialog-root tbody tr').filter(':contains("pAF")').should('have.length', 2)
      .then(($rows) => {
        expectMeasurements($rows.eq(0), 'pAF full', { bound: 64.9, primer: 64.9, gc: 44.0 });
        expectMeasurements($rows.eq(1), 'pAF partial', { bound: 59.8, primer: 64.9, gc: 38.1 });
      });
    cy.get('.MuiDialog-root tbody tr').filter(':contains("pAF")').eq(1).contains('21 / 25 bp');
  });

  it('leaves out the binding sites that melt below the minimal Tm', () => {
    loadPlasmid();
    importPrimersFromFile();
    setPrimerConcentration(500);
    selectMapPrimers();

    cy.contains('label', 'Minimal Tm').parent().find('input').type('60');
    cy.contains('button', 'Map primers').click();

    cy.get('li[id^="sequence-"]', { timeout: 20000 }).should('have.length', 2);
    annotationSource().contains('button', 'See report').click();
    // M13R melts at 51 degrees, gfp-genomF at 63.2
    cy.get('.MuiDialog-root tbody tr').filter(':contains("M13R")').should('have.length', 0);
    cy.get('.MuiDialog-root tbody tr').filter(':contains("gfp-genomF")').should('have.length', 1);
    // The filter is on the bound stretch, so pAF keeps only the site where it anneals fully
    cy.get('.MuiDialog-root tbody tr').filter(':contains("pAF")').should('have.length', 1)
      .contains('25 / 25 bp');
    cy.get('.MuiDialog-root').contains('do not bind anywhere');
  });
});

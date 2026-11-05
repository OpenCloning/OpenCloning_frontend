import { changeTab } from '../common_functions';

// The workspace has sequences tagged "golden-braid". For the GoldenBraid Level 1 α syntax, the compatible ones are:
// backbone pDGB3_alpha2, promoter pJOG684, CDSs pJOG171, pJOG173 and pJOG351, terminator pUPD-ADH2t_(17-21).
// pDGB3_omega2R and pJOG587 are not compatible.
function loadGoldenBraidSyntax() {
  changeTab('Assembler');
  cy.get('button').contains('Load Syntax').click();
  cy.get('div[role="dialog"] li', { timeout: 20000 }).contains('GoldenBraid').click();
  cy.get('div[role="dialog"] li').contains('Level 1 α').click();
  cy.get('button').contains('Load Plasmids', { timeout: 20000 }).should('be.visible');
}

function loadPlasmidsByTag(tagName) {
  cy.get('[data-testid="load-plasmids-button"]').click();
  cy.get('[data-testid="load-plasmids-from-database"]').click();
  cy.get('[role="dialog"] input').first().click();
  cy.get('li[role="option"]').contains(tagName).click();
  // Click on the title to close the options popup (clicking the backdrop would close the dialog)
  cy.get('[role="dialog"] h2').click();
  cy.intercept('GET', '**/sequences/text_file_sequences*').as('getTextFiles');
  cy.get('[role="dialog"] button').contains('Load sequences').click();
  cy.wait('@getTextFiles');
}

describe('Assembler with OpenCloningDB', () => {
  beforeEach(() => {
    cy.e2eLogin('/design', 'bootstrap+clerk_test@example.com', 'password');
  });

  it('does not load the default plasmids of the syntax, and offers the database as a source', () => {
    loadGoldenBraidSyntax();
    // No plasmids loaded, so there is nothing to choose from
    cy.get('[data-testid="assembler-submit-button"]').should('not.exist');
    cy.get('[data-testid="load-plasmids-button"]').click();
    cy.get('[data-testid="load-plasmids-from-files"]').should('exist');
    cy.get('[data-testid="load-plasmids-from-database"]').should('exist');
    cy.get('[data-testid="load-plasmids-from-local-server"]').should('not.exist');
  });

  it('loads plasmids by tag from the database and uses them in the assembler', () => {
    loadGoldenBraidSyntax();
    loadPlasmidsByTag('golden-braid');

    // Incompatible plasmids are reported as invalid, compatible ones as valid
    cy.get('[role="dialog"]').contains('Invalid Plasmids').should('exist');
    cy.get('[role="dialog"]').contains('Valid Plasmids').should('exist');
    cy.get('[data-testid="invalid-plasmids-box"]').contains('pDGB3_omega2R').should('exist');
    cy.get('[data-testid="invalid-plasmids-box"]').contains('pJOG587').should('exist');
    ['pDGB3_alpha2', 'pJOG684', 'pJOG171', 'pJOG173', 'pJOG351', 'pUPD-ADH2t_(17-21)'].forEach((name) => {
      cy.get('[data-testid="valid-plasmids-box"]').contains(name).should('exist');
    });
    cy.get('[role="dialog"] button').contains('Import valid plasmids').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Only the valid ones are available
    cy.get('[data-testid="category-select"]').last().click();
    cy.get('li[role="option"]').contains("Prom + 5'UTR").click();
    cy.get('[data-testid="plasmid-select"]').last().click();
    cy.get('li[role="option"]').should('have.length', 1);
    cy.get('li[role="option"]').contains('pJOG684').should('exist');
    cy.get('li[role="option"]').contains('pJOG587').should('not.exist');
    cy.get('li[role="option"]').contains('pDGB3_omega2R').should('not.exist');
  });

  it('runs a combinatorial assembly with plasmids from the database', () => {
    loadGoldenBraidSyntax();
    loadPlasmidsByTag('golden-braid');
    cy.get('[role="dialog"] button').contains('Import valid plasmids').click();
    cy.get('[role="dialog"]').should('not.exist');

    // Each plasmid-select is addressed by the position of its box, since the backbone box is added automatically
    const selectPlasmids = (boxIndex, plasmidNames) => {
      plasmidNames.forEach((name) => {
        cy.get('[data-testid="plasmid-select"]').eq(boxIndex).find('input').click();
        cy.get('li[role="option"]').contains(name).click();
      });
    };
    const selectCategory = (categoryName) => {
      cy.get('[data-testid="category-select"]').last().click();
      cy.get('li[role="option"]').contains(categoryName).click();
    };
    selectCategory("Prom + 5'UTR");
    selectPlasmids(0, ['pJOG684']);
    selectCategory('CDS (Includes STOP)');
    selectPlasmids(1, ['pJOG171', 'pJOG173', 'pJOG351']);
    selectCategory("3'UTR + Term");
    selectPlasmids(2, ['pUPD-ADH2t']);
    // The backbone category is the only option left, so it is filled automatically
    selectPlasmids(3, ['pDGB3_alpha2']);

    cy.get('[data-testid="assembler-submit-button"]').click();
    cy.get('[data-testid="assembler-product-table"]', { timeout: 30000 }).should('be.visible');
    // 1 promoter x 3 CDS x 1 terminator x 1 backbone
    cy.get('[data-testid="assembler-product-table-view-button"]').should('have.length', 3);

    // The product is sent to the cloning tab, where the input plasmids are DatabaseSources
    cy.get('[data-testid="assembler-product-table-view-button"]').first().click();
    cy.get('button.MuiTab-root.Mui-selected').contains('Cloning').should('exist');
    // The 4 input plasmids are DatabaseSources (located in the database), the product is not
    [1, 2, 3, 4].forEach((id) => cy.checkSequenceInDatabase(id));
    cy.checkSequenceNotInDatabase(5);
  });
});

import { prepareTemplateSequenceRowsForValidation } from './bulk_upload';

describe('prepareTemplateSequenceRowsForValidation', () => {
  it('returns normalized rows when sequence_type values are valid and removes empty names', () => {
    const result = prepareTemplateSequenceRowsForValidation([
      { name: '  template_a  ', sequence_type: 'allele' },
      { name: 'template_b', sequence_type: 'pcr_product' },
      { name: '   ', sequence_type: 'allele' },
    ]);

    expect(result).to.deep.equal([
      { name: 'template_a', sequence_type: 'allele' },
      { name: 'template_b', sequence_type: 'pcr_product' },
    ]);
  });

  it('throws when sequence_type contains invalid values', () => {
    expect(() => prepareTemplateSequenceRowsForValidation([
      { name: 'template_a', sequence_type: 'not_a_type' },
    ])).to.throw('Invalid sequence_type value(s): not_a_type');
  });

  it('throws when all names are empty after trimming', () => {
    expect(() => prepareTemplateSequenceRowsForValidation([
      { name: '   ', sequence_type: 'allele' },
    ])).to.throw('File does not contain template sequence rows with names');
  });
});

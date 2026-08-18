import { it, describe } from 'vitest';
import {
  getUsedPrimerIds,
  isCompletePrimerBindingAnnotationSource,
  mergePrimersInSource,
  pcrPrimerPositionsInInput,
  primersInSource,
} from './cloning_utils';

// Template sequence fwd
const source1 = {
  type: 'PCRSource',
  input: [
    {
      sequence: 1,
      left_location: null,
      right_location: '1..6',
      reverse_complemented: false,
    },
    {
      sequence: 2,
      left_location: 'join(21..23,1..3)',
      right_location: '10..15',
      reverse_complemented: false,
    },
    {
      sequence: 1,
      left_location: '1..6',
      right_location: null,
      reverse_complemented: true,
    },
  ],
};

// Template sequence rvs
const source2 = {
  type: 'PCRSource',
  input: [
    {
      sequence: 1,
      left_location: null,
      right_location: '1..7',
      reverse_complemented: false,
    },
    {
      sequence: 4,
      left_location: 'join(21..23,1..4)',
      right_location: '10..15',
      reverse_complemented: true,
    },
    {
      sequence: 2,
      left_location: '1..6',
      right_location: null,
      reverse_complemented: true,
    },
  ],
};

describe('test pcrPrimerPositionsInInput', () => {
  it('test normal case', () => {
    const primerPos1 = pcrPrimerPositionsInInput(source1, { size: 23 });
    expect(primerPos1).toEqual([{ start: 20, end: 2, strand: 1 }, { start: 9, end: 14, strand: -1 }]);

    const primerPos2 = pcrPrimerPositionsInInput(source2, { size: 23 });
    expect(primerPos2).toEqual([{ end: 2, start: 19, strand: -1 }, { end: 13, start: 8, strand: 1 }]);
  });
  it('raises error if source is not a PCRSource', () => {
    const source = { type: 'dummy' };
    expect(() => pcrPrimerPositionsInInput(source, { size: 23 })).toThrow('Source is not a PCRSource');
  });
});

// The first input is the annotated sequence, the rest are the primers that bound to it
const primerBindingSource = {
  id: 10,
  type: 'AnnotationSource',
  annotation_tool: 'primer_binding_sites',
  input: [{ type: 'SourceInput', sequence: 1 }, { type: 'SourceInput', sequence: 5 }, { type: 'SourceInput', sequence: 7 }],
};

// No primer bound anywhere, so the sequence is the only input
const primerBindingSourceWithoutHits = {
  id: 11,
  type: 'AnnotationSource',
  annotation_tool: 'primer_binding_sites',
  input: [{ type: 'SourceInput', sequence: 1 }],
};

const plannotateSource = {
  id: 12,
  type: 'AnnotationSource',
  annotation_tool: 'plannotate',
  input: [{ type: 'SourceInput', sequence: 1 }],
};

describe('primer binding site annotation sources', () => {
  it('recognises a source that bound at least one primer', () => {
    expect(isCompletePrimerBindingAnnotationSource(primerBindingSource)).toBe(true);
    expect(isCompletePrimerBindingAnnotationSource(primerBindingSourceWithoutHits)).toBe(false);
    expect(isCompletePrimerBindingAnnotationSource(plannotateSource)).toBe(false);
  });

  it('reports the primers it used, but not the annotated sequence', () => {
    expect(primersInSource(primerBindingSource)).toEqual([5, 7]);
    expect(primersInSource(primerBindingSourceWithoutHits)).toEqual([]);
    expect(primersInSource(plannotateSource)).toEqual([]);
  });

  it('protects those primers from being deleted', () => {
    expect(getUsedPrimerIds([primerBindingSource, plannotateSource])).toEqual([5, 7]);
  });

  it('remaps primer ids when two primers are merged', () => {
    const merged = mergePrimersInSource(primerBindingSource, 5, 7);
    expect(merged.input.map(({ sequence }) => sequence)).toEqual([1, 5, 5]);
    // The annotated sequence is not a primer, so it is never remapped
    const untouched = mergePrimersInSource(primerBindingSource, 99, 1);
    expect(untouched.input.map(({ sequence }) => sequence)).toEqual([1, 5, 7]);
  });
});

import React from 'react';
import { QuerySelect, useDebouncedSearchQuery } from '@opencloning/ui';
import { openCloningDBHttpClient } from './common';
import endpoints from './endpoints';

const messages = {
  loadingMessage: 'retrieving sequences',
  errorMessage: 'Could not retrieve sequences from OpenCloningDB',
};

const getGetQuery = (sequenceTypes) => {
  return (name) => ({
    queryKey: ['sequences', { sequence_types: sequenceTypes, name }],
    queryFn: async () => {
      const { data } = await openCloningDBHttpClient.get(endpoints.sequences, {
        params: { sequence_types: sequenceTypes, name },
      });
      return data.items;
    },
  })};

function SequenceSelect({ value, onChange, label, multiple = true, sequenceTypes = undefined, ...rest }) {
  const { query, autocompleteProps, clearInput } = useDebouncedSearchQuery(getGetQuery(sequenceTypes));

  return (
    <QuerySelect
      query={query}
      label={label}
      loadingMessage={messages.loadingMessage}
      errorMessage={messages.errorMessage}
      multiple={multiple}
      getOptionLabel={(seq) => seq.name ?? `Sequence ${seq.id}`}
      getOptionKey={(seq) => seq.id}
      value={value}
      onChange={onChange}
      autoComplete={true}
      autocompleteProps={autocompleteProps}
      onClear={clearInput}
      {...rest}
    />
  );
}

export default SequenceSelect;

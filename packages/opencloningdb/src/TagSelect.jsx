import React from 'react';
import { QuerySelect } from '@opencloning/ui';
import { openCloningDBHttpClient } from './common';
import endpoints from './endpoints';

const query = {
  queryKey: ['tags'],
  queryFn: async () => {
    const { data } = await openCloningDBHttpClient.get(endpoints.tags);
    return data;
  },
};

/** Read-only multi-select of the workspace tags. Value is an array of tag objects ({id, name}). */
function TagSelect({ value, onChange, label = 'Tags', ...rest }) {
  return (
    <QuerySelect
      query={query}
      label={label}
      loadingMessage="retrieving tags"
      errorMessage="Could not retrieve tags from OpenCloningDB"
      getOptionLabel={(tag) => tag.name}
      getOptionKey={(tag) => tag.id}
      value={value}
      onChange={onChange}
      autoComplete={true}
      {...rest}
    />
  );
}

export default TagSelect;

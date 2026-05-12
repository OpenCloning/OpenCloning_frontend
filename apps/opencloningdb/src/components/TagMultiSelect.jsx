import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuerySelect } from '@opencloning/ui';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useCreateTagMutation from '../hooks/useCreateTagMutation';

function TagMultiSelect({ onChange, label = 'Tags', value, excludeTagIds = [], ...rest }) {

  const createTagMutation = useCreateTagMutation();
  const query = useMemo(() => ({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data } = await openCloningDBHttpClient.get(endpoints.tags);
      return data.filter((tag) => !excludeTagIds.includes(tag.id));
    },
  }), [excludeTagIds]);

  const { data: options = [] } = useQuery(query);
  const valueAsObjects = useMemo(
    () => (value || []).map((id) => options.find((o) => o.id === id)).filter(Boolean),
    [value, options],
  );

  return (
    <QuerySelect
      query={query}
      label={label}
      getOptionLabel={(tag) => tag.name}
      getOptionKey={(tag) => tag.id}
      value={valueAsObjects}
      onChange={(selectedTags) => onChange(selectedTags?.map((t) => t.id) ?? [])}
      inputProps={{ size: 'small' }}
      autoComplete={true}
      noOptionsAction={{ label: 'Create tag', onClick: (inputValue) => createTagMutation.mutate(inputValue) }}
      {...rest}
    />
  );
}

export default TagMultiSelect;


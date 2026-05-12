import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TextField } from '@mui/material';

/**
 * Text field with validation driven by a React Query. Error/loading state come from the query.
 * Similar to TextFieldApiValidated but takes a query (like QuerySelect vs PostRequestSelect).
 *
 * @param {string} label - Label for the TextField
 * @param {string} placeholder - Placeholder text
 * @param {Function} getQuery - (value) => ({ queryKey, queryFn, ... }) — returns a query config for the given value (use value in queryKey so each input has its own cache).
 * @param {Function} onChange - Callback when validation succeeds; receives (queryData). Called with null when value is empty or validation fails.
 * @param {string} value - Controlled value (optional)
 * @param {number} debounceDelay - Delay in ms before running the query (default: 500)
 * @param {string} successMessage - Optional message to show when validation succeeds (default: ' ')
 * @param {string} validatingMessage - Message while the query is loading (default: 'Validating...')
 */
export default function TextFieldQueryValidated({
  label,
  placeholder,
  getQuery,
  onChange,
  debounceDelay = 500,
  successMessage = ' ',
  validatingMessage = 'Validating...',
  defaultValue = '',
  ...rest
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const [debouncedValue, setDebouncedValue] = useState(defaultValue);

  useEffect(() => {
    setLocalValue(defaultValue);
    setDebouncedValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(localValue), debounceDelay);
    return () => clearTimeout(id);
  }, [localValue, debounceDelay]);

  const queryConfig = React.useMemo(
    () => getQuery(debouncedValue),
    [getQuery, debouncedValue],
  );

  const { data: validationError, isLoading, error, isSuccess } = useQuery({
    ...queryConfig,
    enabled: debouncedValue.length > 0 && (queryConfig.enabled !== false),
  });


  useEffect(() => {
    if (debouncedValue.length === 0) {
      onChange('');
      return;
    }
    if (isSuccess && !validationError) {
      onChange(debouncedValue);
    }
    if (error || validationError) {
      onChange('');
    }
  }, [debouncedValue, isSuccess, validationError, error, onChange]);

  const handleChange = (e) => {
    onChange('');
    setLocalValue(e.target.value);
  };

  let helperText = ' ';
  if (isLoading) {
    helperText = validatingMessage;
  } else if (validationError) {
    helperText = validationError;
  } else if (error) {
    helperText = error.message;
  } else if (isSuccess && !validationError) {
    helperText = successMessage;
  }

  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      error={!!error || !!validationError}
      helperText={helperText}
      {...rest}
    />
  );
}

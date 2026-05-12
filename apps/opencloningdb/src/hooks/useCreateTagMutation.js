import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import useAppAlerts from './useAppAlerts';

export default function useCreateTagMutation() {
  const { addAlert } = useAppAlerts();
  const queryClient = useQueryClient();
  const createTagMutation = useMutation({
    mutationFn: async (tagName) => {
      const { data } = await openCloningDBHttpClient.post(endpoints.tagPost, { name: tagName });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error) => {
      addAlert({ message: error?.response?.data?.detail || error?.message || 'Failed to create tag', severity: 'error' });
    },
  });
  return createTagMutation;
}

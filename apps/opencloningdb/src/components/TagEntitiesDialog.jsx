import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { openCloningDBHttpClient, endpoints } from '@opencloning/opencloningdb';
import { Dialog, DialogTitle, DialogContent, FormControl, Alert, Button } from '@mui/material';
import TagMultiSelect from './TagMultiSelect';
import error2String from '@opencloning/utils/error2String';

function TagEntitiesDialog({ selectedEntities, entityType, label, open, onClose, onSuccess, excludeTagIds = [] }) {
  const [tags, setTags] = React.useState([]);
  const queryClient = useQueryClient();
  
  const attachTagsMutation = useMutation({
    mutationFn: async ({ entities, tagIds }) => {
      const requests = [];
      entities.forEach((entity) => {
        tagIds.forEach((tagId) => {
          // Skip if entity already has tag
          if (entity.tags?.some((t) => t.id === tagId)) {
            return;
          }
  
          let url;
          if (entityType === 'lines') {
            url = endpoints.lineTags(entity.id);
          } else if (entityType === 'input_entities') {
            url = endpoints.inputEntityTags(entity.id);
          } else {
            throw new Error(`Tagging not implemented for entity type: ${entityType}`);
          }
  
          const body = { tag_id: tagId };
          requests.push(openCloningDBHttpClient.post(url, body));
        });
      });
  
      await Promise.all(requests);
    },
    onSuccess: (_data, variables) => {
      // Refresh queries depending on entity type
      if (entityType === 'lines') {
        queryClient.invalidateQueries({ queryKey: ['lines'] });
        variables.entities.forEach((entity) => {
          queryClient.invalidateQueries({ queryKey: ['line', String(entity.id)] });
        });
      } else if (entityType === 'input_entities') {
        queryClient.invalidateQueries({ queryKey: ['sequences'] });
        queryClient.invalidateQueries({ queryKey: ['primers'] });
        variables.entities.forEach((entity) => {
          queryClient.invalidateQueries({ queryKey: ['sequence', String(entity.id)] });
          queryClient.invalidateQueries({ queryKey: ['primer', String(entity.id)] });
        });
      }
      setTags([]);
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    },
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tags.length || !selectedEntities.length || attachTagsMutation.isPending) return;
    attachTagsMutation.mutate({
      entities: selectedEntities,
      tagIds: tags,
    });
  };
  
  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} data-testid="tag-entities-dialog">
      <DialogTitle>Tag {label}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <TagMultiSelect
              value={tags}
              excludeTagIds={excludeTagIds}
              onChange={(value) => {
                setTags(value);
              }}
            />
          </FormControl>
          {attachTagsMutation.isError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error2String(attachTagsMutation.error) || 'Failed to tag entities'}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!tags.length || attachTagsMutation.isPending}
            >
              {attachTagsMutation.isPending ? 'Tagging…' : 'Tag'}
            </Button>
          </FormControl>
        </form>
      </DialogContent>
    </Dialog>
  );
}
  
export default TagEntitiesDialog;

import React from 'react';
import { Box, Modal, Typography } from '@mui/material';

export default function BulkUploadModal({
  open,
  onClose,
  title,
  dataTestId,
  children,
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        data-testid={dataTestId}
        sx={{
          bgcolor: 'background.paper',
          p: 3,
          width: 'min(1280px, 98vw)',
          maxHeight: '90vh',
          overflow: 'hidden',
          mx: 'auto',
          my: '5vh',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
          {title}
        </Typography>
        {children}
      </Box>
    </Modal>
  );
}

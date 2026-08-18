import { Alert, Dialog, DialogContent, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import React from 'react';

function formatTemperature(value) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(1);
}

function PrimerBindingAnnotationReport({ dialogOpen, setDialogOpen, report }) {
  const bound = report.filter((row) => row.start_location !== null && row.start_location !== undefined);
  const unbound = report.filter((row) => row.start_location === null || row.start_location === undefined);

  return (
    <Dialog fullWidth maxWidth="lg" open={dialogOpen} onClose={() => setDialogOpen(false)}>
      <DialogContent>
        <Table sx={{ textAlign: 'center' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Primer</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Position</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Strand</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Annealing length</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Mismatches</TableCell>
              {/* The two only differ where the primer does not anneal over its full length */}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Tm (bound)</TableCell>
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Tm (primer)</TableCell>
              {/* Of the bound stretch as well, so it goes with Tm (bound) */}
              <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>%GC</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bound.map((row) => (
              <TableRow key={`${row.primer_id}-${row.start_location}-${row.strand}`}>
                <TableCell>{row.primer_name}</TableCell>
                {/* The stored coordinates are 0-based, they are shown 1-based like in the sequence editor */}
                <TableCell sx={{ textAlign: 'center' }}>{`${row.start_location + 1}..${row.end_location}`}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{row.strand === 1 ? 'forward' : 'reverse'}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {`${row.matched_length} / ${row.primer_length} bp`}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{row.mismatches}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{formatTemperature(row.melting_temperature)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {formatTemperature(row.primer_melting_temperature)}
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>
                  {row.gc_content === null || row.gc_content === undefined ? '—' : (row.gc_content * 100).toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {unbound.length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {`${unbound.length} primer${unbound.length === 1 ? ' does' : 's do'} not bind anywhere: `}
            {unbound.map((row) => row.primer_name).join(', ')}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PrimerBindingAnnotationReport;

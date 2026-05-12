import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';
import { resolve } from 'path';

export default () => ({
  plugins: [
    react(),
    (process.env.VITE_COVERAGE) && istanbul({
      include: [
        'packages/*/src/**/*',
        'apps/*/src/**/*'
      ],
      extension: ['.js', '.jsx'],
      cwd: resolve(__dirname, '../..'),
    }),
  ],
  server: {
    port: 3002,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      '@mui/material',

    ],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'build',
  },
});

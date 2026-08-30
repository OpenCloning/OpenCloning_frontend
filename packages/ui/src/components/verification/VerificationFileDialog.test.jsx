import React from 'react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { legacy_createStore as createStore, combineReducers } from 'redux';
import cloningReducer, { cloningActions } from '@opencloning/store/cloning';
import { getVerificationFileName } from '@opencloning/utils/readNwrite';
import {
  clearVerificationFileContents,
  getVerificationFileContent,
  setVerificationFileContent,
} from '@opencloning/utils/verificationFileStore';
import { ConfigProvider } from '@opencloning/ui/providers/ConfigProvider';
import VerificationFileDialog from './VerificationFileDialog';

const { setFiles } = cloningActions;

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

// No real backend is available in jsdom; the align_sanger call only needs to
// return one extra (reference) aligned trace on top of the submitted traces.
vi.mock('@opencloning/utils/getHttpClient', () => ({
  default: () => ({ post: postMock }),
  getAuthenticatedHttpClient: () => ({ post: postMock }),
}));

// @teselagen/ove imports a CSS file, which cannot be loaded in node; the
// editor itself is not exercised by these tests
vi.mock('@teselagen/ove', () => ({
  updateEditor: vi.fn(),
  addAlignment: vi.fn(),
}));

const config = {
  backendUrl: 'http://127.0.0.1:8000',
};

// A real ~346 KB AB1 file, so 12 copies are ~5.5 MB in base64, i.e. above the
// ~5 MB Web Storage quota that broke the old implementation (issue #82).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ab1Path = path.join(__dirname, '../../../../../cypress/test_files/sequencing/BZO902-13409020-13409020.ab1');
const ab1Buffer = fs.readFileSync(ab1Path);

// window.localStorage may be unavailable in some jsdom setups (a pre-existing
// environment quirk, see httpClientAuth.test.js); only assert on it when present
const webStorageIsEmpty = () => (
  window.sessionStorage.length === 0
  && (!window.localStorage || window.localStorage.length === 0)
);

// jsdom's Blob does not expose .text(), read it with a FileReader instead
const blobToText = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsText(blob);
});

let createdBlobs = [];

const mount = (store, id = 1) => render(
  <Provider store={store}>
    <ConfigProvider config={config}>
      <VerificationFileDialog id={id} dialogOpen setDialogOpen={() => {}} />
    </ConfigProvider>
  </Provider>,
);

const uploadFiles = (files) => {
  const fileInput = document.querySelector('input[type="file"]');
  fireEvent.change(fileInput, { target: { files } });
};

describe('<VerificationFileDialog /> (issue #82: Web Storage quota)', () => {
  let store;

  beforeEach(() => {
    clearVerificationFileContents();
    // Web Storage must stay untouched by the verification file flow
    window.sessionStorage.clear();
    if (window.localStorage) {
      window.localStorage.clear();
    }
    postMock.mockReset();
    postMock.mockImplementation(async (url, { traces }) => ({
      data: ['REFERENCE', ...(traces || [])],
    }));
    createdBlobs = [];
    // jsdom has no URL.createObjectURL; extend the real URL so that the
    // constructor (used by useBackendRoute) keeps working
    class MockURL extends URL {
      static createObjectURL(blob) {
        createdBlobs.push(blob);
        return 'blob:mock';
      }

      static revokeObjectURL() {}
    }
    vi.stubGlobal('URL', MockURL);
    store = createStore(combineReducers({ cloning: cloningReducer }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('stores many large AB1 files in memory, beyond the 5 MB Web Storage quota (issue #82)', async () => {
    const nFiles = 12;
    // base64 of the single file is already ~461 KB; 12 files -> ~5.5 MB
    expect(Math.ceil(ab1Buffer.length * 4 / 3) * nFiles).toBeGreaterThan(5 * 1024 * 1024);

    const files = Array.from({ length: nFiles }, (_, i) => new File(
      [ab1Buffer],
      `KKF080_${70250800 + i}_70250801.ab1`,
      { type: 'application/octet-stream' },
    ));
    mount(store);
    uploadFiles(files);

    // All files end up in the store (the old implementation lost the files that
    // failed to be written to Web Storage)
    await waitFor(() => {
      expect(store.getState().cloning.files).toHaveLength(nFiles);
    }, { timeout: 30000 });

    // And all their contents are available in the in-memory store
    const totalSize = store.getState().cloning.files
      .reduce((sum, f) => sum + (getVerificationFileContent(getVerificationFileName(f))?.length || 0), 0);
    expect(totalSize).toBeGreaterThan(5 * 1024 * 1024);

    // No verification content was written to Web Storage
    expect(webStorageIsEmpty()).toBe(true);
  }, 120000);

  it('downloads a file from the in-memory store', async () => {
    const file = { file_name: 'file1.txt', sequence_id: 1, file_type: 'Sequencing file' };
    store.dispatch(setFiles([file]));
    setVerificationFileContent(getVerificationFileName(file), 'aGVsbG8='); // "hello"

    mount(store);
    fireEvent.click(screen.getByTestId('DownloadIcon'));

    await waitFor(() => expect(createdBlobs).toHaveLength(1));
    expect(await blobToText(createdBlobs[0])).toBe('hello');
    // Still nothing in Web Storage
    expect(webStorageIsEmpty()).toBe(true);
  });

  it('removes the file content from the in-memory store when the file is removed', async () => {
    const file1 = { file_name: 'file1.txt', sequence_id: 1, file_type: 'Sequencing file' };
    const file2 = { file_name: 'file2.txt', sequence_id: 1, file_type: 'Sequencing file' };
    store.dispatch(setFiles([file1, file2]));
    setVerificationFileContent(getVerificationFileName(file1), 'aGVsbG8=');
    setVerificationFileContent(getVerificationFileName(file2), 'aGVsbG8h');

    mount(store);
    fireEvent.click(screen.getAllByTestId('DeleteIcon')[0]);

    await waitFor(() => {
      expect(store.getState().cloning.files.map((f) => f.file_name)).toEqual(['file2.txt']);
    });
    expect(getVerificationFileContent(getVerificationFileName(file1))).toBeNull();
    expect(getVerificationFileContent(getVerificationFileName(file2))).toBe('aGVsbG8h');
    expect(webStorageIsEmpty()).toBe(true);
  });
});

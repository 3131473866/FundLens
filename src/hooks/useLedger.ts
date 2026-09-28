import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError } from '../api/client';
import { fetchLedger } from '../api/statements';
import { parseStatement } from '../lib/parseStatement';
import type { Ledger } from '../types';

export type Source = 'api' | 'file';

export interface LedgerState {
  status: 'loading' | 'ready' | 'error';
  source: Source;
  ledger: Ledger | null;
  fileName?: string;
  /** Rows skipped while reading an uploaded statement. */
  warnings: string[];
  /** Failure to load from the API. */
  error?: string;
  /** Failure to read an uploaded file. The previous data stays on screen. */
  uploadError?: string;
}

export function useLedger() {
  const [state, setState] = useState<LedgerState>({ status: 'loading', source: 'api', ledger: null, warnings: [] });
  const controller = useRef<AbortController | null>(null);

  const loadFromApi = useCallback(async () => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setState((s) => ({ ...s, status: 'loading', source: 'api', error: undefined, uploadError: undefined }));
    try {
      const ledger = await fetchLedger(ctrl.signal);
      setState({ status: 'ready', source: 'api', ledger, warnings: [] });
    } catch (e) {
      if (axios.isCancel(e)) return;
      setState((s) => ({ ...s, status: 'error', error: describeError(e) }));
    }
  }, []);

  useEffect(() => {
    void loadFromApi();
    return () => controller.current?.abort();
  }, [loadFromApi]);

  const importFile = useCallback(async (file: File) => {
    try {
      const { ledger, warnings } = parseStatement(await file.text());
      controller.current?.abort();
      setState({ status: 'ready', source: 'file', ledger, fileName: file.name, warnings });
    } catch (e) {
      setState((s) => ({ ...s, uploadError: e instanceof Error ? e.message : 'Could not read that file.' }));
    }
  }, []);

  return { state, reload: loadFromApi, importFile };
}

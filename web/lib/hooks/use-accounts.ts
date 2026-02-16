'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Account, ConnectAccountPayload } from '@/lib/types/account';
import {
  fetchAccounts as apiFetchAccounts,
  connectAccount as apiConnectAccount,
  disconnectAccount as apiDisconnectAccount,
} from '@/lib/services/account-service';

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes max polling

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    pollCountRef.current = 0;
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchAccounts();
      setAccounts(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch accounts';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    return () => stopPolling();
  }, [refresh, stopPolling]);

  /**
   * Poll for sync status changes after connecting a new account.
   * Stops when the account's syncStatus moves to 2 (synced) or 3 (error),
   * or after MAX_POLL_ATTEMPTS.
   */
  const startSyncPolling = useCallback(
    (accountId: string) => {
      stopPolling();
      pollCountRef.current = 0;

      const poll = async () => {
        pollCountRef.current++;
        if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
          stopPolling();
          return;
        }

        try {
          const data = await apiFetchAccounts();
          setAccounts(data);

          const target = data.find((a) => a.id === accountId);
          // Stop polling if account settled (synced or error) or not found
          if (!target || target.syncStatus >= 2) {
            stopPolling();
            return;
          }
        } catch {
          // Continue polling on transient errors
        }

        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      };

      pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    },
    [stopPolling]
  );

  const connect = useCallback(
    async (payload: ConnectAccountPayload) => {
      const account = await apiConnectAccount(payload);
      setAccounts((prev) => [...prev, account]);

      // Start polling for sync status updates
      startSyncPolling(account.id);

      return account;
    },
    [startSyncPolling]
  );

  const disconnect = useCallback(
    async (accountId: string) => {
      await apiDisconnectAccount(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    },
    []
  );

  return { accounts, isLoading, error, connect, disconnect, refresh };
}

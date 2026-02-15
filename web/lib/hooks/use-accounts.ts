'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Account, ConnectAccountPayload } from '@/lib/types/account';
import {
  fetchAccounts as apiFetchAccounts,
  connectAccount as apiConnectAccount,
  disconnectAccount as apiDisconnectAccount,
} from '@/lib/services/account-service';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetchAccounts();
      setAccounts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch accounts';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(
    async (payload: ConnectAccountPayload) => {
      const account = await apiConnectAccount(payload);
      setAccounts((prev) => [...prev, account]);
      return account;
    },
    []
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

import { apiClient } from '@/lib/api-client';
import type { Account, ConnectAccountPayload } from '@/lib/types/account';

interface AccountsResponse {
  success: boolean;
  data: { accounts: Account[] };
}

interface ConnectResponse {
  success: boolean;
  data: { account: Account };
}

interface DisconnectResponse {
  success: boolean;
  data: { message: string };
}

export async function fetchAccounts(): Promise<Account[]> {
  const { data } = await apiClient.get<AccountsResponse>('/accounts');
  return data.data.accounts;
}

export async function connectAccount(payload: ConnectAccountPayload): Promise<Account> {
  const { data } = await apiClient.post<ConnectResponse>('/accounts', payload);
  return data.data.account;
}

export async function disconnectAccount(accountId: string): Promise<void> {
  await apiClient.post<DisconnectResponse>(`/accounts/${accountId}/disconnect`);
}

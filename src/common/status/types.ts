export interface CurrentAccount { id: string; name: string | null; email: string }
export type AccountStatus =
  | { authStatus: 'loading' | 'unauthenticated'; account: null }
  | { authStatus: 'authenticated'; account: CurrentAccount }
export interface LocalClock { localNow: string | null; localDate: string | null }
export type CommonStatus = AccountStatus & LocalClock

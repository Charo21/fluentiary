import { useState } from 'react'
import { useRouter } from 'next/router'
import { signOut } from 'next-auth/react'
import { useCurrentAccount } from '@/common/status'

export default function AccountMenu() {
  const { account } = useCurrentAccount()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!account) return null
  async function logout() {
    setBusy(true)
    setFailed(false)
    try { await signOut({ redirect: false }); await router.replace('/login') }
    catch { setBusy(false); setFailed(true) }
  }
  return <div className="fl-account">
    <span title={account.email}>{account.name || account.email}</span>
    <button type="button" className="fl-btn fl-btn--text" disabled={busy} onClick={logout}>{busy ? 'Signing out…' : 'Sign out'}</button>
    {failed && <span role="alert">Unable to sign out. Please try again.</span>}
  </div>
}

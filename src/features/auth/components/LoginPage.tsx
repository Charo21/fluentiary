import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { signIn } from 'next-auth/react'
import { useCurrentAccount } from '@/common/status'
import { safeCallbackUrl } from '../redirect'

export default function LoginPage() {
  const router = useRouter()
  const { authStatus } = useCurrentAccount()
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const callbackUrl = safeCallbackUrl(router.query.callbackUrl)
  useEffect(() => {
    if (authStatus === 'authenticated') void router.replace(callbackUrl)
  }, [authStatus, callbackUrl, router])

  async function login() {
    setBusy(true)
    setFailed(false)
    try { await signIn('google', { callbackUrl }) }
    catch { setFailed(true); setBusy(false) }
  }

  return <>
    <Head><title>Fluentiary — Sign in</title></Head>
    <div className="fl-page">
      <div className="fl-wordmark">Fluentiary</div>
      <main className="fl-card fl-login">
        <p className="fl-label">Your daily English journal</p>
        <h1>Make room for your words.</h1>
        <p className="fl-note">Sign in to write, refine, and revisit your daily practice.</p>
        {(failed || router.query.error) && <p className="fl-note fl-note--error" role="alert">Unable to sign in. Please try again.</p>}
        <button className="fl-btn" type="button" onClick={login} disabled={busy || authStatus !== 'unauthenticated'}>
          {busy ? 'Connecting…' : 'Continue with Google'}
        </button>
        <p className="fl-note">Your first sign-in creates your account automatically.</p>
      </main>
    </div>
  </>
}

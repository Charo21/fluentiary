import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import { CommonStatusProvider } from '@/common/status'

export default function App({ Component, pageProps }: AppProps) {
  return <SessionProvider session={pageProps.session} refetchInterval={60}>
    <CommonStatusProvider><Component {...pageProps} /></CommonStatusProvider>
  </SessionProvider>
}

import RecordPage from '@/features/records/components/RecordPage'
import AuthBoundary from '@/features/auth/components/AuthBoundary'
export { requirePageSession as getServerSideProps } from '@/features/auth/server/session'

export default function RecordRoute() {
  return <AuthBoundary><RecordPage /></AuthBoundary>
}

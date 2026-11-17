import CalendarPage from '@/features/calendar/components/CalendarPage'
import AuthBoundary from '@/features/auth/components/AuthBoundary'
export { requirePageSession as getServerSideProps } from '@/features/auth/server/session'

export default function CalendarRoute() {
  return <AuthBoundary><CalendarPage /></AuthBoundary>
}

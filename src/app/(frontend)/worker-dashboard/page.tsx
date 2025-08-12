// Legacy path support: previously worker dashboards may have used /workers-dashboard.
// Ensure any navigation here seamlessly redirects to the new /tutors-dashboard route.
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function WorkersDashboardLegacyRedirect() {
  return redirect('/tutors-dashboard')
}

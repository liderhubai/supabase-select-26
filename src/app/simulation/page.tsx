import { Suspense } from 'react'
import SimulationPage from '@/views/SimulationPage'

export default function Page() {
  return (
    <Suspense>
      <SimulationPage />
    </Suspense>
  )
}

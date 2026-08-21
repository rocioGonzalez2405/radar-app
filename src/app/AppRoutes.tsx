import { Route, Routes } from 'react-router'
import { ROUTES } from '@/app/routes'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { TriagePage } from '@/pages/Triage/TriagePage'
import { ForecastPage } from '@/pages/Forecast/ForecastPage'
import { CapacityPage } from '@/pages/Capacity/CapacityPage'
import { SimulatorPage } from '@/pages/Simulator/SimulatorPage'
import { SourcesPage } from '@/pages/Sources/SourcesPage'
import { DonatePage } from '@/pages/Donate/DonatePage'

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path={ROUTES.triage} element={<TriagePage />} />
      <Route path={ROUTES.forecast} element={<ForecastPage />} />
      <Route path={ROUTES.capacity} element={<CapacityPage />} />
      <Route path={ROUTES.simulator} element={<SimulatorPage />} />
      <Route path={ROUTES.sources} element={<SourcesPage />} />
      <Route path={ROUTES.donate} element={<DonatePage />} />
    </Route>
  </Routes>
)

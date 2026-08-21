import { Route, Routes } from 'react-router'
import { ROUTES } from '@/app/routes'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { TriagePage } from '@/pages/Triage/TriagePage'
import { ForecastPage } from '@/pages/Forecast/ForecastPage'
import { CapacityPage } from '@/pages/Capacity/CapacityPage'
import { SimulatorPage } from '@/pages/Simulator/SimulatorPage'
import { SourcesPage } from '@/pages/Sources/SourcesPage'
import { DonatePage } from '@/pages/Donate/DonatePage'
import { AffordShell } from '@/affordai/layout/AffordShell'
import { OverviewPage } from '@/affordai/pages/Overview/OverviewPage'

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path={ROUTES.radar.triage} element={<TriagePage />} />
      <Route path={ROUTES.radar.forecast} element={<ForecastPage />} />
      <Route path={ROUTES.radar.capacity} element={<CapacityPage />} />
      <Route path={ROUTES.radar.simulator} element={<SimulatorPage />} />
      <Route path={ROUTES.radar.sources} element={<SourcesPage />} />
      <Route path={ROUTES.radar.donate} element={<DonatePage />} />
    </Route>
    <Route element={<AffordShell />}>
      <Route path={ROUTES.affordai.overview} element={<OverviewPage />} />
    </Route>
  </Routes>
)

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
import { HouseholdsPage } from '@/affordai/pages/Households/HouseholdsPage'
import { HouseholdDetailPage } from '@/affordai/pages/HouseholdDetail/HouseholdDetailPage'
import { VulnerabilityPage } from '@/affordai/pages/Vulnerability/VulnerabilityPage'
import { PredictionsPage } from '@/affordai/pages/Predictions/PredictionsPage'

export const AppRoutes = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route path={ROUTES.radar.triage} element={<TriagePage />} />
      <Route path={ROUTES.radar.forecast} element={<ForecastPage />} />
      <Route path={ROUTES.radar.capacity} element={<CapacityPage />} />
      <Route path={ROUTES.radar.simulator} element={<SimulatorPage />} />
      <Route path={ROUTES.radar.sources} element={<SourcesPage />} />
      <Route path={ROUTES.radar.donate} element={<DonatePage />} />
      {/* AffordAI is nested inside the Radar shell so the top bar stays visible
          and marks AffordAI as the active section. AffordShell contributes only
          the section's sidebar. */}
      <Route element={<AffordShell />}>
        <Route path={ROUTES.affordai.overview} element={<OverviewPage />} />
        <Route path={ROUTES.affordai.households} element={<HouseholdsPage />} />
        <Route path={ROUTES.affordai.householdDetail} element={<HouseholdDetailPage />} />
        <Route path={ROUTES.affordai.vulnerability} element={<VulnerabilityPage />} />
        <Route path={ROUTES.affordai.predictions} element={<PredictionsPage />} />
      </Route>
    </Route>
  </Routes>
)

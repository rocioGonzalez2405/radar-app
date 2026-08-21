import { Outlet, Route, Routes } from 'react-router'
import { ROUTES, ROUTE_PATTERNS } from '@/app/routes'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { PublicPortalShell } from '@/layouts/PublicPortalShell/PublicPortalShell'
import { TriagePage } from '@/pages/Triage/TriagePage'
import { ForecastPage } from '@/pages/Forecast/ForecastPage'
import { CapacityPage } from '@/pages/Capacity/CapacityPage'
import { SimulatorPage } from '@/pages/Simulator/SimulatorPage'
import { SourcesPage } from '@/pages/Sources/SourcesPage'
import { AffordShell } from '@/affordai/layout/AffordShell'
import { OverviewPage } from '@/affordai/pages/Overview/OverviewPage'
import { PortalProvider } from '@/pages/Portal/PortalContext'
import { PortalBrowsePage } from '@/pages/Portal/PortalBrowsePage'
import { ProjectDetailPage } from '@/pages/Portal/ProjectDetailPage'
import { VolunteerSignupPage } from '@/pages/Portal/VolunteerSignupPage'
import { LegalAidIntakePage } from '@/pages/Portal/LegalAidIntakePage'
import { CreateProjectPage } from '@/pages/Portal/CreateProjectPage'

export const AppRoutes = () => (
  <Routes>
    {/* Shared PortalProvider instance: both the admin (`/portal`) and
        public (`/projects`) trees below read/write the same portal state. */}
    <Route
      element={
        <PortalProvider>
          <Outlet />
        </PortalProvider>
      }
    >
      <Route element={<AppShell />}>
        <Route path={ROUTES.radar.triage} element={<TriagePage />} />
        <Route path={ROUTES.radar.forecast} element={<ForecastPage />} />
        <Route path={ROUTES.radar.capacity} element={<CapacityPage />} />
        <Route path={ROUTES.radar.simulator} element={<SimulatorPage />} />
        <Route path={ROUTES.radar.sources} element={<SourcesPage />} />
        <Route path={ROUTES.portal} element={<PortalBrowsePage variant="admin" />} />
        <Route path={ROUTES.portalNew} element={<CreateProjectPage />} />
        <Route path={ROUTE_PATTERNS.portalDetail} element={<ProjectDetailPage />} />
        <Route path={ROUTE_PATTERNS.portalVolunteer} element={<VolunteerSignupPage />} />
        <Route path={ROUTE_PATTERNS.portalLegalAid} element={<LegalAidIntakePage />} />
        {/* AffordAI is nested inside the Radar shell so the top bar stays visible
            and marks AffordAI as the active section. AffordShell contributes only
            the section's sidebar. */}
        <Route element={<AffordShell />}>
          <Route path={ROUTES.affordai.overview} element={<OverviewPage />} />
        </Route>
      </Route>

      <Route element={<PublicPortalShell />}>
        <Route path={ROUTES.projects} element={<PortalBrowsePage variant="public" />} />
        <Route path={ROUTE_PATTERNS.projectDetail} element={<ProjectDetailPage />} />
        <Route path={ROUTE_PATTERNS.projectVolunteer} element={<VolunteerSignupPage />} />
        <Route path={ROUTE_PATTERNS.projectLegalAid} element={<LegalAidIntakePage />} />
      </Route>
    </Route>
  </Routes>
)

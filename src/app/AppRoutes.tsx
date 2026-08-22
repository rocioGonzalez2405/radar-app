import { Outlet, Route, Routes } from 'react-router'
import { ROUTES, ROUTE_PATTERNS } from '@/app/routes'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { PublicPortalShell } from '@/layouts/PublicPortalShell/PublicPortalShell'
import { TriagePage } from '@/pages/Triage/TriagePage'
import { ForecastPage } from '@/pages/Forecast/ForecastPage'
import { CapacityPage } from '@/pages/Capacity/CapacityPage'
import { SimulatorPage } from '@/pages/Simulator/SimulatorPage'
import { SourcesPage } from '@/pages/Sources/SourcesPage'
import { PortalProvider } from '@/pages/Portal/PortalContext'
import { PortalBrowsePage } from '@/pages/Portal/PortalBrowsePage'
import { ProjectDetailPage } from '@/pages/Portal/ProjectDetailPage'
import { VolunteerSignupPage } from '@/pages/Portal/VolunteerSignupPage'
import { LegalAidIntakePage } from '@/pages/Portal/LegalAidIntakePage'
import { CreateProjectPage } from '@/pages/Portal/CreateProjectPage'
import { AffordShell } from '@/affordai/layout/AffordShell'
import { OverviewPage } from '@/affordai/pages/Overview/OverviewPage'
import { HouseholdsPage } from '@/affordai/pages/Households/HouseholdsPage'
import { HouseholdDetailPage } from '@/affordai/pages/HouseholdDetail/HouseholdDetailPage'
import { VulnerabilityPage } from '@/affordai/pages/Vulnerability/VulnerabilityPage'
import { SubsidiesPage } from '@/affordai/pages/Subsidies/SubsidiesPage'
import { MarketPricesPage } from '@/affordai/pages/MarketPrices/MarketPricesPage'
import { PredictionsPage } from '@/affordai/pages/Predictions/PredictionsPage'
import { ImpactPage } from '@/affordai/pages/Impact/ImpactPage'
import { DataSourcesPage } from '@/affordai/pages/DataSources/DataSourcesPage'
import { SettingsPage } from '@/affordai/pages/Settings/SettingsPage'
import { NonprofitDashboardShell } from '@/layouts/NonprofitDashboardShell/NonprofitDashboardShell'
import { DashboardPage } from '@/pages/NonprofitDashboard/Dashboard/DashboardPage'
import { InventoryPage } from '@/pages/NonprofitDashboard/Inventory/InventoryPage'
import { AddInventoryPage } from '@/pages/NonprofitDashboard/Inventory/AddInventoryPage'
import { NeedsPage } from '@/pages/NonprofitDashboard/Needs/NeedsPage'
import { PostNeedPage } from '@/pages/NonprofitDashboard/Needs/PostNeedPage'
import { MatchesPage } from '@/pages/NonprofitDashboard/Matches/MatchesPage'
import { TransactionsPage } from '@/pages/NonprofitDashboard/Transactions/TransactionsPage'
import { ProfilePage } from '@/pages/NonprofitDashboard/Profile/ProfilePage'

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
          <Route path={ROUTES.affordai.households} element={<HouseholdsPage />} />
          <Route
            path={ROUTES.affordai.householdDetail}
            element={<HouseholdDetailPage />}
          />
          <Route path={ROUTES.affordai.vulnerability} element={<VulnerabilityPage />} />
          <Route path={ROUTES.affordai.subsidies} element={<SubsidiesPage />} />
          <Route path={ROUTES.affordai.marketPrices} element={<MarketPricesPage />} />
          <Route path={ROUTES.affordai.predictions} element={<PredictionsPage />} />
          <Route path={ROUTES.affordai.impact} element={<ImpactPage />} />
          <Route path={ROUTES.affordai.dataSources} element={<DataSourcesPage />} />
          <Route path={ROUTES.affordai.settings} element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<PublicPortalShell />}>
        <Route path={ROUTES.projects} element={<PortalBrowsePage variant="public" />} />
        <Route path={ROUTE_PATTERNS.projectDetail} element={<ProjectDetailPage />} />
        <Route path={ROUTE_PATTERNS.projectVolunteer} element={<VolunteerSignupPage />} />
        <Route path={ROUTE_PATTERNS.projectLegalAid} element={<LegalAidIntakePage />} />
      </Route>

      <Route element={<NonprofitDashboardShell />}>
        <Route path={ROUTES.nonprofitDashboard.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.nonprofitDashboard.inventory} element={<InventoryPage />} />
        <Route path={ROUTES.nonprofitDashboard.addInventory} element={<AddInventoryPage />} />
        <Route path={ROUTES.nonprofitDashboard.needs} element={<NeedsPage />} />
        <Route path={ROUTES.nonprofitDashboard.needsNew} element={<PostNeedPage />} />
        <Route path={ROUTES.nonprofitDashboard.matches} element={<MatchesPage />} />
        <Route path={ROUTES.nonprofitDashboard.transactions} element={<TransactionsPage />} />
        <Route path={ROUTES.nonprofitDashboard.profile} element={<ProfilePage />} />
      </Route>
    </Route>
  </Routes>
)

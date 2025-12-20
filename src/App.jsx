import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/shared/lib/query-client'
import VisualEditAgent from '@/shared/lib/VisualEditAgent'

import { usePageDirection } from '@/shared/hooks/usePageDirection';
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { setupIframeMessaging } from '@/shared/lib/iframe-messaging';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// import AgentCommandCenter from '@/pages/AgentCommandCenter'; // Unused?
import AdminImporter from '@/pages/AdminImporter';
import { ProtectedAdminRoute, ProtectedUserRoute } from '@/components/RouteGuards';
import { RequireRole } from '@/components/RequireRole';

import VendorSignup from '@/features/vendors/pages/Signup';
// import VendorLite from '@/pages/VendorLite'; // Unused?

import { AppConfigProvider } from '@/components/AppConfigContext';
import { RxDBInitializer } from '@/services/rxdb/RxDBInitializer';
import { RxDBProvider } from '@/core/db/RxDBProvider';
import OnboardingEarningDisplay from '@/components/OnboardingEarningDisplay';
import PersistenceTestPage from '@/pages/PersistenceTest';
import { SpeedInsights } from "@vercel/speed-insights/react"
// import Footer from '@/components/Footer'; // Unused in main layout?

import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';

// Content Sprint Pages
import AboutUs from '@/pages/AboutUs';
import UseCases from '@/pages/UseCases';
import Pricing from '@/pages/Pricing';
import Terms from '@/pages/legal/Terms';
import Privacy from '@/pages/legal/Privacy';
import Accessibility from '@/pages/legal/Accessibility';
import BusinessInfo from '@/pages/BusinessInfo';
import Contact from '@/pages/Contact';
import Blog from '@/pages/Blog';
import BlogPostDetail from '@/pages/BlogPostDetail';
import CalendarView from '@/pages/vendor/CalendarView';
import MyBookings from '@/pages/MyBookings';
import Marketplace from '@/pages/Marketplace';

import RealEstateHub from '@/pages/RealEstateHub';
import CommandCenter from '@/features/agents/pages/CommandCenter';
import AdminLayout from '@/layouts/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminClaims from '@/pages/admin/AdminClaims';
import AdminAgents from '@/features/agents/pages/AdminAgents';
import AgentDetail from '@/pages/admin/AgentDetail';
import AdminCompany from '@/pages/admin/AdminCompany';
import AdminBusinesses from '@/pages/admin/AdminBusinesses';
import AdminData from '@/pages/admin/AdminData';
import AdminCRM from '@/pages/admin/AdminCRM';
import AdminEvolution from './pages/admin/AdminEvolution';
import AdminKanban from './pages/admin/AdminKanban';
import AdminRoadmap from '@/pages/admin/AdminRoadmap';
import AdminCanvas from './pages/admin/AdminCanvas';
import AdminInfra from './pages/admin/AdminInfra';
import AdminLogs from './pages/admin/AdminLogs';
import AdminSchema from './pages/admin/AdminSchema';
import AdminMemory from './pages/admin/AdminMemory';
import AdminSitemap from '@/pages/admin/AdminSitemap';
import AdminOptimizer from './pages/admin/AdminOptimizer';
import AdminSkills from './pages/admin/AdminSkills';
import Studio from '@/pages/admin/Studio';
import BoardRoom from '@/pages/BoardRoom';
import NotFound from '@/pages/NotFound';

import LocalBrain from '@/pages/LocalBrain';
// import SystemMonitor from '@/components/dashboard/SystemMonitor'; // Unused?
import ProviderProfile from '@/pages/ProviderProfile';

// Speed Pass Injection
// import SpeedPassCard from '@/components/SpeedPassCard'; // Disabled

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => {
  const LayoutComponent = Layout;
  return LayoutComponent ?
    // @ts-ignore
    <LayoutComponent currentPageName={currentPageName}>{children}</LayoutComponent>
    : <>{children}</>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  const location = useLocation();
  usePageDirection();

  // Allow public access to diagnostics
  if (location.pathname === '/diagnostics') {
    const DiagnosticsPage = Pages['Diagnostics'];
    return <DiagnosticsPage />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500">Loading... (Auth: {isLoadingAuth ? 'Checking' : 'Done'}, Settings: {isLoadingPublicSettings ? 'Loading' : 'Done'})</p>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  const MapViewPage = Pages['MapView'];

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          {/* Persistent MapView */}
          <div style={{ display: location.pathname.toLowerCase() === '/mapview' ? 'block' : 'none', height: '100%' }}>
            <MapViewPage />
          </div>

          <Routes>
            <Route path="/" element={<MainPage />} />
            {/* Add dummy route for mapview so it matches but renders nothing (since we render it manually above) */}
            <Route path="/mapview" element={null} />

            {/* Protected Business Route */}
            <Route path="/business" element={
              <RequireRole role="vendor">
                <Pages.Business />
              </RequireRole>
            } />

            {Object.entries(Pages)
              .filter(([path]) => path !== 'MapView')
              .filter(([path]) => !['Wallet', 'ProviderDashboard', 'RealEstate', 'Experiences'].includes(path)) // Exclude Super App pages for manual routing
              .map(([path, Page]) => (
                <Route key={path} path={`/${path.toLowerCase()}`} element={<Page />} />
              ))}

            {/* Public Super App Routes */}
            <Route path="/real-estate" element={<RealEstateHub />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/vendor-signup" element={<VendorSignup />} />
            <Route path="/login" element={<Pages.Login />} />
            <Route path="/experiences" element={<Pages.Experiences />} />

            <Route path="/provider/:providerId" element={<ProviderProfile />} />
            <Route path="/chat/:workflowId" element={<Pages.AgentChat />} />

            {/* Admin & Vendor Routes */}
            <Route path="/command-center" element={<CommandCenter />} />
            <Route path="/board-room" element={<BoardRoom />} />

            {/* Admin Routes (New Layout) */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={
                <RequireRole role="admin">
                  <AdminLayout />
                </RequireRole>
              }>
                <Route index element={<Navigate to="/admin/command-center" replace />} />
                <Route path="command-center" element={<CommandCenter />} />
                <Route path="board-room" element={<BoardRoom />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="claims" element={<AdminClaims />} />
                <Route path="agents" element={<AdminAgents />} />
                <Route path="agents/:agentId" element={<AgentDetail />} />
                <Route path="company" element={<AdminCompany />} />
                <Route path="businesses" element={<AdminBusinesses />} />
                <Route path="data" element={<AdminData />} />
                <Route path="optimizer" element={<AdminOptimizer />} />
                <Route path="crm" element={<AdminCRM />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="evolution" element={<AdminEvolution />} />
                <Route path="schema" element={<AdminSchema />} />
                <Route path="memory" element={<AdminMemory />} />
                <Route path="tasks" element={<AdminKanban />} />
                <Route path="roadmap" element={<AdminRoadmap />} />
                <Route path="infrastructure" element={<AdminInfra />} />
                <Route path="canvas" element={<AdminCanvas />} />
                <Route path="studio" element={<Studio />} />
                <Route path="skills" element={<AdminSkills />} />
                <Route path="settings" element={<div className="p-8 text-slate-400">Admin Settings Coming Soon...</div>} />
                <Route path="importer" element={<AdminImporter />} />
                <Route path="sitemap" element={<AdminSitemap />} />
              </Route>
            </Route>


            <Route element={<ProtectedUserRoute />}>
              <Route path="/wallet" element={<Pages.Wallet />} />
              <Route path="/provider-dashboard" element={<Pages.ProviderDashboard />} />
              <Route path="/vendor/calendar" element={<CalendarView />} />
              <Route path="/my-bookings" element={<MyBookings />} />

            </Route>

            <Route path="/earnings-preview" element={<div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center"><OnboardingEarningDisplay data={{}} /></div>} />
            <Route path="/test-persistence" element={<PersistenceTestPage />} />

            {/* Trust Pages */}
            <Route path="/about" element={<AboutUs />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/legal/terms" element={<Terms />} />
            <Route path="/legal/privacy" element={<Privacy />} />
            <Route path="/legal/accessibility" element={<Accessibility />} />
            <Route path="/business-info" element={<BusinessInfo />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPostDetail />} />

            <Route path="/local-brain" element={<LocalBrain />} />
            <Route path="/health" element={<div className="p-4 text-green-500 font-bold">OK</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </LayoutWrapper >
  );
};

function App() {

  return (
    <AuthProvider>
      <AppConfigProvider>
        <RxDBProvider>
          <RxDBInitializer />
          <QueryClientProvider client={queryClientInstance}>
            <GlobalErrorBoundary>
              <Router>

                <AuthenticatedApp />
                <VisualEditAgent />
              </Router>
            </GlobalErrorBoundary>
            <Toaster />
          </QueryClientProvider>
        </RxDBProvider>
        <SpeedInsights />
      </AppConfigProvider>
    </AuthProvider>
  )
}

export default App

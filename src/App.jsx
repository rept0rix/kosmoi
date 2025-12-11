import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AgentCommandCenter from '@/pages/AgentCommandCenter';
import AdminImporter from '@/pages/AdminImporter';
import { ProtectedAdminRoute, ProtectedUserRoute } from '@/components/RouteGuards';

import VendorSignup from './pages/VendorSignup';
import VendorLite from '@/pages/VendorLite';

import { AppConfigProvider } from '@/components/AppConfigContext';
import OnboardingEarningDisplay from '@/components/OnboardingEarningDisplay';
import PersistenceTestPage from '@/pages/PersistenceTest';
import { SpeedInsights } from "@vercel/speed-insights/react"
import Footer from '@/components/Footer';

// Content Sprint Pages
import AboutUs from '@/pages/AboutUs';
import UseCases from '@/pages/UseCases';
import Pricing from '@/pages/Pricing';
import Terms from '@/pages/legal/Terms';
import Privacy from '@/pages/legal/Privacy';
import Accessibility from '@/pages/legal/Accessibility';
import BusinessInfo from '@/pages/BusinessInfo';
import Contact from '@/pages/Contact';

import CommandCenter from '@/pages/CommandCenter';
import AdminLayout from '@/layouts/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminData from '@/pages/admin/AdminData';
import AdminCRM from '@/pages/admin/AdminCRM';
import BoardRoom from '@/pages/BoardRoom';
import NotFound from '@/pages/NotFound';
import LocalBrain from '@/pages/LocalBrain';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  const location = useLocation();

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

            {Object.entries(Pages)
              .filter(([path]) => path !== 'MapView') // Exclude MapView from standard routing
              .map(([path, Page]) => (
                <Route key={path} path={`/${path.toLowerCase()}`} element={<Page />} />
              ))}

            {/* Admin & Vendor Routes */}
            <Route path="/command-center" element={<CommandCenter />} />
            <Route path="/board-room" element={<BoardRoom />} />

            {/* Admin Routes (New Layout) */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<CommandCenter />} />
                <Route path="overview" element={<AdminOverview />} />
                <Route path="command-center" element={<CommandCenter />} />
                <Route path="board-room" element={<BoardRoom />} />

                <Route path="users" element={<AdminUsers />} />
                <Route path="data" element={<AdminData />} />
                <Route path="crm" element={<AdminCRM />} />
                {/* Placeholders for now */}
                <Route path="logs" element={<div className="p-8 text-slate-400">System Logs Coming Soon...</div>} />
                <Route path="settings" element={<div className="p-8 text-slate-400">Admin Settings Coming Soon...</div>} />
              </Route>
              <Route path="/admin-importer" element={<AdminImporter />} />
            </Route>

            <Route element={<ProtectedUserRoute />}>
              <Route path="/vendor-signup" element={<VendorSignup />} />
              <Route path="/vendor" element={<VendorLite />} />
            </Route>

            <Route path="/earnings-preview" element={<div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center"><OnboardingEarningDisplay /></div>} />
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

            <Route path="/local-brain" element={<LocalBrain />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>

      </div>
    </LayoutWrapper>
  );
};

function App() {

  return (
    <AuthProvider>
      <AppConfigProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
        <SpeedInsights />
      </AppConfigProvider>
    </AuthProvider>
  )
}

export default App

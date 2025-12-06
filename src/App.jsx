import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { setupIframeMessaging } from './lib/iframe-messaging';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AgentCommandCenter from '@/pages/AgentCommandCenter';
import AdminImporter from '@/pages/AdminImporter';

import VendorSignup from '@/pages/VendorSignup';
import { AppConfigProvider } from '@/components/AppConfigContext';
import OnboardingEarningDisplay from '@/components/OnboardingEarningDisplay';
import PersistenceTestPage from '@/pages/PersistenceTest';

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
        <Route path="/command-center" element={<AgentCommandCenter />} />
        <Route path="/admin-importer" element={<AdminImporter />} />
        <Route path="/vendor-signup" element={<VendorSignup />} />
        <Route path="/earnings-preview" element={<div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center"><OnboardingEarningDisplay /></div>} />
        <Route path="/test-persistence" element={<PersistenceTestPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </LayoutWrapper>
  );
};


// import AIConcierge from '@/components/AIConcierge'; // Removed in favor of full page

// ... (existing imports)

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
      </AppConfigProvider>
    </AuthProvider>
  )
}

export default App

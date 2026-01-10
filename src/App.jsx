import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/shared/lib/query-client'
import VisualEditAgent from '@/shared/lib/VisualEditAgent'

import { usePageDirection } from '@/shared/hooks/usePageDirection';
import { pagesConfig } from './pages.config'
import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useParams } from 'react-router-dom';
import { setupIframeMessaging } from '@/shared/lib/iframe-messaging';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
// import AgentCommandCenter from '@/pages/AgentCommandCenter'; // Unused?
import AdminImporter from '@/pages/AdminImporter';
import { ProtectedAdminRoute, ProtectedUserRoute } from '@/components/RouteGuards';
import * as RouteGuards from '@/components/RouteGuards'; // Import all as RouteGuards for the new route
import { RequireRole } from '@/components/RequireRole';

import VendorSignup from '@/features/vendors/pages/Signup';
// import VendorLite from '@/pages/VendorLite'; // Unused?

import { AppConfigProvider } from '@/components/AppConfigContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { RxDBProvider } from '@/core/db/RxDBProvider';
import OnboardingEarningDisplay from '@/components/OnboardingEarningDisplay';
const PersistenceTest = lazy(() => import('./pages/PersistenceTest'));
const MemoryLab = lazy(() => import('./pages/MemoryLab'));
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"
import KosmoiLoader from '@/components/ui/KosmoiLoader';
// import Footer from '@/components/Footer'; // Unused in main layout?

import GlobalErrorBoundary from '@/components/GlobalErrorBoundary';
import ScrollToTop from '@/components/ScrollToTop';
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';

// Content Sprint Pages
import AboutUs from '@/pages/AboutUs';
import UseCases from '@/pages/UseCases';
import Pricing from '@/pages/Pricing';
import TermsOfService from '@/pages/legal/TermsOfService';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import Security from '@/pages/legal/Security';
import Accessibility from '@/pages/legal/Accessibility';
import BusinessInfo from '@/pages/BusinessInfo';
import Contact from '@/pages/Contact';
import SupportChat from '@/pages/SupportChat';
import Blog from '@/pages/Blog';
import BlogPostDetail from '@/pages/BlogPostDetail';
import CalendarView from '@/pages/vendor/CalendarView';
import MyBookings from '@/pages/MyBookings';
import Marketplace from '@/pages/Marketplace.jsx';
import ProductDetails from '@/pages/ProductDetails';
import ChatHub from '@/pages/ChatHub';
import Notifications from '@/pages/Notifications';
import Organizer from '@/pages/Organizer.jsx';

import RealEstateHub from '@/pages/RealEstateHub';
import OneDollar from '@/pages/OneDollar';
import ClaimProfile from '@/pages/ClaimProfile';
import CommandCenter from '@/features/agents/pages/CommandCenter';
import AdminLayout from '@/layouts/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminClaims from '@/pages/admin/AdminClaims';
import AdminAgents from '@/features/agents/pages/AdminAgents';
import AgentDetail from '@/pages/admin/AgentDetail';
import AdminCompany from '@/pages/admin/AdminCompany';
import AdminBusinesses from '@/pages/admin/AdminBusinesses';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminData from '@/pages/admin/AdminData';
import AdminCRM from '@/pages/admin/AdminCRM';
import AdminLeads from './pages/admin/AdminLeads';
import AdminMarketing from './pages/admin/AdminMarketing';
import AdminAutomations from './pages/admin/AdminAutomations';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminScheduler from './pages/admin/AdminScheduler';
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
import AdminWallet from './pages/admin/AdminWallet';
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
  const location = useLocation();
  // Check if we are on the contact page or support page (supports localized routes)
  const isStandalonePage = location.pathname.includes('/contact') || location.pathname.includes('/support');

  if (isStandalonePage) {
    return <>{children}</>;
  }

  const LayoutComponent = Layout;
  return LayoutComponent ?
    // @ts-ignore
    <LayoutComponent currentPageName={currentPageName}>{children}</LayoutComponent>
    : <>{children}</>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } = useAuth();
  const location = useLocation();
  const { language } = useLanguage();
  usePageDirection();

  // Allow public access to diagnostics
  // Updated to be rigorous about path matching regardless of language prefix
  const isDiagnostics = location.pathname.endsWith('/diagnostics');
  if (isDiagnostics) {
    const DiagnosticsPage = Pages['Diagnostics'];
    return <DiagnosticsPage />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50">
        <KosmoiLoader />
        {/* <p className="text-sm text-gray-500 mt-4">Loading... (Auth: {isLoadingAuth ? 'Checking' : 'Done'}, Settings: {isLoadingPublicSettings ? 'Loading' : 'Done'})</p> */}
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    // Allow public access to Contact page even if auth fails
    const isContactPage = location.pathname.includes('/contact');

    if (!isContactPage) {
      if (authError.type === 'user_not_registered') {
        return <UserNotRegisteredError />;
      } else if (authError.type === 'auth_required') {
        // Redirect to login automatically
        // TODO: Handle language-aware redirect
        navigateToLogin();
        return null;
      }
    }
  }

  const MapViewPage = Pages['MapView'];
  const isMapView = location.pathname.endsWith('/mapview');

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          {/* Persistent MapView */}
          <div style={{ display: isMapView ? 'block' : 'none', height: '100%' }}>
            <MapViewPage />
          </div>

          <Routes>
            {/* Note: All paths here are relative to the parent Route (language prefix or root) */}
            <Route path="/" element={<MainPage />} />
            {/* Add dummy route for mapview so it matches but renders nothing (since we render it manually above) */}
            <Route path="mapview" element={null} />

            {/* Protected Business Route */}
            <Route path="business" element={
              <RequireRole role="vendor">
                <Pages.Business />
              </RequireRole>
            } />

            {Object.entries(Pages)
              .filter(([path]) => path !== 'MapView')
              .filter(([path]) => !['Wallet', 'ProviderDashboard', 'RealEstate', 'Experiences'].includes(path)) // Exclude Super App pages for manual routing
              .map(([path, Page]) => (
                <Route key={path} path={`${path.toLowerCase()}`} element={<Page />} />
              ))}

            {/* Public Super App Routes */}
            <Route path="real-estate" element={<RealEstateHub />} />
            <Route path="test-drive" element={<OneDollar />} />
            <Route path="one-dollar" element={<OneDollar />} />
            <Route path="claim" element={<ClaimProfile />} /> // Query param: ?token=...
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="marketplace/:id" element={<ProductDetails />} />
            <Route path="organizer" element={<Organizer />} />
            <Route path="vendor-signup" element={<VendorSignup />} />
            <Route path="login" element={<Pages.Login />} />
            <Route path="update-password" element={<Pages.UpdatePassword />} />
            <Route path="complete-signup" element={<Pages.CompleteSignup />} />
            <Route path="experiences" element={<Pages.Experiences />} />
            <Route path="experiences/:id" element={<Pages.ExperienceDetails />} />

            <Route path="provider/:providerId" element={<ProviderProfile />} />
            <Route path="chat/:workflowId" element={<Pages.AgentChat />} />
            <Route path="chat-hub" element={<ChatHub />} />
            <Route path="notifications" element={<Notifications />} />

            {/* Admin & Vendor Routes */}
            <Route path="command-center" element={<CommandCenter />} />
            <Route path="board-room" element={<BoardRoom />} />

            {/* Admin Routes (New Layout) */}
            <Route element={<ProtectedAdminRoute />}>
              <Route path="admin" element={
                <RequireRole role="admin">
                  <AdminLayout />
                </RequireRole>
              }>
                <Route index element={<Navigate to="command-center" replace />} />
                <Route path="command-center" element={<CommandCenter />} />
                <Route path="board-room" element={<BoardRoom />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="claims" element={<AdminClaims />} />
                <Route path="agents" element={<AdminAgents />} />
                <Route path="agents/:agentId" element={<AgentDetail />} />
                <Route path="company" element={<AdminCompany />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="businesses" element={<AdminBusinesses />} />
                <Route path="data" element={<AdminData />} />
                <Route path="optimizer" element={<AdminOptimizer />} />
                <Route path="crm" element={<AdminCRM />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="automations" element={<AdminAutomations />} />
                <Route path="scheduler" element={<AdminScheduler />} />
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
                <Route path="wallet" element={<AdminWallet />} />
                <Route path="settings" element={<div className="p-8 text-slate-400">Admin Settings Coming Soon...</div>} />
                <Route path="importer" element={<AdminImporter />} />
                <Route path="sitemap" element={<AdminSitemap />} />
                <Route path="wiki" element={<Pages.AdminWiki />} />
              </Route>
            </Route>


            <Route element={<ProtectedUserRoute />}>
              <Route path="wallet" element={<Pages.Wallet />} />
              <Route path="wallet/scan" element={<Pages.WalletScan />} />
              <Route path="wallet/send" element={<Pages.WalletSend />} />
              <Route path="wallet/receive" element={<Pages.WalletReceive />} />
              <Route path="wallet/card" element={<Pages.WalletCard />} />
              <Route path="provider-dashboard" element={<Pages.ProviderDashboard />} />
              <Route path="vendor/calendar" element={<CalendarView />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="memory-lab" element={<MemoryLab />} />
            </Route>

            <Route path="earnings-preview" element={<div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center"><OnboardingEarningDisplay data={{}} /></div>} />
            <Route path="persistence-test" element={<PersistenceTest />} />
            <Route path="persistence-test" element={<PersistenceTest />} />

            {/* Trust Pages */}
            <Route path="about" element={<AboutUs />} />
            <Route path="use-cases" element={<UseCases />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="legal/terms" element={<TermsOfService />} />
            <Route path="legal/privacy" element={<PrivacyPolicy />} />
            <Route path="legal/security" element={<Security />} />
            <Route path="legal/accessibility" element={<Accessibility />} />
            <Route path="business-info" element={<BusinessInfo />} />
            <Route path="contact" element={<Contact />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPostDetail />} />

            {/* Support & Aliases */}
            <Route path="support" element={<SupportChat />} />
            <Route path="bookmarks" element={<Navigate to="/favorites" replace />} />
            <Route path="settings" element={<Navigate to="/profile" replace />} />

            <Route path="local-brain" element={<LocalBrain />} />
            <Route path="health" element={<div className="p-4 text-green-500 font-bold">OK</div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </LayoutWrapper >
  );
};

const LanguageRoot = ({ lang }) => {
  const { setLanguage } = useLanguage();
  useEffect(() => {
    if (lang) {
      setLanguage(lang);
    } else {
      setLanguage('en');
    }
  }, [lang, setLanguage]);

  return <AuthenticatedApp />;
};

function App() {

  return (
    <AuthProvider>
      <UserProfileProvider>
        <LocationProvider>
          <LanguageProvider>
            <AppConfigProvider>
              <RxDBProvider>
                <QueryClientProvider client={queryClientInstance}>
                  <GlobalErrorBoundary>
                    <Router>
                      <ScrollToTop />
                      <Routes>
                        <Route path="/he/*" element={<LanguageRoot lang="he" />} />
                        <Route path="/th/*" element={<LanguageRoot lang="th" />} />
                        <Route path="/ru/*" element={<LanguageRoot lang="ru" />} />
                        <Route path="/fr/*" element={<LanguageRoot lang="fr" />} />
                        <Route path="/de/*" element={<LanguageRoot lang="de" />} />
                        <Route path="/es/*" element={<LanguageRoot lang="es" />} />
                        <Route path="/zh/*" element={<LanguageRoot lang="zh" />} />
                        <Route path="/*" element={<LanguageRoot lang="en" />} />
                      </Routes>
                      {/* <VisualEditAgent /> */}
                    </Router>
                  </GlobalErrorBoundary>
                  <Toaster />
                  <SonnerToaster />
                </QueryClientProvider>
              </RxDBProvider>
              <SpeedInsights />
              <Analytics />
            </AppConfigProvider>
          </LanguageProvider>
        </LocationProvider>
      </UserProfileProvider>
    </AuthProvider>
  )
}

export default App

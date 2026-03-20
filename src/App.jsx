import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/shared/lib/query-client";
import VisualEditAgent from "@/shared/lib/VisualEditAgent";

import { usePageDirection } from "@/shared/hooks/usePageDirection";
import { pagesConfig } from "./pages.config";
import React, { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
  useParams,
} from "react-router-dom";
import { setupIframeMessaging } from "@/shared/lib/iframe-messaging";
import { AuthProvider, useAuth } from "@/features/auth/context/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
// import AgentCommandCenter from '@/pages/AgentCommandCenter'; // Unused?
const AdminImporter = lazy(() => import("@/pages/AdminImporter"));
import {
  ProtectedAdminRoute,
  ProtectedUserRoute,
} from "@/components/RouteGuards";
import * as RouteGuards from "@/components/RouteGuards"; // Import all as RouteGuards for the new route
import { RequireRole } from "@/components/RequireRole";

const VendorSignup = lazy(() => import("@/features/vendors/pages/Signup"));
// import VendorLite from '@/pages/VendorLite'; // Unused?

import { AppConfigProvider } from "@/components/AppConfigContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { RxDBProvider } from "@/core/db/RxDBProvider";
import OnboardingEarningDisplay from "@/components/OnboardingEarningDisplay";
const PersistenceTest = lazy(() => import("./pages/PersistenceTest"));
const MemoryLab = lazy(() => import("./pages/MemoryLab"));
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import KosmoiLoader from "@/components/ui/KosmoiLoader";
// import Footer from '@/components/Footer'; // Unused in main layout?

import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";

// Content Sprint Pages
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const UseCases = lazy(() => import("@/pages/UseCases"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const TermsOfService = lazy(() => import("@/pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("@/pages/legal/PrivacyPolicy"));
const Security = lazy(() => import("@/pages/legal/Security"));
const Accessibility = lazy(() => import("@/pages/legal/Accessibility"));
const BusinessInfo = lazy(() => import("@/pages/BusinessInfo"));
const Contact = lazy(() => import("@/pages/Contact"));
const SupportChat = lazy(() => import("@/pages/SupportChat"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostDetail = lazy(() => import("@/pages/BlogPostDetail"));
const CalendarView = lazy(() => import("@/pages/vendor/CalendarView"));
const MyBookings = lazy(() => import("@/pages/MyBookings"));
const Marketplace = lazy(() => import("@/pages/Marketplace.jsx"));
const ProductDetails = lazy(() => import("@/pages/ProductDetails"));
const ChatHub = lazy(() => import("@/pages/ChatHub"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Organizer = lazy(() => import("@/pages/Organizer.jsx"));

const RealEstateHub = lazy(() => import("@/pages/RealEstateHub"));
const OneDollar = lazy(() => import("@/pages/OneDollar"));
const ClaimProfile = lazy(() => import("@/pages/ClaimProfile"));
const WellnessHub = lazy(() => import("@/pages/WellnessHub"));
const TransportHub = lazy(() => import("@/pages/TransportHub"));
const CommandCenter = lazy(
  () => import("@/features/agents/pages/CommandCenter"),
);
import AdminLayout from "@/layouts/AdminLayout";
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminClaims = lazy(() => import("@/pages/admin/AdminClaims"));
const AdminAgents = lazy(() => import("@/features/agents/pages/AdminAgents"));
const AgentDetail = lazy(() => import("@/pages/admin/AgentDetail"));
const AdminCompany = lazy(() => import("@/pages/admin/AdminCompany"));
const AdminBusinesses = lazy(() => import("@/pages/admin/AdminBusinesses"));
const AdminBookings = lazy(() => import("@/pages/admin/AdminBookings"));
const AdminData = lazy(() => import("@/pages/admin/AdminData"));
const AdminCRM = lazy(() => import("@/pages/admin/AdminCRM"));
const AdminSales = lazy(() => import("@/pages/admin/AdminSales"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminMailbox = lazy(() => import("./pages/admin/AdminMailbox"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminAutomations = lazy(() => import("./pages/admin/AdminAutomations"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminScheduler = lazy(() => import("./pages/admin/AdminScheduler"));
const AdminEvolution = lazy(() => import("./pages/admin/AdminEvolution"));
const AdminAutonomy = lazy(() => import("./pages/admin/AdminAutonomy"));
const AdminKanban = lazy(() => import("./pages/admin/AdminKanban"));
const AdminRoadmap = lazy(() => import("@/pages/admin/AdminRoadmap"));
const AdminCanvas = lazy(() => import("./pages/admin/AdminCanvas"));
const AdminInfra = lazy(() => import("./pages/admin/AdminInfra"));
const AdminHealth = lazy(() => import("./pages/admin/AdminHealth"));
const AdminGodView = lazy(() => import("./pages/admin/AdminGodView"));
const AdminExecutives = lazy(() => import("./pages/admin/AdminExecutives"));
const AdminDepartments = lazy(() => import("./pages/admin/AdminDepartments"));
const AdminCreativeHub = lazy(() => import("./pages/admin/AdminCreativeHub"));
const AdminFullMatrix = lazy(() => import("./pages/admin/AdminFullMatrix"));
const AdminLiveControl = lazy(() => import("./pages/admin/AdminLiveControl"));
const AdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const AdminSchema = lazy(() => import("./pages/admin/AdminSchema"));
const AdminMemory = lazy(() => import("./pages/admin/AdminMemory"));
const AdminSitemap = lazy(() => import("@/pages/admin/AdminSitemap"));
const AdminOptimizer = lazy(() => import("./pages/admin/AdminOptimizer"));
const AdminHyperloop = lazy(() => import("./pages/admin/AdminHyperloop"));
const AdminSkills = lazy(() => import("./pages/admin/AdminSkills"));
const AdminWallet = lazy(() => import("./pages/admin/AdminWallet"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Studio = lazy(() => import("@/pages/admin/Studio"));
const BoardRoom = lazy(() => import("@/pages/BoardRoom"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const TransactionHistoryPage = lazy(
  () => import("./pages/TransactionHistoryPage"),
);

const LocalBrain = lazy(() => import("@/pages/LocalBrain"));
// import SystemMonitor from '@/components/dashboard/SystemMonitor'; // Unused?
const ProviderProfile = lazy(() => import("@/pages/ProviderProfile"));

// Speed Pass Injection
// import SpeedPassCard from '@/components/SpeedPassCard'; // Disabled

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

setupIframeMessaging();

const LayoutWrapper = ({ children, currentPageName }) => {
  const location = useLocation();
  // Check if we are on the contact page or support page (supports localized routes)
  const isStandalonePage =
    location.pathname.includes("/contact") ||
    location.pathname.includes("/support");

  if (isStandalonePage) {
    return <>{children}</>;
  }

  const LayoutComponent = Layout;
  return LayoutComponent ? (
    // @ts-ignore
    <LayoutComponent currentPageName={currentPageName}>
      {children}
    </LayoutComponent>
  ) : (
    <>{children}</>
  );
};

const AuthenticatedApp = () => {
  const {
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    isAuthenticated,
    navigateToLogin,
  } = useAuth();
  const location = useLocation();
  const { language } = useLanguage();
  usePageDirection();

  // Allow public access to diagnostics
  // Updated to be rigorous about path matching regardless of language prefix
  const isDiagnostics = location.pathname.endsWith("/diagnostics");
  if (isDiagnostics) {
    const DiagnosticsPage = Pages["Diagnostics"];
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
    const isContactPage = location.pathname.includes("/contact");

    if (!isContactPage) {
      if (authError.type === "user_not_registered") {
        return <UserNotRegisteredError />;
      } else if (authError.type === "auth_required") {
        // Redirect to login automatically
        // TODO: Handle language-aware redirect
        navigateToLogin();
        return null;
      }
    }
  }

  const MapViewPage = Pages["MapView"];
  const isMapView = location.pathname.endsWith("/mapview");

  // Render the main app
  return (
    <LayoutWrapper currentPageName={mainPageKey}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          {/* Persistent MapView */}
          {/* {console.log(
            "App Render: isMapView =",
            isMapView,
            "Pages['MapView'] exists?",
            !!MapViewPage,
          ) || null} */}
          <div
            style={{ display: isMapView ? "block" : "none", height: "100%" }}
          >
            <MapViewPage />
          </div>

          <Suspense
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[50vh]">
                <KosmoiLoader />
              </div>
            }
          >
            <Routes>
              {/* Note: All paths here are relative to the parent Route (language prefix or root) */}
              <Route path="/" element={<MainPage />} />
              {/* Add dummy route for mapview so it matches but renders nothing (since we render it manually above) */}
              <Route path="mapview" element={null} />
              <Route path="map" element={<Navigate to="/mapview" replace />} />
              {/* Business Registration Flow (Non-Vendor) */}
              <Route
                path="business-registration"
                element={<Pages.BusinessRegistration />}
              />
              <Route
                path="business"
                element={
                  <RequireRole role="vendor">
                    <Pages.Business />
                  </RequireRole>
                }
              />
              <Route path="vendor-signup" element={<VendorSignup />} />
              {Object.entries(Pages)
                .filter(([path]) => path !== "MapView")
                .filter(
                  ([path]) =>
                    ![
                      "Wallet",
                      "ProviderDashboard",
                      "RealEstate",
                      "Experiences",
                      "Business",
                      "BusinessRegistration",
                      "Login",
                      "UpdatePassword",
                      "CompleteSignup",
                      "VendorSignup",
                    ].includes(path),
                ) // Exclude Super App and Business pages for manual routing
                .map(([path, Page]) => (
                  <Route
                    key={path}
                    path={`${path.toLowerCase()}`}
                    element={<Page />}
                  />
                ))}
              {/* Public Super App Routes */}
              <Route path="roadmap" element={<Roadmap />} />
              <Route path="real-estate" element={<RealEstateHub />} />
              <Route path="test-drive" element={<OneDollar />} />
              <Route path="wellness" element={<Pages.Wellness />} />
              <Route path="transport" element={<Pages.Transport />} />
              <Route path="one-dollar" element={<OneDollar />} />
              <Route path="claim" element={<ClaimProfile />} /> // Query param:
              ?token=...
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="marketplace/:id" element={<ProductDetails />} />
              <Route path="organizer" element={<Organizer />} />
              <Route path="login" element={<Pages.Login />} />
              <Route
                path="update-password"
                element={<Pages.UpdatePassword />}
              />
              <Route
                path="complete-signup"
                element={<Pages.CompleteSignup />}
              />
              <Route path="experiences" element={<Pages.Experiences />} />
              <Route
                path="experiences/:id"
                element={<Pages.ExperienceDetails />}
              />
              <Route
                path="provider/:providerId"
                element={<ProviderProfile />}
              />
              <Route path="chat/:workflowId" element={<Pages.AgentChat />} />
              <Route path="chat-hub" element={<ChatHub />} />
              <Route path="notifications" element={<Notifications />} />
              {/* Admin & Vendor Routes */}
              <Route path="command-center" element={<CommandCenter />} />
              <Route path="board-room" element={<BoardRoom />} />
              {/* Admin Routes (New Layout) */}
              <Route element={<ProtectedAdminRoute />}>
                <Route
                  path="admin"
                  element={
                    <RequireRole role="admin">
                      <AdminLayout />
                    </RequireRole>
                  }
                >
                  <Route
                    index
                    element={<Navigate to="command-center" replace />}
                  />
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
                  <Route path="sales" element={<AdminSales />} />
                  <Route path="mailbox" element={<AdminMailbox />} />
                  <Route path="leads" element={<AdminLeads />} />
                  <Route path="marketing" element={<AdminMarketing />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="automations" element={<AdminAutomations />} />
                  <Route path="scheduler" element={<AdminScheduler />} />
                  <Route path="logs" element={<AdminLogs />} />
                  <Route path="evolution" element={<AdminEvolution />} />
                  <Route path="autonomy" element={<AdminAutonomy />} />
                  <Route path="schema" element={<AdminSchema />} />
                  <Route path="hyperloop" element={<AdminHyperloop />} />
                  <Route path="memory" element={<AdminMemory />} />
                  <Route path="tasks" element={<AdminKanban />} />
                  <Route path="roadmap" element={<AdminRoadmap />} />
                  <Route path="infrastructure" element={<AdminInfra />} />
                  <Route path="canvas" element={<AdminCanvas />} />
                  <Route path="health" element={<AdminHealth />} />
                  <Route path="god-view" element={<AdminGodView />} />
                  <Route path="executives" element={<AdminExecutives />} />
                  <Route path="departments" element={<AdminDepartments />} />
                  <Route path="creative-hub" element={<AdminCreativeHub />} />
                  <Route path="full-matrix" element={<AdminFullMatrix />} />
                  <Route path="live" element={<AdminLiveControl />} />
                  <Route path="studio" element={<Studio />} />
                  <Route path="skills" element={<AdminSkills />} />
                  <Route path="wallet" element={<AdminWallet />} />
                  <Route
                    path="settings"
                    element={
                      <div className="p-8 text-slate-400">
                        Admin Settings Coming Soon...
                      </div>
                    }
                  />
                  <Route path="importer" element={<AdminImporter />} />
                  <Route path="sitemap" element={<AdminSitemap />} />
                  <Route path="wiki" element={<Pages.AdminWiki />} />
                </Route>
              </Route>
              <Route element={<ProtectedUserRoute />}>
                <Route path="profile/edit" element={<Pages.EditProfile />} />
                <Route path="wallet" element={<Pages.Wallet />} />
                <Route
                  path="wallet/history"
                  element={<TransactionHistoryPage />}
                />
                <Route path="wallet/scan" element={<Pages.WalletScan />} />
                <Route path="wallet/send" element={<Pages.WalletSend />} />
                <Route
                  path="wallet/receive"
                  element={<Pages.WalletReceive />}
                />
                <Route path="wallet/card" element={<Pages.WalletCard />} />
                <Route
                  path="provider-dashboard"
                  element={<Pages.ProviderDashboard />}
                />
                <Route path="vendor/calendar" element={<CalendarView />} />
                <Route path="my-bookings" element={<MyBookings />} />
                <Route path="memory-lab" element={<MemoryLab />} />
              </Route>
              <Route
                path="earnings-preview"
                element={
                  <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
                    <OnboardingEarningDisplay data={{}} />
                  </div>
                }
              />
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
              <Route
                path="bookmarks"
                element={<Navigate to="/favorites" replace />}
              />
              <Route
                path="settings"
                element={<Navigate to="/profile" replace />}
              />
              <Route path="local-brain" element={<LocalBrain />} />
              <Route
                path="health"
                element={<div className="p-4 text-green-500 font-bold">OK</div>}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </LayoutWrapper>
  );
};

const LanguageRoot = ({ lang }) => {
  // console.log("LanguageRoot Render, lang=", lang);
  const { setLanguage } = useLanguage();
  useEffect(() => {
    if (lang) {
      setLanguage(lang);
    } else {
      setLanguage("en");
    }
  }, [lang, setLanguage]);

  return <AuthenticatedApp />;
};

function App() {
  // console.log("ROOT APP RENDER");
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <AppConfigProvider>
          <UserProfileProvider>
            <AppModeProvider>
              <LocationProvider>
                <RxDBProvider>
                  <LanguageProvider>
                    <GlobalErrorBoundary>
                      <Router>
                        <ScrollToTop />
                        <Routes>
                          <Route
                            path="/he/*"
                            element={<LanguageRoot lang="he" />}
                          />
                          <Route
                            path="/th/*"
                            element={<LanguageRoot lang="th" />}
                          />
                          <Route
                            path="/ru/*"
                            element={<LanguageRoot lang="ru" />}
                          />
                          <Route
                            path="/fr/*"
                            element={<LanguageRoot lang="fr" />}
                          />
                          <Route
                            path="/de/*"
                            element={<LanguageRoot lang="de" />}
                          />
                          <Route
                            path="/es/*"
                            element={<LanguageRoot lang="es" />}
                          />
                          <Route
                            path="/zh/*"
                            element={<LanguageRoot lang="zh" />}
                          />
                          <Route
                            path="/en/*"
                            element={<LanguageRoot lang="en" />}
                          />
                          <Route
                            path="/*"
                            element={<LanguageRoot lang="en" />}
                          />
                        </Routes>
                        <Toaster />
                        <SonnerToaster />
                      </Router>
                    </GlobalErrorBoundary>
                  </LanguageProvider>
                </RxDBProvider>
              </LocationProvider>
            </AppModeProvider>
          </UserProfileProvider>
        </AppConfigProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

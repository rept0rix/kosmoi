import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { LanguageProvider } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { AppConfigProvider, useAppConfig } from "@/components/AppConfigContext";
import DebugRoleSwitcher from "@/components/DebugRoleSwitcher";
import MiniWeather from "@/components/MiniWeather";
import { Home, Search, User, Map, Languages, Sparkles, LayoutDashboard, Briefcase, ExternalLink, ShieldAlert, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import UserMenu from "@/components/UserMenu";
import PageTransition from "@/components/PageTransition";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// --- Configuration ---
// Define which paths belong to which zone
const ZONES = {
  PUBLIC: ['/', '/about', '/team', '/pricing', '/business-info', '/legal'],
  BUSINESS: ['/business-registration', '/vendor-dashboard'],
  ADMIN: ['/admin', '/board-room', '/command-center', '/admin-importer'],
  // Everything else is considered APP
};

const LayoutContent = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t, i18n } = useTranslation();
  const { config, debugRole } = useAppConfig();

  const isPublicZone = ZONES.PUBLIC.some(path => currentPath === path || (path !== '/' && currentPath.startsWith(path)));
  const isBusinessZone = ZONES.BUSINESS.some(path => currentPath.startsWith(path));
  const isAdminZone = ZONES.ADMIN.some(path => currentPath.startsWith(path));

  // Determine App Zone: Not Public, Business or Admin
  const isAppZone = !isPublicZone && !isBusinessZone && !isAdminZone;

  // If we are in Admin Zone, let the specific AdminLayout handle everything (no double header/nav)
  if (isAdminZone) {
    return children;
  }

  // --- Styles ---
  const themeColors = {}; // Placeholder if needed

  // --- Navigation Items ---
  // Only for APP Zone
  let appNavItems = [
    { title: t('nav.marketplace'), url: createPageUrl("App"), icon: Home },
    { title: t('nav.search'), url: createPageUrl("ServiceProviders"), icon: Search },
    { title: t('nav.ai'), url: createPageUrl("AIChat"), icon: Sparkles },
    { title: t('nav.map'), url: createPageUrl("MapView"), icon: Map },
    { title: t('nav.trip'), url: createPageUrl("TripPlanner"), icon: Map },
    { title: t('nav.profile'), url: createPageUrl("Profile"), icon: User },
  ];

  // Inject Business Links based on Role (Admin links removed from here as requested)
  if (debugRole === 'business') {
    appNavItems.push({ title: t('nav.vendor'), url: '/vendor-dashboard', icon: Briefcase });
  }

  // Admin links removed from Bottom Nav to declutter




  // Render Header (Different for zones?)
  const renderHeader = () => {
    // Landing Page handles its own specialized header
    if (currentPath === '/') return null;

    return (
      <header className={`${isAdminZone ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} border-b px-4 py-3 sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            {config.logoUrl ? (
              <img
                src={isAdminZone ? '/kosmoi_logo_white.svg' : config.logoUrl}
                alt="Kosmoi"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <>
                <img
                  src={isAdminZone ? '/kosmoi_logo_white.svg' : '/kosmoi_logo.svg'}
                  alt="Kosmoi"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.nextSibling && target.nextSibling instanceof HTMLElement) {
                      target.nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent ${isAdminZone ? 'from-white to-slate-400' : ''}`} style={{ display: 'none' }}>
                  {isAdminZone ? 'Kosmoi ADMIN' : (isBusinessZone ? 'Kosmoi BUSINESS' : config.appName)}
                </span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-3">
            {/* Public Zone Context Links */}
            {isPublicZone && (
              <>
                <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600 mr-4">
                  <Link to="/about" className="hover:text-blue-600">{t('nav.about')}</Link>
                  <Link to="/team" className="hover:text-blue-600">{t('nav.team')}</Link>
                  <Link to="/business-info" className="hover:text-blue-600">{t('nav.business')}</Link>
                </div>

                {/* Mobile Menu */}
                <div className="md:hidden mr-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Menu className="w-5 h-5 text-gray-600" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader className="">
                        <SheetTitle className="text-left">Menu</SheetTitle>
                      </SheetHeader>
                      <div className="flex flex-col gap-4 mt-6">
                        <Link to="/about" className="text-lg font-medium">{t('nav.about')}</Link>
                        <Link to="/team" className="text-lg font-medium">{t('nav.team')}</Link>
                        <Link to="/business-info" className="text-lg font-medium">{t('nav.business')}</Link>
                        <hr />
                        <Link to="/dashboard" className="text-lg font-medium text-blue-600">{t('nav.launch_app')}</Link>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </>
            )}

            {!isAdminZone && !isBusinessZone && <MiniWeather />}

            {/* Replaced legacy toggle with new component */}
            <LanguageSwitcher />

            <UserMenu />
          </div>
        </div>
      </header >
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${isAdminZone ? 'bg-slate-950 text-slate-200' : 'bg-gray-50'}`} dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {renderHeader()}

      {/* Main Content */}
      <main className={`flex-1 ${isAppZone ? 'pb-20' : ''} relative`}>
        <PageTransition key={currentPath}>
          {children}
        </PageTransition>
      </main>

      {/* role switcher debug tool */}
      <DebugRoleSwitcher />

      {/* Bottom Navigation - ONLY FOR APP ZONE */}
      {isAppZone && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg safe-area-pb">
          <div className="max-w-7xl mx-auto px-2">
            <div className="flex items-center justify-around overflow-x-auto">
              {appNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex flex-col items-center py-3 px-3 min-w-[64px] transition-colors ${isActive ? 'text-blue-600' : 'text-gray-600'}`}
                  >
                    <item.icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className="text-xs mt-1 font-medium whitespace-nowrap">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Footer - Only for Public Zone (excluding Landing which is handled separately) / Business */}
      {((isPublicZone && currentPath !== '/') || isBusinessZone) && (
        <Footer />
      )}
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <AppConfigProvider>
        <LayoutContent children={children} />
      </AppConfigProvider>
    </LanguageProvider>
  );
}
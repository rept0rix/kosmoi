import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LanguageProvider } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { AppConfigProvider, useAppConfig } from "@/components/AppConfigContext";
import DebugRoleSwitcher from "@/components/DebugRoleSwitcher";
import MiniWeather from "@/components/MiniWeather";
import { Home, Search, User, Map, Languages, Sparkles, LayoutDashboard, Briefcase, ExternalLink, ShieldAlert, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";

// --- Configuration ---
// Define which paths belong to which zone
const ZONES = {
  PUBLIC: ['/', '/about', '/team', '/pricing', '/business-info', '/legal'],
  BUSINESS: ['/business-registration', '/vendor-dashboard'],
  ADMIN: ['/board-room', '/command-center', '/admin-importer'],
  // Everything else is considered APP
};

function LayoutContent({ children }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { config } = useAppConfig();
  const debugRole = config.debugRole || 'user'; // 'user', 'business', 'admin'

  // --- Zone Detection ---
  const currentPath = location.pathname.toLowerCase();

  const isPublicZone = ZONES.PUBLIC.some(path =>
    path === '/' ? currentPath === '/' : currentPath.startsWith(path)
  );

  const isBusinessZone = ZONES.BUSINESS.some(path => currentPath.startsWith(path));

  const isAdminZone = ZONES.ADMIN.some(path => currentPath.startsWith(path));

  // Determine App Zone: Not Public, Business or Admin
  const isAppZone = !isPublicZone && !isBusinessZone && !isAdminZone;

  // --- Styles ---
  const themeColors = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };
  const activeColor = themeColors[config.themeColor] || 'text-blue-600';

  // --- Navigation Items ---
  // Only for APP Zone
  let appNavItems = [
    { title: t('nav.home'), url: createPageUrl("App"), icon: Home },
    { title: t('nav.search'), url: createPageUrl("ServiceProviders"), icon: Search },
    { title: t('nav.ai'), url: createPageUrl("AIChat"), icon: Sparkles },
    { title: t('nav.map'), url: createPageUrl("MapView"), icon: Map },
    { title: t('nav.trip'), url: createPageUrl("TripPlanner"), icon: Map },
    { title: t('nav.profile'), url: createPageUrl("Profile"), icon: User },
  ];

  // Inject Admin/Business Links based on Role
  if (debugRole === 'business') {
    appNavItems.push({ title: t('nav.vendor'), url: '/vendor-dashboard', icon: Briefcase });
  }

  if (debugRole === 'admin') {
    appNavItems.push({ title: t('nav.board'), url: '/board-room', icon: ShieldAlert });
    appNavItems.push({ title: t('nav.admin'), url: '/command-center', icon: Monitor });
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'he' : 'en';
    i18n.changeLanguage(newLang);
  };

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
              <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600 mr-4">
                <Link to="/about" className="hover:text-blue-600">{t('nav.about')}</Link>
                <Link to="/team" className="hover:text-blue-600">{t('nav.team')}</Link>
                <Link to="/business-info" className="hover:text-blue-600">{t('nav.business')}</Link>
              </div>
            )}

            {!isAdminZone && !isBusinessZone && <MiniWeather />}

            <Button
              onClick={toggleLanguage}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 ${isAdminZone ? 'text-slate-300 hover:text-white hover:bg-slate-800' : ''}`}
            >
              <Languages className="w-4 h-4" />
              <span className="text-sm font-medium">
                {i18n.language === 'he' ? 'EN' : 'עב'}
              </span>
            </Button>

            {/* CTA for Public Zone */}
            {isPublicZone && (
              <Link to="/dashboard">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  {t('nav.launch_app')}
                </Button>
              </Link>
            )}
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
        {children}
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
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { LanguageProvider } from "@/components/LanguageContext";
import { Button } from "@/components/ui/button";
import { AppConfigProvider, useAppConfig } from "@/components/AppConfigContext";
import DebugRoleSwitcher from "@/components/DebugRoleSwitcher";
import MiniWeather from "@/components/MiniWeather";
import { Home, Search, User, Map, Languages, Sparkles, LayoutDashboard, Briefcase, ExternalLink, ShieldAlert, Monitor, Store, Calendar, QrCode, Menu, MessageCircle, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Footer from "@/components/Footer";
import UserMenu from "@/components/UserMenu";
import PageTransition from "@/components/PageTransition";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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

  // --- Navigation Items ---
  // New Structure: Home, Chat, PAY (Center), Marketplace, Organizer
  const appNavItems = [
    { title: t('nav.home'), url: createPageUrl("App"), icon: Home },
    { title: t('nav.ai'), url: createPageUrl("AIChat"), icon: Sparkles },
    // Center Button (Pay) - Special Styling
    { title: 'PAY', url: createPageUrl("Wallet"), icon: QrCode, isSpecial: true },
    { title: 'Market', url: '/marketplace', icon: Store },
    { title: 'Organizer', url: '/organizer', icon: Calendar },
  ];

  // Render Header
  const renderHeader = () => {
    // Landing Page handles its own specialized header
    if (currentPath === '/') return null;

    return (
      <header className={`${isAdminZone ? 'bg-background/80 backdrop-blur-md border-border shadow-sm' : 'bg-background/80 backdrop-blur-md border-border shadow-sm'} border-b px-4 py-3 sticky top-0 z-50 transition-colors duration-500`}>
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

            {!isAdminZone && !isBusinessZone && (
              <div className="flex items-center gap-1 mr-2">
                <Link to="/chat-hub">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-indigo-600 rounded-full">
                    <MessageCircle className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/notifications">
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-indigo-600 rounded-full">
                    <Bell className="w-5 h-5" />
                  </Button>
                </Link>
                <div className="mx-2"><MiniWeather /></div>
              </div>
            )}

            <LanguageSwitcher />

            <UserMenu />
          </div>
        </div>
      </header >
    );
  };

  return (
    <div className={`min-h-screen flex flex-col bg-background text-foreground transition-colors duration-500`} dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
      {renderHeader()}

      {/* Main Content */}
      <main className={`flex-1 ${isAppZone ? 'pb-24' : ''} relative`}>
        <PageTransition key={currentPath}>
          {children}
        </PageTransition>
      </main>

      {/* role switcher debug tool */}
      <DebugRoleSwitcher />

      {/* Bottom Navigation - ONLY FOR APP ZONE */}
      {isAppZone && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 dark:bg-slate-950/90 dark:border-slate-800 z-50 safe-area-pb shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
          <div className="max-w-md mx-auto px-4">
            <div className="flex items-center justify-between relative">

              {appNavItems.map((item) => {
                const isActive = location.pathname === item.url;

                if (item.isSpecial) {
                  // CENTER BUTTON (SCAN/PAY)
                  return (
                    <div key={item.title} className="relative -top-6">
                      <Link to={item.url}>
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                          className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg shadow-blue-500/40 border-4 border-white dark:border-slate-950 flex items-center justify-center"
                        >
                          <item.icon size={28} />
                        </motion.div>
                      </Link>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex flex-col items-center py-3 min-w-[60px] transition-colors relative group ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                  >
                    <div className="relative">
                      <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      {isActive && (
                        <motion.div
                          layoutId="navIndicator"
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                        />
                      )}
                    </div>
                    <span className="text-[10px] mt-1 font-medium">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Footer - Only for Public Zone */}
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
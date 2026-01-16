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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DirectionProvider } from '@radix-ui/react-direction';
import QuickActionsFab from "@/components/QuickActionsFab";
import LandingNavbar from "@/components/LandingNavbar";

// --- Configuration ---
// Define which paths belong to which zone
const ZONES = {
  PUBLIC: ['/', '/about', '/team', '/pricing', '/business-info', '/legal', '/business'],
  BUSINESS: ['/business-registration', '/vendor-dashboard'],
  ADMIN: ['/admin', '/board-room', '/command-center', '/admin-importer'],
  // Everything else is considered APP
};

const LayoutContent = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t, i18n } = useTranslation();
  const { config, debugRole } = useAppConfig();
  const [notifications, setNotifications] = React.useState([
    { id: 1, title: 'New Feature', message: 'Check out the new Rentals category!', time: '2m ago', read: false },
    { id: 2, title: 'System Update', message: 'Maintenance scheduled for tonight.', time: '1h ago', read: false },
    { id: 3, title: 'Welcome', message: 'Welcome to Koh Samui Hub!', time: '1d ago', read: true },
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [messages, setMessages] = React.useState([
    { id: 1, user: 'Concierge AI', message: 'I found some great bike rentals for you.', time: '5m ago', unread: true },
    { id: 2, user: 'Support Team', message: 'Your booking #1234 is confirmed.', time: '2h ago', unread: false },
  ]);
  const unreadMsgCount = messages.filter(m => m.unread).length;

  // --- Normalization for Locale Prefixes ---
  // Strip /he, /th, /ru from the beginning of path to check zones correctly
  // e.g. /he/about -> /about, /he -> /
  const normalizedPath = currentPath.replace(/^\/(he|th|ru)(\/|$)/, '/$2') || '/';

  const isPublicZone = ZONES.PUBLIC.some(path => normalizedPath === path || (path !== '/' && normalizedPath.startsWith(path)));
  const isBusinessZone = ZONES.BUSINESS.some(path => normalizedPath.startsWith(path));
  const isAdminZone = ZONES.ADMIN.some(path => normalizedPath.startsWith(path));

  // Determine App Zone: Not Public, Business or Admin
  // If request is exact root '/' or '/he', it counts as Public Zone due to normalizedPath === '/' check above
  const isAppZone = !isPublicZone && !isBusinessZone && !isAdminZone;

  // Vibe & Wallet State
  const [wallet, setWallet] = React.useState(null);

  React.useEffect(() => {
    const fetchVibes = async () => {
      try {
        const { WalletService } = await import('@/services/WalletService');
        const data = await WalletService.getWallet();
        if (data) setWallet(data);
      } catch (e) {
        // silent fail
      }
    };

    if (isAppZone) {
      fetchVibes();
    }
  }, [isAppZone]);

  // If we are in Admin Zone, let the specific AdminLayout handle everything (no double header/nav)
  if (isAdminZone) {
    return children;
  }

  // --- Navigation Items ---
  // New Structure: Home, Chat, PAY (Center), Marketplace, Organizer
  const appNavItems = [
    { title: t('nav.home'), url: createPageUrl("App"), icon: Home },
    { title: t('nav.ai'), url: createPageUrl("AIChat"), icon: Sparkles },
    // Center Button (Pay) - Special Styling -> Now Quick Action FAB
    { title: 'PAY', url: '#', icon: QrCode, isSpecial: true },
    { title: 'Market', url: '/marketplace', icon: Store },
    { title: 'Organizer', url: '/organizer', icon: Calendar },
  ];

  // Render Header
  const renderHeader = () => {
    // 1. Landing / Public Zone Header
    if (isPublicZone) {
      // Use the new dedicated LandingNavbar
      return <LandingNavbar />;
    }

    // 2. Business / App Header
    return (
      <header className={`${isAdminZone ? 'bg-background/80 backdrop-blur-md border-border shadow-sm' : 'bg-background/80 backdrop-blur-md border-border shadow-sm'} border-b px-4 py-2 sticky top-0 z-50 transition-colors duration-500`}>
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
            {/* Vibe Token Counter */}
            {isAppZone && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full mr-2">
                <Sparkles className="w-4 h-4 text-purple-500 fill-purple-500/20" />
                <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                  {wallet?.vibes_balance || 0} Vibes
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 mr-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-indigo-600 rounded-full relative">
                    <MessageCircle className="w-5 h-5" />
                    {unreadMsgCount > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-semibold">Messages</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {messages.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No new messages</div>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className="relative">
                          <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-slate-50">
                            <div className="flex justify-between w-full items-center">
                              <span className={`text-sm font-semibold ${msg.unread ? 'text-blue-600' : 'text-gray-700'}`}>{msg.user}</span>
                              <span className="text-xs text-gray-400">{msg.time}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-1">{msg.message}</p>
                          </DropdownMenuItem>
                          {msg.unread && (
                            <div className="absolute left-1 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-blue-600 cursor-pointer font-medium" asChild>
                    <Link to="/chat-hub" className="w-full text-center block">Open Chat Hub</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-indigo-600 rounded-full relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No new notifications</div>
                    ) : (
                      notifications.map(notification => (
                        <div key={notification.id} className="relative">
                          <DropdownMenuItem className="cursor-pointer flex flex-col items-start gap-1 p-3 focus:bg-slate-50">
                            <div className="flex justify-between w-full items-center">
                              <span className={`text-sm font-semibold ${!notification.read ? 'text-blue-600' : 'text-gray-700'}`}>{notification.title}</span>
                              <span className="text-xs text-gray-400">{notification.time}</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                          </DropdownMenuItem>
                          {!notification.read && (
                            <div className="absolute left-1 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-blue-600 cursor-pointer font-medium" asChild>
                    <Link to="/notifications" className="w-full text-center block">View all notifications</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="mx-2"><MiniWeather /></div>
            </div>

            <LanguageSwitcher />

            <UserMenu />
          </div>
        </div>
      </header >
    );
  };

  return (
    <DirectionProvider dir={i18n.language === 'he' ? 'rtl' : 'ltr'}>
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
                    // CENTER BUTTON (Action FAB)
                    return (
                      <div key={item.title} className="relative -top-6 z-50">
                        <QuickActionsFab />
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
        {isPublicZone && (
          <Footer />
        )}
      </div>
    </DirectionProvider>
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
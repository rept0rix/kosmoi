import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, User, Map, Languages, Sparkles, LayoutDashboard, Users } from "lucide-react";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";
import { Button } from "@/components/ui/button";

import { AppConfigProvider, useAppConfig } from "@/components/AppConfigContext";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const { config } = useAppConfig();
  const t = (key) => getTranslation(language, key);

  const navItems = [
    { title: t('home'), url: createPageUrl("Home"), icon: Home },
    { title: t('search'), url: createPageUrl("ServiceProviders"), icon: Search },
    { title: "AI", url: createPageUrl("AIChat"), icon: Sparkles },
    { title: t('map'), url: createPageUrl("MapView"), icon: Map },
    { title: "Trip", url: createPageUrl("TripPlanner"), icon: Map },
    { title: "Board", url: createPageUrl("BoardRoom"), icon: Users },
    { title: "Agents", url: "/command-center", icon: LayoutDashboard },
    { title: t('profile'), url: createPageUrl("Profile"), icon: User },
  ];

  // Map theme colors to Tailwind classes
  const themeColors = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    orange: 'text-orange-600'
  };

  const activeColor = themeColors[config.themeColor] || 'text-blue-600';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.logoUrl && <img src={config.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />}
            <h1 className={`text-xl font-bold ${activeColor.replace('text-', 'text-gray-900')}`}>{config.appName}</h1>
          </div>
          <Button
            onClick={toggleLanguage}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium">
              {language === 'he' ? 'EN' : language === 'en' ? 'ไทย' : language === 'th' ? 'RU' : 'עב'}
            </span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = location.pathname === item.url;
              return (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex flex-col items-center py-3 px-4 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-600'
                    }`}
                >
                  <item.icon className={`w-6 h-6 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-xs mt-1 font-medium">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <LayoutContent children={children} currentPageName={currentPageName} />
    </LanguageProvider>
  );
}
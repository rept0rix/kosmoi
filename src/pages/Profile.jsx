import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  Bell,
  User,
  History,
  Ticket,
  CalendarCheck,
  Heart,
  Bookmark,
  Settings,
  Info,
  HelpCircle,
  ChevronRight,
  LogOut,
  CreditCard,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PushService } from "@/services/PushService";
import { toast } from "@/components/ui/use-toast";
import { useAppMode } from "@/contexts/AppModeContext";
import { Store, RefreshCw } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { activeMode, setMode } = useAppMode();
  const [isPushEnabled, setIsPushEnabled] = React.useState(false);
  const [loadingPush, setLoadingPush] = React.useState(false);

  React.useEffect(() => {
    PushService.getSubscription().then(sub => {
      setIsPushEnabled(!!sub);
    });
  }, []);

  const handleTogglePush = async () => {
    setLoadingPush(true);
    try {
      if (isPushEnabled) {
        await PushService.unsubscribe();
        setIsPushEnabled(false);
        toast({ title: t('notifications.disabled'), description: "You will no longer receive push notifications." });
      } else {
        await PushService.subscribe();
        setIsPushEnabled(true);
        toast({ title: t('notifications.enabled'), description: "Push notifications enabled successfully!" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update notification settings.", variant: "destructive" });
    } finally {
      setLoadingPush(false);
    }
  };

  // Temporary Member ID generation (or fetch from metadata if exists)
  const memberId = user?.id ? `MM${user.id.substring(0, 8).toUpperCase()}` : "MM30593117";

  const menuItems = [
    {
      title: t('account.section_personal'),
      items: [
        { icon: User, label: t('account.details'), path: "/profile/edit" },
        { icon: Wallet, label: t('account.wallet'), path: "/wallet" },
        { icon: History, label: t('account.purchase_history'), path: "/wallet/history" },
        //{ icon: Gift, label: "Benefit Redemption History", path: "/benefits" }, // Placeholder
        { icon: Ticket, label: t('account.booking_history'), path: "/my-bookings" },
        { icon: CalendarCheck, label: t('account.reservation'), path: "/vendor/calendar" }, // Mapping to Calendar for now
        { icon: Heart, label: t('account.favorites'), path: "/favorites" }, // Need to ensure route exists
        { icon: Bookmark, label: t('account.bookmark'), path: "/bookmarks" }, // Placeholder
      ]
    },
    {
      title: t('account.section_general'),
      items: [
        { icon: Settings, label: t('account.settings'), path: "/settings" },
        { icon: Info, label: t('account.about'), path: "/about" },
        { icon: HelpCircle, label: t('account.help'), path: "/contact" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 font-sans">
      {/* --- Header Section (Red Gradient) --- */}
      <div className="bg-gradient-to-b from-[#E93B4E] to-[#C92A3B] pt-12 pb-8 px-6 text-white relative overflow-hidden">
        {/* Decorative BG elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8 relative z-10 font-['Outfit']">
          <h1 className="text-2xl font-bold">{t('account.title')}</h1>
          <button
            onClick={handleTogglePush}
            disabled={loadingPush}
            className={`p-2 rounded-full transition backdrop-blur-sm ${isPushEnabled ? 'bg-white text-[#E93B4E]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <Bell className={`w-5 h-5 ${isPushEnabled ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-20 h-20 rounded-full bg-white text-[#E93B4E] flex items-center justify-center text-3xl font-bold border-4 border-white/20 shadow-lg">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">
              {t('account.hi')}, {user?.user_metadata?.full_name || 'Traveler'}
            </h2>
            <p className="text-sm text-white/90 font-light mb-1">{user?.email}</p>
            <div className="inline-flex items-center px-2 py-0.5 rounded bg-black/20 text-xs text-white/80 backdrop-blur-sm">
              {t('account.member_id')}: {memberId}
            </div>
          </div>
        </div>
      </div>

      {/* --- Mode Switcher Card --- */}
      <div className="px-4 -mt-6 relative z-30 mb-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${activeMode === 'business' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
              {activeMode === 'business' ? <Store className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {activeMode === 'business' ? 'Business Mode' : 'Personal Mode'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeMode === 'business' ? 'Managing your services' : 'Standard user view'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 font-bold flex gap-2"
            onClick={() => {
              const newMode = activeMode === 'personal' ? 'business' : 'personal';
              if (newMode === 'business' && user?.role !== 'vendor' && user?.role !== 'service_provider') {
                navigate('/business-registration');
                toast({ title: "Registration Required", description: "Please register your business to access Business Mode." });
              } else {
                setMode(newMode);
                toast({ title: `Switched to ${newMode === 'business' ? 'Business' : 'Personal'} Mode` });
                if (newMode === 'business') navigate('/provider-dashboard');
                else navigate('/app');
              }
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Switch
          </Button>
        </div>
      </div>

      {/* --- Menu List --- */}
      <div className="px-4 relative z-20">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">

          {menuItems.map((section, idx) => (
            <div key={idx} className="pb-2 last:pb-0">
              <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-['Outfit']">
                  {section.title}
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-slate-400 group-hover:text-[#E93B4E] transition-colors">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="text-slate-600 dark:text-slate-300 font-medium text-[15px]">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Logout Button */}
          <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 mt-2">
            <Button
              variant="ghost"
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 justify-start h-12 px-4"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('account.sign_out')}
            </Button>
          </div>
        </div>
      </div>

      {/* Version Tag */}
      <div className="text-center text-slate-400 text-xs mt-8 pb-8">
        {t('account.version')}
      </div>

    </div>
  );
}
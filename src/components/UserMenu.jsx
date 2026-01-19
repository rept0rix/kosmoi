
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useAppConfig } from '@/components/AppConfigContext';
import { useAppMode } from '@/contexts/AppModeContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, LayoutDashboard, Briefcase, ShieldAlert, Calendar, RefreshCw, Store } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserMenu() {
    const { t } = useTranslation();
    const { user, signOut } = useAuth();
    const { config } = useAppConfig();
    const { activeMode, setMode } = useAppMode();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);


    if (!user) {
        return (
            <Link to="/login">
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-0">
                    <Avatar className="h-full w-full">
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-800 text-slate-400">
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </Link>
        );
    }

    // Determine role based on real user data (RBAC)
    const isAdmin = user?.role === 'admin' || user?.user_metadata?.role === 'admin';
    const isBusiness = user?.role === 'service_provider' || config.debugRole === 'business';

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-0">
                        <Avatar className="h-full w-full">
                            <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-medium">{getInitials(displayName)}</AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal p-2">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-semibold leading-none">{displayName}</p>
                            <p className="text-xs leading-none text-muted-foreground opacity-70">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-slate-800">
                        <Link to="/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4 text-blue-500" />
                            <span className="flex-1">{t('nav.profile') || 'Profile'}</span>
                        </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-slate-800">
                        <Link to="/my-bookings" className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-green-500" />
                            <span className="flex-1">{t('nav.my_bookings') || 'My Bookings'}</span>
                        </Link>
                    </DropdownMenuItem>

                    {/* Settings Trigger */}
                    <DropdownMenuItem
                        onSelect={(e) => {
                            e.preventDefault();
                            setIsSettingsOpen(true);
                        }}
                        className="p-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-slate-800"
                    >
                        <Settings className="mr-2 h-4 w-4 text-slate-500" />
                        <span className="flex-1">{t('nav.settings') || 'Settings'}</span>
                    </DropdownMenuItem>

                    {isAdmin && (
                        <>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-slate-800">
                                <Link to="/admin" className="flex items-center font-medium text-amber-600">
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    <span>Admin Console</span>
                                </Link>
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                        onSelect={() => {
                            const newMode = activeMode === 'personal' ? 'business' : 'personal';
                            if (newMode === 'business' && user?.role !== 'vendor' && user?.role !== 'service_provider') {
                                navigate('/business-registration');
                            } else {
                                setMode(newMode);
                                navigate(newMode === 'business' ? '/provider-dashboard' : '/app');
                            }
                        }}
                        className="p-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-slate-800"
                    >
                        <RefreshCw className="mr-2 h-4 w-4 text-blue-500" />
                        <span className="flex-1">Switch to {activeMode === 'personal' ? 'Business' : 'Personal'}</span>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild className="p-2 cursor-pointer rounded-md focus:bg-slate-50 dark:focus:bg-slate-800">
                        <Link to="/vendor-dashboard" className="flex items-center font-medium text-purple-600">
                            <Store className="mr-2 h-4 w-4" />
                            <span>Business Interface</span>
                        </Link>
                    </DropdownMenuItem>


                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem onSelect={handleLogout} className="p-2 cursor-pointer rounded-md focus:bg-red-50 text-red-600 focus:text-red-700">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('nav.logout') || 'Log out'}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dialog */}
            <UserSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </>
    );
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe, Bell, Moon, UserCog } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

function UserSettingsDialog({ open, onOpenChange }) {
    const { t, i18n } = useTranslation();
    const { setLanguage } = useLanguage();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t('nav.settings') || 'User Settings'}</DialogTitle>
                    <DialogDescription>
                        Manage your account preferences and settings.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4 py-4">
                        <div className="flex items-center justify-between space-x-2">
                            <Label htmlFor="language" className="flex flex-col space-y-1">
                                <span>Language</span>
                                <span className="font-normal text-xs text-muted-foreground">Select your preferred language</span>
                            </Label>
                            <div className="grid grid-cols-3 gap-2 border rounded-md p-2">
                                <Button
                                    variant={i18n.language === 'en' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('en')}
                                >
                                    🇺🇸 English
                                </Button>
                                <Button
                                    variant={i18n.language === 'he' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('he')}
                                >
                                    🇮🇱 עברית
                                </Button>
                                <Button
                                    variant={i18n.language === 'th' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('th')}
                                >
                                    🇹🇭 ไทย
                                </Button>
                                <Button
                                    variant={i18n.language === 'ru' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('ru')}
                                >
                                    🇷🇺 Русский
                                </Button>
                                <Button
                                    variant={i18n.language === 'fr' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('fr')}
                                >
                                    🇫🇷 Français
                                </Button>
                                <Button
                                    variant={i18n.language === 'de' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('de')}
                                >
                                    🇩🇪 Deutsch
                                </Button>
                                <Button
                                    variant={i18n.language === 'es' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('es')}
                                >
                                    🇪🇸 Español
                                </Button>
                                <Button
                                    variant={i18n.language === 'zh' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setLanguage('zh')}
                                >
                                    🇨🇳 中文
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between space-x-2 opacity-50 cursor-not-allowed">
                            <Label htmlFor="theme" className="flex flex-col space-y-1">
                                <span>Dark Mode</span>
                                <span className="font-normal text-xs text-muted-foreground">Switch between light and dark themes (Coming Soon)</span>
                            </Label>
                            {/* @ts-ignore */}
                            <Switch id="theme" disabled />
                        </div>
                    </TabsContent>

                    <TabsContent value="notifications" className="space-y-4 py-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg flex items-start gap-3">
                            <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Coming Soon</h4>
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                    Notification settings are currently under development. You will be notified when this feature is available.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 opacity-50 pointer-events-none">
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="email-notifs">Email Notifications</Label>
                                {/* @ts-ignore */}
                                <Switch id="email-notifs" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor="push-notifs">Push Notifications</Label>
                                {/* @ts-ignore */}
                                <Switch id="push-notifs" defaultChecked />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

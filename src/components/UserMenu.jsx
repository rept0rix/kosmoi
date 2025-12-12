
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { useAppConfig } from '@/components/AppConfigContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, Settings, LogOut, LayoutDashboard, Briefcase, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserMenu() {
    const { t } = useTranslation();
    const { user, signOut } = useAuth();
    const { config } = useAppConfig();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    if (!user) {
        return (
            <Link to="/login">
                <Button size="sm" variant="ghost">
                    {t('nav.login') || 'Login'}
                </Button>
            </Link>
        );
    }

    // Determine role based on config for now (Debug Role)
    // In real app, this would come from user metadata or claims
    const isAdmin = config.debugRole === 'admin';
    const isBusiness = config.debugRole === 'business';

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('nav.profile') || 'Profile'}</span>
                    </Link>
                </DropdownMenuItem>

                {isAdmin && (
                    <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer text-red-600 focus:text-red-600">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            <span>Admin Console</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                {isBusiness && (
                    <DropdownMenuItem asChild>
                        <Link to="/vendor-dashboard" className="cursor-pointer text-blue-600 focus:text-blue-600">
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Vendor Dashboard</span>
                        </Link>
                    </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500 focus:text-red-500">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('nav.logout') || 'Log out'}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

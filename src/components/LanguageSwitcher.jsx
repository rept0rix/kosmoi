import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const changeLanguage = (lng) => {
        // i18n.changeLanguage(lng); // Now handled by App.jsx -> LanguageContext sync

        const currentPath = location.pathname;
        const parts = currentPath.split('/').filter(Boolean); // Remove empty strings
        const langs = ['he', 'th', 'ru'];

        // Check if current path starts with a language prefix
        const firstPart = parts[0];
        const hasLangPrefix = langs.includes(firstPart);

        let newPathSegments = hasLangPrefix ? parts.slice(1) : parts;

        if (lng !== 'en') {
            newPathSegments = [lng, ...newPathSegments];
        }

        const newPath = '/' + newPathSegments.join('/');
        navigate(newPath + location.search + location.hash);
    };

    const getCurrentLabel = () => {
        switch (i18n.language) {
            case 'he': return '🇮🇱 HE';
            case 'th': return '🇹🇭 TH';
            default: return '🇺🇸 EN';
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="w-4 h-4" />
                    <span className="hidden sm:inline">{getCurrentLabel()}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => changeLanguage('en')}>
                    🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('he')}>
                    🇮🇱 Hebrew (עברית)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('th')}>
                    🇹🇭 Thai (ไทย)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

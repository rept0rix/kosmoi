import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        // Force direction change for Hebrew
        document.dir = lng === 'he' ? 'rtl' : 'ltr';
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

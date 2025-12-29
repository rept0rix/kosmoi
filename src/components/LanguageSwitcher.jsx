import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';
import { useLanguage } from '@/components/LanguageContext';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const { setLanguage } = useLanguage();

    const changeLanguage = (lng) => {
        setLanguage(lng);
    };

    const getCurrentLabel = () => {
        switch (i18n.language) {
            case 'he': return '🇮🇱 HE';
            case 'th': return '🇹🇭 TH';
            case 'ru': return '🇷🇺 RU';
            case 'fr': return '🇫🇷 FR';
            case 'es': return '🇪🇸 ES';
            case 'de': return '🇩🇪 DE';
            case 'zh': return '🇨🇳 CN';
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
                <DropdownMenuItem onSelect={() => changeLanguage('zh')}>
                    🇨🇳 Chinese (中文)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('ru')}>
                    🇷🇺 Russian (Русский)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('fr')}>
                    🇫🇷 French (Français)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('de')}>
                    🇩🇪 German (Deutsch)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('es')}>
                    🇪🇸 Spanish (Español)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => changeLanguage('th')}>
                    🇹🇭 Thai (ไทย)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

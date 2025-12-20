import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const usePageDirection = () => {
    const { i18n } = useTranslation();

    useEffect(() => {
        const dir = i18n.language === 'he' ? 'rtl' : 'ltr';
        document.dir = dir;
        document.documentElement.lang = i18n.language;
        document.documentElement.dir = dir;
    }, [i18n.language]);
};

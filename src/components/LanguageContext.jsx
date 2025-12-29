import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('appLanguage') || 'he';
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    const isRTL = language === 'he';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;

    import('../i18n').then(({ default: i18n }) => {
      if (i18n.language !== language) {
        i18n.changeLanguage(language);
      }
    });

    // Valid supported languages matching route definitions
    const supportedLangs = ['he', 'en', 'th', 'ru', 'fr', 'de', 'es', 'zh'];

    // Correctly update URL without stacking prefixes
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter(Boolean); // Remove empty strings

    // Check if first part is a language code
    if (pathParts.length > 0 && supportedLangs.includes(pathParts[0])) {
      if (pathParts[0] !== language) {
        // Replace existing language prefix
        pathParts[0] = language;
        const newPath = '/' + pathParts.join('/') + window.location.search;
        window.history.replaceState(null, '', newPath);
      }
    } else {
      // No language prefix present (root or other path)
      // If we are essentially at root or not in a lang path, we might want to prepend
      // BUT standard behavior in this app seems to be /lang/path for non-default?
      // Let's assume for now we only fix REPLACEMENT to stop stacking. 
      // If we are at /, we should probably go to /he/ or /en/ etc?
      // For now, let's strictly fix the stacking bug reported.

      const newPath = '/' + language + currentPath + window.location.search;
      // Only redirect if we are not at root logic which is handled by App.jsx LanguageRoot
      // Actually, App.jsx handles routing. This context might be fighting it.

      // BETTER APPROACH:
      // Let App.jsx/Router handle the structure, but we need to trigger navigation.
      // window.history.replaceState won't trigger React Router re-render necessarily if not used via navigate.
      // However, `setLanguage` updates state, which might trigger re-renders if used in Router.
    }

  }, [language]);

  const toggleLanguage = () => {
    const langs = ['he', 'en', 'th', 'ru'];
    const currentIndex = langs.indexOf(language);
    const nextIndex = (currentIndex + 1) % langs.length;
    setLanguage(langs[nextIndex]);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
import React, { createContext, useContext, useState, useEffect } from 'react';

const AppConfigContext = createContext(null);

export const useAppConfig = () => {
    const context = useContext(AppConfigContext);
    if (!context) {
        throw new Error('useAppConfig must be used within an AppConfigProvider');
    }
    return context;
};

export const AppConfigProvider = ({ children }) => {
    // Load initial state from localStorage or defaults
    const [config, setConfig] = useState(() => {
        const saved = localStorage.getItem('app_config');
        return saved ? JSON.parse(saved) : {
            appName: 'Kosmoi',
            themeColor: 'blue', // blue, red, green, purple, orange
            logoUrl: '/kosmoi_logo_blue.svg', // Default for light mode
            debugRole: 'user' // 'user', 'business', 'admin'
        };
    });

    // Persist to localStorage whenever config changes
    useEffect(() => {
        localStorage.setItem('app_config', JSON.stringify(config));

        // Apply theme color to document root for global CSS variables if needed
        // For now, we'll just use the config in components
        document.documentElement.style.setProperty('--primary-color', config.themeColor);
    }, [config]);

    const updateConfig = (newConfig) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
    };

    const resetConfig = () => {
        setConfig({
            appName: 'Kosmoi',
            themeColor: 'blue',
            logoUrl: null,
            debugRole: 'user'
        });
    };

    return (
        <AppConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
            {children}
        </AppConfigContext.Provider>
    );
};

import React, { createContext, useState, useContext, useEffect } from 'react';

const AppModeContext = createContext(null);

export const AppModeProvider = ({ children }) => {
    const [activeMode, setActiveMode] = useState(() => {
        return localStorage.getItem('app_mode') || 'personal';
    });

    const toggleMode = () => {
        const newMode = activeMode === 'personal' ? 'business' : 'personal';
        setActiveMode(newMode);
        localStorage.setItem('app_mode', newMode);
    };

    const setMode = (mode) => {
        if (mode === 'personal' || mode === 'business') {
            setActiveMode(mode);
            localStorage.setItem('app_mode', mode);
        }
    };

    return (
        <AppModeContext.Provider value={{ activeMode, toggleMode, setMode }}>
            {children}
        </AppModeContext.Provider>
    );
};

export const useAppMode = () => {
    const context = useContext(AppModeContext);
    if (!context) {
        throw new Error('useAppMode must be used within an AppModeProvider');
    }
    return context;
};

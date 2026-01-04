import React, { createContext, useContext, useState, useEffect } from 'react';

const UserProfileContext = createContext(null);

export const PROFILES = {
    TOURIST: 'tourist',
    NOMAD: 'nomad',
    RESIDENT: 'resident'
};

export const UserProfileProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(() => {
        return localStorage.getItem('userProfile') || PROFILES.TOURIST;
    });

    const [hasSelectedProfile, setHasSelectedProfile] = useState(() => {
        return !!localStorage.getItem('userProfile');
    });

    const setProfile = (profile) => {
        setUserProfile(profile);
        setHasSelectedProfile(true);
        localStorage.setItem('userProfile', profile);
    };

    const contextValue = React.useMemo(() => ({
        userProfile,
        setProfile,
        hasSelectedProfile,
        PROFILES
    }), [userProfile, hasSelectedProfile]);

    return (
        <UserProfileContext.Provider value={contextValue}>
            {children}
        </UserProfileContext.Provider>
    );
};

export const useUserProfile = () => {
    const context = useContext(UserProfileContext);
    if (!context) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';

const UserProfileContext = createContext();

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

    return (
        <UserProfileContext.Provider value={{ userProfile, setProfile, hasSelectedProfile, PROFILES }}>
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

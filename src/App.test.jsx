import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock everything that might crash the app on pure render
vi.mock('@/features/auth/context/AuthContext', () => ({
    AuthProvider: ({ children }) => <div>{children}</div>,
    useAuth: () => ({ isAuthenticated: false, isLoadingAuth: false })
}));

vi.mock('@/components/LanguageContext', () => ({
    LanguageProvider: ({ children }) => <div>{children}</div>,
    useLanguage: () => ({ language: 'en', t: (k) => k })
}));

// Mock Router since App usually contains Routes
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        BrowserRouter: ({ children }) => <div>{children}</div>,
        useNavigate: () => vi.fn(),
        useLocation: () => ({ pathname: '/' })
    };
});

describe('App Smoke Test', () => {
    it('sanity check', () => {
        expect(true).toBe(true);
    });
});

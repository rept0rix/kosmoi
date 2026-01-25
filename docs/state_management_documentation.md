# Application State Management Documentation

This document outlines the application state management strategy, focusing on authentication and routing.

## Overview

The application leverages React Context API, specifically the `AuthContext`, in conjunction with Supabase for managing user authentication. Routing is handled by `react-router-dom` and configured through `pages.config.js`.

## Key Components

### 1. `src/App.jsx`

*   **Purpose:** Sets up the main application structure.
*   **Routing:** Uses `react-router-dom` for navigation and defines routes based on `pages.config.js`.
*   **Providers:** Wraps the application with essential context providers:
    *   `AuthProvider`: Manages authentication state.
    *   `UserProfileProvider`: Manages user profile data.
    *   `LocationProvider`: Manages location-related data.
    *   `LanguageProvider`: Manages language settings.
    *   `AppConfigProvider`: Manages application-wide configuration.
    *   `RxDBProvider`: Manages the RxDB database.
    *   `QueryClientProvider`: Manages React Query client.
*   **Language Routing:** Implements language-specific routing (e.g., `/he/*` for Hebrew).
*   **Analytics:** Includes Vercel Speed Insights and Analytics for performance monitoring.

### 2. `src/features/auth/context/AuthContext.jsx`

*   **Purpose:** Provides authentication context and manages user authentication state.
*   **Authentication:** Uses Supabase for user authentication and database interactions.
*   **State Management:**
    *   `user`: Stores user data.
    *   `isAuthenticated`: Indicates whether the user is authenticated.
    *   `isLoadingAuth`: Indicates whether authentication is in progress.
    *   `isLoadingPublicSettings`:  Indicates whether public settings are loading (currently set to false).
    *   `authError`: Stores authentication errors.
    *   `appPublicSettings`: Stores public application settings.
*   **Lifecycle:** Listens for authentication state changes using `db.auth.onAuthStateChange`.
*   **Logic:**
    *   Handles optimistic authentication (checking for existing sessions).
    *   Bypasses authentication for public routes.
    *   Verifies user roles for protected routes.
*   **Functions:**
    *   `logout`: Logs the user out.
    *   `navigateToLogin`: Redirects the user to the login page.
*   **Activity Logging:** Uses `ActivityLogService` to log user login and logout actions.

## Authentication Flow

1.  The application checks for an existing session in local storage.
2.  If a session is found, the application attempts to refresh the session.
3.  If the session is valid, the user is authenticated.
4.  If no session is found or the session is invalid, the user is redirected to the login page.

## Protected Routes

Protected routes are implemented using `RequireRole` and `ProtectedAdminRoute`/`ProtectedUserRoute` components. These components check the user's role and authentication status before granting access to the route.

## Error Handling

The application handles authentication errors and displays appropriate error messages to the user.

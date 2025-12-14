# System Overview: Samui Service Hub

## 1. High-Level Architecture
- **Frontend**: React (Vite) single-page application.
- **Backend/Database**: Supabase (PostgreSQL + Auth + Storage).
- **State Management**: React Query (`@tanstack/react-query`) for server state, React Context for local global state (`AuthContext`, `AppConfigContext`).
- **Routing**: `react-router-dom` with a centralized configuration in `pages.config.js`.

## 2. Core Modules & Hierarchy

### A. Consumer Interface (Public/User)
- **Entry Points**: `Home` (/), `MapView` (/mapview).
- **Discovery**: `ServiceProviders`, `ServiceProviderDetails`, `TripPlanner`.
- **Interaction**: `AIChat` (AI Concierge), `RequestService`, `Contact`.
- **User Account**: `Profile`, `EditProfile`, `MyRequests`, `MyBookings`, `Favorites`, `MyReviews`.
- **Content**: `AboutUs`, `UseCases`, `Blog`, `Pricing`, Legal Pages.

### B. Provider Interface (Business)
- **Onboarding**: `BusinessLanding` (/business), `VendorSignup`.
- **Management**: `VendorLite` (/vendor), `BusinessDashboard`.
- **Profile**: `ProviderProfile` (/provider/:id).

### C. Administrative Interface (Admin)
- **Entry Points**: `CommandCenter` (/command-center), `BoardRoom` (/board-room).
- **Admin Dashboard** (`/admin/*`):
  - **Overview**: `AdminOverview`.
  - **Management**: `AdminUsers`, `AdminClaims`, `AdminAgents`, `AdminCompany`.
  - **Data/Analytics**: `AdminData`, `AdminCRM`, `AdminEvolution`, `AdminRoadmap`, `SystemMonitor`.
  - **Tools**: `AdminImporter`, `AdminCanvas`.

## 3. Data Architecture (Supabase)

### Key Tables
- `service_providers`: Core entity for businesses (stores location, rating, category).
- `reviews`: User feedback linked to providers.
- `favorites`: User-saved providers.
- `search_history`: Analytics for user search intent.
- `auth.users`: Managed by Supabase Auth (linked via `user_id`).

### Data Flow
1. **Authentication**: Handled by `AuthContext` wrapping the app. specific routes (`ProtectedAdminRoute`, `ProtectedUserRoute`) guard access.
2. **Data Fetching**: `src/api/supabaseClient.js` initializes the connection. React Query hooks (likely in `src/hooks` or `src/services`) manage data fetching and caching.
3. **Real-time**: Supabase subscriptions are likely used for `AIChat` or live updates (indicated by `SystemMonitor`).

## 4. Key Configurations
- **Routing**: `src/pages.config.js` maps string keys to Component imports, allowing dynamic route generation.
- **Styling**: Tailwind CSS configured via `tailwind.config.js`.
- **Environment**: Vite environment variables for Supabase keys.

## 5. Observations & Recommendations
- **Hybrid Routing**: The app uses both hardcoded routes in `App.jsx` and a dynamic loop over `Pages` from config. Ensure no collision occurs.
- **MapView**: `MapView` is rendered persistently (`display: none` when inactive) to preserve map state/context, which is a critical performance optimization.
- **Legacy/Alias**: "Welcome" maps to `BusinessLanding`, indicating a shift in terminology or focus.

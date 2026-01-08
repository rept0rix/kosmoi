import Home from './pages/Home';
import WalletPage from './pages/WalletPage';
import ProviderDashboard from './pages/ProviderDashboard';
import RealEstateHub from './pages/RealEstateHub';
import ExperiencesHub from './pages/ExperiencesHub';
import ExperienceDetails from './pages/ExperienceDetails';
import BusinessLanding from './pages/BusinessLanding';
import Dashboard from './pages/Dashboard';
import ServiceProviders from './pages/ServiceProviders';
import ServiceProviderDetails from './pages/ServiceProviderDetails';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import BusinessRegistration from './features/vendors/pages/BusinessRegistration';
import BusinessDashboard from './features/vendors/pages/BusinessDashboard';
import EditProfile from './pages/EditProfile';
import Favorites from './pages/Favorites';
import MyReviews from './pages/MyReviews';
import RecentSearches from './pages/RecentSearches';
import Login from './features/auth/pages/Login';
import UpdatePassword from './features/auth/pages/UpdatePassword';
import CompleteSignup from './features/auth/pages/CompleteSignup';
import AdminImporter from './pages/AdminImporter';
import RequestService from './pages/RequestService';
import MyRequests from './pages/MyRequests';
import LeadBoard from './features/leads/pages/LeadBoard';
import AIChat from './pages/AIChat';
import SeedData from './pages/SeedData';
import Diagnostics from './pages/Diagnostics';
import TripPlanner from './pages/TripPlanner';
import BoardRoom from './pages/BoardRoom';
import BusinessInfo from './pages/BusinessInfo';
import Team from './pages/Team';
import AgentChat from './features/agents/pages/AgentChat';
import CommandCenter from './features/agents/pages/CommandCenter';
import AdminAgents from './features/agents/pages/AdminAgents';
import CRMDashboard from './pages/admin/CRMDashboard';
import AdminInfra from './pages/admin/AdminInfra';
import Blog from './pages/Blog';
import BlogPostDetail from './pages/BlogPostDetail';
import Support from './pages/Support'; // New Support Page
import __Layout from './Layout.jsx';
import { lazy } from 'react';

// Wallet Pages
import WalletScan from './pages/wallet/Scan';
import WalletSend from './pages/wallet/Send';
import WalletReceive from './pages/wallet/Receive';
import WalletCard from './pages/wallet/Card';


export const PAGES = {
    "Home": Home,       // Root / (Consumer)
    "Wallet": WalletPage, // /wallet (Kosmoi Pay)
    "ProviderDashboard": ProviderDashboard, // /provider-dashboard (Drivers)
    "RealEstate": RealEstateHub, // /real-estate (Zillow Style)
    "Experiences": ExperiencesHub, // /experiences (GetYourGuide Style)
    "ExperienceDetails": ExperienceDetails, // /experiences/:id
    "Business": BusinessLanding, // /business (Provider)
    "App": Dashboard,    // Main App Dashboard
    "Dashboard": Dashboard, // Keep alias for backward compat if needed
    "Welcome": BusinessLanding, // Keeping Welcome as Business for now, or maybe alias to Home? Let's alias to Business as that was the old Welcome context.
    "BusinessInfo": BusinessInfo, // Added
    "Team": Team, // Added
    // Wallet Sub-pages
    "WalletScan": WalletScan,
    "WalletSend": WalletSend,
    "WalletReceive": WalletReceive,
    "WalletCard": WalletCard,
    "ServiceProviders": ServiceProviders,
    "ServiceProviderDetails": ServiceProviderDetails,
    "MapView": MapView,
    "Profile": Profile,
    "BusinessRegistration": BusinessRegistration,
    "BusinessDashboard": BusinessDashboard,
    "EditProfile": EditProfile,
    "Favorites": Favorites,
    "MyReviews": MyReviews,
    "RecentSearches": RecentSearches,
    "Login": Login,
    "UpdatePassword": UpdatePassword, // Added
    "CompleteSignup": CompleteSignup,
    "AdminImporter": AdminImporter,
    "RequestService": RequestService,
    "MyRequests": MyRequests,
    "LeadBoard": LeadBoard,
    "AIChat": AIChat,
    "AgentChat": AgentChat, // Public Agent Chat
    "SeedData": SeedData,
    "Diagnostics": Diagnostics,
    "TripPlanner": TripPlanner,
    "BoardRoom": BoardRoom,
    "CommandCenter": CommandCenter,
    "Blog": Blog,
    "BlogPostDetail": BlogPostDetail,
    "AdminWiki": lazy(() => import('./pages/admin/AdminWiki')),
    "Support": Support, // Added Support Page
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
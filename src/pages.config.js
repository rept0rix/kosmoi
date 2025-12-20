import Home from './pages/Home';
import WalletPage from './pages/WalletPage';
import ProviderDashboard from './pages/ProviderDashboard';
import RealEstateHub from './pages/RealEstateHub';
import ExperiencesHub from './pages/ExperiencesHub';
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
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,       // Root / (Consumer)
    "Wallet": WalletPage, // /wallet (Kosmoi Pay)
    "ProviderDashboard": ProviderDashboard, // /provider-dashboard (Drivers)
    "RealEstate": RealEstateHub, // /real-estate (Zillow Style)
    "Experiences": ExperiencesHub, // /experiences (GetYourGuide Style)
    "Business": BusinessLanding, // /business (Provider)
    "App": Dashboard,    // Main App Dashboard
    "Dashboard": Dashboard, // Keep alias for backward compat if needed
    "Welcome": BusinessLanding, // Keeping Welcome as Business for now, or maybe alias to Home? Let's alias to Business as that was the old Welcome context.
    "BusinessInfo": BusinessInfo, // Added
    "Team": Team, // Added
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
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
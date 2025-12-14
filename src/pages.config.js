import Home from './pages/Home';
import BusinessLanding from './pages/BusinessLanding';
import Dashboard from './pages/Dashboard';
import ServiceProviders from './pages/ServiceProviders';
import ServiceProviderDetails from './pages/ServiceProviderDetails';
import MapView from './pages/MapView';
import Profile from './pages/Profile';
import BusinessRegistration from './pages/BusinessRegistration';
import BusinessDashboard from './pages/BusinessDashboard';
import EditProfile from './pages/EditProfile';
import Favorites from './pages/Favorites';
import MyReviews from './pages/MyReviews';
import RecentSearches from './pages/RecentSearches';
import Login from './pages/Login';
import AdminImporter from './pages/AdminImporter';
import RequestService from './pages/RequestService';
import MyRequests from './pages/MyRequests';
import LeadBoard from './pages/LeadBoard';
import AIChat from './pages/AIChat';
import SeedData from './pages/SeedData';
import Diagnostics from './pages/Diagnostics';
import TripPlanner from './pages/TripPlanner';
import BoardRoom from './pages/BoardRoom';
import BusinessInfo from './pages/BusinessInfo';
import Team from './pages/Team';
import CommandCenter from './pages/CommandCenter';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,       // Root / (Consumer)
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
    "SeedData": SeedData,
    "Diagnostics": Diagnostics,
    "TripPlanner": TripPlanner,
    "BoardRoom": BoardRoom,
    "CommandCenter": CommandCenter,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
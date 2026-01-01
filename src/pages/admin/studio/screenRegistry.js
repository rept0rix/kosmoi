import { lazy } from 'react';

// --- Auth & Features ---
const Login = lazy(() => import('@/features/auth/pages/Login'));
const VendorSignup = lazy(() => import('@/features/vendors/pages/Signup'));
const BusinessRegistration = lazy(() => import('@/features/vendors/pages/BusinessRegistration'));
const BusinessDashboard = lazy(() => import('@/features/vendors/pages/BusinessDashboard'));

// --- Core Pages ---
const Home = lazy(() => import('@/pages/Home'));
const AboutUs = lazy(() => import('@/pages/AboutUs'));

const Pricing = lazy(() => import('@/pages/Pricing'));
const Contact = lazy(() => import('@/pages/Contact'));
const Blog = lazy(() => import('@/pages/Blog'));
const BlogPostDetail = lazy(() => import('@/pages/BlogPostDetail'));
const UseCases = lazy(() => import('@/pages/UseCases'));
const Team = lazy(() => import('@/pages/Team'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// --- Legal ---
const Privacy = lazy(() => import('@/pages/legal/Privacy'));
const Terms = lazy(() => import('@/pages/legal/Terms'));
const Accessibility = lazy(() => import('@/pages/legal/Accessibility'));

// --- User App ---
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const EditProfile = lazy(() => import('@/pages/EditProfile'));
const WalletPage = lazy(() => import('@/pages/WalletPage'));
const MyBookings = lazy(() => import('@/pages/MyBookings'));
const MyRequests = lazy(() => import('@/pages/MyRequests'));
const MyReviews = lazy(() => import('@/pages/MyReviews'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const RecentSearches = lazy(() => import('@/pages/RecentSearches'));

// --- Features ---
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const ServiceProviders = lazy(() => import('@/pages/ServiceProviders'));
const ServiceProviderDetails = lazy(() => import('@/pages/ServiceProviderDetails'));
const RequestService = lazy(() => import('@/pages/RequestService'));
const RealEstateHub = lazy(() => import('@/pages/RealEstateHub'));
const TripPlanner = lazy(() => import('@/pages/TripPlanner'));
const ExperiencesHub = lazy(() => import('@/pages/ExperiencesHub'));
const MapView = lazy(() => import('@/pages/MapView'));

// --- Business / Provider ---
const ProviderDashboard = lazy(() => import('@/pages/ProviderDashboard'));
const ProviderProfile = lazy(() => import('@/pages/ProviderProfile'));
const BusinessLanding = lazy(() => import('@/pages/BusinessLanding'));
const BusinessInfo = lazy(() => import('@/pages/BusinessInfo'));
const VendorLite = lazy(() => import('@/pages/VendorLite'));
const LeadBoard = lazy(() => import('@/features/leads/pages/LeadBoard'));

// --- AI & Agents ---
const CommandCenter = lazy(() => import('@/features/agents/pages/CommandCenter'));
const AgentCommandCenter = lazy(() => import('@/features/agents/pages/AgentCommandCenter'));
const BoardRoom = lazy(() => import('@/pages/BoardRoom'));
const AIChat = lazy(() => import('@/pages/AIChat'));
const AgentChat = lazy(() => import('@/features/agents/pages/AgentChat'));
const LocalBrain = lazy(() => import('@/pages/LocalBrain'));
const Diagnostics = lazy(() => import('@/pages/Diagnostics'));

// --- Admin Pages ---
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminAgents = lazy(() => import('@/features/agents/pages/AdminAgents'));
const AdminBusinesses = lazy(() => import('@/pages/admin/AdminBusinesses'));
const AdminCRM = lazy(() => import('@/pages/admin/AdminCRM')); // or CRMDashboard?
// const CRMDashboard = lazy(() => import('@/pages/admin/CRMDashboard')); // Potential duplicate or sub-view
const AdminCompany = lazy(() => import('@/pages/admin/AdminCompany'));
const AdminInfra = lazy(() => import('@/pages/admin/AdminInfra'));
const AdminClaims = lazy(() => import('@/pages/admin/AdminClaims'));
const AdminData = lazy(() => import('@/pages/admin/AdminData'));
const AdminKanban = lazy(() => import('@/pages/admin/AdminKanban'));
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs'));
const AdminOptimizer = lazy(() => import('@/pages/admin/AdminOptimizer'));
const AdminRoadmap = lazy(() => import('@/pages/admin/AdminRoadmap'));
const AdminSitemap = lazy(() => import('@/pages/admin/AdminSitemap'));
const SystemMap = lazy(() => import('@/pages/admin/SystemMap'));


export const screenRegistry = {
    // --- Auth ---
    'login': { component: Login, name: 'Login' },
    'vendor-signup': { component: VendorSignup, name: 'Vendor Signup' },
    'business-registration': { component: BusinessRegistration, name: 'Business Reg' },
    'business-dashboard': { component: BusinessDashboard, name: 'Business Dash' },

    // --- Core ---
    'home': { component: Home, name: 'Home' },

    'about': { component: AboutUs, name: 'About Us' },
    'pricing': { component: Pricing, name: 'Pricing' },
    'contact': { component: Contact, name: 'Contact' },
    'blog': { component: Blog, name: 'Blog' },
    'blog-detail': { component: BlogPostDetail, name: 'Blog Detail' },
    'use-cases': { component: UseCases, name: 'Use Cases' },
    'team': { component: Team, name: 'Team' },
    'not-found': { component: NotFound, name: '404 Not Found' },

    // --- Legal ---
    'privacy': { component: Privacy, name: 'Privacy Policy' },
    'terms': { component: Terms, name: 'Terms of Service' },
    'accessibility': { component: Accessibility, name: 'Accessibility' },

    // --- User App ---
    'dashboard': { component: Dashboard, name: 'Main Dashboard' },
    'profile': { component: Profile, name: 'My Profile' },
    'edit-profile': { component: EditProfile, name: 'Edit Profile' },
    'wallet': { component: WalletPage, name: 'Wallet' },
    'bookings': { component: MyBookings, name: 'My Bookings' },
    'requests': { component: MyRequests, name: 'My Requests' },
    'reviews': { component: MyReviews, name: 'My Reviews' },
    'favorites': { component: Favorites, name: 'Favorites' },
    'recent-searches': { component: RecentSearches, name: 'Recent Searches' },

    // --- Features ---
    'marketplace': { component: Marketplace, name: 'Marketplace' },
    'service-providers': { component: ServiceProviders, name: 'Service Providers' },
    'provider-details': { component: ServiceProviderDetails, name: 'Provider Details' },
    'request-service': { component: RequestService, name: 'Request Service' },
    'real-estate': { component: RealEstateHub, name: 'Real Estate' },
    'trip-planner': { component: TripPlanner, name: 'Trip Planner' },
    'experiences': { component: ExperiencesHub, name: 'Experiences' },
    'map-view': { component: MapView, name: 'Map View' },

    // --- Business / Provider ---
    'provider-dashboard': { component: ProviderDashboard, name: 'Provider Dash' },
    'provider-profile': { component: ProviderProfile, name: 'Provider Profile' },
    'business-landing': { component: BusinessLanding, name: 'Business Landing' },
    'business-info': { component: BusinessInfo, name: 'Business Info' },
    'vendor-lite': { component: VendorLite, name: 'Vendor Lite' },
    'lead-board': { component: LeadBoard, name: 'Lead Board' },

    // --- AI & Agents ---
    'command-center': { component: CommandCenter, name: 'Command Center' },
    'agent-command': { component: AgentCommandCenter, name: 'Agent Command' },
    'board-room': { component: BoardRoom, name: 'Board Room' },
    'ai-chat': { component: AIChat, name: 'AI Chat' },
    'agent-chat': { component: AgentChat, name: 'Agent Chat' },
    'local-brain': { component: LocalBrain, name: 'Local Brain' },
    'diagnostics': { component: Diagnostics, name: 'Diagnostics' },

    // --- Admin ---
    'admin-dashboard': { component: AdminDashboard, name: 'Admin Dashboard' },
    'admin-users': { component: AdminUsers, name: 'Admin Users' },
    'admin-agents': { component: AdminAgents, name: 'Admin Agents' },
    'admin-businesses': { component: AdminBusinesses, name: 'Admin Businesses' },
    'admin-crm': { component: AdminCRM, name: 'Admin CRM' },
    'admin-company': { component: AdminCompany, name: 'Admin Company' },
    'admin-infra': { component: AdminInfra, name: 'Admin Infra' },
    'admin-claims': { component: AdminClaims, name: 'Admin Claims' },
    'admin-data': { component: AdminData, name: 'Admin Data' },
    'admin-kanban': { component: AdminKanban, name: 'Admin Kanban' },
    'admin-logs': { component: AdminLogs, name: 'Admin Logs' },
    'admin-optimizer': { component: AdminOptimizer, name: 'Admin Optimizer' },
    'admin-roadmap': { component: AdminRoadmap, name: 'Admin Roadmap' },
    'admin-sitemap': { component: AdminSitemap, name: 'Admin Sitemap' },
    'system-map': { component: SystemMap, name: 'System Map' },
};

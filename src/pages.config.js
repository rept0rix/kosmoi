import { lazy } from "react";
const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./features/auth/pages/Login"));
const MapView = lazy(() => import("./pages/MapView"));
import __Layout from "./Layout.jsx";
import React from "react";

// Real page imports
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Favorites = lazy(() => import("./pages/Favorites"));
const BoardRoom = lazy(() => import("./pages/BoardRoom"));
const ServiceProviders = lazy(() => import("./pages/ServiceProviders"));
const ServiceProviderDetails = lazy(
  () => import("./pages/ServiceProviderDetails"),
);
const RequestService = lazy(() => import("./pages/RequestService"));
const CompleteSignup = lazy(
  () => import("./features/auth/pages/CompleteSignup"),
);

// Safe fallback for pages still in development
const SafePage = () =>
  React.createElement(
    "div",
    { style: { padding: 50, color: "green", fontSize: 24 } },
    "Page Under Maintenance (Safe Mode)",
  );

export const PAGES = {
  Home: Home,
  Dashboard: Dashboard,
  App: Dashboard,
  Login: Login,
  MapView: MapView,
  Profile: Profile,
  EditProfile: EditProfile,
  Favorites: Favorites,
  BoardRoom: BoardRoom,
  // Still in safe mode:
  Wallet: SafePage,
  ProviderDashboard: SafePage,
  RealEstate: SafePage,
  Experiences: SafePage,
  Wellness: SafePage,
  Transport: SafePage,
  ExperienceDetails: SafePage,
  Business: SafePage,
  Welcome: SafePage,
  BusinessInfo: SafePage,
  Team: SafePage,
  WalletScan: SafePage,
  WalletSend: SafePage,
  WalletReceive: SafePage,
  WalletCard: SafePage,
  ServiceProviders: ServiceProviders,
  ServiceProviderDetails: ServiceProviderDetails,
  BusinessRegistration: SafePage,
  BusinessDashboard: SafePage,
  MyReviews: SafePage,
  RecentSearches: SafePage,
  UpdatePassword: SafePage,
  CompleteSignup: CompleteSignup,
  AdminImporter: SafePage,
  RequestService: RequestService,
  MyRequests: SafePage,
  LeadBoard: SafePage,
  AIChat: lazy(() => import("./pages/AIChat")),
  AgentChat: SafePage,
  SeedData: SafePage,
  Diagnostics: SafePage,
  TripPlanner: SafePage,
  CommandCenter: SafePage,
  Blog: SafePage,
  BlogPostDetail: SafePage,
  AdminWiki: SafePage,
};

export const pagesConfig = {
  Pages: PAGES,
  Layout: __Layout,
  mainPage: "Home",
};

export default pagesConfig;

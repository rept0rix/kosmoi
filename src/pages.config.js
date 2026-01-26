import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./features/auth/pages/Login";
import MapView from "./pages/MapView";
import __Layout from "./Layout.jsx";
import React from "react";

// Real page imports
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Favorites from "./pages/Favorites";
import BoardRoom from "./pages/BoardRoom";

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
  ServiceProviders: SafePage,
  ServiceProviderDetails: SafePage,
  BusinessRegistration: SafePage,
  BusinessDashboard: SafePage,
  MyReviews: SafePage,
  RecentSearches: SafePage,
  UpdatePassword: SafePage,
  CompleteSignup: SafePage,
  AdminImporter: SafePage,
  RequestService: SafePage,
  MyRequests: SafePage,
  LeadBoard: SafePage,
  AIChat: SafePage,
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

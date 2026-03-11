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
import ServiceProviders from "./pages/ServiceProviders";
import ServiceProviderDetails from "./pages/ServiceProviderDetails";
import RequestService from "./pages/RequestService";
import CompleteSignup from "./features/auth/pages/CompleteSignup";
import AIChat from "./pages/AIChat";
import TripPlannerPage from "./pages/TripPlanner";
import Blog from "./pages/Blog";

// Safe fallback for pages still in development — styled "Coming Soon"
const SafePage = () =>
  React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #020617 50%, #0f172a 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: "2rem",
        textAlign: "center",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          width: 80,
          height: 80,
          borderRadius: 20,
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          marginBottom: 24,
          boxShadow: "0 0 40px rgba(124,58,237,0.3)",
        },
      },
      "🚧",
    ),
    React.createElement(
      "h1",
      {
        style: {
          fontSize: 32,
          fontWeight: 700,
          background: "linear-gradient(to right, #a78bfa, #f472b6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          margin: "0 0 12px 0",
        },
      },
      "Coming Soon",
    ),
    React.createElement(
      "p",
      {
        style: {
          fontSize: 16,
          color: "#94a3b8",
          maxWidth: 400,
          lineHeight: 1.6,
          margin: "0 0 32px 0",
        },
      },
      "This feature is currently under development. Check back soon!",
    ),
    React.createElement(
      "a",
      {
        href: "/",
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 24px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.05)",
          color: "#e2e8f0",
          fontSize: 14,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
          transition: "all 0.2s",
        },
      },
      "← Back to Home",
    ),
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
  AIChat: AIChat,
  AgentChat: SafePage,
  SeedData: SafePage,
  Diagnostics: SafePage,
  TripPlanner: TripPlannerPage,
  CommandCenter: SafePage,
  Blog: Blog,
  BlogPostDetail: SafePage,
  AdminWiki: SafePage,
};

export const pagesConfig = {
  Pages: PAGES,
  Layout: __Layout,
  mainPage: "Home",
};

export default pagesConfig;

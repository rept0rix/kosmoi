import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutDashboard,
  Calendar,
  History,
  Heart,
  Trophy,
  Sparkles,
  Command,
} from "lucide-react";

// Feature Components
import OrganizerOverview from "@/features/organizer/components/OrganizerOverview";
import TripPlanner from "./TripPlanner";
import MyBookings from "./MyBookings";
import Favorites from "./Favorites";
import GoalsTab from "@/features/organizer/components/GoalsTab";

// Hooks
import { useOrganizer } from "@/shared/hooks/useOrganizer";

export default function Organizer() {
  const { t } = useTranslation();
  const { activeTrip, loading, actions } = useOrganizer();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans animate-in fade-in duration-500 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-['Outfit'] text-slate-900 dark:text-white flex items-center gap-3">
              <Command className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {t("organizer.title") || "Command Center"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t("organizer.subtitle") ||
                "Your central hub for planning your Samui adventure"}
            </p>
          </div>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto">
            <TabsTrigger
              value="overview"
              className="h-12 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              className="h-12 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">My Plan</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="h-12 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
            >
              <History className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">History</span>
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="h-12 data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
            >
              <Heart className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Collections</span>
            </TabsTrigger>
            <TabsTrigger
              value="goals"
              className="h-12 data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all"
            >
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Goals</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content Areas */}
          <div className="min-h-[500px]">
            {/* Overview Tab */}
            <TabsContent
              value="overview"
              className="mt-0 focus-visible:outline-none"
            >
              <OrganizerOverview
                activeTrip={activeTrip}
                onNavigate={(tab) => setActiveTab(tab)}
              />
            </TabsContent>

            <TabsContent
              value="plan"
              className="mt-0 focus-visible:outline-none data-[state=active]:animate-in data-[state=active]:fade-in data-[state=active]:slide-in-from-bottom-2 duration-500"
            >
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                <TripPlanner
                  activeTrip={activeTrip}
                  onAddItem={actions.addItemToTrip}
                  onRemoveItem={actions.removeItemFromTrip}
                  onCreateTrip={actions.createTrip}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="history"
              className="mt-0 focus-visible:outline-none"
            >
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm min-h-[60vh]">
                <MyBookings />
              </div>
            </TabsContent>

            <TabsContent
              value="collections"
              className="mt-0 focus-visible:outline-none"
            >
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm min-h-[60vh]">
                <Favorites onAddToTrip={actions.addItemToTrip} />
              </div>
            </TabsContent>

            <TabsContent
              value="goals"
              className="mt-0 focus-visible:outline-none"
            >
              <div className="max-w-2xl mx-auto pt-4">
                <GoalsTab />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

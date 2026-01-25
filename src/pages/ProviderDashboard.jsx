import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MapPin from "lucide-react/icons/map-pin";
import Navigation from "lucide-react/icons/navigation";
import CreditCard from "lucide-react/icons/credit-card";
import Zap from "lucide-react/icons/zap";
import LayoutGrid from "lucide-react/icons/layout-grid";
import MapIcon from "lucide-react/icons/map";
import ImageIcon from "lucide-react/icons/image";
import Loader2 from "lucide-react/icons/loader-2";
import Bot from "lucide-react/icons/bot";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import GoogleMap from "@/components/GoogleMap";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/api/supabaseClient";
import PricingModal from "@/components/payments/PricingModal";
import { StripeService } from "@/services/payments/StripeService";

const CalendarView = React.lazy(() => import("@/pages/vendor/CalendarView"));
const EditProfileDialog = React.lazy(
  () => import("@/components/dashboard/EditProfileDialog"),
);
const StatsOverview = React.lazy(
  () => import("@/components/dashboard/StatsOverview"),
);
import { FinanceView } from "@/features/vendors/components/FinanceView";
import { ReceptionistConfig } from "@/features/vendors/components/ReceptionistConfig";

const ServicesView = ({ provider }) => {
  if (!provider?.price_packages || provider.price_packages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">No services listed</p>
        <p className="text-sm">Edit your profile to add service packages.</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
      {provider.price_packages.map((pkg, idx) => (
        <Card
          key={idx}
          className="p-6 relative group hover:shadow-md transition-all bg-white border-slate-200"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-slate-900 text-lg">{pkg.title}</h3>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-600 bg-blue-50"
            >
              {pkg.price}
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mb-4 line-clamp-2">
            {pkg.description}
          </p>
          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-600 border border-slate-200"
            >
              Package
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
};

const GalleryView = ({ provider }) => {
  if (!provider?.images || provider.images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
        <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">No images uploaded</p>
        <p className="text-sm">Add photos to your gallery in Edit Profile.</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
      {provider.images.map((img, idx) => (
        <Card
          key={idx}
          className="p-0 relative aspect-square overflow-hidden group border-slate-200"
        >
          <img
            src={img}
            alt={`Gallery ${idx}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </Card>
      ))}
    </div>
  );
};

export default function ProviderDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [incomingJob, setIncomingJob] = useState(null);
  const [viewMode, setViewMode] = useState("map");
  const { toast } = useToast();
  const [providerProfile, setProviderProfile] = useState(null);

  // Pricing Modal State
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    StripeService.getSubscription().then(setSubscription);
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("service_providers")
          .select("*")
          .or(`id.eq.${user.id},owner_id.eq.${user.id}`)
          .maybeSingle();

        if (data) setProviderProfile(data);
        if (error) console.error("Error fetching profile:", error);
      }
    } catch (error) {
      console.error("Critical Profile Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleOnlineStatus = async (val) => {
    setIsOnline(val);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("service_providers")
        .update({
          is_online: val,
          last_seen: new Date().toISOString(),
          ...(userLocation
            ? {
                current_lat: userLocation.lat,
                current_lng: userLocation.lng,
              }
            : {}),
        })
        .eq("owner_id", user.id);

      if (error) {
        console.error("Failed to update status", error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Could not sync status.",
        });
        setIsOnline(!val);
      } else {
        if (val)
          toast({
            title: "You are Online 🟢",
            description: "Waiting for requests...",
          });
        else
          toast({
            title: "You are Offline ⚫",
            description: "You will not receive jobs.",
          });
      }
    } catch (e) {
      console.error(e);
      setIsOnline(!val);
    }
  };

  const handleAcceptJob = async () => {
    if (!incomingJob || !providerProfile) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Update Database
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: "accepted",
          provider_id: providerProfile.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", incomingJob.id);

      if (error) throw error;

      // 2. Update UI
      setIncomingJob(null);
      toast({
        title: "Job Accepted! 🚀",
        description: "Navigating to customer location...",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Failed to accept job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not accept job. It may have been taken.",
      });
    }
  };

  // Earnings State
  const [dailyEarnings, setDailyEarnings] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!providerProfile?.owner_id) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", providerProfile.owner_id)
        .single();

      if (!wallet) return;

      const { data } = await supabase
        .from("transactions")
        .select("amount")
        .eq("wallet_id", wallet.id)
        .eq("type", "earning")
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      if (data) {
        const total = data.reduce(
          (sum, txn) => sum + (Number(txn.amount) || 0),
          0,
        );
        setDailyEarnings(total);
      }
    };
    fetchEarnings();
  }, [providerProfile]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-60px)] relative flex flex-col bg-slate-50 overflow-hidden">
      {/* --- Top Bar (Status) --- */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-6 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {/* Business Header */}
            {providerProfile && (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                  {providerProfile.logo_url ? (
                    <img
                      src={providerProfile.logo_url}
                      alt="Logo"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm">
                      {providerProfile.business_name
                        ?.substring(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-slate-900 font-bold text-xl leading-none">
                    {providerProfile.business_name || "My Business"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`h-5 text-[10px] px-2 border ${isOnline ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                    >
                      {isOnline ? "ONLINE" : "OFFLINE"}
                    </Badge>
                    <Switch
                      checked={isOnline}
                      onCheckedChange={toggleOnlineStatus}
                      className="scale-75 origin-left"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {providerProfile && (
                <React.Suspense fallback={null}>
                  <EditProfileDialog
                    provider={providerProfile}
                    onUpdate={fetchProfile}
                  />
                </React.Suspense>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-lg w-full md:w-fit overflow-x-auto no-scrollbar gap-1">
              {[
                { id: "map", icon: MapIcon, label: "Dispatch" },
                { id: "calendar", icon: CalendarIcon, label: "Schedule" },
                { id: "services", icon: LayoutGrid, label: "Services" },
                { id: "gallery", icon: ImageIcon, label: "Gallery" },
                { id: "stats", icon: Zap, label: "Analytics" },
                { id: "finance", icon: CreditCard, label: "Finance" },
                { id: "agents", icon: Bot, label: "Agents" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`
                                        flex items-center px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                                        ${
                                          viewMode === tab.id
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                                        }
                                    `}
                  onClick={() => setViewMode(tab.id)}
                >
                  <tab.icon className="w-3 h-3 mr-1.5" />{" "}
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Earnings & Pro Badge */}
          <div className="flex flex-row md:flex-col gap-2 items-center md:items-end w-full md:w-auto justify-between md:justify-start">
            <Card className="p-2 px-4 text-right bg-white border-slate-200 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                Today's Earnings
              </p>
              <p className="text-xl font-bold text-slate-900 tracking-tight">
                ฿ {dailyEarnings.toLocaleString()}
              </p>
            </Card>

            {!subscription && (
              <PricingModal
                trigger={
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  >
                    <Zap className="w-4 h-4 mr-1 text-yellow-300 fill-yellow-300" />
                    <span className="font-bold">UPGRADE PRO</span>
                  </Button>
                }
              />
            )}
            {subscription && (
              <Badge className="bg-blue-50 text-blue-600 border-blue-200">
                PRO PARTNER
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* --- Main Content Layer --- */}
      <div className="flex-1 w-full h-full pt-48 md:pt-36">
        {viewMode === "map" && (
          <div className="w-full h-full relative">
            <div className="absolute inset-0">
              <GoogleMap
                center={userLocation || { lat: 9.512, lng: 100.052 }}
                zoom={15}
                height="100%"
                userLocation={userLocation}
                markers={
                  incomingJob
                    ? [
                        {
                          lat: incomingJob.location.lat,
                          lng: incomingJob.location.lng,
                          title: "Job Location",
                          icon: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
                        },
                      ]
                    : []
                }
                options={{ disableDefaultUI: true }}
              />
            </div>
          </div>
        )}

        {viewMode === "services" && (
          <div className="h-full bg-slate-50 overflow-y-auto pt-4">
            <ServicesView provider={providerProfile} />
          </div>
        )}

        {viewMode === "gallery" && (
          <div className="h-full bg-slate-50 overflow-y-auto pt-4">
            <GalleryView provider={providerProfile} />
          </div>
        )}

        {viewMode === "calendar" && (
          <div className="h-full bg-slate-50 overflow-y-auto pt-4">
            <React.Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" />
                </div>
              }
            >
              <CalendarView />
            </React.Suspense>
          </div>
        )}

        {viewMode === "stats" && (
          <div className="h-full bg-slate-50 overflow-y-auto p-6 pt-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 font-sans">
              Performance Analytics
            </h2>
            <React.Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="animate-spin text-blue-600" />
                </div>
              }
            >
              <StatsOverview provider={providerProfile} />
            </React.Suspense>

            <Card className="p-12 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 mt-6 md:mt-0 font-mono text-xs shadow-none bg-slate-50">
              // ADVANCED METRICS MODULE COMING SOON
            </Card>
          </div>
        )}

        {viewMode === "finance" && (
          <div className="h-full bg-slate-50 overflow-y-auto pt-4">
            <FinanceView provider={providerProfile} />
          </div>
        )}

        {viewMode === "agents" && (
          <div className="h-full bg-slate-50 overflow-y-auto pt-4 p-4 sm:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 font-sans">
              AI Workforce
            </h2>
            <div className="space-y-6">
              <ReceptionistConfig provider={providerProfile} />

              <div className="opacity-50 pointer-events-none filter blur-[1px]">
                <Card className="border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="text-slate-400 font-mono">
                      SALES_SCOUT_UNIT (Coming Soon)
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      Automated lead generation protocol.
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Bottom Sheet (Incoming Job) --- */}
      <AnimatePresence>
        {incomingJob &&
          incomingJob.status !== "accepted" &&
          viewMode === "map" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-slate-200"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Badge
                    variant="outline"
                    className="mb-2 border-blue-200 text-blue-600 bg-blue-50"
                  >
                    NEW JOB REQUEST
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1 font-sans">
                    {incomingJob.service}
                  </h2>
                  <p className="text-slate-500 flex items-center gap-2 font-mono text-sm">
                    <MapPin size={16} className="text-blue-500" />{" "}
                    {incomingJob.distance} • {incomingJob.estTime} AWAY
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-emerald-600 tracking-tighter">
                    {incomingJob.price}
                  </p>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">
                    Fixed Amount
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full text-lg h-14 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleAcceptJob}
              >
                <Navigation className="mr-2" size={20} /> ACCEPT & NAVIGATE
              </Button>
              <button
                className="w-full mt-3 py-3 text-slate-400 hover:text-slate-600 transition-colors text-xs font-mono tracking-widest uppercase"
                onClick={() => setIncomingJob(null)}
              >
                DECLINE REQUEST
              </button>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}

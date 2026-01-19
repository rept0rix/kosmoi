import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { db } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Store, Plus, Settings, LogOut, Loader2, Search,
  TrendingUp, Users, MessageSquare, Star, Eye,
  LayoutDashboard, MapPin
} from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import { BusinessSearchStep } from "@/features/vendors/components/BusinessSearchStep";
import { ClaimBusinessFlow } from "@/features/vendors/components/ClaimBusinessFlow";
import { RegisterBusinessForm } from "@/features/vendors/components/RegisterBusinessForm";
import { DashboardSingleView } from "@/features/vendors/pages/DashboardSingleView";

// --- Sub-components for Dashboard View ---
// We'll keep the dashboard logic mostly inline or extract later if too big.
// For now, let's focus on the Switching / Adding logic.

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // 'list' | 'dashboard' | 'add_search' | 'add_claim' | 'add_register'
  const [viewMode, setViewMode] = useState('loading');
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);
  const [selectedPlaceForClaim, setSelectedPlaceForClaim] = useState(null);
  const [newBusinessName, setNewBusinessName] = useState('');

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      // Use getUser() for better type compatibility if me() is missing in types
      const { data } = await db.auth.getUser();
      return data?.user || null;
    },
  });

  // Strict Auth Check: Redirect if no user found after loading
  useEffect(() => {
    if (!isLoadingUser && !user && !localStorage.getItem('sb-access-token')) {
      // Double check local storage to avoid premature redirect during load
      console.warn("⚠️ No user found in BusinessDashboard. Redirecting to login...");
      navigate('/login?returnUrl=/business-registration');
    }
  }, [user, isLoadingUser, navigate]);

  // Fetch ALL businesses owned by user
  const { data: myBusinesses, isLoading: isLoadingBusinesses } = useQuery({
    queryKey: ['my-businesses', user?.id],
    queryFn: async () => {
      console.log("Fetching businesses for user:", user?.id);
      if (!user?.id) return [];
      const { data, error } = await db.from('service_providers').select('*').eq('owner_id', user.id);
      console.log("Business fetch result:", { data, error, userId: user.id });
      if (error) throw error;
      return Array.isArray(data) ? data : (data ? [data] : []);
    },
    enabled: !!user?.id
  });

  // Effect to determine initial view
  useEffect(() => {
    if (isLoadingBusinesses) return;

    // Check URL param for business ID
    const urlBusId = searchParams.get('bid');

    if (urlBusId && myBusinesses?.some(b => b.id === urlBusId)) {
      setSelectedBusinessId(urlBusId);
      setViewMode('dashboard');
    } else if (myBusinesses?.length > 0) {
      // Default to first business if available, OR show list?
      // Let's show list if > 1, else dashboard 1
      if (myBusinesses.length === 1) {
        setSelectedBusinessId(myBusinesses[0].id);
        setViewMode('dashboard');
      } else {
        setViewMode('list');
      }
    } else {
      // No businesses -> Show Welcome/Add flow
      // But maybe we want a "Welcome" screen first
      setViewMode('list'); // List view handles empty state too
    }
  }, [isLoadingBusinesses, myBusinesses, searchParams]);


  const handleBusinessSelect = (id) => {
    setSelectedBusinessId(id);
    setViewMode('dashboard');
    setSearchParams({ bid: id });
  };

  const handleStartAdd = () => {
    setViewMode('add_search');
  };

  // --- Add Flow Handlers ---

  const handlePlaceSelect = (place) => {
    // Check if this place is already in myBusinesses?
    // Ideally user shouldn't claim what they already own, but maybe they forgot.
    // For now proceed to claim flow.
    setSelectedPlaceForClaim(place);
    setViewMode('add_claim');
  };

  const handleCreateNew = (name) => {
    setNewBusinessName(name);
    setViewMode('add_register');
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
    toast({
      title: "Success! Business added.",
      description: "Your business has been successfully registered.",
      variant: "default", // or "success" if you have that variant
    });
    // Wait for refetch?
    setTimeout(() => {
      setViewMode('list'); // Go back to list to see new business
    }, 1500); // Increased delay to 1.5s so user sees the message
  };


  if (isLoadingBusinesses) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  // --- Views ---

  if (viewMode === 'list') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Business Hub</h1>
              <p className="text-slate-500">Manage your businesses on Kosmoi</p>
            </div>
            <Button onClick={handleStartAdd} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" /> Add Business
            </Button>
          </div>

          {(!myBusinesses || myBusinesses.length === 0) ? (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <Store className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No businesses yet</h2>
                <p className="text-slate-500 mb-6 max-w-md">Start by adding your first business. You can claim an existing Google Maps profile or create a new one.</p>
                <Button onClick={handleStartAdd} size="lg" className="bg-blue-600 text-white">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {myBusinesses?.map(bus => (
                <Card key={bus.id} className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-600" onClick={() => handleBusinessSelect(bus.id)}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-700 text-xl">
                        {bus.business_name.charAt(0)}
                      </div>
                      <Badge
                        variant="secondary"
                        className={bus.verified ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      >
                        {bus.status || 'Pending'}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{bus.business_name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-1 mb-4">{bus.location || 'No location set'}</p>
                    <div className="flex gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" /> {bus.average_rating || 0}</div>
                      <div className="flex items-center gap-1"><MessageSquare className="w-4 h-4" /> {bus.total_reviews || 0}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === 'add_search') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <Button variant="ghost" className="mb-4 pl-0" onClick={() => setViewMode('list')}><Search className="w-4 h-4 mr-2" /> Back into Hub</Button>
            <BusinessSearchStep
              onSelectPlace={handlePlaceSelect}
              onCreateNew={handleCreateNew}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'add_claim') {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center pt-20">
        <ClaimBusinessFlow
          selectedPlace={selectedPlaceForClaim}
          onBack={() => setViewMode('add_search')}
          onSuccess={handleAddSuccess}
        />
      </div>
    );
  }

  if (viewMode === 'add_register') {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-3xl mx-auto">
          <RegisterBusinessForm
            initialName={newBusinessName}
            onBack={() => setViewMode('add_search')}
            onSuccess={handleAddSuccess}
          />
        </div>
      </div>
    );
  }

  // --- Dashboard Mode (Single Business View) ---
  // This essentially replaces the old BusinessDashboard content but scoped to `selectedBusinessId`

  if (viewMode === 'dashboard' && selectedBusinessId) {
    const activeBusiness = myBusinesses.find(b => b.id === selectedBusinessId);

    if (!activeBusiness) return <div>Business not found</div>;

    return (
      <DashboardSingleView
        business={activeBusiness}
        onBack={() => setViewMode('list')}
      />
    );
  }

  return null;
}



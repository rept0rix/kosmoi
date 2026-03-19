import React, { useEffect, useState } from "react";
import { AdminService } from "../../services/AdminService";
import {
  getSuperCategory,
  formatCategory,
} from "../../shared/utils/categoryMapping";
import { InvitationService } from "@/services/business/InvitationService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Store,
  MapPin,
  Star,
  MoreHorizontal,
  Search,
  ExternalLink,
  Send,
  Pencil,
  Activity,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AdminEditBusinessDialog from "./AdminEditBusinessDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LiveMap from "../../components/admin/LiveMap";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]); // List Data (Paged)
  const [mapLocations, setMapLocations] = useState([]); // Map Data (Lightweight, All)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [activeTab, setActiveTab] = useState("list");

  // --- PAGINATION STATE ---
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Initial Load (Map Locations)
  useEffect(() => {
    const loadMapData = async () => {
      try {
        const locations = await AdminService.getMapLocations();
        setMapLocations(locations || []);
      } catch (err) {
        console.error("Failed to load map data", err);
      }
    };
    loadMapData();
  }, []);

  // List Data Load (Paged + Filtered)
  const loadBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, total } = await AdminService.getBusinessesPage(
        currentPage,
        ITEMS_PER_PAGE,
        {
          search: searchTerm,
          category: categoryFilter,
          status: statusFilter,
        },
      );

      setBusinesses(data || []);
      // setTotalItems(total || 0); // TODO: Fix AdminService to return total
      setTotalItems(data?.length || 0); // Fallback if API doesn't return total count yet
    } catch (err) {
      console.error("Businesses Load Failed", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data when page or filters change
  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      loadBusinesses();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPage, categoryFilter, statusFilter, searchTerm]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, searchTerm]);

  // --- FILTER & PAGINATION HELPERS ---
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Extract unique categories (Limited to current page, or hardcoded if needed)
  // Ideally this should come from a constants file or API
  const uniqueCategories = [
    ...new Set(businesses.map((b) => b.category).filter(Boolean)),
  ].sort();

  // Create Mode Handler
  const handleCreateClick = () => {
    setSelectedBusiness(null); // Null triggers create mode in the dialog
    setIsEditOpen(true);
  };

  const handleVerify = async (id) => {
    await AdminService.toggleBusinessVerification(id);
    await loadBusinesses();
  };

  const handleInviteClick = (business) => {
    setSelectedBusiness(business);
    setInviteEmail(business.email || business.contact_email || "");
    setInviteDialogOpen(true);
  };

  const handleEditClick = (biz) => {
    setSelectedBusiness(biz);
    setIsEditOpen(true);
  };

  const handleBusinessUpdated = (updatedBiz) => {
    setBusinesses((prev) => {
      const exists = prev.find((b) => b.id === updatedBiz.id);
      if (exists) {
        return prev.map((b) => (b.id === updatedBiz.id ? updatedBiz : b));
      }
      return [updatedBiz, ...prev]; // Prepend new business
    });
    setMapLocations((prev) => {
      const exists = prev.find((b) => b.id === updatedBiz.id);
      if (exists) {
        return prev.map((b) =>
          b.id === updatedBiz.id ? { ...b, ...updatedBiz } : b,
        );
      }
      return [
        {
          ...updatedBiz,
          current_lat: updatedBiz.latitude,
          current_lng: updatedBiz.longitude,
        },
        ...prev,
      ];
    });
  };

  const handleViewPublic = (business) => {
    if (business.website) {
      window.open(business.website, "_blank");
    } else if (business.google_place_id) {
      window.open(
        `https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`,
        "_blank",
      );
    } else {
      toast.info("No website or Google Map found for this business.");
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail) return;
    setSendingInvite(true);
    try {
      const invite = await InvitationService.createInvitation(
        selectedBusiness.id,
        { email: inviteEmail },
      );
      const link = `${window.location.origin}/claim?token=${invite.token}`;
      const result = await AdminService.sendInvitationEmail(
        inviteEmail,
        selectedBusiness?.business_name,
        link,
      );

      if (result.error) throw new Error(result.error);

      toast.success("Invitation Sent!", {
        description: `Email sent to ${inviteEmail}`,
      });
      setInviteDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send invitation", { description: error.message });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    if (!selectedBusiness) return;
    try {
      const invite = await InvitationService.createInvitation(
        selectedBusiness.id,
        { email: inviteEmail },
      );
      const link = `${window.location.origin}/claim?token=${invite.token}`;
      await navigator.clipboard.writeText(link);
      toast.success("Link Copied!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to copy link");
    }
  };

  const handleAuditClick = async (business) => {
    try {
      toast.info(`AI Audit for ${business.business_name} initiated.`);
      console.log("Audit requested for:", business.id);
    } catch (e) {
      console.error(e);
      toast.error("Failed to start audit");
    }
  };

  return (
    <div className="space-y-8 p-2 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            SERVICE{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
              NETWORK
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">// VENDOR_REGISTRY</p>
        </div>
        <div className="flex gap-3">
          <NeonButton
            onClick={() => {
              setSelectedBusiness(null);
              setIsEditOpen(true);
            }}
            variant="blue"
            size="sm"
          >
            + ONBOARD_NODE
          </NeonButton>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <div className="flex flex-col xl:flex-row items-center justify-between mb-6 gap-4">
          <TabsList className="bg-slate-900/50 border border-white/5 p-1 rounded-xl backdrop-blur-md">
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-mono text-xs tracking-wider"
            >
              GRID_VIEW
            </TabsTrigger>
            <TabsTrigger
              value="map"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-mono text-xs tracking-wider"
            >
              GEOSPATIAL
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neon-cyan/50" />
              <Input
                type="text"
                placeholder="Search entities..."
                className="pl-9 bg-black/20 border-white/5 focus:border-neon-cyan focus:ring-neon-cyan/20 text-white placeholder:text-slate-600 font-mono text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="bg-black/20 border border-white/5 text-slate-300 text-sm rounded-md px-3 py-2 outline-none focus:border-neon-cyan font-mono"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">ALL_STATUS</option>
              <option value="active">ACTIVE</option>
              <option value="verified">VERIFIED</option>
              <option value="unverified">UNVERIFIED</option>
            </select>

            <select
              className="bg-black/20 border border-white/5 text-slate-300 text-sm rounded-md px-3 py-2 outline-none focus:border-neon-cyan max-w-[160px] font-mono"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">ALL_SECTORS</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {formatCategory(cat)}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={loadBusinesses}
              className="border-white/5 bg-black/20 hover:bg-white/10 hover:text-neon-cyan text-slate-400"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <TabsContent value="list">
          <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4 font-mono tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-4 font-mono tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-4 font-mono tracking-wider">
                      Coordinates
                    </th>
                    <th className="px-6 py-4 font-mono tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 font-mono tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-4 font-mono tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-right font-mono tracking-wider">
                      Protocol
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neon-cyan" />
                        <span className="font-mono text-xs">
                          SYNCING_NETWORK...
                        </span>
                      </td>
                    </tr>
                  ) : businesses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <Store className="w-8 h-8 mb-2" />
                          <p className="font-mono text-xs">NO_NODES_FOUND</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    businesses.map((biz) => {
                      return (
                        <tr
                          key={biz.id}
                          className="hover:bg-white/[0.02] border-white/5 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-900/10 border border-blue-500/20 flex items-center justify-center text-blue-400 overflow-hidden shrink-0 group-hover:border-neon-cyan/50 transition-colors">
                                {biz.images && biz.images.length > 0 ? (
                                  <img
                                    loading="lazy"
                                    src={
                                      biz.images[0].startsWith("http")
                                        ? biz.images[0]
                                        : `https://gzjzeywhqbwppfxqkptf.supabase.co/storage/v1/object/public/provider-images/${biz.images[0]}`
                                    }
                                    className="w-full h-full object-cover"
                                    alt=""
                                  />
                                ) : (
                                  <Store className="w-5 h-5" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200 group-hover:text-neon-cyan transition-colors">
                                  {biz.business_name}
                                </div>
                                <div className="text-[10px] text-slate-500 line-clamp-1 font-mono">
                                  {biz.description?.substring(0, 40) ||
                                    "NO_DESCRIPTION"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <Badge
                                variant="outline"
                                className="bg-slate-800/50 text-slate-300 w-fit pointer-events-none capitalize border-slate-700"
                              >
                                {formatCategory(biz.category)}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            <div className="flex items-center gap-1.5 opacity-80">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-purple-400" />
                              <span
                                className="truncate max-w-[150px] text-xs font-mono"
                                title={biz.location}
                              >
                                {biz.location}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={
                                biz.verified
                                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                                  : "border-slate-700 text-slate-500 bg-slate-900/20"
                              }
                            >
                              {biz.verified ? "VERIFIED" : "UNVERIFIED"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {biz.metadata?.score !== undefined ? (
                              <Badge
                                variant="outline"
                                className={
                                  biz.metadata.score > 80
                                    ? "bg-green-500/5 text-green-400 border-green-500/20"
                                    : biz.metadata.score > 50
                                      ? "bg-yellow-500/5 text-yellow-400 border-yellow-500/20"
                                      : "bg-red-500/5 text-red-400 border-red-500/20"
                                }
                              >
                                {biz.metadata.score} // 100
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-700 font-mono">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-slate-300 font-mono text-xs">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              <span>{biz.average_rating || "0.0"}</span>
                              <span className="text-slate-600">
                                ({biz.user_ratings_total || 0})
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="bg-slate-900 border-slate-700 text-slate-200 backdrop-blur-xl"
                              >
                                <DropdownMenuLabel className="font-mono text-xs text-slate-500 uppercase">
                                  Manage Node
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem
                                  onSelect={() => handleEditClick(biz)}
                                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-yellow-400 font-medium text-xs"
                                >
                                  <Pencil className="mr-2 h-3 w-3" />
                                  EDIT_DETAILS
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleVerify(biz.id)}
                                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-xs"
                                >
                                  {biz.verified
                                    ? "REVOKE_VERIFICATION"
                                    : "GRANT_VERIFICATION"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    handleViewPublic(biz);
                                  }}
                                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-xs"
                                >
                                  <ExternalLink className="mr-2 h-3 w-3" />
                                  VIEW_PUBLIC
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => handleInviteClick(biz)}
                                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-teal-400 text-xs"
                                >
                                  <Send className="mr-2 h-3 w-3" />
                                  SEND_INVITE
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-800" />
                                <DropdownMenuItem
                                  onSelect={() => handleAuditClick(biz)}
                                  className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-purple-400 font-mono text-[10px]"
                                >
                                  <Activity className="mr-2 h-3 w-3" />
                                  RUN_AI_AUDIT
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Pagination Controls */}
          {totalItems > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between mt-4 text-xs text-slate-400 font-mono">
              <div>
                DISPLAYING {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} /{" "}
                {totalItems} NODES
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-slate-700 hover:bg-slate-800 disabled:opacity-50 text-xs h-7"
                >
                  PREV
                </Button>
                <span className="text-slate-500">
                  PAGE {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="border-slate-700 hover:bg-slate-800 disabled:opacity-50 text-xs h-7"
                >
                  NEXT
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <LiveMap businesses={mapLocations} />
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl">INVITE_NODE</DialogTitle>
            <DialogDescription className="text-slate-400 font-mono text-xs">
              Initiate onboarding sequence for {selectedBusiness?.business_name}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className="text-slate-300 text-xs uppercase font-bold"
              >
                Target Email
              </Label>
              <Input
                id="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="bg-black/50 border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono"
                placeholder="business@example.com"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={handleCopyLink}
              className="text-slate-400 hover:text-white"
            >
              COPY_LINK
            </Button>
            <NeonButton
              onClick={handleSendInvite}
              disabled={sendingInvite || !inviteEmail}
              variant="cyan"
            >
              {sendingInvite ? "TRANSMITTING..." : "SEND_INVITE"}
            </NeonButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <AdminEditBusinessDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        business={selectedBusiness}
        onSaved={handleBusinessUpdated}
      />
    </div>
  );
}

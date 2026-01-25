import React, { useEffect, useState } from "react";
import { AdminService } from "@/services/AdminService";
import { BookingService } from "@/services/BookingService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  User,
  Store,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import KosmoiLoader from "@/components/ui/KosmoiLoader";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await AdminService.getBookings();
    if (error) {
      toast({
        title: "Error fetching bookings",
        description: error.message,
        variant: "destructive",
      });
    }
    setBookings(data || []);
    setLoading(false);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await BookingService.updateBookingStatus(bookingId, newStatus);
      toast({
        title: "Status Updated",
        description: `Booking marked as ${newStatus}`,
      });
      loadBookings(); // Refresh
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Safe filtering logic
  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    const searchLower = searchTerm.toLowerCase();

    const userName = (b.profiles?.full_name || "").toLowerCase();
    const providerName = (
      b.service_providers?.business_name || ""
    ).toLowerCase();
    const serviceName = (b.service_type || "").toLowerCase();
    const bookingId = (b.id || "").toLowerCase();

    const matchesSearch =
      userName.includes(searchLower) ||
      providerName.includes(searchLower) ||
      serviceName.includes(searchLower) ||
      bookingId.includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20"
          >
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
          >
            <XCircle className="w-3 h-3 mr-1" /> Cancelled
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-slate-700/50 text-slate-200 border-slate-600"
          >
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <KosmoiLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            BOOKING{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              MATRIX
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            // RESERVATION_PROTOCOL_V1
          </p>
        </div>
        <NeonButton onClick={loadBookings} variant="ghost" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> REFRESH_DATA
        </NeonButton>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL_RESERVATIONS"
          value={stats.total}
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          trend="LIFETIME"
          variant="blue"
        />
        <StatCard
          title="ACTION_REQUIRED"
          value={stats.pending}
          icon={<Clock className="w-5 h-5 text-yellow-400" />}
          trend="PENDING"
          variant="yellow"
        />
        <StatCard
          title="CONFIRMED_GUESTS"
          value={stats.confirmed}
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          trend="ACTIVE"
          variant="green"
        />
        <StatCard
          title="CANCELLED"
          value={stats.cancelled}
          icon={<XCircle className="w-5 h-5 text-red-400" />}
          trend="LOST"
          variant="red"
        />
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-black/20 border-white/5 text-white placeholder:text-slate-600 focus:border-neon-cyan focus:ring-neon-cyan/20"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] bg-black/20 border-white/5 text-slate-300">
              <SelectValue placeholder="FILTER_STATUS" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-white">
              <SelectItem value="all">ALL_STATUS</SelectItem>
              <SelectItem value="pending">PENDING</SelectItem>
              <SelectItem value="confirmed">CONFIRMED</SelectItem>
              <SelectItem value="completed">COMPLETED</SelectItem>
              <SelectItem value="cancelled">CANCELLED</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bookings Table */}
      <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
        <Table>
          <TableHeader className="bg-white/[0.02]">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Booking ID
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                User
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Provider
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Service / Date
              </TableHead>
              <TableHead className="text-slate-400 font-mono text-xs uppercase tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-right text-slate-400 font-mono text-xs uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow className="hover:bg-transparent border-white/5">
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center opacity-50">
                    <Calendar className="w-8 h-8 mb-2" />
                    <p className="font-mono text-xs">NO_BOOKINGS_FOUND</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow
                  key={booking.id}
                  className="hover:bg-white/[0.02] border-white/5 transition-colors group"
                >
                  <TableCell className="font-mono text-xs text-slate-400 group-hover:text-neon-cyan transition-colors">
                    {booking.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-800/50 p-2 rounded-lg border border-white/5">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-200 text-sm">
                          {booking.profiles?.full_name || "Guest User"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {booking.profiles?.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-800/50 p-2 rounded-lg border border-white/5">
                        <Store className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-200 text-sm">
                          {booking.service_providers?.business_name ||
                            "Unknown Provider"}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {booking.service_providers?.category || "General"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300 font-medium">
                      {booking.service_type}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{" "}
                        {new Date(booking.service_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {booking.start_time?.substring(0, 5)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
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
                        <DropdownMenuLabel className="font-mono text-xs uppercase text-slate-500">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            navigator.clipboard.writeText(booking.id)
                          }
                          className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer font-mono text-xs"
                        >
                          COPY_ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <div className="p-1">
                          <div className="text-[10px] text-slate-600 px-2 py-1 uppercase font-bold tracking-wider">
                            Set Status
                          </div>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(booking.id, "confirmed")
                            }
                            className="hover:bg-green-900/20 focus:bg-green-900/20 text-green-400 cursor-pointer text-xs"
                          >
                            CONFIRM
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(booking.id, "completed")
                            }
                            className="hover:bg-blue-900/20 focus:bg-blue-900/20 text-blue-400 cursor-pointer text-xs"
                          >
                            COMPLETE
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(booking.id, "cancelled")
                            }
                            className="hover:bg-red-900/20 focus:bg-red-900/20 text-red-400 cursor-pointer text-xs"
                          >
                            CANCEL
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
}

function StatCard({ title, value, icon, trend, variant = "blue" }) {
  const variants = {
    blue: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40",
    yellow: "border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/40",
    green: "border-green-500/20 bg-green-500/5 hover:border-green-500/40",
    red: "border-red-500/20 bg-red-500/5 hover:border-red-500/40",
  };

  return (
    <GlassCard
      className={`p-4 transition-all duration-300 hover:scale-[1.02] ${variants[variant]}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          {title}
        </div>
        <div className={`p-2 rounded-lg bg-white/5`}>{icon}</div>
      </div>
      <div className="text-3xl font-mono font-bold text-white tracking-tight">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1 font-mono">{trend}</div>
    </GlassCard>
  );
}

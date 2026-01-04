
import React, { useEffect, useState } from 'react';
import { AdminService } from '@/services/AdminService';
import { BookingService } from '@/services/BookingService';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    Store
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import KosmoiLoader from '@/components/ui/KosmoiLoader';

export default function AdminBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
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
                variant: "destructive"
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
                variant: "destructive"
            });
        }
    };

    // Safe filtering logic
    const filteredBookings = bookings.filter(b => {
        const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
        const searchLower = searchTerm.toLowerCase();

        const userName = (b.profiles?.full_name || '').toLowerCase();
        const providerName = (b.service_providers?.business_name || '').toLowerCase();
        const serviceName = (b.service_type || '').toLowerCase();
        const bookingId = (b.id || '').toLowerCase();

        const matchesSearch =
            userName.includes(searchLower) ||
            providerName.includes(searchLower) ||
            serviceName.includes(searchLower) ||
            bookingId.includes(searchLower);

        return matchesStatus && matchesSearch;
    });

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        cancelled: bookings.filter(b => b.status === 'cancelled').length,
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</Badge>;
            case 'pending': return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'cancelled': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
            case 'completed': return <Badge variant="secondary" className="bg-slate-700 text-slate-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
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
        <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Bookings Management
                </h1>
                <p className="text-slate-400">View and manage all platform bookings</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Bookings"
                    value={stats.total}
                    icon={<Calendar className="w-5 h-5 text-blue-400" />}
                    trend="Lifetime"
                    colorClass="bg-blue-500/10"
                />
                <StatCard
                    title="Pending Action"
                    value={stats.pending}
                    icon={<Clock className="w-5 h-5 text-yellow-400" />}
                    trend="Needs Review"
                    colorClass="bg-yellow-500/10"
                />
                <StatCard
                    title="Confirmed"
                    value={stats.confirmed}
                    icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                    trend="Active"
                    colorClass="bg-green-500/10"
                />
                <StatCard
                    title="Cancelled"
                    value={stats.cancelled}
                    icon={<XCircle className="w-5 h-5 text-red-400" />}
                    trend="Lost"
                    colorClass="bg-red-500/10"
                />
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-lg border border-white/5">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search bookings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-slate-800 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[180px] bg-slate-800 border-white/10 text-white">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={loadBookings} variant="outline" className="border-white/10 hover:bg-white/5 text-slate-300">
                    Refresh
                </Button>
            </div>

            {/* Bookings Table */}
            <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-white/5">
                        <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-slate-400">Booking ID</TableHead>
                            <TableHead className="text-slate-400">User</TableHead>
                            <TableHead className="text-slate-400">Provider</TableHead>
                            <TableHead className="text-slate-400">Service / Date</TableHead>
                            <TableHead className="text-slate-400">Status</TableHead>
                            <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBookings.length === 0 ? (
                            <TableRow className="hover:bg-transparent border-white/5">
                                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                                    No bookings found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredBookings.map((booking) => (
                                <TableRow key={booking.id} className="hover:bg-white/5 border-white/5">
                                    <TableCell className="font-mono text-xs text-slate-400">
                                        {booking.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-800 p-2 rounded-full">
                                                <User className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">
                                                    {booking.profiles?.full_name || 'Guest User'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {booking.profiles?.email || 'No email'}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-slate-800 p-2 rounded-full">
                                                <Store className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-200">
                                                    {booking.service_providers?.business_name || 'Unknown Provider'}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {booking.service_providers?.category || 'General'}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-200">{booking.service_type}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(booking.service_date).toLocaleDateString()}
                                            <span className="mx-1">•</span>
                                            <Clock className="w-3 h-3" />
                                            {booking.start_time?.substring(0, 5)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(booking.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onClick={() => navigator.clipboard.writeText(booking.id)}
                                                    className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                                                >
                                                    Copy Booking ID
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-700" />
                                                <div className="p-1">
                                                    <div className="text-xs text-slate-500 px-2 py-1 uppercase font-bold">Set Status</div>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                                        className="hover:bg-green-900/50 focus:bg-green-900/50 text-green-400 cursor-pointer"
                                                    >
                                                        Mark as Confirmed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(booking.id, 'completed')}
                                                        className="hover:bg-blue-900/50 focus:bg-blue-900/50 text-blue-400 cursor-pointer"
                                                    >
                                                        Mark as Completed
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                                        className="hover:bg-red-900/50 focus:bg-red-900/50 text-red-400 cursor-pointer"
                                                    >
                                                        Mark as Cancelled
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
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon, trend, colorClass }) {
    return (
        <Card className="p-4 bg-slate-900/40 border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-slate-400">{title}</div>
                <div className={`p-2 rounded-lg ${colorClass || 'bg-slate-800/50'}`}>{icon}</div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{trend}</div>
        </Card>
    );
}

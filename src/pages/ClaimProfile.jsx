import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { InvitationService } from '@/services/business/InvitationService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, MapPin, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/api/supabaseClient';

export default function ClaimProfile() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [invitation, setInvitation] = useState(null);
    const [provider, setProvider] = useState(null);
    const [error, setError] = useState(null);
    const [claiming, setClaiming] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Missing invitation token.");
            setLoading(false);
            return;
        }

        async function loadData() {
            console.log("ClaimProfile: Loading data for token:", token);
            try {
                // Add a timeout to prevent infinite loading
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 10000)
                );

                const invitePromise = InvitationService.validateToken(token);

                const invite = await Promise.race([invitePromise, timeoutPromise]);

                console.log("ClaimProfile: Invitation result:", invite);

                if (!invite) {
                    setError("This invitation is invalid or has expired.");
                } else {
                    setInvitation(invite);
                    setProvider(invite.service_providers); // joined data
                }
            } catch (err) {
                console.error("ClaimProfile Error:", err);
                setError(err.message || "Failed to load invitation.");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [token]);

    const handleClaim = async () => {
        setClaiming(true);
        try {
            // Check if user is logged in first
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Determine Redirect URL to come back here after login
                // We preserve the token in the URL or returnUrl
                const returnUrl = encodeURIComponent(`/claim?token=${token}`);
                navigate(`/login?returnUrl=${returnUrl}`);
                return;
            }

            // User is logged in, attempt to claim
            await InvitationService.claimProfile(token, session.user.id);

            toast.success("Profile claimed successfully!");
            // Redirect to their new dashboard
            navigate('/provider-dashboard');
        } catch (err) {
            console.error(err);
            toast.error("Failed to claim profile. Please contact support.");
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center text-white">
                <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
                <Card className="max-w-md w-full bg-slate-900 border-red-500/20">
                    <CardHeader className="text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <CardTitle className="text-white text-xl">Invitation Error</CardTitle>
                        <CardDescription className="text-slate-400">{error}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0F1C] text-slate-200">
            {/* Minimal Header */}
            <div className="border-b border-white/5 bg-[#0A0F1C]/80 p-4">
                <div className="container mx-auto flex items-center justify-between">
                    <span className="font-bold text-white text-lg">Kosmoi Business</span>
                </div>
            </div>

            <div className="container mx-auto px-4 py-10 max-w-4xl">
                <div className="grid md:grid-cols-2 gap-12 items-center">

                    {/* Left: Pitch */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full text-sm font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Verified Invitation
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Is <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">{provider?.business_name || "this business"}</span> yours?
                        </h1>

                        <p className="text-lg text-slate-400 leading-relaxed">
                            We've detected high tourist interest in your services.
                            Claim your profile now to reply to inquiries and manage your online presence.
                        </p>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl">
                                    5
                                </div>
                                <div>
                                    <h4 className="text-white font-medium">Leads Waiting</h4>
                                    <p className="text-sm text-slate-500">People asking for {provider?.category || "your service"} today.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Business Card Preview */}
                    <Card className="bg-slate-900 border-white/10 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <CardHeader className="pb-2">
                            <div className="w-full h-32 bg-slate-800 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                {provider?.images ? (
                                    <img src={provider.images[0]} alt="Business" className="w-full h-full object-cover" />
                                ) : (
                                    <MapPin className="w-10 h-10 text-slate-600" />
                                )}
                            </div>
                            <CardTitle className="text-white text-2xl">{provider?.business_name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4" /> {provider?.location || "Koh Samui, Thailand"}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <Button
                                onClick={handleClaim}
                                disabled={claiming}
                                className="w-full h-12 text-lg bg-teal-500 hover:bg-teal-600 text-white font-bold shadow-lg shadow-teal-500/20"
                            >
                                {claiming ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                {claiming ? "Claiming..." : "Yes, Claim This Business"}
                            </Button>
                            <p className="text-xs text-center text-slate-500 mt-4">
                                By claiming, you agree to our Terms of Service.
                            </p>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

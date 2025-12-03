import React, { useState } from 'react';
import { db } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw } from "lucide-react";

const MOCK_PROVIDERS = [
    {
        business_name: "Samui Plumbers Pro",
        category: "plumber",
        description: "Professional plumbing services for homes and villas. We specialize in leak detection, pipe repair, and bathroom installations. Available 24/7 for emergencies.",
        phone: "081-234-5678",
        // whatsapp: "66812345678",
        location: "Bo Phut, Koh Samui",
        latitude: 9.5532,
        longitude: 100.0321,
        // available_hours: "Mon-Sun: 24 Hours",
        // email: "info@samuiplumbers.com",
        // website: "https://samuiplumbers.com",
        images: [
            "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
        // emergency_service: true,
        // price_range: "medium",
        // languages: ["English", "Thai"]
    },
    {
        business_name: "Cool Breeze AC Repair",
        category: "ac_repair",
        description: "Keep your villa cool with our expert AC cleaning and repair services. We service all major brands including Daikin, Mitsubishi, and Samsung.",
        phone: "089-876-5432",
        // whatsapp: "66898765432",
        location: "Chaweng, Koh Samui",
        latitude: 9.5318,
        longitude: 100.0614,
        // available_hours: "Mon-Sat: 8:00 AM - 6:00 PM",
        // email: "service@coolbreeze.com",
        images: [
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1581094794329-cd1096d7a43f?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
        // emergency_service: false,
        // price_range: "low",
        // languages: ["English", "Thai", "Russian"]
    },
    {
        business_name: "Island Taxi Service",
        category: "taxi",
        description: "Reliable taxi and transfer service around Koh Samui. Airport transfers, full day tours, and late night pickups.",
        phone: "099-111-2222",
        // whatsapp: "66991112222",
        location: "Lamai, Koh Samui",
        latitude: 9.4593,
        longitude: 100.0478,
        // available_hours: "Mon-Sun: 24 Hours",
        images: [
            "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
        // emergency_service: true,
        // price_range: "medium",
        // languages: ["English", "Thai"]
    },
    {
        business_name: "Samui Clean Team",
        category: "cleaning",
        description: "Top-rated cleaning service for villas, apartments, and offices. We use eco-friendly products and guarantee satisfaction.",
        phone: "088-555-4444",
        // whatsapp: "66885554444",
        location: "Maenam, Koh Samui",
        latitude: 9.5694,
        longitude: 99.9976,
        // available_hours: "Mon-Fri: 9:00 AM - 5:00 PM",
        images: [
            "https://images.unsplash.com/photo-1581578731117-104f8a746a32?q=80&w=1000&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1527515637-62c990262bfa?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: false,
        status: 'active',
        // emergency_service: false,
        // price_range: "low",
        // languages: ["Thai"]
    },
    {
        business_name: "Master Electrician",
        category: "electrician",
        description: "Certified electrician for all your electrical needs. Wiring, lighting installation, safety checks, and repairs.",
        phone: "082-333-9999",
        // whatsapp: "66823339999",
        location: "Bangrak, Koh Samui",
        latitude: 9.5587,
        longitude: 100.0545,
        // available_hours: "Mon-Sat: 8:00 AM - 8:00 PM",
        images: [
            "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=1000&auto=format&fit=crop"
        ],
        verified: true,
        status: 'active',
        // emergency_service: true,
        // price_range: "high",
        // languages: ["English", "Thai", "German"]
    }
];

export default function SeedData() {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const handleClearData = async () => {
        setStatus('loading');
        addLog("Clearing all service providers...");
        try {
            // Fetch all providers using the list method
            const providers = await db.entities.ServiceProvider.list(null, 1000); // Fetch up to 1000

            if (providers.length === 0) {
                addLog("No providers to delete.");
            } else {
                addLog(`Found ${providers.length} providers. Deleting...`);
                let deletedCount = 0;

                // Delete in concurrent batches to speed up
                const BATCH_SIZE = 5;
                for (let i = 0; i < providers.length; i += BATCH_SIZE) {
                    const batch = providers.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch.map(async (provider) => {
                        try {
                            await db.entities.ServiceProvider.delete(provider.id);
                            deletedCount++;
                        } catch (err) {
                            addLog(`⚠️ Failed to delete ${provider.business_name || provider.id}: ${err.message}`);
                        }
                    }));
                    addLog(`Deleted ${Math.min(i + BATCH_SIZE, providers.length)} / ${providers.length}...`);
                }

                addLog(`✅ Deleted ${deletedCount} providers.`);
            }
            setStatus('success');
        } catch (error) {
            addLog(`❌ Error clearing data: ${error.message}`);
            setStatus('error');
        }
    };

    const handleSeed = async () => {
        setStatus('loading');
        setLogs([]);
        addLog("Starting seed process...");

        try {
            for (const provider of MOCK_PROVIDERS) {
                addLog(`Processing provider: ${provider.business_name}...`);

                // Check if exists
                const existing = await db.entities.ServiceProvider.filter({ business_name: provider.business_name });

                if (existing && existing.length > 0) {
                    addLog(`🔄 Found existing ${provider.business_name}. Deleting to recreate...`);
                    try {
                        // Delete all existing matches to be safe
                        for (const exist of existing) {
                            await db.entities.ServiceProvider.delete(exist.id);
                        }
                        addLog(`🗑️ Deleted existing record(s)`);
                    } catch (e) {
                        addLog(`⚠️ Failed to delete existing ${provider.business_name}: ${e.message}`);
                    }
                }

                addLog(`➕ Creating ${provider.business_name}`);
                try {
                    await db.entities.ServiceProvider.create(provider);
                    addLog(`✅ Created ${provider.business_name}`);
                } catch (e) {
                    addLog(`⚠️ Failed to create ${provider.business_name}: ${e.message}`);
                }
            }

            addLog("Seed process completed!");
            setStatus('success');
        } catch (error) {
            addLog(`Critical Error: ${error.message}`);
            setStatus('error');
        }
    };

    const handleResetAndSeed = async () => {
        setLogs([]);
        await handleClearData();
        if (status !== 'error') {
            await handleSeed();
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Database Seeder</h1>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Warning</span>
                </div>
                <p className="text-sm text-yellow-700">
                    This will inject mock data into your Supabase database.
                    Use this only for development and testing purposes.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                    onClick={handleClearData}
                    disabled={status === 'loading'}
                    variant="destructive"
                    className="w-full"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                </Button>
                <Button
                    onClick={handleResetAndSeed}
                    disabled={status === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Reset & Seed (Recommended)
                </Button>
            </div>

            <Button
                onClick={handleSeed}
                disabled={status === 'loading'}
                variant="outline"
                className="w-full mb-6"
            >
                {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Append Mock Data (No Delete)'}
            </Button>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {logs.length === 0 ? (
                    <span className="text-gray-500">// Logs will appear here...</span>
                ) : (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                )}
            </div>
        </div>
    );
}

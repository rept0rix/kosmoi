// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { db, supabase } from '@/api/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function Diagnostics() {
    const [results, setResults] = useState({
        env: { status: 'pending', details: {} },
        supabase: { status: 'pending' },
        supabaseDirect: { status: 'pending' },
        supabaseClient: { status: 'pending' },
        gemini: { status: 'pending' },
        models: { status: 'pending' },
        maps: { status: 'pending' }
    });

    const checkEnv = () => {
        const vars = {
            'VITE_SUPABASE_URL': import.meta.env.VITE_SUPABASE_URL,
            'VITE_SUPABASE_ANON_KEY': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'VITE_GEMINI_API_KEY': import.meta.env.VITE_GEMINI_API_KEY,
            'VITE_GOOGLE_MAPS_API_KEY': import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        };

        const details = Object.fromEntries(
            Object.entries(vars).map(([key, val]) => [key, val ? 'Present' : 'Missing'])
        );

        const allPresent = Object.values(vars).every(v => !!v);
        return { status: allPresent ? 'success' : 'error', details };
    };

    const checkSupabase = async () => {
        try {
            console.log("Starting Supabase check...");
            const start = performance.now();

            // Create a timeout promise
            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out after 5s')), 5000)
            );

            // Race the query against the timeout
            const result = await Promise.race([
                db.entities.ServiceProvider.list(null, 1),
                timeout
            ]);

            console.log("Supabase check result:", result);
            const duration = performance.now() - start;

            // Result is the data array directly
            return { status: 'success', message: `Connected in ${duration.toFixed(0)}ms`, dataCount: result.length };
        } catch (error) {
            console.error("Supabase check error:", error);
            return { status: 'error', message: error.message };
        }
    };

    const checkSupabaseClient = async () => {
        let lastFetch = { url: 'none', status: 'none' };
        try {
            console.log("Starting Supabase Client check with custom options...");
            const start = performance.now();

            // Create a fresh client with specific options to debug
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const customFetch = async (input, init) => {
                console.log("Supabase Client Fetch:", input, init);
                lastFetch.url = input.toString();
                try {
                    const response = await fetch(input, init);
                    console.log("Supabase Client Response:", response.status, response.statusText);
                    lastFetch.status = `${response.status} ${response.statusText}`;
                    return response;
                } catch (err) {
                    console.error("Supabase Client Fetch Error:", err);
                    lastFetch.status = `Error: ${err.message}`;
                    throw err;
                }
            };

            const tempClient = createClient(url, key, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                },
                global: {
                    fetch: customFetch
                },
                db: {
                    schema: 'public'
                }
            });

            const timeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timed out after 5s')), 5000)
            );

            const { data, error } = await Promise.race([
                tempClient.from('service_providers').select('*').limit(1),
                timeout
            ]);

            const duration = performance.now() - start;

            if (error) throw error;
            return {
                status: 'success',
                message: `Connected (Custom Client) in ${duration.toFixed(0)}ms`,
                dataCount: data.length,
                debug: lastFetch
            };
        } catch (error) {
            console.error("Supabase Client check error:", error);
            return {
                status: 'error',
                message: error.message,
                debug: lastFetch // Return debug info even on error
            };
        }
    };
    const checkSupabaseDirect = async () => {
        try {
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!url || !key) return { status: 'error', message: 'Missing URL/Key' };

            const response = await fetch(`${url}/rest/v1/service_providers?select=*&limit=1`, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const data = await response.json();
            return { status: 'success', message: 'Direct Fetch OK', dataCount: data.length };
        } catch (error) {
            return { status: 'error', message: `Direct Fetch Failed: ${error.message}` };
        }
    };

    const checkGemini = async () => {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) return { status: 'error', message: 'Missing API Key' };

            const start = performance.now();
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: "Ping" }] }]
                })
            });
            const duration = performance.now() - start;

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || response.statusText);
            }
            return { status: 'success', message: `Responded in ${duration.toFixed(0)}ms` };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    };

    const checkMaps = () => {
        // @ts-ignore
        if (window.google && window.google.maps) {
            return { status: 'success', message: 'Maps API Loaded' };
        }
        return { status: 'error', message: 'Maps API not found on window' };
    };

    const checkModels = async () => {
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) return { status: 'error', message: 'Missing API Key' };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            const availableModels = data.models
                ?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                .map(m => m.name.replace('models/', ''))
                .join(', ');

            return { status: 'success', message: `Available: ${availableModels}` };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    };

    const runDiagnostics = () => {
        setResults(prev => ({ ...prev, env: checkEnv() }));

        // Supabase
        setResults(prev => ({ ...prev, supabase: { status: 'loading' } }));
        checkSupabase().then(res => setResults(prev => ({ ...prev, supabase: res })));

        // Supabase Direct
        setResults(prev => ({ ...prev, supabaseDirect: { status: 'loading' } }));
        checkSupabaseDirect().then(res => setResults(prev => ({ ...prev, supabaseDirect: res })));

        // Supabase Client Direct
        setResults(prev => ({ ...prev, supabaseClient: { status: 'loading' } }));
        checkSupabaseClient().then(res => setResults(prev => ({ ...prev, supabaseClient: res })));

        // Gemini
        setResults(prev => ({ ...prev, gemini: { status: 'loading' } }));
        checkGemini().then(res => setResults(prev => ({ ...prev, gemini: res })));

        // Models List
        setResults(prev => ({ ...prev, models: { status: 'loading' } }));
        checkModels().then(res => setResults(prev => ({ ...prev, models: res })));

        // Maps
        setTimeout(() => {
            setResults(prev => ({ ...prev, maps: checkMaps() }));
        }, 1000);
    };

    useEffect(() => {
        runDiagnostics();
    }, []);

    const StatusIcon = ({ status }) => {
        if (status === 'loading') return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
        if (status === 'success') return <CheckCircle className="h-5 w-5 text-green-500" />;
        if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">System Diagnostics <span className="text-xs text-gray-400">v1.0</span></h1>
                <Button onClick={runDiagnostics} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Run Diagnostics Again
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Environment Variables */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Environment Variables</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.env.status} />
                            <span className="font-bold capitalize">{results.env.status}</span>
                        </div>
                        <div className="space-y-1">
                            {results.env.details && Object.entries(results.env.details).map(([key, val]) => (
                                <div key={key} className="flex justify-between text-xs">
                                    <span className="text-gray-500">{key}:</span>
                                    <span className={val === 'Missing' ? 'text-red-500 font-bold' : 'text-green-600'}>{val}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Supabase Connection (Helper) */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Supabase (Helper)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.supabase.status} />
                            <span className="font-bold capitalize">{results.supabase.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{results.supabase.message}</p>
                        {results.supabase.dataCount !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">Rows: {results.supabase.dataCount}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Supabase Client Direct */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Supabase (Client Direct)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.supabaseClient?.status || 'pending'} />
                            <span className="font-bold capitalize">{results.supabaseClient?.status || 'pending'}</span>
                        </div>
                        <p className="text-xs text-gray-500">{results.supabaseClient?.message || 'Checking...'}</p>
                        {results.supabaseClient?.dataCount !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">Rows: {results.supabaseClient.dataCount}</p>
                        )}
                        {results.supabaseClient?.debug && (
                            <div className="mt-2 p-2 bg-gray-100 rounded text-[10px] font-mono overflow-hidden">
                                <p>Last Fetch: {results.supabaseClient.debug.url}</p>
                                <p>Status: {results.supabaseClient.debug.status}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Supabase Direct Fetch */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Supabase (Fetch)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.supabaseDirect?.status || 'pending'} />
                            <span className="font-bold capitalize">{results.supabaseDirect?.status || 'pending'}</span>
                        </div>
                        <p className="text-xs text-gray-500">{results.supabaseDirect?.message || 'Checking...'}</p>
                        {results.supabaseDirect?.dataCount !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">Rows: {results.supabaseDirect.dataCount}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Gemini AI */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Gemini AI</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.gemini.status} />
                            <span className="font-bold capitalize">{results.gemini.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{results.gemini.message}</p>
                    </CardContent>
                </Card>

                {/* Available Models */}
                <Card className="col-span-full md:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Available Models</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.models?.status || 'pending'} />
                            <span className="font-bold capitalize">{results.models?.status || 'pending'}</span>
                        </div>
                        <p className="text-xs text-gray-500 break-words">{results.models?.message || 'Checking...'}</p>
                    </CardContent>
                </Card>

                {/* Google Maps */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Google Maps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mb-2">
                            <StatusIcon status={results.maps.status} />
                            <span className="font-bold capitalize">{results.maps.status}</span>
                        </div>
                        <p className="text-xs text-gray-500">{results.maps.message}</p>
                    </CardContent>
                </Card>
            </div>

            <Button onClick={runDiagnostics} className="w-full">Run Diagnostics Again</Button>
        </div>
    );
}

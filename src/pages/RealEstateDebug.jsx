import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';
import NavigationBar from '@/components/landing/NavigationBar';
import Footer from '@/components/Footer';

export default function RealEstateDebug() {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchProperties() {
            console.log('[DEBUG] Starting to fetch properties...');
            try {
                const { data, error: fetchError } = await supabase
                    .from('properties')
                    .select('*, images:property_images(url)');

                console.log('[DEBUG] Fetch result:', { data, error: fetchError });

                if (fetchError) {
                    setError(fetchError.message);
                } else {
                    setProperties(data || []);
                }
            } catch (err) {
                console.error('[DEBUG] Catch block error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProperties();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <NavigationBar />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-bold mb-8">Real Estate Hub (DEBUG MODE)</h1>

                {loading && (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600">Loading properties...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {!loading && !error && properties.length === 0 && (
                    <div className="text-center py-12 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-semibold">No properties found in database</p>
                    </div>
                )}

                {!loading && properties.length > 0 && (
                    <div>
                        <p className="mb-4 text-green-600 font-semibold">
                            ✅ Found {properties.length} {properties.length === 1 ? 'property' : 'properties'}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map((prop) => (
                                <div key={prop.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="h-48 bg-gray-200">
                                        {prop.images && prop.images[0] ? (
                                            <img
                                                src={prop.images[0].url}
                                                alt={prop.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-2">{prop.title}</h3>
                                        <p className="text-gray-600 text-sm mb-2">{prop.location}</p>
                                        <p className="text-blue-600 font-semibold">
                                            {new Intl.NumberFormat('en-TH', {
                                                style: 'currency',
                                                currency: 'THB',
                                                maximumFractionDigits: 0
                                            }).format(prop.price)}
                                            {prop.type === 'rent' ? '/mo' : ''}
                                        </p>
                                        <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                            {prop.type === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                    <h3 className="font-bold mb-2">Debug Info:</h3>
                    <pre className="text-xs overflow-auto">
                        {JSON.stringify({
                            loading,
                            error,
                            propertyCount: properties.length,
                            timestamp: new Date().toISOString()
                        }, null, 2)}
                    </pre>
                </div>
            </div>

            <Footer />
        </div>
    );
}

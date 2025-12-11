import React from 'react';
import { Button } from "@/components/ui/button";
import { Home, MoveLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="text-center px-4">
                <h1 className="text-9xl font-bold text-gray-200">404</h1>
                <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">Page Not Found</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={() => navigate(-1)}
                        variant="outline"
                        className="gap-2"
                    >
                        <MoveLeft className="w-4 h-4" />
                        Go Back
                    </Button>
                    <Button
                        onClick={() => navigate('/')}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                    >
                        <Home className="w-4 h-4" />
                        Home Page
                    </Button>
                </div>
            </div>

            {/* Decorative */}
            <div className="mt-16 text-gray-400 text-sm">
                Samui Service Hub
            </div>
        </div>
    );
}

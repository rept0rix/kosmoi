
import React, { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Lock, Heart, PartyPopper } from 'lucide-react';
import { db } from '@/api/supabaseClient';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AuthGate({ children, actionName = "continue", onAuthSuccess = () => { }, className = "" }) {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Check auth on mount or click
    const checkAuth = async () => {
        const isAuth = await db.auth.isAuthenticated();
        if (isAuth) {
            setIsAuthenticated(true);
            return true;
        }
        return false;
    };

    const handleClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const isAuth = await checkAuth();
        if (isAuth) {
            if (children.props.onClick) {
                children.props.onClick(e);
            }
        } else {
            setShowAuthModal(true);
        }
    };

    const handleLogin = () => {
        // Redirect to login with return path
        navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
    };

    // Clone the child to intercept the click
    const childrenWithAuth = React.cloneElement(children, {
        onClick: handleClick
    });

    return (
        <>
            {childrenWithAuth}

            <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl">
                    <div className="bg-white p-6 text-center">

                        {/* Easy-style Illustration (Placeholder or Emoji art) */}
                        <div className="flex justify-center mb-4 relative">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative">
                                <User className="w-12 h-12 text-blue-500" />
                                <div className="absolute top-0 right-0 bg-yellow-400 p-1.5 rounded-full border-2 border-white">
                                    <Lock className="w-4 h-4 text-white" />
                                </div>
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            כשמחוברים, הכל איזי :)
                        </h2>

                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                            מתחברים כדי לראות מספרי טלפון, לכתוב ביקורות ולשמור את המקומות שאהבתם.
                            <br />
                            זה לוקח בדיוק רגע.
                        </p>

                        <div className="space-y-3">
                            <Button
                                onClick={handleLogin}
                                className="w-full bg-gray-900 hover:bg-black text-white rounded-full py-6 font-medium text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                התחברות / הרשמה
                            </Button>

                            <p className="text-xs text-gray-400 mt-4">
                                אנחנו שומרים על המידע שלך בבטחה. לא נפרסם שום דבר בשמך.
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

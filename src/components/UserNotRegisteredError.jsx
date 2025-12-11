import React from 'react';
import { ShieldAlert, LogOut, Home } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from '@/api/supabaseClient';

const UserNotRegisteredError = () => {
  const handleLogout = async () => {
    try {
      await db.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <Card className="max-w-md w-full border-red-100 shadow-xl overflow-hidden">
        <div className="bg-red-50/50 p-6 flex justify-center pb-2">
          <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
            <ShieldAlert className="h-10 w-10 text-red-600" />
          </div>
        </div>
        <CardHeader className="text-center pt-2">
          <CardTitle className="text-2xl font-bold text-gray-900">Access Restricted</CardTitle>
          <CardDescription className="text-base mt-2">
            This account is not authorized to access the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600">
            <p className="font-medium mb-2 text-slate-900">Possible reasons:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Your account registration is pending approval</li>
              <li>The email address is not in the allowlist</li>
              <li>Your access has been temporarily suspended</li>
            </ul>
          </div>
          <p className="text-center text-sm text-slate-500">
            Please contact your administrator for assistance.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center pb-8">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Button>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default UserNotRegisteredError;

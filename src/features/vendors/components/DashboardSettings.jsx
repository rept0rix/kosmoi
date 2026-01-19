import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Bell, CreditCard, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export const DashboardSettings = ({ business }) => {
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState(business.metadata?.settings || {
        email_notifications: true,
        push_notifications: true,
        public_visibility: true
    });

    const updateSettingsMutation = useMutation({
        mutationFn: async (newSettings) => {
            const { error } = await supabase
                .from('service_providers')
                .update({
                    metadata: {
                        ...business.metadata,
                        settings: newSettings
                    }
                })
                .eq('id', business.id);

            if (error) throw error;
            return newSettings;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
            toast({ title: "Settings Saved", description: "Your preferences have been updated." });
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
        }
    });

    const handleToggle = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);
        updateSettingsMutation.mutate(newSettings);
    };

    return (
        <div className="max-w-2xl space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Online Presence</CardTitle>
                    <CardDescription>Manage how your business appears online.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Public Profile</Label>
                            <p className="text-sm text-muted-foreground">Make your business visible to everyone.</p>
                        </div>
                        <Switch
                            checked={settings.public_visibility}
                            onCheckedChange={() => handleToggle('public_visibility')}
                            disabled={updateSettingsMutation.isPending}
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">Google Maps Sync <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Connected</Badge></Label>
                            <p className="text-sm text-muted-foreground">Automatically update hours and photos from Google.</p>
                        </div>
                        <Button variant="outline" size="sm" disabled>Synched</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifs">Email Notifications</Label>
                        <Switch
                            id="email-notifs"
                            checked={settings.email_notifications}
                            onCheckedChange={() => handleToggle('email_notifications')}
                            disabled={updateSettingsMutation.isPending}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="push-notifs">Push Notifications</Label>
                        <Switch
                            id="push-notifs"
                            checked={settings.push_notifications}
                            onCheckedChange={() => handleToggle('push_notifications')}
                            disabled={updateSettingsMutation.isPending}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Billing & Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div>
                            <p className="font-semibold text-blue-900">Current Plan: {business.status || 'Free'}</p>
                            <p className="text-xs text-blue-600">Basic features</p>
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Upgrade</Button>
                    </div>
                    <Button variant="outline" className="w-full">Manage Payment Methods</Button>
                </CardContent>
            </Card>
        </div>
    );
};

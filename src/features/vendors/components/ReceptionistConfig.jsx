
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Bot, Save, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { ReceptionistAgent } from '@/features/agents/services/ReceptionistAgent';

export function ReceptionistConfig({ provider }) {
    const { user } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    // Test Agent State
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        if (provider?.id) fetchConfig();
    }, [provider]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('agent_configurations')
                .select('*')
                .eq('provider_id', provider.id)
                .eq('agent_type', 'receptionist')
                .single();

            if (data) {
                setConfig(data);
            } else {
                // Initialize default state if no record exists
                setConfig({
                    provider_id: provider.id,
                    agent_type: 'receptionist',
                    is_active: false,
                    auto_reply_enabled: false,
                    tone: 'formal',
                    custom_instructions: ''
                });
            }
        } catch (err) {
            console.error('Error fetching agent config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            // Remove id if it's a new record holder (optional, upsert handles it if unique key matches)
            const { error } = await supabase
                .from('agent_configurations')
                .upsert(config, { onConflict: 'provider_id, agent_type' });

            if (error) throw error;

            toast({
                title: "Settings Saved",
                description: "AI Receptionist configuration updated."
            });
        } catch (error) {
            console.error('Error saving config:', error);
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const handleTestAgent = async () => {
        if (!testMessage.trim()) return;
        setTesting(true);
        setTestResponse('');
        try {
            // Force save first to ensure testing latest config
            await handleSave();

            const response = await ReceptionistAgent.handleIncomingMessage(
                { content: testMessage, sender_id: 'test-user' },
                provider.id
            );

            if (response) {
                setTestResponse(response);
            } else {
                setTestResponse("No response generated (Check if Agent is Active/Auto-Reply Enabled)");
            }
        } catch (error) {
            console.error("Test Error:", error);
            setTestResponse("Error: " + error.message);
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    if (!config) return null;

    return (
        <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-white flex items-center gap-2">
                                <Bot className="w-5 h-5 text-indigo-400" />
                                AI Receptionist
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Automatically reply to customer inquiries with your business style.
                            </CardDescription>
                        </div>
                        <Switch
                            checked={config.is_active}
                            onCheckedChange={(checked) => setConfig({ ...config, is_active: checked })}
                        />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Auto Reply Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <div className="space-y-0.5">
                            <Label className="text-base text-slate-200">Auto-Reply</Label>
                            <p className="text-sm text-slate-500">Automatically reply to new messages when you are away.</p>
                        </div>
                        <Switch
                            checked={config.auto_reply_enabled}
                            onCheckedChange={(checked) => setConfig({ ...config, auto_reply_enabled: checked })}
                            disabled={!config.is_active}
                        />
                    </div>

                    {/* Tone Selector */}
                    <div className="space-y-3">
                        <Label className="text-slate-200">Personality Tone</Label>
                        <Select
                            value={config.tone}
                            onValueChange={(val) => setConfig({ ...config, tone: val })}
                            disabled={!config.is_active}
                        >
                            <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
                                <SelectValue placeholder="Select a tone" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                <SelectItem value="formal">👔 Formal & Professional</SelectItem>
                                <SelectItem value="friendly">👋 Friendly & Welcoming</SelectItem>
                                <SelectItem value="fun">🎉 Fun & Casual</SelectItem>
                                <SelectItem value="pirate">🏴‍☠️ Pirate Mode (Alpha)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Instructions */}
                    <div className="space-y-3">
                        <Label className="text-slate-200 flex items-center gap-2">
                            Custom Knowledge
                            <span className="text-xs text-slate-500 font-normal">(Optional)</span>
                        </Label>
                        <Textarea
                            placeholder="e.g., We are closed on public holidays. Ask customers for their hotel name for pick-up."
                            className="bg-slate-800 border-slate-700 text-slate-200 min-h-[120px]"
                            value={config.custom_instructions || ''}
                            onChange={(e) => setConfig({ ...config, custom_instructions: e.target.value })}
                            disabled={!config.is_active}
                        />
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            The AI uses these instructions to guide its answers.
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Test Playground */}
            {config.is_active && (
                <Card className="border-slate-800 bg-slate-900/50 border-dashed">
                    <CardHeader>
                        <CardTitle className="text-slate-200 text-base">Test Your Receptionist</CardTitle>
                        <CardDescription>Simulate a customer message to see how it replies.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type a message (e.g., 'Are you open?')"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white"
                            />
                            <Button
                                onClick={handleTestAgent}
                                disabled={testing || !testMessage}
                                variant="secondary"
                            >
                                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simulate"}
                            </Button>
                        </div>

                        {testResponse && (
                            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                                <div className="text-xs text-purple-300 mb-1 flex items-center gap-1">
                                    <Bot className="w-3 h-3" /> AI Response:
                                </div>
                                <p className="text-slate-200 italic">"{testResponse}"</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

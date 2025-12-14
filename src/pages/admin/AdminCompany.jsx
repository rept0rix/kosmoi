import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Building2, Target, Wallet, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminCompany() {
    const { t } = useTranslation();
    const [companyData, setCompanyData] = useState({
        name: 'Kosmoi',
        tagline: 'Connect. Solve. Thrive.',
        logoUrl: '/kosmoi_logo_white.svg',
        vision: 'Creating a decentralized city operating system where every interaction is seamless.',
        mission: 'Empower local businesses and residents with AI-driven tools for efficient city living.',
        budget: 1000,
        currency: 'USD',
        oneDollarChallenge: false
    });

    useEffect(() => {
        const stored = localStorage.getItem('kosmoi_company_settings');
        if (stored) {
            setCompanyData(JSON.parse(stored));
        }
    }, []);

    const handleSave = () => {
        localStorage.setItem('kosmoi_company_settings', JSON.stringify(companyData));
        alert('Company settings saved successfully.');
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Company Headquarters</h1>
                    <p className="text-gray-500 mt-2">Global configuration and strategic alignment.</p>
                </div>
                <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" /> Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general" className="gap-2"><Building2 className="w-4 h-4" /> General Identity</TabsTrigger>
                    <TabsTrigger value="strategy" className="gap-2"><Target className="w-4 h-4" /> Strategy & Vision</TabsTrigger>
                    <TabsTrigger value="finance" className="gap-2"><Wallet className="w-4 h-4" /> Finance & Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Identity</CardTitle>
                            <CardDescription>How the world sees us.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input value={companyData.name} onChange={e => setCompanyData({ ...companyData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Tagline</Label>
                                <Input value={companyData.tagline} onChange={e => setCompanyData({ ...companyData, tagline: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Logo URL</Label>
                                <div className="flex gap-4 items-center">
                                    <Input value={companyData.logoUrl} onChange={e => setCompanyData({ ...companyData, logoUrl: e.target.value })} />
                                    <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center p-2">
                                        <img src={companyData.logoUrl} alt="Preview" className="max-w-full max-h-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="strategy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Strategy & Vision</CardTitle>
                            <CardDescription>The North Star for all autonomous agents.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Vision Statement (The "Why")</Label>
                                <Textarea
                                    className="min-h-[100px]"
                                    value={companyData.vision}
                                    onChange={e => setCompanyData({ ...companyData, vision: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">Agents use this to align their autonomous decisions.</p>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Mission Statement (The "what")</Label>
                                <Textarea
                                    className="min-h-[100px]"
                                    value={companyData.mission}
                                    onChange={e => setCompanyData({ ...companyData, mission: e.target.value })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Finance & Operational Metrics</CardTitle>
                            <CardDescription>Budget constraints (Token usage & API costs).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Monthly Budget Cap</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            value={companyData.budget}
                                            onChange={e => setCompanyData({ ...companyData, budget: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Input value={companyData.currency} disabled />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                                <input
                                    type="checkbox"
                                    id="challenge"
                                    checked={companyData.oneDollarChallenge}
                                    onChange={e => setCompanyData({ ...companyData, oneDollarChallenge: e.target.checked })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <label
                                        htmlFor="challenge"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Enable "$1 Challenge" Mode
                                    </label>
                                    <p className="text-sm text-muted-foreground">
                                        Strictly limits agent spending to $1/day. Aggressive optimization.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

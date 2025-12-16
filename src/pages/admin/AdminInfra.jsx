import React from 'react';
import {
    Bot,
    Database,
    Cloud,
    Search,
    Map,
    CreditCard,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ServiceCard = ({
    title,
    icon: Icon,
    status = 'unknown',
    description,
    features = [],
    costModel,
    billingUrl,
    color = 'text-blue-500',
    bgColor = 'bg-blue-500/10',
    borderColor = 'border-blue-500/20',
    usage = null
}) => (
    <Card className="h-full border-slate-800 bg-slate-950/50 backdrop-blur-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
        <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${bgColor} ${color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">{title}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                            {status === 'active' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                            {status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />}
                            <span className="text-xs text-slate-400">
                                {status === 'active' ? 'Connected' : status === 'warning' ? 'Config Required' : 'Not Connected'}
                            </span>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="text-slate-400 border-slate-700 bg-slate-900/50">
                    {costModel}
                </Badge>
            </div>

            <p className="text-sm text-slate-400 mb-6 min-h-[40px] leading-relaxed">
                {description}
            </p>

            {usage && (
                <div className="mb-6 p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs text-slate-400">Estimated Usage</span>
                        <span className="text-xs font-medium text-white">{usage.current} / {usage.limit}</span>
                    </div>
                    <Progress value={(parseInt(usage.current.replace(/\D/g, '')) / parseInt(usage.limit.replace(/\D/g, ''))) * 100} className="h-1.5" />
                </div>
            )}

            <div className="w-full h-px bg-slate-800 mb-4" />

            <div className="space-y-2 mb-6">
                {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${color.replace('text-', 'bg-')}`} />
                        <span className="text-xs text-slate-500">{feature}</span>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all"
                onClick={() => window.open(billingUrl, '_blank')}
            >
                <span className="mr-2">Manage Billing</span>
                <ExternalLink className="w-3 h-3" />
            </Button>
        </CardContent>
    </Card>
);

const AdminInfra = () => {
    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
                    Infrastructure & Costs
                </h1>
                <p className="text-slate-400 text-lg">
                    Monitor your active services, API limits, and control your budget from one place.
                </p>
            </div>

            <Alert className="bg-blue-900/10 border-blue-900/20 text-blue-200">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertTitle>Pro Tip</AlertTitle>
                <AlertDescription className="text-blue-200/80">
                    To avoid unexpected charges, set "Hard Limits" or "Budget Caps" in each provider's billing settings.
                    Most providers (like OpenAI) use a pre-paid credit system, so your risk is capped at the amount you load.
                </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ServiceCard
                    title="OpenAI"
                    status="active"
                    icon={Bot}
                    color="text-emerald-500"
                    bgColor="bg-emerald-500/10"
                    borderColor="border-emerald-500/20"
                    description="Powers the core Agent Brain and chat intelligence."
                    costModel="Pre-paid Credits"
                    usage={{ current: '$2.30', limit: '$10.00' }}
                    features={[
                        "No surprise bills (Credits system)",
                        "Model: GPT-4o & GPT-4-turbo",
                        "Auto-recharge options available"
                    ]}
                    billingUrl="https://platform.openai.com/settings/organization/billing/overview"
                />

                <ServiceCard
                    title="Supabase"
                    status="active"
                    icon={Database}
                    color="text-green-400"
                    bgColor="bg-green-400/10"
                    borderColor="border-green-400/20"
                    description="Database, Authentication, and Real-time subscriptions."
                    costModel="Free Tier (Generous)"
                    usage={{ current: '500MB', limit: '500MB' }}
                    features={[
                        "Database: 500MB included",
                        "Auth: 50k MAU included",
                        "Pause inactive projects automatically"
                    ]}
                    billingUrl="https://supabase.com/dashboard/org/_/billing"
                />

                <ServiceCard
                    title="Apify"
                    status="active"
                    icon={Cloud}
                    color="text-orange-500"
                    bgColor="bg-orange-500/10"
                    borderColor="border-orange-500/20"
                    description="Web scraping and data extraction (Google Maps, Websites)."
                    costModel="$5/mo Free Credits"
                    features={[
                        "Includes $5 free usage monthly",
                        "Pay-as-you-go above limit",
                        "Proxies included"
                    ]}
                    billingUrl="https://console.apify.com/billing"
                />

                <ServiceCard
                    title="Perplexity"
                    status="active"
                    icon={Search}
                    color="text-cyan-400"
                    bgColor="bg-cyan-400/10"
                    borderColor="border-cyan-400/20"
                    description="Deep research and real-time live web search."
                    costModel="Pay-as-you-go"
                    features={[
                        "Requires Pre-paid credits",
                        "Used for 'Research' tasks only",
                        "Sonar-Deep-Research Model"
                    ]}
                    billingUrl="https://www.perplexity.ai/settings/api"
                />

                <ServiceCard
                    title="Google Maps"
                    status="warning"
                    icon={Map}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                    borderColor="border-blue-500/20"
                    description="Interactive maps and location services."
                    costModel="$200/mo Free Credit"
                    features={[
                        "$200 free monthly credit",
                        "Google Cloud Console managed",
                        "Requires active billing account"
                    ]}
                    billingUrl="https://console.cloud.google.com/billing"
                />

                <Card className="h-full border-dashed border-2 border-slate-800 bg-slate-900/20 flex flex-col justify-center items-center p-6 text-center">
                    <CardContent>
                        <CreditCard className="w-12 h-12 text-slate-700 mb-4 mx-auto" />
                        <h3 className="text-lg text-slate-500 font-medium mb-2">Total Estimated Cost</h3>
                        <p className="text-4xl font-bold text-white mb-2">~$0.00</p>
                        <p className="text-xs text-slate-600">Current Monthly Run Rate</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminInfra;


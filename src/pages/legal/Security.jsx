import React from 'react';
import { Shield, Lock, Eye, Server, Globe, FileText, CheckCircle, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Security = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Hero Section */}
            <div className="relative bg-slate-900 border-b border-slate-800 pb-24 pt-16 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
                <div className="relative max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center p-2 bg-blue-500/10 rounded-full mb-6 ring-1 ring-blue-500/20">
                        <Shield className="w-5 h-5 text-blue-400 mr-2" />
                        <span className="text-sm font-medium text-blue-400 tracking-wide uppercase">Trust Center</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                        Security at Kosmoi
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        We prioritize the protection of your data with enterprise-grade security, ensuring your business stays private and resilient.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 pb-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <SecurityCard
                        icon={<Lock className="w-6 h-6 text-green-500" />}
                        title="End-to-End Encryption"
                        description="Data is encrypted at rest and in transit using industry-standard TLS 1.3 and AES-256 protocols."
                    />
                    <SecurityCard
                        icon={<Server className="w-6 h-6 text-purple-500" />}
                        title="Secure Infrastructure"
                        description="Hosted on enterprise-class cloud providers (Vercel & Supabase) with strict access controls and 24/7 monitoring."
                    />
                    <SecurityCard
                        icon={<Eye className="w-6 h-6 text-blue-500" />}
                        title="Privacy First"
                        description="We design with privacy by default. We never sell your personal data to advertisers or third parties."
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Built for Compliance</h2>
                        <div className="space-y-4">
                            <ComplianceItem
                                title="GDPR Ready"
                                desc="We adhere to the General Data Protection Regulation regulations for user data rights."
                            />
                            <ComplianceItem
                                title="PDPA Compliant"
                                desc="Fully compliant with Thailand's Personal Data Protection Act for local operations."
                            />
                            <ComplianceItem
                                title="SOC 2 Type II"
                                desc="Our infrastructure partners are SOC 2 certified, ensuring high standards of security and availability."
                            />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg">
                                <Smartphone className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">Mobile Security</h3>
                                <p className="text-sm text-slate-500">Secure on every device</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <FeatureRow text="Biometric Authentication support" />
                            <FeatureRow text="Secure Session Management" />
                            <FeatureRow text="Real-time Threat Detection" />
                            <FeatureRow text="Automatic Security Updates" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-center text-white shadow-2xl">
                    <h2 className="text-3xl font-bold mb-4">Have specific security questions?</h2>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Our dedicated security team is available to answer any questions regarding our practices, compliance, or vulnerability reporting.
                    </p>
                    <a href="mailto:security@kosmoi.com" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 transition-colors">
                        Contact Security Team
                    </a>
                </div>
            </div>
        </div>
    );
};

const SecurityCard = ({ icon, title, description }) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/50 backdrop-blur">
        <CardHeader>
            <div className="bg-slate-100 dark:bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                {icon}
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
            </CardDescription>
        </CardContent>
    </Card>
);

const ComplianceItem = ({ title, desc }) => (
    <div className="flex gap-4 p-4 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="mt-1">
            <CheckCircle className="w-5 h-5 text-blue-500" />
        </div>
        <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">{desc}</p>
        </div>
    </div>
);

const FeatureRow = ({ text }) => (
    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
        <span className="text-sm font-medium">{text}</span>
    </div>
);

export default Security;

import React from 'react';
import { Users, Globe, Zap, ShieldCheck, TrendingUp, Award, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AboutUs = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Compact Hero Section */}
            <div className="bg-slate-900 text-white pt-24 pb-12 md:pt-32 md:pb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <Badge variant="secondary" className="mb-4 bg-slate-800 text-slate-300 hover:bg-slate-700 border-0">Our Story</Badge>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('about.title')}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        {t('about.subtitle')}
                    </p>
                </div>
            </div>

            {/* Stats Bar - High Density Info */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800">
                        <StatItem icon={<Globe className="w-4 h-4 text-blue-500" />} value="50+" label="Countries" />
                        <StatItem icon={<Building className="w-4 h-4 text-purple-500" />} value="2,000+" label="Partners" />
                        <StatItem icon={<Users className="w-4 h-4 text-green-500" />} value="150k" label="Active Users" />
                        <StatItem icon={<Award className="w-4 h-4 text-amber-500" />} value="#1" label="Rated Platform" />
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {/* Mission & Why - Side by Side for density */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                {t('about.mission')}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t('about.mission_desc_1')}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                                {t('about.mission_desc_2')}
                            </p>
                        </div>

                        <div className="pt-4">
                            <h3 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">{t('about.values')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ValueCard
                                    icon={<Globe className="w-4 h-4 text-blue-500" />}
                                    title={t('about.global')}
                                    desc={t('about.global_desc')}
                                />
                                <ValueCard
                                    icon={<Users className="w-4 h-4 text-green-500" />}
                                    title={t('about.human')}
                                    desc={t('about.human_desc')}
                                />
                                <ValueCard
                                    icon={<ShieldCheck className="w-4 h-4 text-purple-500" />}
                                    title={t('about.trust')}
                                    desc={t('about.trust_desc')}
                                />
                                <ValueCard
                                    icon={<TrendingUp className="w-4 h-4 text-indigo-500" />}
                                    title="Innovation"
                                    desc="Constantly pushing boundaries."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="bg-slate-900 text-white border-0 shadow-lg h-full">
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div>
                                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur">
                                        <Award className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{t('about.why')}</h3>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                                        {t('about.why_desc')}
                                    </p>
                                    <ul className="space-y-3 text-sm text-slate-300">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            AI-Driven Insights
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                            Real-time Analytics
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                            Global Reach
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatItem = ({ icon, value, label }) => (
    <div className="py-6 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{value}</span>
        </div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
);

const ValueCard = ({ icon, title, desc }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="mt-0.5 shrink-0 bg-slate-50 dark:bg-slate-800 p-1.5 rounded">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{title}</h4>
            <p className="text-xs text-slate-500 leading-snug mt-1">{desc}</p>
        </div>
    </div>
);

export default AboutUs;
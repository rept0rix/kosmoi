import React from 'react';
import { Users, Globe, Zap, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutUs = () => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="bg-slate-900 text-white py-20">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">{t('about.title')}</h1>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        {t('about.subtitle')}
                    </p>
                </div>
            </div>

            {/* Mission & Vision */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                    <div>
                        <h2 className="text-3xl font-bold mb-6 text-slate-900">{t('about.mission')}</h2>
                        <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                            {t('about.mission_desc_1')}
                        </p>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {t('about.mission_desc_2')}
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
                        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold mb-4">{t('about.why')}</h3>
                        <p className="text-slate-600">
                            {t('about.why_desc')}
                        </p>
                    </div>
                </div>

                {/* Values Grid */}
                <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">{t('about.values')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
                            <Globe className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('about.global')}</h3>
                        <p className="text-slate-500">{t('about.global_desc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-6">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('about.human')}</h3>
                        <p className="text-slate-500">{t('about.human_desc')}</p>
                    </div>
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mx-auto mb-6">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">{t('about.trust')}</h3>
                        <p className="text-slate-500">{t('about.trust_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;
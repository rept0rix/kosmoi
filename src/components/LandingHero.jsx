import React from 'react';
import { Bot, Map, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LandingHero = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="relative bg-slate-900 text-white overflow-hidden">
            {/* Background Gradient/Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 opacity-90 z-0"></div>
            <div className="absolute inset-0 bg-[url('/kosmoi_cover_bg.png')] bg-cover bg-center mix-blend-overlay opacity-30 z-0"></div>

            <div className="container mx-auto px-4 py-20 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1 text-blue-300 text-sm font-medium mb-6">
                        <Bot className="w-4 h-4" />
                        <span>{t('hero.badge')}</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                        {t('hero.title')}
                    </h1>

                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        {t('hero.subtitle')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                        <Button
                            size="lg"
                            className="bg-blue-600 hover:bg-blue-700 h-14 px-8 text-lg rounded-full"
                            onClick={() => navigate('/vendor-signup')}
                        >
                            {t('hero.join_pro')}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            className="bg-transparent border-slate-600 text-white hover:bg-white/10 h-14 px-8 text-lg rounded-full"
                            onClick={() => navigate('/about')}
                        >
                            {t('hero.learn_more')}
                        </Button>
                    </div>

                    {/* Feature Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                                <Bot className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('hero.feature_smart')}</h3>
                            <p className="text-slate-400 text-sm">{t('hero.feature_smart_desc')}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-4">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('hero.feature_verified')}</h3>
                            <p className="text-slate-400 text-sm">{t('hero.feature_verified_desc')}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-4">
                                <Map className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold mb-2">{t('hero.feature_map')}</h3>
                            <p className="text-slate-400 text-sm">{t('hero.feature_map_desc')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingHero;
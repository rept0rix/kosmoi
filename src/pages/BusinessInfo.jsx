import React from 'react';
import { CheckCircle, HelpCircle, DollarSign, TrendingUp, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const BusinessInfo = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const faqs = [
        { q: t('business.faq_1_q'), a: t('business.faq_1_a') },
        { q: t('business.faq_2_q'), a: t('business.faq_2_a') },
        { q: t('business.faq_3_q'), a: t('business.faq_3_a') }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
                        {t('business.title')}
                    </h1>
                    <p className="mt-4 text-xl text-slate-600">
                        {t('business.subtitle')}
                    </p>
                </div>

                {/* How it Works */}
                <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-slate-900">{t('business.how_it_works')}</h2>
                    <p className="text-slate-600">
                        {t('business.how_it_works_desc')}
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="bg-blue-100 p-3 rounded-full mb-4">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg">{t('business.visibility')}</h3>
                            <p className="text-sm text-slate-500 mt-2">{t('business.visibility_desc')}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="bg-yellow-100 p-3 rounded-full mb-4">
                                <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h3 className="font-semibold text-lg">{t('business.tools')}</h3>
                            <p className="text-sm text-slate-500 mt-2">{t('business.tools_desc')}</p>
                        </div>
                        <div className="flex flex-col items-center text-center p-4">
                            <div className="bg-green-100 p-3 rounded-full mb-4">
                                <Shield className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg">{t('business.network')}</h3>
                            <p className="text-sm text-slate-500 mt-2">{t('business.network_desc')}</p>
                        </div>
                    </div>
                </div>

                {/* Pricing Model */}
                <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-8 text-center border-b border-slate-800">
                        <h2 className="text-3xl font-bold">{t('business.pricing_title')}</h2>
                        <p className="text-slate-400 mt-2">{t('business.pricing_subtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                        {/* Trial */}
                        <div className="p-8 text-center text-slate-300">
                            <h3 className="text-xl font-bold text-white mb-2">{t('business.trial_title')}</h3>
                            <div className="text-4xl font-extrabold text-yellow-400 mb-4">{t('business.free')}</div>
                            <p className="text-sm mb-6">{t('business.trial_desc')}</p>
                            <ul className="text-left space-y-3 text-sm mb-8">
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {t('business.full_access')}</li>
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {t('business.ai_setup')}</li>
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {t('business.no_commitment')}</li>
                            </ul>
                        </div>

                        {/* Starter */}
                        <div className="p-8 text-center bg-slate-800/50">
                            <div className="inline-block px-3 py-1 bg-yellow-500 text-slate-900 text-xs font-bold rounded-full mb-4">{t('business.most_popular')}</div>
                            <h3 className="text-xl font-bold text-white mb-2">{t('business.starter_title')}</h3>
                            <div className="text-4xl font-extrabold text-white mb-1">{t('business.starter_price')}</div>
                            <p className="text-xs text-slate-400 mb-4">{t('business.starter_period')}</p>
                            <ul className="text-left space-y-3 text-sm mb-8 text-slate-300">
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-yellow-500" /> {t('business.verified_badge')}</li>
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-yellow-500" /> {t('business.priority_listing')}</li>
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-yellow-500" /> {t('business.support')}</li>
                            </ul>
                            <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold">
                                {t('business.start_starter')}
                            </Button>
                        </div>

                        {/* Scale */}
                        <div className="p-8 text-center text-slate-300">
                            <h3 className="text-xl font-bold text-white mb-2">{t('business.growth_title')}</h3>
                            <div className="text-4xl font-extrabold text-white mb-1">{t('business.growth_price')}</div>
                            <p className="text-xs text-slate-400 mb-4">{t('business.growth_period')}</p>
                            <ul className="text-left space-y-3 text-sm mb-8">
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {t('business.all_features')}</li>
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {t('business.weekly_reports')}</li>
                                <li className="flex items-center"><CheckCircle className="w-4 h-4 mr-2 text-green-500" /> {t('business.marketing_boost')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Q&A */}
                <div className="bg-white rounded-2xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                        <HelpCircle className="w-6 h-6 mr-2 text-blue-600" /> {t('business.faq_title')}
                    </h2>
                    <div className="space-y-6">
                        {faqs.map((item, i) => (
                            <div key={i} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{item.q}</h3>
                                <p className="text-slate-600">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Contact */}
                <div className="text-center">
                    <p className="text-slate-500 mb-4">{t('business.still_questions')}</p>
                    <Button
                        onClick={() => window.location.href = 'https://wa.me/66000000000'}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8"
                    >
                        {t('business.chat_whatsapp')}
                    </Button>
                </div>

            </div>
        </div>
    );
};

export default BusinessInfo;
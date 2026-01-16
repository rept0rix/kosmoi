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
        <div className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
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

                {/* CTA to Pricing */}
                <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden p-12 text-center">
                    <h2 className="text-3xl font-bold mb-4">{t('business.ready_to_start', 'Ready to scale your business?')}</h2>
                    <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
                        {t('business.pricing_cta_desc', 'Choose the plan that fits your growth stage. From a $1 test drive to full-scale partnership.')}
                    </p>
                    <Button
                        onClick={() => navigate('/pricing')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 px-8 rounded-xl text-lg shadow-lg shadow-blue-900/50 transition-all hover:scale-105"
                    >
                        {t('business.view_pricing', 'View Plans & Pricing')} <TrendingUp className="ml-2 w-5 h-5" />
                    </Button>
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
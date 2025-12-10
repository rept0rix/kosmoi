import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">K</div>
                            <span className="text-2xl font-bold text-white">Kosmoi</span>
                        </div>
                        <p className="text-sm text-slate-400">
                            {t('footer.brand_description')}
                        </p>
                    </div>

                    {/* Information Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('footer.information')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/app" className="hover:text-blue-400 transition-colors">{t('footer.enter_app')}</Link></li>
                            <li><Link to="/team" className="hover:text-blue-400 transition-colors">{t('footer.about_us')}</Link></li>
                            <li><Link to="/business-info" className="hover:text-blue-400 transition-colors">{t('footer.partner_with_us')}</Link></li>
                            <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">{t('footer.pricing_plans')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('footer.legal')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/legal/terms" className="hover:text-blue-400 transition-colors">{t('footer.terms_of_service')}</Link></li>
                            <li><Link to="/legal/privacy" className="hover:text-blue-400 transition-colors">{t('footer.privacy_policy')}</Link></li>
                            <li><Link to="/legal/accessibility" className="hover:text-blue-400 transition-colors">{t('footer.accessibility')}</Link></li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('footer.support')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/contact" className="hover:text-blue-400 transition-colors">{t('footer.contact_us')}</Link></li>
                            <li><a href="mailto:support@kosmoi.site" className="hover:text-blue-400 transition-colors">support@kosmoi.site</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>{t('footer.copyright')}</p>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {t('footer.secure_private')}</span>
                        <span className="hidden md:inline">|</span>
                        <span>{t('footer.compliance')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

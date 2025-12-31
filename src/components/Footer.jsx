import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/kosmoi_logo_white.svg" alt="Kosmoi" className="h-10 w-auto" />
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed mb-6">
                            {t('footer.brand_description', 'Connecting Koh Samui with Intelligent Action. We build the digital heartbeat of the island, streamlining operations and driving growth.')}
                        </p>
                        <div className="flex gap-4">
                            {/* Social Icons Placeholder */}
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">OK</div>
                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-blue-400 hover:text-white transition-colors cursor-pointer">LI</div>
                        </div>
                    </div>

                    {/* Information Column */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">{t('footer.information', 'Information')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/app" className="hover:text-blue-400 transition-colors flex items-center gap-2"><ArrowRight className="w-3 h-3" /> {t('footer.enter_app', 'Enter App')}</Link></li>
                            <li><Link to="/team" className="hover:text-blue-400 transition-colors">{t('footer.team', 'Team')}</Link></li>
                            <li><Link to="/about" className="hover:text-blue-400 transition-colors">{t('footer.about_us', 'About Us')}</Link></li>
                            <li><Link to="/business-info" className="hover:text-blue-400 transition-colors">{t('footer.partner_with_us', 'Partner With Us')}</Link></li>
                            <li><Link to="/pricing" className="hover:text-blue-400 transition-colors">{t('footer.pricing_plans', 'Plans & Pricing')}</Link></li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">{t('footer.legal', 'Legal')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/legal/terms" className="hover:text-blue-400 transition-colors">{t('footer.terms_of_service', 'Terms of Service')}</Link></li>
                            <li><Link to="/legal/privacy" className="hover:text-blue-400 transition-colors">{t('footer.privacy_policy', 'Privacy Policy')}</Link></li>
                            <li><Link to="/legal/security" className="hover:text-blue-400 transition-colors">{t('footer.security', 'Security')}</Link></li>
                            <li><Link to="/legal/accessibility" className="hover:text-blue-400 transition-colors">{t('footer.accessibility', 'Accessibility Statement')}</Link></li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="text-white font-bold text-lg mb-6">{t('footer.support', 'Support')}</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/contact" className="hover:text-blue-400 transition-colors">{t('footer.contact_us', 'Contact Us')}</Link></li>
                            <li><a href="mailto:support@kosmoi.site" className="hover:text-blue-400 transition-colors">support@kosmoi.site</a></li>
                            <li className="pt-4 mt-4 border-t border-slate-900">
                                <Link to="/admin" className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                    <ShieldCheck className="w-3 h-3" />
                                    {t('footer.admin_access', 'Admin Login')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
                    <p>{t('footer.copyright', `© ${new Date().getFullYear()} Kosmoi. All rights reserved.`)}</p>
                    <div className="flex flex-col md:flex-row items-center gap-4 mt-4 md:mt-0">
                        <Link to="/legal/security" className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-900 text-slate-400 hover:text-white transition-colors">
                            <ShieldCheck className="w-3 h-3 text-green-500" />
                            {t('footer.secure_private', 'Secure & Private')}
                        </Link>
                        <span className="hidden md:inline text-slate-800">|</span>
                        <span className="flex items-center gap-2">
                            <Heart className="w-3 h-3 text-red-500 animate-pulse" />
                            {t('footer.compliance', 'GDPR & SOC2 Compliant')}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

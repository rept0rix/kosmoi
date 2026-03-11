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
                            {/* Instagram */}
                            <a href="https://instagram.com/kosmoi.site" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-pink-600 hover:text-white transition-colors" aria-label="Instagram">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                            </a>
                            {/* Facebook */}
                            <a href="https://facebook.com/kosmoi" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-colors" aria-label="Facebook">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                            </a>
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

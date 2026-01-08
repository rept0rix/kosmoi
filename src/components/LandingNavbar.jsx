import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ChevronDown, User, LogIn, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from '@/features/auth/context/AuthContext';

const LandingNavbar = () => {
    const location = useLocation(); // Ensure useLocation is imported or available if inside Router context
    // ... existing hooks
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isScrolled, setIsScrolled] = React.useState(false);

    // Define pages with Dark Hero sections where header text should be white initially
    const darkHeroPages = ['/', '/about', '/he', '/he/about', '/th', '/th/about', '/ru', '/ru/about']; // Add other langs if needed
    const isDarkHeroPage = darkHeroPages.includes(location.pathname) || location.pathname === '/' || location.pathname.endsWith('/about'); /* Simple check */

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: t('nav.about', 'About'), href: '/about' },
        { name: t('nav.business', 'Business'), href: '/business-info' },
        { name: t('nav.pricing', 'Pricing'), href: '/pricing' },
        { name: t('nav.blog', 'Blog'), href: '/blog' },
        { name: t('nav.contact', 'Contact'), href: '/contact' },
    ];

    const categories = [
        { name: t('category.real_estate', 'Real Estate'), href: '/real-estate' },
        { name: t('category.transport', 'Transport'), href: '/transport' },
        { name: t('category.experiences', 'Experiences'), href: '/experiences' },
        { name: t('category.wellness', 'Wellness'), href: '/wellness' },
    ];

    // Dynamic Text Color Logic
    // If Scrolled: Text is Dark (Gray-700) because BG is White.
    // If Not Scrolled:
    //    If Dark Hero Page: Text is White.
    //    If Light Page: Text is Dark (Gray-700).
    const isTextWhite = !isScrolled && isDarkHeroPage;
    const textColorClass = isTextWhite ? 'text-white hover:text-white/80' : 'text-gray-700 dark:text-gray-200 hover:text-blue-600';
    const logoSrc = isTextWhite ? "/kosmoi_logo_white.svg" : "/kosmoi_logo.svg";

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-2 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800' : 'py-4 bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <img src={logoSrc} alt="Kosmoi" className="h-10 w-auto" />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8 rtl:space-x-reverse">
                        {/* Categories Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger className={`flex items-center gap-1 text-sm font-medium transition-colors focus:outline-none ${textColorClass}`}>
                                {t('nav.explore', 'Explore')} <ChevronDown className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {categories.map((cat) => (
                                    <DropdownMenuItem key={cat.href} asChild>
                                        <Link to={cat.href} className="w-full cursor-pointer">{cat.name}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className={`text-sm font-medium transition-colors ${textColorClass}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <LanguageSwitcher />

                        {isAuthenticated ? (
                            <Button asChild variant="default" size="sm" className="gap-2 rounded-full">
                                <Link to="/app">
                                    {t('nav.dashboard', 'Dashboard')} <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="ghost" size="sm" className="hidden lg:flex">
                                    <Link to="/one-dollar" className={`font-semibold ${isTextWhite ? 'text-white/90 hover:text-white hover:bg-white/10' : 'text-blue-600 hover:text-blue-700'}`}>
                                        Test Drive (35฿)
                                    </Link>
                                </Button>
                                <Button asChild variant="ghost" size="sm" className={isTextWhite ? 'text-white hover:bg-white/10' : ''}>
                                    <Link to="/login">{t('nav.login', 'Login')}</Link>
                                </Button>
                                <Button asChild variant="default" size="sm" className="rounded-full px-6">
                                    <Link to="/login?signup=true">{t('nav.get_started', 'Get Started')}</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-2">
                        <LanguageSwitcher />
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className={isTextWhite ? 'text-white hover:bg-white/10' : ''}>
                                    <Menu className={`w-6 h-6 ${isTextWhite ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <div className="flex flex-col gap-6 mt-8">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-2">{t('nav.explore', 'Explore')}</h3>
                                        {categories.map((cat) => (
                                            <Link key={cat.href} to={cat.href} className="text-base py-1 hover:text-blue-600">
                                                {cat.name}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-semibold text-lg border-b pb-2 mb-2">{t('nav.menu', 'Menu')}</h3>
                                        {navLinks.map((link) => (
                                            <Link key={link.href} to={link.href} className="text-base py-1 hover:text-blue-600">
                                                {link.name}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-6 border-t flex flex-col gap-3">
                                        {isAuthenticated ? (
                                            <Button asChild className="w-full">
                                                <Link to="/app">{t('nav.dashboard', 'Go to Dashboard')}</Link>
                                            </Button>
                                        ) : (
                                            <>
                                                <Button asChild variant="outline" className="w-full">
                                                    <Link to="/login">{t('nav.login', 'Login')}</Link>
                                                </Button>
                                                <Button asChild className="w-full">
                                                    <Link to="/login?signup=true">{t('nav.get_started', 'Get Started')}</Link>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default LandingNavbar;

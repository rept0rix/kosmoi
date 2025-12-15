
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NavigationBar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <img
                            src="/kosmoi_logo_blue.svg"
                            alt="Kosmoi"
                            className="h-9 w-auto group-hover:opacity-80 transition-opacity"
                            onError={(e) => { e.currentTarget.src = "https://placehold.co/200x50?text=Kosmoi"; }}
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-1">
                        <Link to="/real-estate" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">Real Estate</Link>
                        <Link to="/experiences" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">Experiences</Link>
                        <Link to="/provider-dashboard" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">For Drivers</Link>
                        <Link to="/business" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all">Business</Link>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all flex items-center gap-1 focus:outline-none">
                                    More <ChevronDown className="w-3 h-3 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-white/95 backdrop-blur-sm border-slate-100 shadow-xl rounded-xl">
                                <DropdownMenuItem asChild>
                                    <Link to="/about" className="cursor-pointer">About Us</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/team" className="cursor-pointer">Team</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/wallet" className="cursor-pointer">Kosmoi Wallet</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            to="/app"
                            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-blue-600 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                        >
                            Enter App
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none bg-slate-50 rounded-lg"
                        >
                            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 absolute w-full left-0 top-20 shadow-2xl z-40 animate-in slide-in-from-top-2">
                    <div className="px-4 pt-4 pb-6 space-y-2">
                        <Link to="/real-estate" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Real Estate</Link>
                        <Link to="/experiences" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Experiences</Link>
                        <Link to="/provider-dashboard" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">For Drivers</Link>
                        <Link to="/business" className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">Business</Link>
                        <div className="pt-4 mt-4 border-t border-slate-100">
                            <Link to="/app" className="block w-full text-center px-4 py-3 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-blue-600 transition-all shadow-lg">
                                Enter App
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

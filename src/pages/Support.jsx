
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    MessageSquare,
    HelpCircle,
    Bot,
    User,
    Ticket,
    ChevronDown,
    ChevronUp,
    Search,
    Send
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';

import { KnowledgeService } from '@/services/ai/KnowledgeService';

const Support = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [ticketSubject, setTicketSubject] = useState('');
    const [ticketMessage, setTicketMessage] = useState('');
    const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
    const [ticketSuccess, setTicketSuccess] = useState(false);

    // Tier 1: Dummy FAQ Data
    const faqs = [
        { q: "How do I reset my password?", a: "Go to Settings > Profile > Security to update your password. If you cannot login, use the 'Forgot Password' link on the login page." },
        { q: "How do I become a service provider?", a: "Navigate to 'Business Info' in the menu and click 'Register Business'. Follow the onboarding steps." },
        { q: "Is payment secure?", a: "Yes, we use Stripe for all transactions, ensuring industry-standard security." },
        { q: "Can I cancel a booking?", a: "Cancellation policies depend on the provider. Check your booking details in the 'My Bookings' section." },
        { q: "How does the Concierge work?", a: "The Concierge AI can help you plan trips, find services, and answer questions about Koh Samui. Just click the 'Chat' icon." }
    ];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setSearchResults(null);

        try {
            const context = await KnowledgeService.retrieveContext(searchQuery);
            // Parse context because retrieveContext returns a formatted string with "--- FILE: ..."
            // We want to display snippets.
            // Actually, for a simple bot display, let's just show the raw text or try to parse if structure permits.
            // KnowledgeService.retrieveContext returns a string. Let's wrap it.

            if (context) {
                setSearchResults(context);
            } else {
                setSearchResults("I couldn't find any specific information in my knowledge base, but I can still try to help via the Concierge Agent.");
            }
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults("Sorry, I encountered an error searching the knowledge base.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleTicketSubmit = (e) => {
        e.preventDefault();
        setIsSubmittingTicket(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmittingTicket(false);
            setTicketSuccess(true);
            setTicketSubject('');
            setTicketMessage('');
            // Reset success message after 5 seconds
            setTimeout(() => setTicketSuccess(false), 5000);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold text-slate-900">How can we help you today?</h1>
                    <p className="text-lg text-slate-600">Choose the best way to get support.</p>
                </div>

                {/* Tier 1: FAQ Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="w-6 h-6 text-blue-600" />
                            Frequently Asked Questions
                        </CardTitle>
                        <CardDescription>Quick answers to common questions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                                    <AccordionContent className="text-slate-600">
                                        {faq.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Tier 2 & 3: AI & Agent */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Knowledge Bot */}
                    <Card className="border-blue-100 bg-blue-50/50 flex flex-col h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-6 h-6 text-cyan-600" />
                                Knowledge Bot
                            </CardTitle>
                            <CardDescription>Instant answers from our documentation.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ask a question..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="bg-white"
                                />
                                <Button size="icon" onClick={handleSearch} disabled={isSearching}>
                                    {isSearching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
                                </Button>
                            </div>

                            {searchResults && (
                                <div className="bg-white p-3 rounded-lg border border-blue-100 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap">
                                    <p className="font-semibold text-blue-600 mb-1">Answer:</p>
                                    {searchResults}
                                </div>
                            )}

                            {!searchResults && !isSearching && (
                                <p className="text-xs text-slate-500">Example: "What is the best time to visit?", "How to book a taxi?"</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Human-like Agent */}
                    <Card className="border-purple-100 bg-purple-50/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-purple-600" />
                                Concierge Agent
                            </CardTitle>
                            <CardDescription>Personalized assistance for complex needs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600 mb-4">
                                Our AI Concierge can help plan your trip, manage bookings, and guide you through the app.
                            </p>
                            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                                <Link to="/chat/concierge" state={{ context: searchQuery ? `I was searching for "${searchQuery}" in the help center but couldn't find what I needed. Can you help?` : "I need help with a support issue." }}>
                                    Start Chat with Concierge
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Tier 4: Ticket System */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ticket className="w-6 h-6 text-orange-600" />
                            Submit a Ticket
                        </CardTitle>
                        <CardDescription>Still need help? Our human support team is here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {ticketSuccess ? (
                            <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                Ticket submitted successfully! We'll reply via email shortly.
                            </div>
                        ) : (
                            <form onSubmit={handleTicketSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                    <Input
                                        required
                                        placeholder="Brief description of the issue"
                                        value={ticketSubject}
                                        onChange={(e) => setTicketSubject(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                    <Textarea
                                        required
                                        placeholder="Describe your issue in detail..."
                                        className="min-h-[120px]"
                                        value={ticketMessage}
                                        onChange={(e) => setTicketMessage(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmittingTicket} className="w-full">
                                    {isSubmittingTicket ? 'Submitting...' : 'Open Ticket'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default Support;

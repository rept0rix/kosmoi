import React from 'react';
import { Shield, Eye, Lock, FileText, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const Privacy = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6">
                        <Eye className="w-6 h-6" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        We believe in transparency. Here's exactly how we handle your data to provide you with the best possible service.
                    </p>
                    <div className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">
                        <span>Last Updated: December 2025</span>
                    </div>
                </div>
            </div>

            {/* Core Privacy Principles */}
            <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <PrincipleCard
                    icon={<Shield className="w-5 h-5 text-green-500" />}
                    title="Data Protection"
                    desc="Encrypted at rest and in transit."
                />
                <PrincipleCard
                    icon={<Lock className="w-5 h-5 text-blue-500" />}
                    title="No Data Selling"
                    desc="We never sell your personal info."
                />
                <PrincipleCard
                    icon={<FileText className="w-5 h-5 text-purple-500" />}
                    title="User Control"
                    desc="You own your data, period."
                />
            </div>

            {/* Detailed Policies */}
            <div className="max-w-3xl mx-auto px-4 pb-24">
                <Accordion type="single" collapsible className="w-full space-y-4">
                    <PolicyItem value="item-1" title="1. Information We Collect">
                        <p className="mb-4">
                            When you use Kosmoi, we collect information to provide better services:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                            <li><strong>Personal Information:</strong> Name, email address, and phone number when you register.</li>
                            <li><strong>Usage Data:</strong> Pages visited, features used, and time spent on the platform.</li>
                            <li><strong>Device Information:</strong> Browser type, IP address, and operating system.</li>
                        </ul>
                    </PolicyItem>

                    <PolicyItem value="item-2" title="2. How We Use Your Information">
                        <p className="mb-4">We use your data strictly for:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                            <li>Providing and maintaining our Service.</li>
                            <li>Notifying you about changes to our Service.</li>
                            <li>Allowing you to participate in interactive features when you choose to do so.</li>
                            <li>Providing customer support.</li>
                            <li>Gathering analysis or valuable information so that we can improve our Service.</li>
                        </ul>
                    </PolicyItem>

                    <PolicyItem value="item-3" title="3. Data Retention & Deletion">
                        <p className="mb-4">
                            We will retain your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy.
                            You can request deletion of your account and all associated data at any time via your account settings or by contacting support.
                        </p>
                    </PolicyItem>

                    <PolicyItem value="item-4" title="4. Cookies & Tracking">
                        <p className="mb-4">
                            We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.
                            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                        </p>
                    </PolicyItem>

                    <PolicyItem value="item-5" title="5. Third-Party Service Providers">
                        <p className="mb-4">
                            We may employ third-party companies and individuals due to the following reasons:
                        </p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-400">
                            <li>To facilitate our Service (e.g., Supabase for database, Vercel for hosting).</li>
                            <li>To provide the Service on our behalf.</li>
                            <li>To perform Service-related services.</li>
                            <li>To assist us in analyzing how our Service is used.</li>
                        </ul>
                    </PolicyItem>
                </Accordion>

                <div className="mt-12 p-6 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Have questions about your privacy?</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                        Our Data Protection Officer is here to help.
                    </p>
                    <a href="mailto:privacy@kosmoi.com" className="text-blue-600 hover:text-blue-500 font-medium text-sm">
                        Contact Privacy Team &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
};

const PrincipleCard = ({ icon, title, desc }) => (
    <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
        <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </CardContent>
    </Card>
);

const PolicyItem = ({ value, title, children }) => (
    <AccordionItem value={value} className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 px-4">
        <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold text-slate-900 dark:text-white">
            {title}
        </AccordionTrigger>
        <AccordionContent className="text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
            {children}
        </AccordionContent>
    </AccordionItem>
);

export default Privacy;

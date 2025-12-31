import React from 'react';
import { Scale, FileCheck, AlertCircle, HelpCircle } from 'lucide-react';

const Terms = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-6">
                        <Scale className="w-6 h-6" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Terms of Service</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Please read these terms carefully before using our platform. They define the rules and regulations for the use of Kosmoi's Website.
                    </p>
                    <div className="mt-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">
                        <span>Last Updated: December 2025</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="space-y-12">
                    <Section
                        number="01"
                        title="Acceptance of Terms"
                        content="By accessing this website we assume you accept these terms and conditions. Do not continue to use Kosmoi if you do not agree to take all of the terms and conditions stated on this page."
                    />

                    <Section
                        number="02"
                        title="License"
                        content="Unless otherwise stated, Kosmoi and/or its licensors own the intellectual property rights for all material on Kosmoi. All intellectual property rights are reserved. You may access this from Kosmoi for your own personal use subjected to restrictions set in these terms."
                    />

                    <Section
                        number="03"
                        title="User Accounts"
                        content={
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You must be at least 18 years of age to use this Service.</li>
                                <li>You are responsible for maintaining the security of your account and password.</li>
                                <li>You are responsible for all content posted and activity that occurs under your account.</li>
                            </ul>
                        }
                    />

                    <Section
                        number="04"
                        title="Hyperlinking to our Content"
                        content="Organizations may link to our home page, to publications or to other Website information so long as the link: (a) is not in any way deceptive; (b) does not falsely imply sponsorship, endorsement or approval of the linking party and its products and/or services."
                    />

                    <Section
                        number="05"
                        title="Disclaimer"
                        content="To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will: limit or exclude our or your liability for death or personal injury; limit or exclude our or your liability for fraud or fraudulent misrepresentation."
                    />
                </div>

                {/* Footer Note */}
                <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex items-start gap-4 text-slate-500 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>
                        These terms constitute the entire agreement between us regarding our Service, and supersede and replace any prior agreements we might have had between us regarding the Service.
                    </p>
                </div>
            </div>
        </div>
    );
};

const Section = ({ number, title, content }) => (
    <div className="flex gap-6 md:gap-8">
        <div className="shrink-0 flex flex-col items-center">
            <span className="text-2xl font-bold text-slate-200 dark:text-slate-800 select-none">{number}</span>
            <div className="w-px h-full bg-slate-100 dark:bg-slate-800 mt-2"></div>
        </div>
        <div className="pb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                {title}
            </h2>
            <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {content}
            </div>
        </div>
    </div>
);

export default Terms;

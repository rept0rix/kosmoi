import React from 'react';

const Accessibility = () => {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-slate-900">Accessibility Statement</h1>
            <p className="text-sm text-slate-500 mb-8">Last Updated: December 2025</p>

            <div className="prose prose-slate lg:prose-lg">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">Commitment to Accessibility</h2>
                    <p className="mb-4">
                        Kosmoi is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">Conformance Status</h2>
                    <p className="mb-4">
                        The Web Content Accessibility Guidelines (WCAG) defines requirements for designers and developers to improve accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA. Kosmoi is partially conformant with WCAG 2.1 level AA.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">Feedback</h2>
                    <p className="mb-4">
                        We welcome your feedback on the accessibility of Kosmoi. Please let us know if you encounter accessibility barriers on Kosmoi:
                    </p>
                    <p className="font-semibold text-blue-600">
                        Email: support@kosmoi.site
                    </p>
                </section>
            </div>
        </div>
    );
};

export default Accessibility;

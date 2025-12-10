import React from 'react';

const Terms = () => {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-slate-900">Terms of Service</h1>
            <p className="text-sm text-slate-500 mb-8">Last Updated: December 2025</p>

            <div className="prose prose-slate lg:prose-lg">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to Kosmoi. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">2. Description of Service</h2>
                    <p className="mb-4">
                        Kosmoi provides an AI-powered service management platform ("the Service") that utilizes autonomous agents to facilitate business operations.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">3. User Obligations</h2>
                    <p className="mb-4">
                        You agree to use the Service only for lawful purposes. You are responsible for maintaining the confidentiality of your account credentials.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">4. Intellectual Property</h2>
                    <p className="mb-4">
                        The content, organization, graphics, design, compilation, magnetic translation, digital conversion and other matters related to the Site are protected under applicable copyrights and trademarks.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">5. Limitation of Liability</h2>
                    <p className="mb-4">
                        In no event will Kosmoi be liable for any incidental, consequential, or indirect damages arising out of the use of or inability to use the Service.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">6. Governing Law</h2>
                    <p className="mb-4">
                        These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Kosmoi operates, without regard to its conflict of law provisions.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default Terms;

import React from 'react';

const Privacy = () => {
    return (
        <div className="container mx-auto px-4 py-16 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-slate-900">Privacy Policy</h1>
            <p className="text-sm text-slate-500 mb-8">Last Updated: December 2025</p>

            <div className="prose prose-slate lg:prose-lg">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">1. Information We Collect</h2>
                    <p className="mb-4">
                        When you use Kosmoi, we may collect personal information such as your name, email address, and usage data. We use this information to provide and improve our services.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">2. How We Use Your Information</h2>
                    <p className="mb-4">
                        We use the information we collect to:
                        <ul className="list-disc ml-6 mt-2">
                            <li>Provide, operate, and maintain our website</li>
                            <li>Improve, personalize, and expand our website</li>
                            <li>Understand and analyze how you use our website</li>
                            <li>Develop new products, services, features, and functionality</li>
                        </ul>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">3. Data Security</h2>
                    <p className="mb-4">
                        We implement appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">4. Third-Party Services</h2>
                    <p className="mb-4">
                        We may use third-party Service Providers to monitor and analyze the use of our Service, such as Google Analytics and Vercel Speed Insights.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800">5. Your Data Rights (GDPR)</h2>
                    <p className="mb-4">
                        If you are a resident of the European Economic Area (EEA), you have certain data protection rights, including the right to access, correct, update, or request deletion of your personal information.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default Privacy;

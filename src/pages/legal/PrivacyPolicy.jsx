import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicy() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'he';

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="text-center mb-12">
                <Shield className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h1 className="text-4xl font-bold mb-4">{t('legal.privacy_title', 'Privacy Policy')}</h1>
                <p className="text-gray-500 text-lg">
                    {t('legal.privacy_subtitle', 'Last Updated: December 31, 2024')}
                </p>
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-500" />
                            1. Information We Collect
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            We collect information you provide directly to us, such as when you create an account,
                            update your profile, book a service, or communicate with us. This may include your name,
                            email, phone number, and location data.
                        </p>
                        <p>
                            When you use our services, we automatically collect information about how you interact
                            with appropriate features, including device information and log data.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-500" />
                            2. How We Use Your Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>We use the information we collect to:</p>
                        <ul className={`list-disc ps-5 space-y-2 ${isRTL ? 'mr-5' : 'ml-5'}`}>
                            <li>Provide, maintain, and improve our services.</li>
                            <li>Process transactions and send related information.</li>
                            <li>Send technical notices, updates, security alerts, and support messages.</li>
                            <li>Respond to your comments, questions, and requests.</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-500" />
                            3. Data Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            We take reasonable measures to help protect information about you from loss, theft,
                            misuse and unauthorized access, disclosure, alteration, and destruction.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
                <p>Contact: privacy@kosmoi.com</p>
            </div>
        </div>
    );
}

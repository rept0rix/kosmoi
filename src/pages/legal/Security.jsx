import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Security() {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <div className="text-center mb-12">
                <ShieldCheck className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h1 className="text-4xl font-bold mb-4">{t('legal.security_title', 'Security at Kosmoi')}</h1>
                <p className="text-gray-500 text-lg">
                    {t('legal.security_subtitle', 'Protecting your data is our top priority.')}
                </p>
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-500" />
                            Data Encryption
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            We use industry-standard encryption to protect your data both in transit and at rest.
                            All connections to Kosmoi are secured using SSL/TLS encryption.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="w-5 h-5 text-blue-500" />
                            Secure Infrastructure
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Our infrastructure is hosted on secure, world-class cloud providers with robust physical
                            and network security measures. We regularly perform security audits and updates.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

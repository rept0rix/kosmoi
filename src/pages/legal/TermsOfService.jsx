import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto pt-32 pb-12 px-4 max-w-4xl">
            <div className="text-center mb-12">
                <FileText className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h1 className="text-4xl font-bold mb-4">{t('legal.terms_title', 'Terms of Service')}</h1>
                <p className="text-gray-500 text-lg">
                    {t('legal.terms_subtitle', 'Last Updated: December 31, 2024')}
                </p>
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            1. Acceptance of Terms
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            By accessing or using Kosmoi services, you agree to be bound by these Terms of Service
                            and all applicable laws and regulations. If you do not agree with any of these terms,
                            you are prohibited from using or accessing this site.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            2. Use License
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p>
                            Permission is granted to temporarily view the materials (information or software) on
                            Kosmoi's website for personal, non-commercial transitory viewing only.
                        </p>
                        <p className="font-semibold">You may not:</p>
                        <ul className="list-disc ps-5 space-y-2">
                            <li>Modify or copy the materials;</li>
                            <li>Use the materials for any commercial purpose;</li>
                            <li>Attempt to decompile or reverse engineer any software contained on Kosmoi's website;</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            3. Service Provider Obligations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Service Providers listed on Kosmoi certify that they hold all necessary licenses and insurance
                            required to perform their services. Kosmoi is not responsible for the quality or legality
                            of the services provided effectively by third parties.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
                <p>Contact: legal@kosmoi.com</p>
            </div>
        </div>
    );
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accessibility as AccessibilityIcon, Eye, MousePointer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Accessibility() {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto pt-32 pb-12 px-4 max-w-4xl">
            <div className="text-center mb-12">
                <AccessibilityIcon className="w-16 h-16 mx-auto text-blue-600 mb-4" />
                <h1 className="text-4xl font-bold mb-4">{t('legal.accessibility_title', 'Accessibility Statement')}</h1>
                <p className="text-gray-500 text-lg">
                    {t('legal.accessibility_subtitle', 'Committed to digital inclusion.')}
                </p>
            </div>

            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-500" />
                            Visual Accessibility
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            We strive to ensure our website is accessible to users with visual impairments.
                            This includes support for screen readers, high contrast modes, and scalable text.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MousePointer className="w-5 h-5 text-blue-500" />
                            Navigation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>
                            Our site is designed to be navigable via keyboard and assistive technologies.
                            If you encounter any barriers, please contact us immediately.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-12 text-center text-sm text-gray-400">
                <p>Contact: accessibility@kosmoi.com</p>
            </div>
        </div>
    );
}

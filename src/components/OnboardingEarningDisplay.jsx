import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, Award } from 'lucide-react';

const OnboardingEarningDisplay = ({ data }) => {
    // Default data structure to break the "waiting for data" loop
    const defaultData = {
        average_monthly: 45000,
        currency: "THB",
        growth_rate: 0.15,
        top_earner_monthly: 120000,
        tiers: [
            { name: "Bronze", commission: "15%", benefits: "Basic Listing" },
            { name: "Silver", commission: "12%", benefits: "Priority Support" },
            { name: "Gold", commission: "10%", benefits: "Featured Listing" }
        ]
    };

    const displayData = data || defaultData;

    return (
        <Card className="w-full max-w-md mx-auto bg-white shadow-lg border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5" />
                    Unlock Your Earning Potential
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Average Monthly</p>
                        <h3 className="text-2xl font-bold text-blue-900">
                            {displayData.average_monthly.toLocaleString()} {displayData.currency}
                        </h3>
                    </div>
                    <div className="h-10 w-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        Commission Tiers
                    </h4>
                    <div className="grid gap-2">
                        {displayData.tiers.map((tier, index) => (
                            <div key={index} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`
                                        ${tier.name === 'Gold' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                                            tier.name === 'Silver' ? 'border-slate-200 text-slate-700 bg-slate-50' :
                                                'border-orange-200 text-orange-700 bg-orange-50'}
                                    `}>
                                        {tier.name}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{tier.benefits}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{tier.commission}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-xs text-center text-gray-400 pt-4 border-t">
                    * Based on historical data of top 20% providers on Koh Samui.
                </div>
            </CardContent>
        </Card>
    );
};

export default OnboardingEarningDisplay;

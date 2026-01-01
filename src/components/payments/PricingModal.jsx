import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { StripeService } from '@/services/payments/StripeService';
import { toast } from 'sonner';

export default function PricingModal({ trigger }) {
    const [loading, setLoading] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null);

    React.useEffect(() => {
        async function checkSubscription() {
            const sub = await StripeService.getSubscription();
            if (sub) {
                setCurrentPlan(sub.prices.products.name); // Assuming product name is available
            }
        }
        checkSubscription();
    }, []);

    const handleSubscribe = async (priceId) => {
        setLoading(true);
        try {
            await StripeService.checkoutSubscription(priceId);
        } catch (error) {
            console.error(error);
            toast.error("Failed to start checkout: " + error.message);
            setLoading(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || <Button variant="default">Upgrade to Pro</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Workspace</DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        Unlock the full potential of your AI workforce.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    {/* Free Plan */}
                    <div className="border rounded-xl p-6 flex flex-col hover:border-blue-200 transition-colors">
                        <div className="mb-4">
                            <h3 className="text-xl font-bold">Starter</h3>
                            <p className="text-gray-500">Perfect for exploring capabilities.</p>
                            <div className="mt-4 text-3xl font-bold">$0 <span className="text-base font-normal text-gray-500">/mo</span></div>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> 1 Agent</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Basic Templates</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-green-500" /> Community Support</li>
                        </ul>
                        <Button variant="outline" disabled>Current Plan</Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="border-2 border-blue-600 rounded-xl p-6 flex flex-col relative bg-blue-50/50">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            Most Popular
                        </div>
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-blue-900">Pro</h3>
                            <p className="text-gray-500">For serious builders and automation.</p>
                            <div className="mt-4 text-3xl font-bold">$29 <span className="text-base font-normal text-gray-500">/mo</span></div>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Unlimited Agents</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Advanced Logic Nodes</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> 24/7 Priority Support</li>
                            <li className="flex items-center gap-2"><Check size={16} className="text-blue-600" /> Custom Integrations</li>
                        </ul>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                            onClick={() => handleSubscribe('price_1Qbl0qGg9y6X2yq5U7b1XxJz')} // Replace with valid price ID
                            disabled={loading || currentPlan === 'Pro'}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            {loading ? 'Processing...' : (currentPlan === 'Pro' ? 'Current Plan' : 'Upgrade Now')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

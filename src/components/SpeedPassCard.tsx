import React from 'react';
import { Rocket } from 'lucide-react';

const SpeedPassCard = () => {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);

  // If dismissed, return nothing
  if (!isVisible) return null;

  const product = {
    name: 'Samui Speed Pass',
    price: 1.00,
    currency: 'USD',
    description: 'Priority matching for urgent service requests. Skip the queue.'
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    console.log('Processing purchase for:', product.name);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In a real app, you'd get this link from your backend
    // For now, redirect to a generic Stripe link or a success page to demonstrate flow
    // Using a reliable test link or just alerting for now if no real link exists
    // But user complained "lo over lesham", so let's actually go somewhere visual
    const mockPaymentUrl = "https://buy.stripe.com/test_mock_checkout";

    // Open in new tab
    if (window.confirm("Redirecting to Secure Payment (Mock)...")) {
      window.open(mockPaymentUrl, '_blank');
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-20 z-50 w-80 bg-white rounded-xl shadow-2xl border-2 border-blue-500 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 animate-pulse" />
          <h3 className="font-bold text-lg leading-none">{product.name}</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-blue-100 hover:text-white p-1 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-center gap-2">
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-yellow-200">High Priority</span>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-green-200">Instant Delivery</span>
        </div>

        <p className="text-gray-600 text-sm text-center">
          {product.description}
        </p>

        <div className="text-center">
          <span className="text-3xl font-bold text-gray-900">$1.00</span>
        </div>

        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Activate Now</>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          *Guaranteed response within 5 minutes
        </p>
      </div>
    </div>
  );
};

export default SpeedPassCard;
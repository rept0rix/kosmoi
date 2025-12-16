import React from 'react';
import { Rocket } from 'lucide-react';

const SpeedPassCard = () => {
  const product = {
    name: 'Samui Speed Pass',
    price: 1.00,
    currency: 'USD',
    description: 'Priority matching for urgent service requests. Skip the queue.'
  };

  const handlePurchase = () => {
    console.log('Processing purchase for:', product.name);
    alert('Samui Speed Pass Activated: Priority Protocol Engaged.');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border-2 border-blue-500 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-blue-600 p-4 text-white flex items-center gap-2">
        <Rocket className="h-5 w-5 animate-pulse" />
        <h3 className="font-bold text-lg leading-none">{product.name}</h3>
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center justify-center gap-2"
        >
          Activate Now
        </button>
        
        <p className="text-xs text-gray-400 text-center">
          *Guaranteed response within 5 minutes
        </p>
      </div>
    </div>
  );
};

export default SpeedPassCard;
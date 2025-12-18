import React from 'react';

const SamuiExpressPass = () => {
  const product = {
    name: "Samui Express Pass",
    description: "A 24-hour priority access token for the LEONS platform. Grants instant matching with top-rated service providers and zero booking fees for one day.",
    price: "1.00",
    currency: "USD"
  };

  const handlePurchase = () => {
    console.log("Processing transaction for: " + product.name);
    // Integration with payment gateway would go here
  };

  return (
    <div className="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl border border-blue-500 m-4">
      <div className="md:flex">
        <div className="p-8">
          <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">Exclusive Offer</div>
          <h2 className="block mt-1 text-lg leading-tight font-medium text-black">{product.name}</h2>
          <p className="mt-2 text-slate-500">{product.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900">${product.price}</span>
            <button 
              onClick={handlePurchase}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-colors"
            >
              Purchase Instant Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamuiExpressPass;
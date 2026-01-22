// src/components/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { StripeService } from '../services/StripeService'; // Assuming this service exists

const Dashboard = () => {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verificationSuccess = urlParams.get('verification_success');

    if (verificationSuccess === 'true') {
      setIsVerified(true);
      alert('Business Verification Successful!'); // Replace with actual state update logic
    }
  }, []);

  const handleVerifyBusiness = async () => {
    try {
      const paymentLink = await StripeService.createPaymentLink({
        productName: 'Business Verification',
        amount: 100,
        currency: 'usd',
        successUrl: `${window.location.origin}/dashboard?verification_success=true` // Adjust the URL as needed
      });

      window.location.href = paymentLink.url; // Redirect to Stripe checkout
    } catch (error) {
      console.error('Error creating payment link:', error);
      alert('Failed to initiate verification. Please try again.');
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {isVerified ? (
        <p>Business Verified!</p>
      ) : (
        <button onClick={handleVerifyBusiness}>Verify Business ($1)</button>
      )}
      {/* Other dashboard content */}
    </div>
  );
};

export default Dashboard;

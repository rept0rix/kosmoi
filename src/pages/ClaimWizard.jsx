import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BusinessSearchStep } from "@/features/vendors/components/BusinessSearchStep";
import { ClaimBusinessFlow } from "@/features/vendors/components/ClaimBusinessFlow";
import { CreatePaymentLink } from "@/api/integrations";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";

export default function ClaimWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState("search"); // 'search' | 'confirm' | 'redirecting'
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Redirect to login if not authenticated (should be handled by route protection, but double check)
  useEffect(() => {
    // Optional: Pre-check auth state
  }, []);

  const handleSelectPlace = (place) => {
    setSelectedPlace(place);
    setStep("confirm");
  };

  const handleClaimSuccess = async (businessData) => {
    setStep("redirecting");

    try {
      if (!user) {
        // Should be caught inside ClaimBusinessFlow but failsafe here
        const returnUrl = encodeURIComponent(window.location.pathname);
        navigate(`/login?returnUrl=${returnUrl}`);
        return;
      }

      toast.info("Initializing payment gateway...");

      // Create Payment Link
      const currentOrigin = window.location.origin;
      const successUrl = `${currentOrigin}/dashboard?payment_success=true`;
      const cancelUrl = `${currentOrigin}/claim-business`; // Back to start

      const payment = await CreatePaymentLink({
        name: `Claim Verification: ${businessData.business_name}`,
        amount: 1, // 1 THB Verification Fee
        currency: "thb",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id,
          providerId: businessData.id,
          type: "claim_profile", // Critical for webhook handler
        },
      });

      if (payment.error) {
        throw new Error(payment.error);
      }

      if (!payment.url) {
        throw new Error("No payment URL returned");
      }

      // Redirect to Stripe
      window.location.href = payment.url;
    } catch (error) {
      console.error("Payment Init Error:", error);
      toast.error("Failed to start payment: " + error.message);
      setStep("confirm"); // Go back to allow retry
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Simple Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <span className="text-blue-600">✨</span> Kosmoi Claims
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Official Verification Portal</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        {step === "search" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <BusinessSearchStep
              onSelectPlace={handleSelectPlace}
              onCreateNew={(name) => {
                // For now, handle create new by searching context or custom flow
                // Just alert for MVP or redirect to manual register
                toast.info(
                  "Manual registration coming soon. Please search for an existing place.",
                );
              }}
            />
          </div>
        )}

        {step === "confirm" && selectedPlace && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <ClaimBusinessFlow
              selectedPlace={selectedPlace}
              requirePayment={true}
              onBack={() => setStep("search")}
              onSuccess={handleClaimSuccess}
            />
          </div>
        )}

        {step === "redirecting" && (
          <div className="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Securely Redirecting...
            </h2>
            <p className="text-slate-500">
              Transferring you to Stripe for 1 THB verification.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

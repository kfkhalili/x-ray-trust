"use client";

import { useState } from "react";
import { X, CreditCard } from "lucide-react";
import { createCheckoutSession } from "@/lib/fetch-utils";
import { AuthButton } from "./AuthButton";
import type { User } from "@supabase/supabase-js";

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  user?: User; // User object from Supabase, undefined if not signed in
}

/**
 * Credit purchase modal with Stripe Checkout integration.
 *
 * Why redirect to Stripe? We don't handle payment forms—Stripe does.
 * Redirecting to Stripe Checkout keeps PCI compliance on Stripe's side,
 * not ours. After payment, webhook grants credits automatically.
 *
 * If user is not signed in, shows sign-in prompt instead of credit packs.
 */
export const CreditModal = ({
  isOpen,
  onClose,
  currentCredits,
  user,
}: CreditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);

  // Credit pack options (should match CREDIT_PACKS in lib/stripe.ts)
  // Recommended for German launch: 3 tiers in EUR
  // Can be updated after creating products in Stripe Dashboard
  const creditPacks = [
    { credits: 50, price: 4.99, label: "50 Credits - €4.99", popular: false },
    { credits: 100, price: 9.99, label: "100 Credits - €9.99", popular: true },
    {
      credits: 250,
      price: 19.99,
      label: "250 Credits - €19.99",
      popular: false,
    },
  ];

  const handleCheckout = async () => {
    if (!selectedCredits || !user) {
      return;
    }

    setLoading(true);

    const result = await createCheckoutSession(selectedCredits);

    if (result.isErr()) {
      console.error("Checkout error:", result.error);
      alert(result.error.message || "Failed to create checkout session");
      setLoading(false);
      return;
    }

    window.location.href = result.value.url;
    // Note: setLoading(false) not needed - page will redirect
  };

  if (!isOpen) {
    return null;
  }

  // Show sign-in prompt if user is not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-100">
              Buy More Lookups
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-300 text-sm">
              You've used all 3 free lookups. Sign in to purchase credits starting from €4.99 and
              continue verifying accounts.
            </p>
          </div>

          {/* Sign In Button */}
          <div className="flex justify-center">
            <AuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Buy Credits</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Credits */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Current Credits</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {currentCredits}
          </div>
        </div>

        {/* Credit Packs */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-300 mb-3">
            Select a credit pack:
          </div>
          {creditPacks.map((pack) => (
            <button
              key={pack.credits}
              onClick={() => setSelectedCredits(pack.credits)}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedCredits === pack.credits
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-100">
                      {pack.label}
                    </div>
                    {pack.popular && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    €{(pack.price / pack.credits).toFixed(3)} per credit
                  </div>
                </div>
                {selectedCredits === pack.credits && (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gray-900" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={!selectedCredits || loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
          {loading ? (
            "Processing..."
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Proceed to Checkout
            </>
          )}
        </button>
      </div>
    </div>
  );
};

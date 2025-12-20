'use client';

import { useState } from 'react';
import { X, CreditCard } from 'lucide-react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
}

/**
 * Modal for purchasing credit packs via Stripe Checkout.
 * Displays available credit packs and handles checkout session creation.
 */
export const CreditModal = ({ isOpen, onClose, currentCredits }: CreditModalProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);

  // Credit pack options (should match CREDIT_PACKS in lib/stripe.ts)
  const creditPacks = [
    { credits: 50, price: 5, label: '50 Credits - $5' },
    { credits: 120, price: 10, label: '120 Credits - $10' },
    { credits: 250, price: 20, label: '250 Credits - $20' },
  ];

  const handleCheckout = async () => {
    if (!selectedCredits) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credits: selectedCredits }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to create checkout session');
        return;
      }

      const { url } = await response.json() as { url: string };
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">Buy Credits</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
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
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <div className="font-semibold text-gray-100">{pack.label}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    ${(pack.price / pack.credits).toFixed(3)} per credit
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
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            'Processing...'
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


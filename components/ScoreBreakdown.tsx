'use client';

import { ScoreBreakdown as ScoreBreakdownType } from '@/types/trust';
import { CheckCircle2, AlertCircle, Minus } from 'lucide-react';

interface ScoreBreakdownProps {
  breakdown: readonly ScoreBreakdownType[];
  confidence?: number;
}

/**
 * Factor-by-factor score transparency.
 *
 * Trust requires understanding. Users won't accept "trust us, score is 42"
 * without knowing what went wrong. Each factor shows its contribution,
 * enabling users to weigh signals differently based on their use case.
 */
export const ScoreBreakdown = ({ breakdown, confidence }: ScoreBreakdownProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'positive':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'negative':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive':
        return 'bg-emerald-500/20 border-emerald-500/30';
      case 'negative':
        return 'bg-rose-500/20 border-rose-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
          Score Breakdown
        </h3>
        {confidence !== undefined && (
          <div className="text-xs text-gray-400">
            Confidence: <span className="font-semibold text-gray-300">{confidence}%</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {breakdown.map((factor, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getStatusColor(factor.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-1">
                {getStatusIcon(factor.status)}
                <span className="font-medium text-gray-200 text-sm">{factor.factor}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-100">
                  {factor.score}/100
                </div>
                <div className="text-xs text-gray-400">
                  +{factor.contribution} pts
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  factor.status === 'positive'
                    ? 'bg-emerald-500'
                    : factor.status === 'negative'
                    ? 'bg-rose-500'
                    : 'bg-gray-500'
                }`}
                style={{ width: `${factor.score}%` }}
              />
            </div>

            <p className="text-xs text-gray-400">{factor.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
};


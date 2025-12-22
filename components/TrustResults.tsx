'use client';

import { RadialProgress } from './RadialProgress';
import { UserDetails } from './UserDetails';
import { ScoreBreakdown } from './ScoreBreakdown';
import type { TrustReport } from '@/types/trust';
import { AlertTriangle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';

interface TrustResultsProps {
  report: TrustReport;
}

/**
 * Displays trust verification results with score, verdict, and risk flags.
 * Uses color-coded verdict badges and icon indicators for visual clarity.
 */
export const TrustResults = ({ report }: TrustResultsProps) => {
  const verdictConfig = {
    TRUSTED: {
      label: 'Trusted',
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      bgColor: 'bg-emerald-500/5',
    },
    CAUTION: {
      label: 'Caution',
      icon: AlertTriangle,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      bgColor: 'bg-amber-500/5',
    },
    DANGER: {
      label: 'Danger',
      icon: XCircle,
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      bgColor: 'bg-rose-500/5',
    },
  };

  const config = verdictConfig[report.verdict];
  const Icon = config.icon;

  return (
    <div className="mt-8 space-y-6">
      {/* User Details */}
      <UserDetails userInfo={report.userInfo} />

      {/* Score Card */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-6">
          <RadialProgress score={report.score} verdict={report.verdict} />

          <div className="text-center space-y-2">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.color}`}>
              <Icon className="w-4 h-4" />
              <span className="font-semibold text-sm">{config.label}</span>
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Trust Score: {report.score}/100
            </p>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {report.breakdown && (
        <ScoreBreakdown breakdown={report.breakdown} confidence={report.confidence} />
      )}

      {/* Positive Indicators */}
      {report.positiveIndicators && report.positiveIndicators.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Positive Indicators
          </h3>
          <ul className="space-y-2">
            {report.positiveIndicators.map((indicator, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-300 text-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{indicator}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Flags */}
      {report.flags.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Risk Flags
          </h3>
          <ul className="space-y-2">
            {report.flags.map((flag, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-300 text-sm"
              >
                <span className="text-rose-400 mt-0.5">•</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Flags Message */}
      {report.flags.length === 0 && !report.positiveIndicators && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">No risk flags detected</span>
          </div>
        </div>
      )}
    </div>
  );
};


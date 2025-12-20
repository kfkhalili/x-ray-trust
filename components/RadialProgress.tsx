'use client';

import type { TrustVerdict } from '@/types/trust';

interface RadialProgressProps {
  score: number;
  verdict: TrustVerdict;
  size?: number;
  strokeWidth?: number;
}

/**
 * Radial progress indicator for trust score visualization.
 * Uses SVG circle with stroke-dasharray to create animated progress ring.
 * Color changes based on verdict (emerald/amber/rose).
 */
export const RadialProgress = ({
  score,
  verdict,
  size = 120,
  strokeWidth = 8,
}: RadialProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorMap: Record<TrustVerdict, string> = {
    TRUSTED: 'text-trust-trusted stroke-trust-trusted',
    CAUTION: 'text-trust-caution stroke-trust-caution',
    DANGER: 'text-trust-danger stroke-trust-danger',
  };

  const color = colorMap[verdict];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-800"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className={`text-3xl font-bold ${color.split(' ')[0]}`}>
            {score}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">/ 100</div>
        </div>
      </div>
    </div>
  );
};


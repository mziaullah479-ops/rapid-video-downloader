import React from 'react';

interface RadialProgressProps {
  percentage: number;
  downloadedMB: number;
  totalMB: number;
}

export const RadialProgress: React.FC<RadialProgressProps> = ({
  percentage,
  downloadedMB,
  totalMB,
}) => {
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="relative w-[180px] h-[180px] flex items-center justify-center">
        {/* Outer glowing halo ring */}
        <div className="absolute inset-0 rounded-full bg-[#00ffd5]/5 blur-xl pointer-events-none" />

        {/* SVG Circular Ring */}
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0, 255, 213, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Active progress stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00ffd5"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.3s ease',
              filter: 'drop-shadow(0 0 8px rgba(0, 255, 213, 0.7))',
            }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-display font-bold text-white tracking-wider glow-text-cyan">
            {Math.round(percentage)}%
          </span>
          <span className="text-[11px] font-mono-cyber text-[#00ffd5]/70 uppercase tracking-widest mt-0.5">
            DECRYPTING
          </span>
        </div>
      </div>

      {/* Downloaded / Total MB display */}
      <div className="mt-3 text-sm font-mono-cyber text-[#a0e8df] flex items-center gap-2">
        <span className="text-[#00ffd5] font-semibold">{downloadedMB.toFixed(1)} MB</span>
        <span className="text-[#00ffd5]/40">/</span>
        <span>{totalMB.toFixed(1)} MB</span>
      </div>
    </div>
  );
};

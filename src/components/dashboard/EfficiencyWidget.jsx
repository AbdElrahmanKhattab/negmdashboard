import React from 'react';
import { Rocket } from 'lucide-react';

export default function EfficiencyWidget({ rate = 94 }) {
  // SVG calculation for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (rate / 100) * circumference;

  return (
    <div className="bg-gradient-to-br from-[#0d47a1] to-[#1e3a8a] rounded-2xl p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between h-full min-h-[250px]">
      {/* Background illustration */}
      <Rocket className="absolute top-4 right-4 w-24 h-24 text-white/10 -rotate-12" />
      
      <div className="relative z-10 w-full flex justify-between items-start">
        <h3 className="font-bold text-sm tracking-wider uppercase text-white/90">Efficiency Rate</h3>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-4">
        {/* Circular Progress */}
        <div className="relative flex items-center justify-center w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/20"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-white drop-shadow-md"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-4xl font-bold font-sans tracking-tighter">{rate}%</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center">
        <p className="font-medium text-sm text-white/90">On-time Completion Rate</p>
        <p className="text-xs text-white/70 font-sans mt-0.5">في الوقت المحدد</p>
      </div>
    </div>
  );
}

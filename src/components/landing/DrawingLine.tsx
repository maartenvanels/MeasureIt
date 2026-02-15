'use client';
import { useInView } from '@/hooks/useInView';

export function DrawingLine() {
  const { ref, isInView } = useInView({ threshold: 0.5 });

  return (
    <div ref={ref} className="mx-auto max-w-2xl px-6 py-4">
      <svg viewBox="0 0 600 40" className="w-full h-10">
        {/* Main measurement line */}
        <line
          x1="50" y1="20" x2="550" y2="20"
          stroke="#e11d48"
          strokeWidth="1.5"
          strokeDasharray="500"
          strokeDashoffset={isInView ? 0 : 500}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
        {/* Left end-cap */}
        <line
          x1="50" y1="10" x2="50" y2="30"
          stroke="#e11d48" strokeWidth="1.5"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.3s ease-out 1s' }}
        />
        {/* Right end-cap */}
        <line
          x1="550" y1="10" x2="550" y2="30"
          stroke="#e11d48" strokeWidth="1.5"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.3s ease-out 1s' }}
        />
        {/* Center tick marks */}
        {[150, 250, 350, 450].map((x) => (
          <line
            key={x}
            x1={x} y1="15" x2={x} y2="25"
            stroke="#e11d48" strokeWidth="1"
            opacity={isInView ? 0.5 : 0}
            style={{ transition: `opacity 0.3s ease-out ${0.8 + (x - 150) * 0.002}s` }}
          />
        ))}
        {/* Dimension label */}
        <text
          x="300" y="14" textAnchor="middle"
          fill="#e11d48"
          fontSize="11"
          fontFamily="monospace"
          opacity={isInView ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease-out 1.2s' }}
        >
          500 mm
        </text>
      </svg>
    </div>
  );
}

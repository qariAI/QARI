
import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showLastValue?: boolean;
}

const Sparkline: React.FC<SparklineProps> = ({ 
  data, 
  width = 120, 
  height = 40, 
  color = '#10b981',
  showLastValue = true
}) => {
  if (!data || data.length < 2) {
    return (
       <div className="flex items-center gap-2 opacity-50 select-none">
          <div className="h-10 w-24 bg-slate-50 border border-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">
             Not enough data
          </div>
       </div>
    );
  }

  const max = 100;
  const min = 0;
  
  // Calculate points for polyline
  const points = data.map((val, i) => {
    // Normalize x to width
    const x = (i / (data.length - 1)) * width;
    // Normalize y to height (inverted because SVG y=0 is top)
    const normalizedVal = Math.max(0, Math.min(100, val));
    const y = height - ((normalizedVal - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(' ');

  const lastVal = data[data.length-1];
  const lastY = height - ((Math.max(0, Math.min(100, lastVal)) - min) / (max - min)) * height;

  return (
    <div className="flex items-center gap-3">
        <svg width={width} height={height} className="overflow-visible">
            {/* Background Lines */}
            <line x1="0" y1={height} x2={width} y2={height} stroke="#e2e8f0" strokeWidth="1" />
            <line x1="0" y1={0} x2={width} y2={0} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />
            
            {/* Trend Line */}
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-sm"
            />
            
            {/* Data Points */}
            {data.map((val, i) => {
                 const x = (i / (data.length - 1)) * width;
                 const y = height - ((Math.max(0, Math.min(100, val)) - min) / (max - min)) * height;
                 return (
                    <circle key={i} cx={x} cy={y} r="1.5" fill="white" stroke={color} strokeWidth="1" />
                 );
            })}

            {/* Last Point Indicator */}
            <circle 
                cx={width} 
                cy={lastY} 
                r="3" 
                fill={color} 
                stroke="white" 
                strokeWidth="2" 
            />
        </svg>
        {showLastValue && (
            <div className="flex flex-col items-start leading-none">
                <span className={`text-sm font-bold ${lastVal >= 80 ? 'text-emerald-600' : lastVal >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {Math.round(lastVal)}%
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-semibold">Accuracy</span>
            </div>
        )}
    </div>
  );
};

export default Sparkline;

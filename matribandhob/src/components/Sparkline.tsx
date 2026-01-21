import React from "react";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    strokeWidth?: number;
}

export default function Sparkline({
    data,
    width = 100,
    height = 30,
    color = "rgb(59, 130, 246)",
    strokeWidth = 2
}: SparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; // Avoid divide by zero

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const normalizedY = (val - min) / range;
        const y = height - (normalizedY * height); // Invert Y because SVG 0 is top
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            {/* Area under the line (optional, for aesthetics) */}
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Fill Area */}
            <polyline
                fill="none" // For now, just line context
                stroke="none"
                points={`${points}`}
            />

            {/* The Line */}
            <polyline
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* End Dot */}
            <circle
                cx={width}
                cy={height - ((data[data.length - 1] - min) / range) * height}
                r={3}
                fill={color}
            />
        </svg>
    );
}

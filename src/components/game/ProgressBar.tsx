import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
}

export function ProgressBar({
  current,
  total,
  label,
  showPercentage = true,
}: ProgressBarProps) {
  const percentage = Math.min(100, (current / total) * 100);

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-muted-foreground">
              {current} / {total} ({percentage.toFixed(0)}%)
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-primary h-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

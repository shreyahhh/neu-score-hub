import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isRunning: boolean;
  initialTime?: number;
  onTick?: (elapsed: number) => void;
  onComplete?: () => void;
  countDown?: boolean;
  maxTime?: number;
}

export function Timer({
  isRunning,
  initialTime = 0,
  onTick,
  onComplete,
  countDown = false,
  maxTime,
}: TimerProps) {
  const [elapsed, setElapsed] = useState(initialTime);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = countDown ? prev - 1 : prev + 1;
        
        if (onTick) {
          onTick(next);
        }

        if (countDown && next <= 0 && onComplete) {
          onComplete();
          return 0;
        }

        if (maxTime && !countDown && next >= maxTime && onComplete) {
          onComplete();
          return maxTime;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTick, onComplete, countDown, maxTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (countDown && maxTime) {
      const percentage = (elapsed / maxTime) * 100;
      if (percentage <= 25) return 'text-destructive';
      if (percentage <= 50) return 'text-accent';
    }
    return 'text-foreground';
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className={`w-5 h-5 ${getTimerColor()}`} />
      <span className={`text-2xl font-mono font-bold ${getTimerColor()}`}>
        {formatTime(elapsed)}
      </span>
    </div>
  );
}

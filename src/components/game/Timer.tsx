import React, { useEffect, useState, useRef } from 'react';
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
  const onTickRef = useRef(onTick);
  const onCompleteRef = useRef(onComplete);

  // Update refs when callbacks change
  useEffect(() => {
    onTickRef.current = onTick;
    onCompleteRef.current = onComplete;
  }, [onTick, onComplete]);

  // Reset elapsed time when initialTime changes
  useEffect(() => {
    setElapsed(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = countDown ? prev - 1 : prev + 1;
        
        // Call onTick from ref
        if (onTickRef.current) {
          onTickRef.current(next);
        }

        // Handle countdown completion
        if (countDown && next <= 0) {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return 0;
        }

        // Handle maxTime completion
        if (maxTime && !countDown && next >= maxTime) {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          return maxTime;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, countDown, maxTime]);

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
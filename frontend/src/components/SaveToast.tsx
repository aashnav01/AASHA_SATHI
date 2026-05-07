import React, { useEffect, useState } from 'react';
import { CheckCircle2, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface SaveToastProps {
  show: boolean;
  onDone?: () => void;
  customMessage?: string;
  holdMs?: number;
}

/**
 * SaveToast — slides up from bottom, holds, then slides back down.
 * Automatically shows offline message with pulsing dot when device is offline.
 */
export const SaveToast: React.FC<SaveToastProps> = ({
  show,
  onDone,
  customMessage,
  holdMs = 1500,
}) => {
  const isOnline = useOnlineStatus();
  const [phase, setPhase] = useState<'hidden' | 'in' | 'hold' | 'out'>('hidden');

  useEffect(() => {
    if (!show) return;

    setPhase('in');

    const holdTimer = setTimeout(() => setPhase('out'), holdMs + 350);
    const doneTimer = setTimeout(() => {
      setPhase('hidden');
      onDone?.();
    }, holdMs + 350 + 280);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(doneTimer);
    };
  }, [show, holdMs, onDone]);

  if (phase === 'hidden') return null;

  const offline = !isOnline;
  const message = customMessage ?? (
    offline
      ? 'Saved locally — will sync when connected'
      : 'Saved ✓'
  );

  return (
    <div
      className={`fixed bottom-28 left-4 right-4 z-[200] max-w-sm mx-auto rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 ${
        phase === 'out' ? 'animate-toast-out' : 'animate-toast-in'
      }`}
      style={{
        background: offline
          ? 'linear-gradient(135deg, #7C4D9F, #B08CC0)'
          : 'linear-gradient(135deg, #2A7D52, #3a9e6a)',
      }}
    >
      {/* Icon */}
      <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
        {offline ? (
          <WifiOff size={16} className="text-white" />
        ) : (
          <CheckCircle2 size={18} className="text-white" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm text-white leading-tight">{message}</p>
        {offline && (
          <p className="text-xs text-white/75 mt-0.5 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-300 flex-shrink-0 animate-offline-dot"
              style={{ display: 'inline-block' }}
            />
            Offline mode active
          </p>
        )}
      </div>
    </div>
  );
};

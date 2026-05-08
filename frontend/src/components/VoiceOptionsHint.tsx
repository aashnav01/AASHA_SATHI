import React, { useState } from 'react';
import { Volume2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VoiceOptionsHintProps {
  /** Called when user taps "read options" — pass a function that calls speak() */
  onReadOptions: () => void;
  /** Short label shown in the hint, e.g. "Tap 🔊 to hear all options" */
  label?: string;
}

/**
 * VoiceOptionsHint — a small discoverable pill that tells ASHA workers
 * they can have options read aloud. Does NOT auto-read; only reads when tapped.
 * Collapses after first tap to avoid cluttering the UI.
 */
export const VoiceOptionsHint: React.FC<VoiceOptionsHintProps> = ({
  onReadOptions,
  label,
}) => {
  const { t } = useTranslation();
  const [hasBeenUsed, setHasBeenUsed] = useState(false);

  const handleTap = () => {
    onReadOptions();
    setHasBeenUsed(true);
  };

  const displayLabel =
    label ?? t('common.tap_to_hear_options', 'Tap 🔊 to hear all options read aloud');

  return (
    <button
      onClick={handleTap}
      className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-left transition-all active:scale-[0.98]"
      style={{
        background: hasBeenUsed
          ? 'rgba(42,125,82,0.07)'
          : 'rgba(124,77,159,0.07)',
        border: hasBeenUsed
          ? '1px solid rgba(42,125,82,0.2)'
          : '1px dashed rgba(124,77,159,0.35)',
      }}
      aria-label="Read options aloud"
    >
      <Volume2
        size={16}
        className="flex-shrink-0"
        style={{ color: hasBeenUsed ? '#2A7D52' : '#7C4D9F' }}
      />
      <span
        className="text-xs font-semibold leading-tight"
        style={{ color: hasBeenUsed ? '#2A7D52' : '#7C4D9F' }}
      >
        {hasBeenUsed
          ? t('common.options_read', '✓ Options read — tap again to replay')
          : displayLabel}
      </span>
      {!hasBeenUsed && (
        <ChevronDown
          size={12}
          className="flex-shrink-0 ml-auto"
          style={{ color: '#B08CC0' }}
        />
      )}
    </button>
  );
};

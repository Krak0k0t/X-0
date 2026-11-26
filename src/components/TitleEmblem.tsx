import React from 'react';

export const TitleEmblem: React.FC<{ subtitle: string }> = ({ subtitle }) => {
  return (
    <div className="flex flex-col items-start gap-2">
      <svg
        viewBox="0 0 380 86"
        className="w-72 sm:w-96 h-auto drop-shadow-[0_6px_22px_rgba(0,0,0,0.85)]"
        role="img"
        aria-label="FLUX GP"
      >
        <defs>
          <linearGradient id="flux-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#e6ba63" />
            <stop offset="100%" stopColor="#9a671c" />
          </linearGradient>
        </defs>
        {/* Crest diamond & wings */}
        <polygon
          points="24,43 44,16 64,43 44,70"
          fill="#141926"
          stroke="url(#flux-gold)"
          strokeWidth="2.5"
        />
        <polygon points="44,24 56,43 44,62 32,43" fill="#2dd4bf" opacity="0.8" />
        <line x1="8" y1="43" x2="20" y2="43" stroke="#e6ba63" strokeWidth="2" />
        <line x1="68" y1="43" x2="82" y2="43" stroke="#e6ba63" strokeWidth="2" />

        {/* Display lockup text */}
        <text
          x="94"
          y="55"
          fill="url(#flux-gold)"
          fontFamily="Cinzel, Georgia, serif"
          fontWeight="800"
          fontSize="46"
          letterSpacing="4"
        >
          FLUX GP
        </text>
        <line x1="94" y1="68" x2="365" y2="68" stroke="url(#flux-gold)" strokeWidth="1.5" strokeOpacity="0.6" />
      </svg>
      <p className="text-sm sm:text-base text-amber-100/80 tracking-wide pl-1">
        {subtitle}
      </p>
    </div>
  );
};

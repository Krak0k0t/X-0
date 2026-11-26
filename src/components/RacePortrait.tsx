import React from 'react';
import { CHARACTERS } from '../game/data/characters';
import type { CharacterId } from '../game/types';

interface RacePortraitProps {
  characterId: CharacterId;
  size?: number;
}

export const RacePortrait: React.FC<RacePortraitProps> = ({
  characterId,
  size = 76,
}) => {
  const char = CHARACTERS[characterId];
  const { eyes, headShape, crest, eyeColor, shellColor } = char.portrait;

  const renderHead = () => {
    switch (headShape) {
      case 'monolith':
        return <polygon points="24,18 76,18 82,84 18,84" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
      case 'hex':
        return <polygon points="50,14 82,32 82,68 50,86 18,68 18,32" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
      case 'dome':
        return <path d="M22,82 L22,48 C22,22 78,22 78,48 L78,82 Z" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
      case 'crest':
        return <polygon points="50,12 78,44 68,84 32,84 22,44" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
      case 'asymmetric':
        return <polygon points="30,16 74,24 80,78 24,84 18,46" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
      case 'visor':
        return <polygon points="26,20 74,20 82,52 66,84 34,84 18,52" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
      case 'none':
        return (
          <g>
            <circle cx="50" cy="50" r="28" fill="none" stroke={eyeColor} strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="16" fill="none" stroke={eyeColor} strokeWidth="2" />
            <circle cx="50" cy="50" r="5" fill={eyeColor} />
          </g>
        );
      default:
        return <polygon points="28,18 72,18 80,50 70,84 30,84 20,50" fill={shellColor} stroke={eyeColor} strokeWidth="1.5" />;
    }
  };

  const renderCrest = () => {
    switch (crest) {
      case 'antennae':
        return (
          <g stroke={eyeColor} strokeWidth="2" fill="none">
            <path d="M32,22 L20,6" />
            <path d="M68,22 L80,6" />
            <circle cx="20" cy="6" r="2.5" fill={eyeColor} />
            <circle cx="80" cy="6" r="2.5" fill={eyeColor} />
          </g>
        );
      case 'fins':
        return (
          <g fill={eyeColor} opacity="0.8">
            <polygon points="22,42 6,22 28,28" />
            <polygon points="78,42 94,22 72,28" />
          </g>
        );
      case 'horns':
        return (
          <g fill="none" stroke={eyeColor} strokeWidth="2.5">
            <path d="M32,20 Q20,8 26,4" />
            <path d="M68,20 Q80,8 74,4" />
          </g>
        );
      case 'halo':
        return <ellipse cx="50" cy="14" rx="22" ry="5" fill="none" stroke={eyeColor} strokeWidth="1.5" />;
      case 'shards':
        return (
          <g fill={eyeColor} opacity="0.75">
            <polygon points="44,18 50,4 56,18" />
            <polygon points="26,26 18,12 34,20" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderEyes = () => {
    if (eyes === 0) return null;
    if (eyes === 1) {
      return <circle cx="50" cy="48" r="6.5" fill={eyeColor} />;
    }
    if (eyes === 2) {
      return (
        <g fill={eyeColor}>
          <rect x="31" y="44" width="12" height="5" rx="2" />
          <rect x="57" y="44" width="12" height="5" rx="2" />
        </g>
      );
    }
    if (eyes === 3) {
      return (
        <g fill={eyeColor}>
          <circle cx="35" cy="48" r="4" />
          <circle cx="50" cy="40" r="4.5" />
          <circle cx="65" cy="48" r="4" />
        </g>
      );
    }
    if (eyes === 4) {
      return (
        <g fill={eyeColor}>
          <circle cx="34" cy="44" r="3.2" />
          <circle cx="66" cy="44" r="3.2" />
          <circle cx="38" cy="55" r="2.6" />
          <circle cx="62" cy="55" r="2.6" />
        </g>
      );
    }
    // 6 eyes (Hash-Swarm)
    return (
      <g fill={eyeColor}>
        <circle cx="34" cy="40" r="2.6" />
        <circle cx="50" cy="36" r="2.6" />
        <circle cx="66" cy="40" r="2.6" />
        <circle cx="34" cy="54" r="2.6" />
        <circle cx="50" cy="58" r="2.6" />
        <circle cx="66" cy="54" r="2.6" />
      </g>
    );
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={char.nameEn}
      className="shrink-0 rounded-md border border-amber-500/35 bg-[#0b0e17]"
    >
      <defs>
        <radialGradient id={`g-${characterId}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={eyeColor} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#090b12" stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#g-${characterId})`} />
      {renderCrest()}
      {renderHead()}
      {renderEyes()}
      <line x1="28" y1="68" x2="72" y2="68" stroke={eyeColor} strokeOpacity="0.35" strokeWidth="1.5" />
    </svg>
  );
};

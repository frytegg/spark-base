interface PixelAvatarProps {
  seed?: string;
  size?: number;
  className?: string;
}

export function PixelAvatar({ seed = "default", size = 64, className = "" }: PixelAvatarProps) {
  // Generate a deterministic color palette based on seed
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const hash = hashCode(seed);
  const colors = [
    `hsl(${(hash % 360)}, 70%, 60%)`,
    `hsl(${((hash + 60) % 360)}, 70%, 50%)`,
    `hsl(${((hash + 120) % 360)}, 70%, 55%)`,
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width="8" height="8" fill="#1a0f2e" />
      
      {/* Simple pixel art pattern */}
      <rect x="2" y="1" width="4" height="1" fill={colors[0]} />
      <rect x="1" y="2" width="6" height="1" fill={colors[0]} />
      <rect x="2" y="3" width="1" height="1" fill="#000" />
      <rect x="5" y="3" width="1" height="1" fill="#000" />
      <rect x="1" y="3" width="6" height="1" fill={colors[1]} />
      <rect x="1" y="4" width="6" height="1" fill={colors[1]} />
      <rect x="3" y="5" width="2" height="1" fill="#000" />
      <rect x="1" y="5" width="6" height="1" fill={colors[2]} />
      <rect x="2" y="6" width="4" height="1" fill={colors[2]} />
      <rect x="3" y="7" width="2" height="1" fill={colors[0]} />
    </svg>
  );
}

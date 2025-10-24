interface PixelNFTBadgeProps {
  tier: string;
  locked?: boolean;
  size?: number;
}

export function PixelNFTBadge({ tier, locked = false, size = 128 }: PixelNFTBadgeProps) {
  const getTierColors = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "bronze":
        return { primary: "#cd7f32", secondary: "#8b5a00", accent: "#ff9f4a" };
      case "silver":
        return { primary: "#c0c0c0", secondary: "#808080", accent: "#ffffff" };
      case "gold":
        return { primary: "#ffd700", secondary: "#b8860b", accent: "#ffed4e" };
      case "platinum":
        return { primary: "#e5e4e2", secondary: "#a8a8a8", accent: "#ffffff" };
      case "diamond":
        return { primary: "#b9f2ff", secondary: "#4dd0e1", accent: "#ffffff" };
      default:
        return { primary: "#8b5cf6", secondary: "#ec4899", accent: "#06b6d4" };
    }
  };

  const colors = getTierColors(tier);

  if (locked) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        style={{ imageRendering: 'pixelated' }}
      >
        <rect width="16" height="16" fill="#0a0118" />
        <rect x="4" y="4" width="8" height="8" fill="#2d1b4e" />
        <rect x="5" y="5" width="6" height="6" fill="#1a0f2e" />
        
        {/* Lock icon */}
        <rect x="7" y="8" width="2" height="3" fill="#666" />
        <rect x="6" y="6" width="4" height="2" fill="#666" />
        <rect x="6" y="5" width="1" height="1" fill="#666" />
        <rect x="9" y="5" width="1" height="1" fill="#666" />
        <rect x="7" y="9" width="2" height="1" fill="#999" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect width="16" height="16" fill="#0a0118" />
      
      {/* Badge shape - shield */}
      <rect x="4" y="2" width="8" height="2" fill={colors.primary} />
      <rect x="3" y="4" width="10" height="2" fill={colors.primary} />
      <rect x="3" y="6" width="10" height="4" fill={colors.secondary} />
      <rect x="4" y="10" width="8" height="2" fill={colors.secondary} />
      <rect x="5" y="12" width="6" height="2" fill={colors.accent} />
      <rect x="6" y="14" width="4" height="1" fill={colors.accent} />
      <rect x="7" y="15" width="2" height="1" fill={colors.accent} />
      
      {/* Star in center */}
      <rect x="7" y="5" width="2" height="1" fill="#fff" opacity="0.9" />
      <rect x="6" y="6" width="4" height="1" fill="#fff" opacity="0.9" />
      <rect x="7" y="7" width="2" height="2" fill="#fff" opacity="0.9" />
      <rect x="6" y="8" width="1" height="1" fill="#fff" opacity="0.9" />
      <rect x="9" y="8" width="1" height="1" fill="#fff" opacity="0.9" />
      
      {/* Border glow */}
      <rect x="4" y="2" width="8" height="2" fill="none" stroke={colors.accent} strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}

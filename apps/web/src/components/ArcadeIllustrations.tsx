export function ChessIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Checkerboard background */}
      <defs>
        <pattern id="checkers" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="20" height="20" fill="#8b5cf6"/>
          <rect x="20" y="0" width="20" height="20" fill="#2d1b4e"/>
          <rect x="0" y="20" width="20" height="20" fill="#2d1b4e"/>
          <rect x="20" y="20" width="20" height="20" fill="#8b5cf6"/>
        </pattern>
      </defs>
      <rect width="200" height="200" fill="#1a0f2e"/>
      <rect x="20" y="20" width="160" height="160" fill="url(#checkers)" stroke="#ec4899" strokeWidth="4"/>
      
      {/* King piece */}
      <g transform="translate(70, 60)">
        <rect x="0" y="40" width="60" height="10" fill="#06b6d4"/>
        <rect x="10" y="20" width="40" height="20" fill="#06b6d4"/>
        <rect x="20" y="10" width="20" height="10" fill="#06b6d4"/>
        <rect x="25" y="0" width="10" height="10" fill="#fbbf24"/>
        <rect x="20" y="5" width="5" height="5" fill="#fbbf24"/>
        <rect x="35" y="5" width="5" height="5" fill="#fbbf24"/>
        <polygon points="30,0 20,5 40,5" fill="#fbbf24"/>
      </g>
      
      {/* Glow effect */}
      <rect x="20" y="20" width="160" height="160" fill="none" stroke="#ec4899" strokeWidth="2" opacity="0.5"/>
    </svg>
  );
}

export function TicTacToeIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Grid */}
      <rect x="70" y="30" width="8" height="140" fill="#8b5cf6"/>
      <rect x="122" y="30" width="8" height="140" fill="#8b5cf6"/>
      <rect x="30" y="70" width="140" height="8" fill="#8b5cf6"/>
      <rect x="30" y="122" width="140" height="8" fill="#8b5cf6"/>
      
      {/* X */}
      <g transform="translate(40, 40)">
        <rect x="0" y="8" width="8" height="24" fill="#ec4899" transform="rotate(-45 4 20)"/>
        <rect x="16" y="8" width="8" height="24" fill="#ec4899" transform="rotate(45 20 20)"/>
      </g>
      
      {/* O */}
      <g transform="translate(88, 88)">
        <rect x="0" y="0" width="24" height="8" fill="#06b6d4"/>
        <rect x="0" y="16" width="24" height="8" fill="#06b6d4"/>
        <rect x="0" y="0" width="8" height="24" fill="#06b6d4"/>
        <rect x="16" y="0" width="8" height="24" fill="#06b6d4"/>
      </g>
      
      {/* X */}
      <g transform="translate(136, 136)">
        <rect x="0" y="8" width="8" height="24" fill="#ec4899" transform="rotate(-45 4 20)"/>
        <rect x="16" y="8" width="8" height="24" fill="#ec4899" transform="rotate(45 20 20)"/>
      </g>
    </svg>
  );
}

export function PuzzleIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Puzzle pieces */}
      <g>
        {/* Piece 1 */}
        <rect x="30" y="30" width="60" height="60" fill="#8b5cf6" stroke="#ec4899" strokeWidth="3"/>
        <circle cx="90" cy="60" r="12" fill="#8b5cf6" stroke="#ec4899" strokeWidth="3"/>
        
        {/* Piece 2 */}
        <rect x="110" y="30" width="60" height="60" fill="#ec4899" stroke="#06b6d4" strokeWidth="3"/>
        <circle cx="110" cy="60" r="12" fill="#1a0f2e" stroke="#06b6d4" strokeWidth="3"/>
        
        {/* Piece 3 */}
        <rect x="30" y="110" width="60" height="60" fill="#06b6d4" stroke="#fbbf24" strokeWidth="3"/>
        <circle cx="60" cy="110" r="12" fill="#1a0f2e" stroke="#fbbf24" strokeWidth="3"/>
        <circle cx="90" cy="140" r="12" fill="#06b6d4" stroke="#fbbf24" strokeWidth="3"/>
        
        {/* Piece 4 */}
        <rect x="110" y="110" width="60" height="60" fill="#fbbf24" stroke="#8b5cf6" strokeWidth="3"/>
        <circle cx="110" cy="140" r="12" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="3"/>
      </g>
      
      {/* Sparkles */}
      <polygon points="100,10 105,20 95,20" fill="#fff" opacity="0.8"/>
      <polygon points="185,95 190,100 185,105 180,100" fill="#fff" opacity="0.8"/>
      <polygon points="15,185 20,190 15,195 10,190" fill="#fff" opacity="0.8"/>
    </svg>
  );
}

export function TriviaIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Question mark */}
      <g transform="translate(60, 30)">
        {/* Top curve */}
        <rect x="10" y="0" width="60" height="12" fill="#06b6d4"/>
        <rect x="70" y="12" width="12" height="30" fill="#06b6d4"/>
        <rect x="30" y="42" width="40" height="12" fill="#06b6d4"/>
        <rect x="30" y="54" width="12" height="30" fill="#06b6d4"/>
        
        {/* Dot */}
        <rect x="30" y="100" width="12" height="12" fill="#ec4899"/>
      </g>
      
      {/* Light bulb */}
      <g transform="translate(30, 120)">
        <rect x="15" y="0" width="30" height="8" fill="#fbbf24"/>
        <rect x="10" y="8" width="40" height="8" fill="#fbbf24"/>
        <rect x="5" y="16" width="50" height="20" fill="#fbbf24"/>
        <rect x="20" y="36" width="20" height="8" fill="#8b5cf6"/>
        <rect x="18" y="44" width="24" height="4" fill="#8b5cf6"/>
        
        {/* Light rays */}
        <rect x="-5" y="16" width="8" height="4" fill="#fbbf24" opacity="0.7"/>
        <rect x="57" y="16" width="8" height="4" fill="#fbbf24" opacity="0.7"/>
        <rect x="5" y="5" width="4" height="8" fill="#fbbf24" opacity="0.7"/>
        <rect x="51" y="5" width="4" height="8" fill="#fbbf24" opacity="0.7"/>
      </g>
      
      {/* Stars */}
      <polygon points="160,40 165,50 155,50" fill="#ec4899"/>
      <polygon points="170,80 175,90 165,90" fill="#8b5cf6"/>
      <polygon points="150,120 155,130 145,130" fill="#06b6d4"/>
    </svg>
  );
}

export function SpeedMatchIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Lightning bolt */}
      <polygon 
        points="100,20 80,90 110,85 90,150 140,80 110,85"
        fill="#fbbf24"
        stroke="#ec4899"
        strokeWidth="4"
      />
      
      {/* Speed lines */}
      <rect x="20" y="40" width="40" height="4" fill="#8b5cf6" opacity="0.6"/>
      <rect x="30" y="60" width="30" height="4" fill="#8b5cf6" opacity="0.6"/>
      <rect x="150" y="100" width="35" height="4" fill="#06b6d4" opacity="0.6"/>
      <rect x="155" y="120" width="30" height="4" fill="#06b6d4" opacity="0.6"/>
      <rect x="25" y="140" width="45" height="4" fill="#ec4899" opacity="0.6"/>
      <rect x="30" y="160" width="35" height="4" fill="#ec4899" opacity="0.6"/>
      
      {/* Clock segments */}
      <circle cx="100" cy="100" r="50" fill="none" stroke="#8b5cf6" strokeWidth="8" opacity="0.3"/>
      <line x1="100" y1="100" x2="100" y2="60" stroke="#ec4899" strokeWidth="6"/>
    </svg>
  );
}

export function MemoryCardsIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Card backs */}
      <g>
        {/* Card 1 */}
        <rect x="20" y="40" width="50" height="70" fill="#8b5cf6" stroke="#ec4899" strokeWidth="3" rx="4"/>
        <rect x="30" y="50" width="30" height="50" fill="none" stroke="#ec4899" strokeWidth="2"/>
        <circle cx="45" cy="75" r="8" fill="#ec4899"/>
        
        {/* Card 2 */}
        <rect x="80" y="30" width="50" height="70" fill="#ec4899" stroke="#06b6d4" strokeWidth="3" rx="4"/>
        <polygon points="105,50 115,70 95,70" fill="#06b6d4"/>
        <polygon points="95,80 105,80 105,90 95,90" fill="#06b6d4"/>
        
        {/* Card 3 */}
        <rect x="140" y="50" width="50" height="70" fill="#06b6d4" stroke="#fbbf24" strokeWidth="3" rx="4"/>
        <rect x="155" y="65" width="20" height="20" fill="#fbbf24"/>
        <circle cx="165" cy="95" r="10" fill="#fbbf24"/>
        
        {/* Card 4 - Face down */}
        <rect x="50" y="120" width="50" height="70" fill="#2d1b4e" stroke="#8b5cf6" strokeWidth="3" rx="4"/>
        <rect x="60" y="130" width="30" height="50" fill="none" stroke="#8b5cf6" strokeWidth="2"/>
        <text x="75" y="165" fill="#8b5cf6" fontSize="24" textAnchor="middle">?</text>
        
        {/* Card 5 - Face down */}
        <rect x="110" y="110" width="50" height="70" fill="#2d1b4e" stroke="#ec4899" strokeWidth="3" rx="4"/>
        <rect x="120" y="120" width="30" height="50" fill="none" stroke="#ec4899" strokeWidth="2"/>
        <text x="135" y="155" fill="#ec4899" fontSize="24" textAnchor="middle">?</text>
      </g>
      
      {/* Sparkle */}
      <polygon points="25,25 30,35 20,35" fill="#fbbf24" opacity="0.8"/>
    </svg>
  );
}

export function ConnectFourIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Grid background */}
      <rect x="30" y="40" width="140" height="120" fill="#2d1b4e" stroke="#8b5cf6" strokeWidth="4" rx="8"/>
      
      {/* Grid holes (7 columns x 6 rows) */}
      <g>
        {/* Row 1 */}
        <circle cx="48" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="68" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="88" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="108" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="128" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="148" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="168" cy="58" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        
        {/* Row 2 */}
        <circle cx="48" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="68" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="88" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="108" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="128" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="148" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="168" cy="78" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        
        {/* Row 3 */}
        <circle cx="48" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="68" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="88" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="108" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="128" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="148" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="168" cy="98" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        
        {/* Row 4 */}
        <circle cx="48" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="68" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="88" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="108" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="128" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="148" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="168" cy="118" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        
        {/* Row 5 with red tokens */}
        <circle cx="48" cy="138" r="8" fill="#ef4444" stroke="#dc2626" strokeWidth="2"/>
        <circle cx="68" cy="138" r="8" fill="#ef4444" stroke="#dc2626" strokeWidth="2"/>
        <circle cx="88" cy="138" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="108" cy="138" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="128" cy="138" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        <circle cx="148" cy="138" r="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/>
        <circle cx="168" cy="138" r="8" fill="#1a0f2e" stroke="#8b5cf6" strokeWidth="2"/>
        
        {/* Row 6 (bottom) with red and yellow tokens */}
        <circle cx="48" cy="150" r="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/>
        <circle cx="68" cy="150" r="8" fill="#ef4444" stroke="#dc2626" strokeWidth="2"/>
        <circle cx="88" cy="150" r="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/>
        <circle cx="108" cy="150" r="8" fill="#ef4444" stroke="#dc2626" strokeWidth="2"/>
        <circle cx="128" cy="150" r="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/>
        <circle cx="148" cy="150" r="8" fill="#ef4444" stroke="#dc2626" strokeWidth="2"/>
        <circle cx="168" cy="150" r="8" fill="#eab308" stroke="#ca8a04" strokeWidth="2"/>
      </g>
      
      {/* Glow effect */}
      <rect x="30" y="40" width="140" height="120" fill="none" stroke="#ec4899" strokeWidth="2" opacity="0.3" rx="8"/>
    </svg>
  );
}

export function RockPaperScissorsIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <rect width="200" height="200" fill="#1a0f2e"/>
      
      {/* Rock (left) - Pixelated boulder/stone */}
      <g transform="translate(20, 70)">
        <rect x="8" y="0" width="24" height="8" fill="#ec4899"/>
        <rect x="0" y="8" width="40" height="8" fill="#ec4899"/>
        <rect x="0" y="16" width="48" height="16" fill="#ec4899"/>
        <rect x="4" y="32" width="40" height="8" fill="#ec4899"/>
        <rect x="12" y="40" width="24" height="8" fill="#ec4899"/>
        {/* Shadow/depth */}
        <rect x="8" y="20" width="8" height="8" fill="#b91c7d" opacity="0.6"/>
        <rect x="32" y="24" width="8" height="8" fill="#b91c7d" opacity="0.6"/>
      </g>
      
      {/* Paper (center) - Pixelated sheet */}
      <g transform="translate(80, 55)">
        <rect x="5" y="0" width="40" height="60" fill="#06b6d4" stroke="#0891b2" strokeWidth="2"/>
        {/* Fold corner */}
        <polygon points="45,0 35,0 45,10" fill="#0891b2"/>
        <polygon points="45,0 45,10 35,0" fill="#e0f2fe"/>
        {/* Lines on paper */}
        <rect x="10" y="12" width="25" height="2" fill="#0891b2" opacity="0.3"/>
        <rect x="10" y="20" width="30" height="2" fill="#0891b2" opacity="0.3"/>
        <rect x="10" y="28" width="28" height="2" fill="#0891b2" opacity="0.3"/>
        <rect x="10" y="36" width="26" height="2" fill="#0891b2" opacity="0.3"/>
        <rect x="10" y="44" width="30" height="2" fill="#0891b2" opacity="0.3"/>
      </g>
      
      {/* Scissors (right) - Pixelated tool */}
      <g transform="translate(148, 70)">
        {/* Handles (circles) */}
        <rect x="0" y="0" width="12" height="12" fill="#fbbf24" stroke="#d97706" strokeWidth="2"/>
        <rect x="2" y="2" width="8" height="8" fill="#1a0f2e"/>
        
        <rect x="20" y="0" width="12" height="12" fill="#fbbf24" stroke="#d97706" strokeWidth="2"/>
        <rect x="22" y="2" width="8" height="8" fill="#1a0f2e"/>
        
        {/* Blades */}
        <rect x="4" y="12" width="4" height="28" fill="#fbbf24"/>
        <rect x="0" y="36" width="12" height="8" fill="#fbbf24"/>
        
        <rect x="24" y="12" width="4" height="28" fill="#fbbf24"/>
        <rect x="20" y="36" width="12" height="8" fill="#fbbf24"/>
        
        {/* Center screw */}
        <rect x="12" y="4" width="8" height="8" fill="#d97706"/>
        <rect x="14" y="6" width="4" height="4" fill="#fbbf24"/>
      </g>
    </svg>
  );
}

export function ArcadeTokenIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
      
      {/* Coin body */}
      <circle cx="50" cy="50" r="45" fill="url(#coinGradient)" stroke="#d97706" strokeWidth="3"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fef3c7" strokeWidth="2" opacity="0.5"/>
      
      {/* ARK text */}
      <text x="50" y="55" fill="#78350f" fontSize="20" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        ARK
      </text>
      
      {/* Shine effect */}
      <circle cx="35" cy="35" r="8" fill="#fef3c7" opacity="0.6"/>
      <circle cx="32" cy="38" r="4" fill="#fff" opacity="0.8"/>
    </svg>
  );
}

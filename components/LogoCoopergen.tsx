export default function LogoCoopergen({ size = 120, color = "#8B004B" }: { size?: number; color?: string }) {
  return (
    <svg 
      width={size} 
      height={size * 1.3} 
      viewBox="0 0 100 130" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central Circle */}
      <circle cx="50" cy="50" r="14" fill={color} />
      
      {/* Concentric Arcs */}
      <path 
        d="M50 25C63.8071 25 75 36.1929 75 50C75 63.8071 63.8071 75 50 75C36.1929 75 25 63.8071 25 50" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M50 18C67.6731 18 82 32.3269 82 50C82 67.6731 67.6731 82 50 82C32.3269 82 18 67.6731 18 50" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M50 11C71.5391 11 89 28.4609 89 50C89 71.5391 71.5391 89 50 89C28.4609 89 11 71.5391 11 50" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M50 4C75.4061 4 96 24.5939 96 50C96 75.4061 75.4061 96 50 96C24.5939 96 4 75.4061 4 50" 
        stroke={color} 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      {/* Logo Text */}
      <text 
        x="50" 
        y="125" 
        textAnchor="middle" 
        fill={color} 
        style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.15em', fontFamily: 'var(--font-montserrat)' }}
      >
        COOPERGEN
      </text>
    </svg>
  );
}

import Image from 'next/image';

export default function LogoCoopergen({ size = 120, color = "#8B004B" }: { size?: number; color?: string }) {
  // Se a cor for branca, aplicamos um filtro para inverter e clarear o PNG
  const isWhite = color.toUpperCase() === '#FFFFFF' || color.toLowerCase() === 'white';
  
  return (
    <div style={{ 
      width: size, 
      height: 'auto', 
      display: 'flex', 
      alignItems: 'center',
      justifyContent: 'center',
      filter: isWhite ? 'brightness(0) invert(1)' : 'none'
    }}>
      <Image 
        src="/logo.png" 
        alt="Coopergen Logo" 
        width={size} 
        height={size} 
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}

import Image from 'next/image';

export default function LogoCoopergen({ size = 120, color }: { size?: number, color?: string }) {
  return (
    <div style={{ width: size, height: 'auto' }}>
      <Image 
        src="/logo-coopergen.png" 
        alt="Coopergen Logo" 
        width={size} 
        height={size} 
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  );
}

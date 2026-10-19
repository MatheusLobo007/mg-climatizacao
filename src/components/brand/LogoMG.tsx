import React from 'react';
import Image from 'next/image';

interface LogoMGProps {
  variant?: 'full' | 'icon' | 'white' | 'monochrome';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LogoMG: React.FC<LogoMGProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
}) => {
  const isWhite = variant === 'white' || variant === 'monochrome';
  const logoSrc = isWhite ? '/logo-mg-white.png' : '/logo-mg-blue.png';
  const primaryBlue = isWhite ? '#FFFFFF' : '#0754D8';
  const textColor = isWhite ? '#FFFFFF' : '#103778';

  // Dimensões compactas e proporcionais para garantir layout limpo em 2 linhas
  const dimensions = {
    sm: { width: 54, height: 22 },
    md: { width: 75, height: 30 },
    lg: { width: 100, height: 40 },
    xl: { width: 130, height: 52 },
  };

  const dim = dimensions[size];

  const IconSymbol = (
    <div className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105">
      <Image
        src={logoSrc}
        alt="MG Climatização e Elétrica"
        width={dim.width}
        height={dim.height}
        priority
        className="object-contain"
        style={{ height: dim.height, width: 'auto' }}
      />
    </div>
  );

  if (variant === 'icon') {
    return <div className={`flex items-center shrink-0 ${className}`}>{IconSymbol}</div>;
  }

  return (
    <div className={`flex items-center gap-2 select-none shrink-0 ${className}`}>
      {IconSymbol}
      <div className="flex flex-col justify-center leading-tight">
        {/* Linha 1: MG Climatização */}
        <span
          className="font-extrabold tracking-tight whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-montserrat), sans-serif',
            color: textColor,
            fontSize:
              size === 'sm'
                ? '0.95rem'
                : size === 'lg'
                ? '1.35rem'
                : size === 'xl'
                ? '1.75rem'
                : '1.15rem',
            letterSpacing: '-0.02em',
          }}
        >
          MG <span style={{ color: primaryBlue }}>Climatização</span>
        </span>

        {/* Linha 2: Refrigeração & Elétrica */}
        <span
          className="text-[8.5px] font-semibold tracking-wider uppercase opacity-85 whitespace-nowrap"
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            color: isWhite ? '#EAF3FF' : '#64748B',
            letterSpacing: '0.06em',
          }}
        >
          Refrigeração & Elétrica
        </span>
      </div>
    </div>
  );
};

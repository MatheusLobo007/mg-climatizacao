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

  const dimensions = {
    sm: { width: 71, height: 28 },
    md: { width: 96, height: 38 },
    lg: { width: 126, height: 50 },
    xl: { width: 166, height: 66 },
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
    return <div className={`flex items-center ${className}`}>{IconSymbol}</div>;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {IconSymbol}
      <div className="flex flex-col leading-none">
        <span
          className="font-extrabold tracking-tight"
          style={{
            fontFamily: 'var(--font-montserrat), sans-serif',
            color: textColor,
            fontSize:
              size === 'sm'
                ? '1.05rem'
                : size === 'lg'
                ? '1.5rem'
                : size === 'xl'
                ? '1.9rem'
                : '1.25rem',
            letterSpacing: '-0.03em',
          }}
        >
          MG <span style={{ color: primaryBlue }}>Climatização</span>
        </span>
        <span
          className="text-[9px] font-semibold tracking-wider uppercase mt-0.5 opacity-80"
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            color: isWhite ? '#EAF3FF' : '#64748B',
            letterSpacing: '0.08em',
          }}
        >
          Refrigeração & Elétrica
        </span>
      </div>
    </div>
  );
};

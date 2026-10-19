import React from 'react';

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
  // Cores oficiais da marca MG Climatização
  const primaryBlue = variant === 'white' || variant === 'monochrome' ? '#FFFFFF' : '#0754D8';
  const navyBlue = variant === 'white' || variant === 'monochrome' ? '#EAF3FF' : '#103778';
  const textColor = variant === 'white' || variant === 'monochrome' ? '#FFFFFF' : '#103778';

  const heights = {
    sm: 32,
    md: 44,
    lg: 56,
    xl: 72,
  };

  const h = heights[size];

  // Apenas o símbolo gráfico (Emblema com elipse, ar split, chave e engrenagem)
  const IconSymbol = (
    <svg
      width={h * 1.5}
      height={h}
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-block transition-transform hover:scale-105"
    >
      {/* Elipse dinâmica / swoosh exterior */}
      <path
        d="M152 48C152 70 118 88 76 88C34 88 0 70 0 48C0 26 34 8 76 8C105 8 131 16 144 28"
        stroke={primaryBlue}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M20 54C22 72 52 84 86 84C122 84 148 72 152 56"
        stroke={navyBlue}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Ícone Split Ar-Condicionado */}
      <rect
        x="36"
        y="30"
        width="54"
        height="26"
        rx="5"
        stroke={primaryBlue}
        strokeWidth="4"
        fill="white"
        fillOpacity={variant === 'white' ? '0.15' : '1'}
      />
      {/* Aleta do split */}
      <line x1="42" y1="48" x2="84" y2="48" stroke={primaryBlue} strokeWidth="3" strokeLinecap="round" />
      {/* Ondas sutis de ar frio */}
      <path
        d="M48 60C48 64 50 66 52 66M62 60C62 64 64 66 66 66M76 60C76 64 78 66 80 66"
        stroke={navyBlue}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Chave de fenda (elétrica/manutenção) */}
      <g transform="translate(98, 26) rotate(25)">
        <rect x="0" y="0" width="6" height="28" rx="2" fill={primaryBlue} />
        <rect x="-2" y="24" width="10" height="18" rx="3" fill={navyBlue} />
      </g>

      {/* Engrenagem / Mecânica */}
      <g transform="translate(122, 58)">
        <circle cx="10" cy="10" r="7" stroke={primaryBlue} strokeWidth="3" fill="none" />
        <circle cx="10" cy="10" r="3" fill={navyBlue} />
        {/* Dentes da engrenagem */}
        <line x1="10" y1="0" x2="10" y2="3" stroke={primaryBlue} strokeWidth="3" strokeLinecap="round" />
        <line x1="10" y1="17" x2="10" y2="20" stroke={primaryBlue} strokeWidth="3" strokeLinecap="round" />
        <line x1="0" y1="10" x2="3" y2="10" stroke={primaryBlue} strokeWidth="3" strokeLinecap="round" />
        <line x1="17" y1="10" x2="20" y2="10" stroke={primaryBlue} strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
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
            fontSize: size === 'sm' ? '1.1rem' : size === 'lg' ? '1.6rem' : size === 'xl' ? '2.1rem' : '1.35rem',
            letterSpacing: '-0.03em',
          }}
        >
          MG <span style={{ color: primaryBlue }}>Climatização</span>
        </span>
        <span
          className="text-[10px] font-semibold tracking-wider uppercase mt-0.5 opacity-80"
          style={{
            fontFamily: 'var(--font-inter), sans-serif',
            color: variant === 'white' ? '#EAF3FF' : '#64748B',
            letterSpacing: '0.08em',
          }}
        >
          Refrigeração & Elétrica
        </span>
      </div>
    </div>
  );
};

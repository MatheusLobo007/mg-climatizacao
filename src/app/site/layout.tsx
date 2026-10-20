import type { Metadata } from 'next';
import './site.css';

export const metadata: Metadata = {
  // Ao publicar, defina o domínio real para as imagens de compartilhamento (Open Graph):
  // metadataBase: new URL('https://www.seudominio.com.br'),
  title: 'MG Climatização | Instalação, Higienização de Ar-Condicionado e Elétrica em Tangará - RN',
  description:
    'Instalação, higienização, manutenção preventiva e PMOC de ar-condicionado, além de serviços de elétrica residencial em Tangará - RN e região. Orçamento rápido pelo WhatsApp e garantia por escrito.',
  openGraph: {
    title: 'MG Climatização | Refrigeração, Climatização e Elétrica',
    description:
      'Ar-condicionado instalado, limpo e funcionando como novo. Atendimento técnico profissional com garantia.',
    images: ['/site/hero-instalacao.jpg'],
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="mg-site bg-white text-[#263447]">{children}</div>;
}

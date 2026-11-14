import type {Metadata} from 'next';
import {Bricolage_Grotesque, DM_Sans, IBM_Plex_Mono} from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mine-to-Port Supply Chain Line Animation',
  description:
    'Interactive line-art supply chain animation and HD video exporter depicting mine excavation, haul dumper transit, port conveyor unloading, bulk ship loading, and empty return cycle.',
  openGraph: {
    title: 'Mine-to-Port Supply Chain Line Animation',
    description:
      'Interactive line-art supply chain animation and HD video exporter depicting mine excavation, haul dumper transit, port conveyor unloading, bulk ship loading, and empty return cycle.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mine-to-Port Supply Chain Line Animation',
    description:
      'Interactive line-art supply chain animation and HD video exporter depicting mine excavation, haul dumper transit, port conveyor unloading, bulk ship loading, and empty return cycle.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${ibmPlexMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 font-sans antialiased selection:bg-sky-100 selection:text-sky-900"
      >
        {children}
      </body>
    </html>
  );
}

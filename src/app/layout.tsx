import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMA Negeri 18 Bombana — Green & Friendly School',
  description: 'Website resmi SMA Negeri 18 Bombana, Kabupaten Bombana, Sulawesi Tenggara. Sekolah ramah lingkungan, berkarakter, dan berprestasi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}

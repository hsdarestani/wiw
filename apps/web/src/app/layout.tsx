import './globals.css';
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'SchichtPro',
  description: 'Dienstplanung und Mitarbeitermanagement',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="de">
      <body className={inter.variable}>{children}</body>
    </html>
  );
}

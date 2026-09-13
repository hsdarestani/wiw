import './globals.css';
import './auth.css';
import './team.css';

export const metadata = {
  title: 'SchichtPro',
  description: 'Dienstplanung und Mitarbeitermanagement',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

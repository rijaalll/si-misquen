// app/layout.js
// Layout utama untuk seluruh aplikasi Next.js.
// Mengatur provider otentikasi.

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aplikasi Koperasi',
  description: 'Web Koperasi dengan Next.js, Tailwind CSS, dan Firebase Realtime DB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

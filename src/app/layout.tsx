import type { Metadata } from 'next';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'GUM Admin',
  description: 'GUM Internships operations portal',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Noto+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-neutral-50">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

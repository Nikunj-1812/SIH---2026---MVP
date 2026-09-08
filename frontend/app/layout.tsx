import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SecureTransform - SIH 2026 PS 26154 MVP',
  description: 'Secure GenAI Content Transformation Platform - Understand once, generate multiple controlled outputs, validate, and verify provenance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full bg-slate-50 ${inter.variable}`}>
      <body suppressHydrationWarning className={`${inter.className} h-full bg-slate-50 text-slate-900 antialiased font-sans`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}

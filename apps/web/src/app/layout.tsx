import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'Social Platform | Production-Grade Social Network',
  description: 'Enterprise scalable social media platform built with Next.js, Express, PostgreSQL, Redis, and MinIO.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-slate-100 antialiased selection:bg-blue-600 selection:text-white flex flex-col">
        <QueryProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
        </QueryProvider>
      </body>
    </html>
  );
}

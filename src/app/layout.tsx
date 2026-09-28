import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'K-Extintor - Gestión de Extintores',
  description: 'Control operativo del inventario de extintores',
  applicationName: 'K-Extintor',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'K-Extintor',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#0d1b33',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__kextintorInstall=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__kextintorInstall=e;window.dispatchEvent(new Event('kextintor-install-ready'));});`,
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

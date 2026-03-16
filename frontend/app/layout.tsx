import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'AI Debugger — GitHub Bug Assistant',
  description: 'AI-powered GitHub debugging assistant that analyzes bugs, generates patches, and creates pull requests automatically.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#161b22',
                color: '#e6edf3',
                border: '1px solid #30363d',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#3fb950', secondary: '#161b22' } },
              error:   { iconTheme: { primary: '#f85149', secondary: '#161b22' } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

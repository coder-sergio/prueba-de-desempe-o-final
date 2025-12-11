import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'HelpDeskPro',
  description: 'Gestión de tickets de soporte',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          {process.env.NODE_ENV !== 'production' && (
            // Cargar Tailwind desde CDN en desarrollo para que las clases funcionen
            <script src="https://cdn.tailwindcss.com" />
          )}
          <div className="app-shell min-h-screen">
            <main className="flex-1 p-6">
              <div className="container mx-auto">{children}</div>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

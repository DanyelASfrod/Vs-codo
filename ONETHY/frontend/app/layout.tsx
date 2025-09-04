
import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'ONETHY - WhatsApp SaaS',
  description: 'Atendimento por WhatsApp simplificado',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className="dark">
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}

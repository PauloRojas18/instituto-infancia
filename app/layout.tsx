// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Infância — instituto da infância',
  description: 'Sistema de chamadas do Ministério Infantil Anália Franco',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
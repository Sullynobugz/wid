import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WID — Willkommen in Deutschland',
  description: 'Integrationsplattform für Maßnahme-Träger',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}

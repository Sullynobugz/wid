import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { PHProvider } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WID — Willkommen in Deutschland',
  description: 'Integrationsplattform für Maßnahme-Träger',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col"><PHProvider>{children}</PHProvider></body>
    </html>
  )
}

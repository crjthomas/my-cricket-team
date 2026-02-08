import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'My Cricket Team',
  description: 'AI-powered cricket team management application',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col pl-64">
            <Header />
            <main className="flex-1 p-6 cricket-gradient">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  )
}


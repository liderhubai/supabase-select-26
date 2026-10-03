import type { Metadata } from 'next'
import { Outfit, Roboto, Geist_Mono } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const roboto = Roboto({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-roboto' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'itera.ai',
  description:
    'Agents want to be used. Every bad conversation becomes a better agent, reviewed by humans, tested automatically, shipped with a diff.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${outfit.variable} ${roboto.variable} ${geistMono.variable}`}>
      <body className="h-full">{children}</body>
    </html>
  )
}

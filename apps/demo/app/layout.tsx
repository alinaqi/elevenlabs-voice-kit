import type { Metadata } from 'next'
import { Archivo_Black as Display, JetBrains_Mono as Mono } from 'next/font/google'
import Link from 'next/link'
import { AgentPromptBar } from '@/components/AgentPromptBar'
import { SITE_URL } from '@/lib/site'
import './globals.css'

const mono = Mono({ subsets: ['latin'], variable: '--font-mono' })
const display = Display({ subsets: ['latin'], weight: '400', variable: '--font-display' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Voice Kit · Voice of the Oasis',
  description: 'ElevenLabs starter kit for the Voice of the Oasis hackathon — Dubai Silicon Oasis × ElevenLabs × Doers Summit.',
  alternates: { types: { 'text/plain': '/llms.txt' } }
}

function Header () {
  return (
    <header className='top'>
      <div className='inner'>
        <Link href='/' className='brands'>
          <b>Dubai Silicon Oasis</b><span className='x'>×</span><b>ElevenLabs</b><span className='x'>×</span><b>Doers Summit</b>
        </Link>
        <nav>
          <Link href='/agents/navigator'>agents</Link>
          <Link href='/avatar'>avatar</Link>
          <Link href='/phone'>phone</Link>
          <Link href='/research'>research</Link>
          <Link href='/tts'>tts</Link>
          <Link href='/stt'>stt</Link>
          <Link href='/build'>build</Link>
          <Link href='/docs'>docs</Link>
          <a href='/llms.txt'>llms.txt</a>
        </nav>
      </div>
    </header>
  )
}

function Footer () {
  return (
    <footer>
      <div className='inner'>
        <span>voice-kit v0.1 · Voice of the Oasis hackathon · Dtec, DSO · 24–25 Nov 2026</span>
        <span>Powered by <span className='palgu'>PALGU</span></span>
      </div>
    </footer>
  )
}

export default function RootLayout ({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${mono.variable} ${display.variable}`}>
      <body>
        <Header />
        <AgentPromptBar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}

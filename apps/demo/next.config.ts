import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@workhub/voice-kit'],
  async headers () {
    return [{ source: '/(.*)', headers: [{ key: 'Permissions-Policy', value: 'microphone=(self "https://*.liveavatar.com"), camera=(), autoplay=(self "https://*.liveavatar.com")' }] }]
  }
}

export default config

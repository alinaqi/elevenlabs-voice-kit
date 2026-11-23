/** Generate hold music with ElevenLabs Music: MP3 for the web, raw 8 kHz μ-law for Twilio phone calls. */
import { execFileSync } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { createVoiceKit } from '../packages/voice-kit/src/index.js'

const PROMPT = 'Calm, warm hold music for a Dubai tech campus reception: soft oud and gentle synth pads, light ambient percussion, 92 bpm, seamless loop, no vocals'
const kit = createVoiceKit()
mkdirSync('../assets', { recursive: true })
const mp3 = await kit.composeMusic(PROMPT, { lengthMs: 30000, format: 'mp3_44100_128' })
writeFileSync('../assets/hold-music.mp3', mp3)
// Phone: 8 kHz mono μ-law, transcoded from the same track so web and phone sound identical.
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', '../assets/hold-music.mp3', '-ac', '1', '-ar', '8000', '-af', 'loudnorm=I=-20', '-f', 'mulaw', '../assets/hold-music.ulaw'])
console.log(`mp3 ${mp3.length} bytes + hold-music.ulaw written`)

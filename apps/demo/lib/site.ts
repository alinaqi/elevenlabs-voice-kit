export const SITE_URL = 'https://voice-of-the-oasis.palgu.ai'

/** The one prompt teams paste into Claude Code / Codex / Cursor. */
export const AGENT_PROMPT = `Read ${SITE_URL}/llms-full.txt and integrate @workhub/voice-kit (ElevenLabs voice agents, English + Arabic, one ELEVENLABS_API_KEY) into this app.
Pick the preset that fits my use case (navigator, soft-landing, hala or assistant) or create one with definePreset.
Keep the key server-side, add the /api/token and /api/research routes, build a talk page with useVoiceAgent, and run the verify steps in section 8.`

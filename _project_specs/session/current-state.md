# Current state (2026-11-24)

**Done:** library v0.1.1, demo, phone bridge, research service, docs page, llms.txt. All validated live.

**Live:**
- Demo, docs and llms.txt: https://voice-of-the-oasis.palgu.ai (Vercel `voice-kit-demo`, team workhub)
- Research: https://voice-kit-research.vercel.app (Vercel Python)
- Phone: https://voice-kit-phone.onrender.com (Render); Twilio +1 350 218 1012 → `/twiml`
- Release: https://github.com/alinaqi/elevenlabs-voice-kit/releases/tag/v0.1.1

**Next steps:**
1. Publish the npm package.
2. Rotate the ElevenLabs, Twilio and Render keys shared in chat after the event.
3. Use a shared rate limiter (Upstash) if demo traffic grows.

**Files to read first:** README.md, CLAUDE.md, llms-full.txt, docs/adr/.

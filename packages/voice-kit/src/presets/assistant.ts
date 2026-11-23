import { definePreset } from './define.js'
import { handoverTool, researchTool } from './tool-specs.js'

/** A blank-slate bilingual assistant to fork for any other use case. */
export const assistant = definePreset({
  id: 'assistant',
  name: 'Voice Assistant',
  description: 'General bilingual voice assistant with fact research — copy this to start your own use case.',
  languages: ['en', 'ar'],
  greeting: 'Hi! مرحباً! How can I help?',
  firstMessage: { en: 'Hi! What can I help you with?', ar: 'مرحباً! كيف يمكنني مساعدتك؟' },
  systemPrompt: 'You are a helpful, concise voice assistant for the Voice of the Oasis hackathon at Dubai Silicon Oasis.',
  tools: [researchTool, handoverTool]
})

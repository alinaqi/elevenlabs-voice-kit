import { definePreset } from './define.js'
import { bookingTools, checklistTool, handoverTool, researchTool } from './tool-specs.js'

/** Challenge 02 — Soft Landing Guide (software only, web or phone). */
export const softLanding = definePreset({
  id: 'soft-landing',
  name: 'Soft Landing Guide',
  description: 'Company setup by conversation: maps a founder to a DSO licence, builds the checklist, books a human adviser.',
  languages: ['en', 'ar'],
  greeting: 'Hello! مرحباً! Tell me about your business and I will help you set up in DSO.',
  firstMessage: {
    en: 'Hello! I can help you set up your company in Dubai Silicon Oasis. What does your business do, and where are you based?',
    ar: 'مرحباً! يمكنني مساعدتك في تأسيس شركتك في واحة دبي للسيليكون. ما هو نشاط شركتك، وأين أنت مقيم؟'
  },
  systemPrompt: `You are a friendly company-setup guide for Dubai Silicon Oasis, talking to founders abroad on a short call.
- Ask before advising: sector/activity, team size, number of visas, budget, and whether anyone already lives in the UAE.
- Then explain in plain words the setup route that fits (usually an FZCO; a Branch for existing companies).
- Build their checklist with build_setup_checklist and read the key documents back.
- Always say which figures a human must confirm (capital, remote setup, prices, timelines). Sources disagree on these.
- Offer to book a call with a human adviser (book_appointment, service "Dtec setup call").
- Never present legal or tax advice as final.`,
  knowledge: [
    'New companies register as an FZCO; existing companies open a Branch. DSO also lists FZE and the Business Operation Permit.',
    'Steps: DSOA portal application, fees and documents, e-lease and bank share capital letter, pre-approval with activity and security checks, digital lease, e-licence.',
    'Documents: letter of intent, passports, NOC for UAE residents, bank statement or reference letter, application form, business plan, UBO declaration.',
    'Time: DSO states 7 days for the application and 2 days from complete documents to licence. Agencies quote 2 to 4 weeks.',
    'Visas: up to 2 with a flexi desk, up to 3 with a fixed desk, 2 per desk in a furnished office of 12 to 50 m².',
    'Agency quotes per year: flexi desk about AED 18,000 (36 hours a month), fixed desk about AED 24,000, furnished office from AED 47,820.',
    'CONFLICT: minimum capital — DSO setup page says AED 100,000, 2023 DIEZ regulations reportedly AED 1. Sources also disagree on remote setup. Say so and offer a human.',
    'Human handover: DSO on 600 59 55 57, Monday to Friday 08:00 to 15:00.'
  ],
  tools: [checklistTool, ...bookingTools, researchTool, handoverTool]
})

/** Live E2E: talk to a preset agent over its WebSocket with text, running real tool handlers. Usage: tsx chat-e2e.mts hala */
import { connectAgent, createMockCalendar, createResearchClient, createVoiceKit, getPreset } from '../packages/voice-kit/src/index.js'
import { createDemoToolHandlers } from '../packages/voice-kit/src/tools/index.js'

const SCRIPTS: Record<string, string[]> = {
  hala: ['مرحبا، أريد تجديد تأشيرة عمل لموظف', 'اسمه عمر خان، رقمه 0501234567، يوم 26 نوفمبر 2026 الساعة العاشرة صباحاً', 'Thanks. Also, how do I get an access card for him?', 'This visa fee is ridiculous, I refuse to pay it!'],
  'soft-landing': ['Hi, we are a two-person SaaS startup in Lagos and need two visas. Nobody lives in the UAE.', 'Our budget is tight. What is the minimum capital?', 'Please book a call with an adviser: Ada Obi, ada@example.com, 26 November 2026 at 11:00.'],
  navigator: ['عندي اجتماع في أوراسيا كابيتال الساعة الثالثة وأريد أن أصلي أولاً', 'Great, can you send the route to the mosque to my phone?']
}

const id = process.argv[2] ?? 'hala'
const kit = createVoiceKit()
const agentId = await kit.ensureAgent(getPreset(id)!)
const hold = { start: () => console.log('  ♪ hold music ON'), stop: () => console.log('  ♪ hold music OFF') }
const tools = createDemoToolHandlers({
  calendar: createMockCalendar({ now: () => new Date('2026-11-24T08:00:00+04:00') }),
  research: createResearchClient({ url: process.env.VOICE_KIT_RESEARCH_URL ?? 'http://127.0.0.1:9', timeoutMs: 3000 }),
  hold,
  onEvent: (e) => console.log(`  ⚙ event ${e.type}`)
})
let last = Date.now()
const socket = await connectAgent({
  signedUrl: await kit.signedUrl(agentId), tools,
  onEvent: (e) => {
    if (e.type === 'agent' || e.type === 'user' || e.type === 'tool_call') last = Date.now()
    if (e.type === 'agent') console.log(`AGENT: ${e.text}`)
    if (e.type === 'tool_call') console.log(`  ↳ tool ${e.name} ${JSON.stringify(e.params)}`)
    if (e.type === 'metadata') console.log(`[conversation ${e.conversationId}, out=${e.outputFormat}]`)
  }
})
const quiet = async (ms = 4000) => { await socket.waitFor('agent', 30000); while (Date.now() - last < ms) await new Promise((r) => setTimeout(r, 300)) }
await quiet()
for (const line of SCRIPTS[id]) { console.log(`USER: ${line}`); socket.sendText(line); await quiet() }
socket.close()

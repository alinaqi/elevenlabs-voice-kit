/** Text-only simulation of a preset agent: an LLM plays the caller. Usage: tsx simulate.mts hala */
import { createVoiceKit, getPreset } from '../packages/voice-kit/src/index.js'

const SCENARIOS: Record<string, string> = {
  hala: 'You are an HR manager. Start in Arabic asking to renew an employee visa (employee name Omar Khan, contact 0501234567, wants 2026-11-26 at 10:00). After the booking is confirmed, switch to English and ask about an access card. Then dispute the visa fee angrily.',
  'soft-landing': 'You are a two-person SaaS founding team calling from Lagos, Nigeria. You need two visas, budget is tight. Nobody lives in the UAE. Answer questions briefly. Ask about minimum capital. Ask to book a call with a human adviser for 2026-11-26 at 11:00, name Ada Obi, email ada@example.com.',
  navigator: 'You are a visitor. Start in Arabic: you have a meeting at Oraseya Capital at three and want to pray first. Then switch to English and ask for the route on your phone.'
}

const id = process.argv[2] ?? 'hala'
const kit = createVoiceKit()
const agentId = await kit.ensureAgent(getPreset(id)!)
const turns = await kit.simulate(agentId, { userPrompt: SCENARIOS[id], turns: 10 }) as Array<{ role: string, message?: string, toolCalls?: Array<{ toolName: string, paramsAsJson: string }> }>
for (const t of turns) {
  const tools = (t.toolCalls ?? []).map((c) => `  ↳ tool ${c.toolName} ${c.paramsAsJson}`).join('\n')
  console.log(`${t.role.toUpperCase()}: ${t.message ?? ''}${tools ? '\n' + tools : ''}`)
}

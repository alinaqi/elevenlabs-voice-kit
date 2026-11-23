/** Create/update every preset agent (web, phone, avatar) and print env lines to pin their IDs. */
import { createVoiceKit, presets } from '../packages/voice-kit/src/index.js'

const kit = createVoiceKit()
for (const [id, preset] of Object.entries(presets)) {
  const env = id.toUpperCase().replace(/-/g, '_')
  for (const channel of ['web', 'phone', 'avatar'] as const) {
    const agentId = await kit.ensureAgent(preset, channel)
    console.log(`AGENT_ID_${env}${channel === 'web' ? '' : '_' + channel.toUpperCase()}=${agentId}`)
  }
}

const BIAS = 0x84
const CLIP = 32635

function encodeSample (sample: number): number {
  const sign = sample < 0 ? 0x80 : 0
  const magnitude = Math.min(Math.abs(sample), CLIP) + BIAS
  const exponent = Math.max(0, Math.floor(Math.log2(magnitude)) - 7)
  const mantissa = (magnitude >> (exponent + 3)) & 0x0f
  return ~(sign | (exponent << 4) | mantissa) & 0xff
}

/** Convert little-endian 16-bit PCM to G.711 μ-law (what Twilio phone streams carry). */
export function pcm16ToMulaw (pcm: Uint8Array): Uint8Array {
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength)
  const out = new Uint8Array(Math.floor(pcm.byteLength / 2))
  for (let i = 0; i < out.length; i++) out[i] = encodeSample(view.getInt16(i * 2, true))
  return out
}

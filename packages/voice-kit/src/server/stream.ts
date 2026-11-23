/** Read a web ReadableStream (what the ElevenLabs SDK returns for audio) into one Uint8Array. */
export async function readAll (stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  const reader = stream.getReader()
  for (let r = await reader.read(); !r.done; r = await reader.read()) chunks.push(r.value)
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
  chunks.reduce((offset, c) => { out.set(c, offset); return offset + c.length }, 0)
  return out
}

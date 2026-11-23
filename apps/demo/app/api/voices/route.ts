import { getKit } from '@/lib/server'

export const revalidate = 3600
export async function GET () {
  try {
    return Response.json(await getKit().listVoices())
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}

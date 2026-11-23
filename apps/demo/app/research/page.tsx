import { ResearchBox } from '@/components/ResearchBox'

export default function Page () {
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Fact <em>research</em></h1>
      <p className='dim' style={{ maxWidth: 760 }}>
        Agents call <code>research_fact</code> for anything outside their prompt. Hackathon topics are prefetched (answers in ~2 ms).
        Anything else is researched live by a pydantic-ai service (Gemini 3.8 Flash racing OpenAI, with web search). If it takes longer than 1.2 s
        the caller hears ElevenLabs-generated hold music — on the web and on the phone.
      </p>
      <ResearchBox />
    </>
  )
}

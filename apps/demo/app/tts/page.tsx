import { TtsPlayground } from '@/components/TtsPlayground'

export default function Page () {
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Text → <em>speech</em></h1>
      <p className='dim'>Arabic automatically uses the multilingual Flash v2.5 model. Server: <code>await kit.speak(text, {'{ language }'})</code></p>
      <TtsPlayground />
    </>
  )
}

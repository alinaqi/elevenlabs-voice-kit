import { SttRecorder } from '@/components/SttRecorder'

export default function Page () {
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Speech → <em>text</em></h1>
      <p className='dim'>Scribe detects the language for you (try Arabic, English or both). Server: <code>await kit.transcribe(blob)</code></p>
      <SttRecorder />
    </>
  )
}

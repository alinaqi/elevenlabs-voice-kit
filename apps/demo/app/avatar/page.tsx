import { AvatarStage } from '@/components/AvatarStage'

export default function Page () {
  return (
    <>
      <h1 style={{ fontSize: 40 }}>Talking <em>avatar</em></h1>
      <p className='dim' style={{ maxWidth: 760 }}>
        The same ElevenLabs agent with a video face — great for a reception screen next to the robot. Optional add-on: needs a LiveAvatar key
        (<code>LIVEAVATAR_API_KEY</code>, <code>LIVEAVATAR_AVATAR_ID</code>). In avatar mode the agent answers from knowledge only (no booking tools).
      </p>
      <AvatarStage />
    </>
  )
}

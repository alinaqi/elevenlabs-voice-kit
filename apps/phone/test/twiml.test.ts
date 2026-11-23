import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { connectTwiml, menuTwiml, presetForDigit } from '../src/twiml.js'
import { validTwilioSignature } from '../src/signature.js'

describe('twiml', () => {
  it('plays the ElevenLabs menu inside a Gather', () => {
    const xml = menuTwiml('https://p.example')
    expect(xml).toContain('<Gather numDigits="1" action="https://p.example/twiml/route"')
    expect(xml).toContain('<Play>https://p.example/audio/menu.mp3</Play>')
  })

  it('connects the call to the media stream with the preset as a parameter', () => {
    const xml = connectTwiml('https://p.example', 'hala')
    expect(xml).toContain('<Stream url="wss://p.example/media">')
    expect(xml).toContain('<Parameter name="preset" value="hala"/>')
  })

  it('maps keypad digits to presets, defaulting to hala', () => {
    expect([presetForDigit('1'), presetForDigit('2'), presetForDigit('3'), presetForDigit('9')]).toEqual(['navigator', 'soft-landing', 'hala', 'hala'])
  })
})

describe('validTwilioSignature', () => {
  const url = 'https://p.example/twiml'
  const params = { CallSid: 'CA1', From: '+1555' }
  const sign = (token: string) => createHmac('sha1', token).update(url + 'CallSid' + 'CA1' + 'From' + '+1555').digest('base64')

  it('accepts a correct signature and rejects a wrong one', () => {
    expect(validTwilioSignature('tok', url, params, sign('tok'))).toBe(true)
    expect(validTwilioSignature('tok', url, params, sign('other'))).toBe(false)
    expect(validTwilioSignature('tok', url, params, undefined)).toBe(false)
  })
})

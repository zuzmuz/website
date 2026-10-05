let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
    audioContext ??= new AudioContext({ latencyHint: 'interactive' })
    return audioContext
}

export async function unlockAudioContext() {
    const c = getAudioContext()
    if (c.state === 'suspended') await c.resume()
    return c
}

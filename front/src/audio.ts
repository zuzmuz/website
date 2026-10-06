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

export async function loadAudioFromSource(src: string): Promise<AudioBuffer> {
    const res = await fetch(src)
    if (!res.ok) throw new Error(`Could not load ${src} (${res.status})`)
    const context = await unlockAudioContext()
    const buffer = await context.decodeAudioData(await res.arrayBuffer())
    return buffer
}

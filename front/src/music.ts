export interface Note {
    pitch: number,
    octave: number,
    duration: number,
}

export function getFrequency(pitch: number, octave: number): number {
    const midi = pitch + (octave+1) * 12
    return 440 * Math.pow(2, (midi - 69) / 12)
}

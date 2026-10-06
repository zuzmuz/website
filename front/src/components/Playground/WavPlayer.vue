<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { unlockAudioContext } from '@/audio'

const props = withDefaults(
  defineProps<{
    src: string // URL of the .wav file
    loop?: boolean
    gain?: number // 0–1
  }>(),
  {
    loop: false,
    gain: 1,
  },
)

const playing = ref(false)
const loading = ref(false)
const error = ref('')
const duration = ref(0)
const position = ref(0) // seconds into the file

let ac: AudioContext | null = null
let buffer: AudioBuffer | null = null
let source: AudioBufferSourceNode | null = null
let gainNode: GainNode | null = null
let startedAt = 0 // context time that corresponds to position 0 of the current run
let offset = 0 // where in the file to resume from
let rafId = 0

const FADE = 0.015 // short fades avoid clicks on play/pause

async function load(context: AudioContext): Promise<AudioBuffer> {
  if (buffer) return buffer
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error(`Could not load ${props.src} (${res.status})`)
    buffer = await context.decodeAudioData(await res.arrayBuffer())
    duration.value = buffer.duration
    return buffer
  } finally {
    loading.value = false
  }
}

async function play() {
  try {
    const context = await unlockAudioContext()
    ac = context
    const buf = await load(context)
    if (offset >= buf.duration) offset = 0

    gainNode = context.createGain()
    gainNode.connect(context.destination)
    source = context.createBufferSource()
    source.buffer = buf
    source.loop = props.loop
    source.connect(gainNode)

    // start slightly ahead so the fade-in is never scheduled in the past
    const t0 = context.currentTime + 0.03
    gainNode.gain.setValueAtTime(0, t0)
    gainNode.gain.linearRampToValueAtTime(props.gain, t0 + FADE)
    source.start(t0, offset)
    startedAt = t0 - offset

    const s = source
    s.onended = () => {
      if (source !== s) return // paused or replaced; handled elsewhere
      playing.value = false
      offset = 0
      position.value = 0
      cleanup()
    }
    playing.value = true
    tick()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
}

function pause() {
  if (!ac || !source || !gainNode) return
  const t = ac.currentTime
  offset = currentPosition()
  gainNode.gain.cancelScheduledValues(t)
  gainNode.gain.setValueAtTime(gainNode.gain.value, t)
  gainNode.gain.linearRampToValueAtTime(0, t + FADE)
  source.stop(t + FADE + 0.005)
  source = null // onended for this source is now ignored
  const g = gainNode
  setTimeout(() => g.disconnect(), 100)
  gainNode = null
  playing.value = false
}

function cleanup() {
  cancelAnimationFrame(rafId)
  source?.disconnect()
  gainNode?.disconnect()
  source = null
  gainNode = null
}

function currentPosition(): number {
  if (!ac || !buffer) return offset
  const p = ac.currentTime - startedAt
  return props.loop ? p % buffer.duration : Math.min(Math.max(p, 0), buffer.duration)
}

function tick() {
  position.value = currentPosition()
  if (playing.value) rafId = requestAnimationFrame(tick)
}

function toggle() {
  playing.value ? pause() : play()
}

// a new file: stop and forget the decoded one
watch(
  () => props.src,
  () => {
    if (playing.value) pause()
    buffer = null
    offset = 0
    position.value = 0
    duration.value = 0
  },
)
watch(
  () => props.loop,
  (l) => {
    if (source) source.loop = l
  },
)
watch(
  () => props.gain,
  (g) => {
    if (ac && gainNode) gainNode.gain.setTargetAtTime(g, ac.currentTime, 0.02)
  },
)

onBeforeUnmount(() => {
  if (playing.value) pause()
  cancelAnimationFrame(rafId)
})

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${Math.floor(s % 60)
    .toString()
    .padStart(2, '0')}`
const progress = computed(() => (duration.value ? position.value / duration.value : 0))
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      type="button"
      :aria-pressed="playing"
      :aria-label="playing ? 'Pause' : 'Play'"
      :disabled="loading"
      class="grid size-10 shrink-0 place-items-center rounded-full cursor-pointer bg-sapphire text-crust hover:bg-sapphire-700 disabled:opacity-50 disabled:cursor-wait"
      @click="toggle"
    >
      <svg viewBox="0 0 16 16" class="size-4 fill-current">
        <path v-if="playing" d="M3 1.5h3.5v13H3zM9.5 1.5H13v13H9.5z" />
        <path v-else d="M4 1.5v13l10-6.5z" />
      </svg>
    </button>

    <div class="grid min-w-0 flex-1 gap-1">
      <div class="h-1 overflow-hidden rounded-full bg-surface0">
        <div class="h-full bg-sapphire" :style="{ width: `${progress * 100}%` }" />
      </div>
      <div class="flex justify-between font-mono text-xs tabular-nums text-muted">
        <span>{{ fmt(position) }}</span>
        <span v-if="error" class="truncate text-red">{{ error }}</span>
        <span>{{ duration ? fmt(duration) : '–:––' }}</span>
      </div>
    </div>
  </div>
</template>

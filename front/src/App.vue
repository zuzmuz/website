<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  frequency?: number
  volume?: number // 0–1
}>(), {
  frequency: 440,
  volume: 0.2,
})

const playing = ref(false)
const canvas = ref<HTMLCanvasElement | null>(null)

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const noteName = computed(() => {
  const midi = Math.round(69 + 12 * Math.log2(props.frequency / 440))
  return NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
})

let ac: AudioContext | null = null
let osc: OscillatorNode | null = null
let gain: GainNode | null = null
let rafId = 0, level = 0, phase = 0, last = 0
const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

function setup(): AudioContext {
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext
  const context: AudioContext = new Ctx()
  osc = context.createOscillator()
  osc.type = 'sine'
  osc.frequency.value = props.frequency
  gain = context.createGain()
  gain.gain.value = 0
  osc.connect(gain).connect(context.destination)
  osc.start()
  ac = context
  return context
}

function rampTo(value: number) {
  if (!ac || !gain) return
  const t = ac.currentTime
  gain.gain.cancelScheduledValues(t)
  gain.gain.setValueAtTime(gain.gain.value, t)
  gain.gain.linearRampToValueAtTime(value, t + 0.03) // short ramp avoids clicks
}

async function toggle() {
  const context = ac ?? setup()
  if (context.state === 'suspended') await context.resume()
  playing.value = !playing.value
  rampTo(playing.value ? props.volume : 0)
}

watch(() => props.frequency, (f) => {
  if (ac && osc) osc.frequency.setTargetAtTime(f, ac.currentTime, 0.01)
})
watch(() => props.volume, (v) => {
  if (ac && playing.value) rampTo(v)
})

function draw(now: number) {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth, h = el.clientHeight
  if (el.width !== w * dpr) { el.width = w * dpr; el.height = h * dpr }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // colours come from the Tailwind classes on the canvas
  const cs = getComputedStyle(el)
  ctx.strokeStyle = cs.borderTopColor
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()

  const dt = (now - last) / 1000; last = now
  level += ((playing.value ? 1 : 0) - level) * Math.min(1, dt * 12)
  if (playing.value && !reduce) phase += dt * 2

  ctx.strokeStyle = cs.color
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x <= w; x++) {
    const y = h / 2 - Math.sin((x / w) * Math.PI * 8 - phase * Math.PI * 2) * (h * 0.38) * level
    x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.stroke()
  rafId = requestAnimationFrame(draw)
}

onMounted(() => {
  last = performance.now()
  rafId = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  if (ac) ac.close()
})
</script>

<template>
  <div class="w-full max-w-md grid gap-5 p-6 rounded-xl border border-slate-300 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <div class="font-mono text-4xl font-medium tabular-nums tracking-tight">
        {{ frequency }}<span class="ml-1 text-base text-slate-500 dark:text-slate-400">Hz</span>
      </div>
      <div class="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {{ noteName }} · sine
      </div>
    </div>

    <canvas
      ref="canvas"
      aria-hidden="true"
      class="block w-full h-30 rounded-md border border-slate-300 dark:border-slate-700 text-teal-700 dark:text-teal-400"
    />

    <button
      type="button"
      :aria-pressed="playing"
      class="flex items-center justify-center gap-2.5 rounded-md py-3.5 font-semibold cursor-pointer
             bg-teal-700 text-white hover:bg-teal-800
             dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300
             focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white"
      @click="toggle"
    >
      <svg viewBox="0 0 16 16" class="size-4 fill-current">
        <path v-if="playing" d="M3 1.5h3.5v13H3zM9.5 1.5H13v13H9.5z" />
        <path v-else d="M3 1.5v13l11-6.5z" />
      </svg>
      <span>{{ playing ? 'Pause' : 'Play' }}</span>
    </button>
  </div>
</template>

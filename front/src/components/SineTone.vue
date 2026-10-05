<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Knob from './Knob.vue'

const props = withDefaults(defineProps<{
  frequency?: number // starting values; the knobs take over from here
  gain?: number      // 0–1
  phase?: number     // degrees, 0–360
}>(), {
  frequency: 440,
  gain: 0.2,
  phase: 0,
})

const MIN_FREQUENCY = 20 // used for capping delay
const frequency = ref(props.frequency)
const gain = ref(props.gain)
const phase = ref(props.phase)
const playing = ref(false)
const canvas = ref<HTMLCanvasElement | null>(null)

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const noteName = computed(() => {
  const midi = Math.round(69 + 12 * Math.log2(frequency.value / 440))
  return NOTES[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1)
})

const fmtHz = (v: number) => (v < 100 ? v.toFixed(1) : Math.round(v).toString()) + ' Hz'
const fmtGain = (v: number) => (v <= 0.001 ? '−∞' : (20 * Math.log10(v)).toFixed(1)) + ' dB'
const fmtDeg = (v: number) => Math.round(v) + '°'

let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let delayNode: DelayNode | null = null
let gainNode: GainNode | null = null
let currentDelay: number = 0
let rafId = 0, level = 0, last = 0

function setup(): AudioContext {
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext
  const context: AudioContext = new Ctx()
  oscillator = context.createOscillator()

  oscillator.setPeriodicWave(
    context.createPeriodicWave(
        new Float32Array([0, 0]),
        new Float32Array([0, 1]),
        { disableNormalization: true }
    )
  )


  oscillator.frequency.value = frequency.value
  delayNode = context.createDelay(1 / MIN_FREQUENCY)
  delayNode.delayTime.value = 0
  gainNode = context.createGain()
  gainNode.gain.value = 0
  oscillator.connect(delayNode).connect(gainNode).connect(context.destination)
  oscillator.start()
  audioContext = context
  return context
}

function updatePhase(degree: number) {
  if (!audioContext || !delayNode) return
  const period = 1 / frequency.value
  const frac = ((-degree / 360) % 1 + 1) % 1 // 0–1, how much of a period to delay
  const d = frac * period
  const t = audioContext.currentTime

  if (Math.abs(d - currentDelay) > period / 2) {
    // crossing 0°/360°: a jump of about one full period sounds the same,
    // so set it directly instead of gliding through the whole cycle
    delayNode.delayTime.setValueAtTime(d, t)
  } else {
    delayNode.delayTime.setTargetAtTime(d, t, 0.02)
  }
  currentDelay = d
}

function rampTo(value: number) {
  if (!audioContext || !gainNode) return
  const t = audioContext.currentTime
  gainNode.gain.cancelScheduledValues(t)
  gainNode.gain.setValueAtTime(gainNode.gain.value, t)
  gainNode.gain.linearRampToValueAtTime(value, t + 0.03) // short ramp avoids clicks
}

async function toggle() {
  const context = audioContext ?? setup()
  if (context.state === 'suspended') await context.resume()
  playing.value = !playing.value
  rampTo(playing.value ? gain.value : 0)
}

watch(frequency, (f) => {
  if (audioContext && oscillator) {
    oscillator.frequency.setTargetAtTime(f, audioContext.currentTime, 0.01)
    updatePhase(phase.value)
    }
})
watch(gain, (g) => {
  if (audioContext && gainNode) gainNode.gain.setValueAtTime(g, audioContext.currentTime)
})
watch(phase, (p) => {
  if (audioContext) updatePhase(p)
})

// The canvas shows a fixed 10 ms window, so the number of cycles follows the
// frequency, the height follows the gain and the starting point follows the phase.
const WINDOW_S = 0.01

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

  const amp = gain.value * (h / 2 - 4)
  const p = phase.value * Math.PI / 180
  const cycles = frequency.value * WINDOW_S

  ctx.globalAlpha = 0.35 + 0.65 * level // dimmed while paused
  ctx.strokeStyle = cs.color
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let x = 0; x <= w; x++) {
    const y = h / 2 - Math.sin(2 * Math.PI * cycles * (x / w) + p) * amp
    x ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
  rafId = requestAnimationFrame(draw)
}

onMounted(() => {
  last = performance.now()
  rafId = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  if (audioContext) audioContext.close()
})
</script>

<template>
  <div class="w-full max-w-md grid gap-5 p-6 rounded-xl border border-slate-300 text-slate-900 dark:border-slate-800  dark:text-slate-100">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <div class="font-mono text-4xl font-medium tabular-nums tracking-tight">
        {{ frequency < 100 ? frequency.toFixed(1) : Math.round(frequency) }}<span class="ml-1 text-base text-slate-500 dark:text-slate-400">Hz</span>
      </div>
      <div class="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {{ noteName }} · sine
      </div>
    </div>

    <div class="grid gap-1">
      <canvas
        ref="canvas"
        aria-hidden="true"
        class="block w-full h-30 rounded-md border border-slate-300 dark:border-slate-700 text-teal-700 dark:text-teal-400"
      />
      <div class="flex justify-between font-mono text-[10px] text-slate-500 dark:text-slate-400">
        <span>0 ms</span><span>10 ms</span>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <Knob v-model="frequency" label="Freq" :min="20" :max="2000" scale="log"
            :default-value="440" :format="fmtHz" />
      <Knob v-model="gain" label="Gain" :min="0" :max="1" :step="0.01"
            :default-value="0.2" :format="fmtGain" />
      <Knob v-model="phase" label="Phase" :min="0" :max="360" :step="1"
            :default-value="0" :format="fmtDeg" />
    </div>

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

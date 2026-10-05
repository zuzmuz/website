<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Knob from '@/components/Knob.vue'
import { unlockAudioContext } from '@/audio';

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


const fmtHz = (v: number) => (v < 100 ? v.toFixed(1) : Math.round(v).toString()) + ' Hz'
const fmtGain = (v: number) => (v <= 0.001 ? '−∞' : (20 * Math.log10(v)).toFixed(1)) + ' dB'

let audioContext: AudioContext | null = null
let oscillator: OscillatorNode | null = null
let delayNode: DelayNode | null = null
let gainNode: GainNode | null = null
let currentDelay: number = 0
let rafId = 0, level = 0, last = 0
let setupPromise: Promise<void> | null = null
let startTime = 0

async function setup() {
    audioContext = await unlockAudioContext()

  oscillator = audioContext.createOscillator()

  oscillator.setPeriodicWave(
    audioContext.createPeriodicWave(
        new Float32Array([0, 0]),
        new Float32Array([0, 1]),
        { disableNormalization: true }
    )
  )


  oscillator.frequency.value = frequency.value
  delayNode = audioContext.createDelay(1 / MIN_FREQUENCY)
  delayNode.delayTime.value = 0
  gainNode = audioContext.createGain()
  gainNode.gain.value = 0
  oscillator.connect(delayNode).connect(gainNode).connect(audioContext.destination)
    startTime = audioContext.currentTime + 0.05
  oscillator.start(startTime)
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

function updateGainSmooth(gain: number) {
    if (!audioContext || !gainNode) return
  const t = Math.max(audioContext.currentTime, startTime)
  gainNode.gain.cancelScheduledValues(t)
  gainNode.gain.setValueAtTime(gainNode.gain.value, t)
  gainNode.gain.linearRampToValueAtTime(gain, t + 0.03) // short ramp avoids clicks
}

async function toggle() {
setupPromise ??= setup()
await setupPromise
  playing.value = !playing.value
  updateGainSmooth(playing.value ? gain.value : 0)
}


watch(frequency, (f) => {
  if (audioContext && oscillator) {
    oscillator.frequency.setTargetAtTime(f, audioContext.currentTime, 0.01)
    updatePhase(phase.value)
    }
})
watch(gain, (g) => {
  if (audioContext && gainNode) {
    if (playing.value) {
        gainNode.gain.setValueAtTime(g, audioContext.currentTime)
    }
    }
})

watch(phase, (p) => {
  if (audioContext) updatePhase(p)
})

// The canvas shows a fixed 10 ms window, so the number of cycles follows the
// frequency, the height follows the gain and the starting point follows the phase.
const WINDOW_S = 0.04

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
  // ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()

  const dt = (now - last) / 1000; last = now
  level += ((playing.value ? 1 : 0) - level) * Math.min(1, dt * 12)

  const amp = gain.value * (h / 2 - 4)
  const p = phase.value * Math.PI / 180
  const cycles = frequency.value * WINDOW_S

  ctx.globalAlpha = 0.35 + 0.65 * level // dimmed while paused
  ctx.strokeStyle = cs.getPropertyValue('--trace').trim()
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
        <h1 class="text-4xl font-semifold title-font text-accent mx-auto my-4">This is a sine wave</h1>

        <div class="mx-auto text-muted my-4">The simplest musical sound, the circle of periodic signals</div>

    <button
      type="button"
      :aria-pressed="playing"
      :class="['flex items-center justify-center w-30 mx-auto rounded-xl text-crust shadow-lg gap-2.5 py-3.5 font-semibold cursor-pointer',
             playing ? 'bg-maroon hover:bg-maroon-700 shadow-maroon-300/20'
             : 'bg-sapphire hover:bg-sapphire-700 shadow-sapphire-300/20']"
      @click="toggle"
    >
      <svg viewBox="0 0 16 16" class="size-4 fill-current">
        <path v-if="playing" d="M3 1.5h3.5v13H3zM9.5 1.5H13v13H9.5z" />
        <path v-else d="M3 1.5v13l11-6.5z" />
      </svg>
      <span>{{ playing ? 'Pause' : 'Play' }}</span>
    </button>

        <div class="grid my-4">
            <canvas
                ref="canvas"
                aria-hidden="true"
                class="
                    block w-full h-30 border-y 
                    border-blue bg-crust shadow-lg shadow-blue/30
                    [--trace:var(--color-peach)]"
                />
        </div>

        <div class="mx-auto text-muted my-4">You can change its frequency or its volume</div>

    <div class="grid grid-cols-2 gap-2">
      <Knob v-model="frequency" :min="20" :max="2000" scale="log"
            :default-value="440" label="Freq" :format="fmtHz" />
      <Knob v-model="gain" :min="0" :max="1" :step="0.01"
            :default-value="0.2" label="Gain" :format="fmtGain" />
    </div>
    <div class="mx-auto text-muted my-4">The frequency affects the perceived musical pitch, the volume affects the perceived intensity</div>
</template>

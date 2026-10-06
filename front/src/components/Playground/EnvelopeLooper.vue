<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Knob from '@/components/Knob.vue'
import { unlockAudioContext } from '@/audio'

const props = withDefaults(defineProps<{
  minFrequency?: number
  maxFrequency?: number
  loopSeconds?: number // starting loop length; the knob takes over
  maxGain?: number     // output level when the drawn volume is at the top
}>(), {
  minFrequency: 50,
  maxFrequency: 2000,
  loopSeconds: 2,
  maxGain: 0.3,
})

type Lane = 'frequency' | 'volume'

// Each envelope is N points spread evenly over one loop, stored as 0–1.
// Frequency is mapped on a log scale, volume linearly.
const N = 200
const freqEnv = new Float32Array(N)
const volEnv = new Float32Array(N)

const lane = ref<Lane>('frequency')
const loopSeconds = ref(props.loopSeconds)
const playing = ref(false)
const canvas = ref<HTMLCanvasElement | null>(null)

const normToHz = (t: number) => props.minFrequency * Math.pow(props.maxFrequency / props.minFrequency, t)
const hzToNorm = (hz: number) => Math.log(hz / props.minFrequency) / Math.log(props.maxFrequency / props.minFrequency)
const fmtSeconds = (v: number) => v.toFixed(1) + ' s'

function resetEnvelopes() {
  // a rise from 220 Hz to 440 Hz with a volume that fades over each loop
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1)
    freqEnv[i] = hzToNorm(220 * Math.pow(2, x))
    volEnv[i] = 0.9 - 0.6 * x
  }
}
resetEnvelopes()

function clearLane() {
  const env = lane.value === 'frequency' ? freqEnv : volEnv
  env.fill(lane.value === 'frequency' ? hzToNorm(440) : 0.5)
}

/* ---------- audio ---------- */

let ac: AudioContext | null = null
let osc: OscillatorNode | null = null
let envGain: GainNode | null = null
let master: GainNode | null = null
let schedulerId = 0
let nextStart = 0
// loops already handed to the audio thread, used to place the playhead
let scheduled: { start: number; duration: number }[] = []

const LOOKAHEAD = 0.25 // seconds of audio scheduled in advance
const TICK_MS = 50

// One loop of an envelope as an automation curve. The first value is repeated
// at the end so each loop ends where the next one starts (no click at the seam).
function curve(env: Float32Array, map: (t: number) => number): Float32Array {
  const out = new Float32Array(N + 1)
  for (let i = 0; i < N; i++) out[i] = map(env[i])
  out[N] = out[0]
  return out
}

function scheduleLoops() {
  if (!ac || !osc || !envGain) return
  while (nextStart < ac.currentTime + LOOKAHEAD) {
    const d = loopSeconds.value
    // the curve is copied when scheduled, so edits apply from the next loop
    osc.frequency.setValueCurveAtTime(curve(freqEnv, normToHz), nextStart, d - 1e-4)
    envGain.gain.setValueCurveAtTime(curve(volEnv, (v) => v), nextStart, d - 1e-4)
    scheduled.push({ start: nextStart, duration: d })
    nextStart += d
  }
  // forget loops that have finished
  const now = ac.currentTime
  while (scheduled.length > 1 && scheduled[0].start + scheduled[0].duration < now) scheduled.shift()
}

async function play() {
  const context = await unlockAudioContext()
  ac = context

  osc = context.createOscillator()
  envGain = context.createGain()
  master = context.createGain()
  osc.connect(envGain).connect(master).connect(context.destination)

  // start slightly ahead so the fade-in is never scheduled in the past
  const t0 = context.currentTime + 0.05
  osc.frequency.value = normToHz(freqEnv[0])
  envGain.gain.value = volEnv[0]
  master.gain.setValueAtTime(0, t0)
  master.gain.linearRampToValueAtTime(props.maxGain, t0 + 0.03)
  osc.start(t0)

  nextStart = t0
  scheduled = []
  scheduleLoops()
  schedulerId = window.setInterval(scheduleLoops, TICK_MS)
  playing.value = true
}

function stop() {
  window.clearInterval(schedulerId)
  playing.value = false
  if (!ac || !osc || !master) return
  const t = ac.currentTime
  master.gain.cancelScheduledValues(t)
  master.gain.setValueAtTime(master.gain.value, t)
  master.gain.linearRampToValueAtTime(0, t + 0.03)
  const o = osc, e = envGain, m = master
  o.onended = () => { o.disconnect(); e?.disconnect(); m.disconnect() }
  o.stop(t + 0.05)
  osc = null; envGain = null; master = null
  scheduled = []
}

function toggle() {
  playing.value ? stop() : play()
}

/* ---------- drawing input ---------- */

let drawing = false
let lastIndex = -1
let lastValue = 0

function pointToEnv(e: PointerEvent): [number, number] {
  const r = canvas.value!.getBoundingClientRect()
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  const y = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height))
  return [Math.round(x * (N - 1)), y]
}

// Writes from the previous point to this one, so fast strokes leave no gaps.
function paint(e: PointerEvent) {
  const env = lane.value === 'frequency' ? freqEnv : volEnv
  const [i, v] = pointToEnv(e)
  if (lastIndex < 0) { env[i] = v }
  else {
    const steps = Math.abs(i - lastIndex)
    for (let s = 0; s <= steps; s++) {
      const k = steps === 0 ? 1 : s / steps
      env[Math.round(lastIndex + (i - lastIndex) * k)] = lastValue + (v - lastValue) * k
    }
  }
  lastIndex = i; lastValue = v
}

function onPointerDown(e: PointerEvent) {
  canvas.value!.setPointerCapture(e.pointerId)
  drawing = true
  lastIndex = -1
  paint(e)
}
function onPointerMove(e: PointerEvent) { if (drawing) paint(e) }
function onPointerUp() { drawing = false }

/* ---------- rendering ---------- */

let rafId = 0
let colors = { freq: '', vol: '', grid: '', label: '', head: '' }

function readColors() {
  const cs = getComputedStyle(canvas.value!)
  const v = (n: string) => cs.getPropertyValue(n).trim()
  colors = { freq: v('--freq'), vol: v('--vol'), grid: v('--grid'), label: v('--label'), head: v('--head') }
}

function strokeEnv(ctx: CanvasRenderingContext2D, env: Float32Array, w: number, h: number,
                   color: string, active: boolean) {
  ctx.globalAlpha = active ? 1 : 0.35
  ctx.strokeStyle = color
  ctx.lineWidth = active ? 2.5 : 1.5
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * w
    const y = (1 - env[i]) * h
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

function draw() {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  if (!el || !ctx) return
  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth, h = el.clientHeight
  if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
    el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  // grid and scale for the lane being edited
  ctx.font = '10px ui-monospace, monospace'
  ctx.textBaseline = 'bottom'
  ctx.lineWidth = 1
  const marks: [number, string][] = lane.value === 'frequency'
    ? [100, 200, 500, 1000].filter((f) => f > props.minFrequency && f < props.maxFrequency)
        .map((f) => [hzToNorm(f), f >= 1000 ? `${f / 1000}k Hz` : `${f} Hz`])
    : [[0.25, '25%'], [0.5, '50%'], [0.75, '75%']]
  for (const [t, text] of marks) {
    const y = Math.round((1 - t) * h) + 0.5
    ctx.strokeStyle = colors.grid
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    ctx.fillStyle = colors.label
    ctx.fillText(text, 4, y - 2)
  }

  // the lane not being edited is drawn faintly behind
  const freqActive = lane.value === 'frequency'
  strokeEnv(ctx, freqActive ? volEnv : freqEnv, w, h, freqActive ? colors.vol : colors.freq, false)
  strokeEnv(ctx, freqActive ? freqEnv : volEnv, w, h, freqActive ? colors.freq : colors.vol, true)

  // playhead
  if (playing.value && ac && scheduled.length) {
    const now = ac.currentTime
    const loop = scheduled.find((l) => now >= l.start && now < l.start + l.duration)
    if (loop) {
      const x = Math.round(((now - loop.start) / loop.duration) * w) + 0.5
      ctx.strokeStyle = colors.head
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
  }

  rafId = requestAnimationFrame(draw)
}

watch(lane, () => { drawing = false })

onMounted(() => {
  readColors()
  rafId = requestAnimationFrame(draw)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  stop() // fades out and disconnects this component's nodes; the shared context stays open
})
</script>

<template>
  <div class="grid gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="inline-flex rounded-lg border border-surface1 p-0.5" role="group" aria-label="Envelope to draw">
        <button
          v-for="l in (['frequency', 'volume'] as const)"
          :key="l"
          type="button"
          :aria-pressed="lane === l"
          class="rounded-md px-3 py-1.5 text-sm font-semibold capitalize cursor-pointer"
          :class="lane === l
            ? (l === 'frequency' ? 'bg-sapphire text-crust' : 'bg-flamingo text-crust')
            : 'text-muted hover:text-fg'"
          @click="lane = l"
        >{{ l }}</button>
      </div>

      <button type="button" class="text-sm text-muted hover:text-fg cursor-pointer" @click="clearLane">
        Clear {{ lane }}
      </button>
    </div>

    <canvas
      ref="canvas"
      :aria-label="`Draw the ${lane} envelope`"
      class="block w-full h-48 touch-none cursor-crosshair border-y border-blue bg-crust shadow-lg shadow-blue/30
             [--freq:var(--color-sapphire)] [--vol:var(--color-flamingo)]
             [--grid:var(--color-surface0)] [--label:var(--color-overlay0)] [--head:var(--color-red)]"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    />

    <div class="flex items-center justify-center gap-8">
      <button
        type="button"
        :aria-pressed="playing"
        class="flex items-center justify-center w-30 rounded-xl gap-2.5 py-3.5 font-semibold cursor-pointer
               bg-sapphire text-crust hover:bg-sapphire-700 shadow-lg shadow-sapphire-300/20"
        @click="toggle"
      >
        <svg viewBox="0 0 16 16" class="size-4 fill-current">
          <path v-if="playing" d="M2.5 2.5h11v11h-11z" />
          <path v-else d="M3 1.5v13l11-6.5z" />
        </svg>
        <span>{{ playing ? 'Stop' : 'Loop' }}</span>
      </button>

      <Knob v-model="loopSeconds" :min="0.5" :max="16" :step="0.1"
            :default-value="2" label="Length" :format="fmtSeconds" />
    </div>
  </div>
</template>

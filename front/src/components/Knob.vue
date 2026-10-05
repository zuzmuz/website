<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  min: number
  max: number
  label?: string
  step?: number
  scale?: 'linear' | 'log'
  defaultValue?: number          // double-click resets to this
  format?: (v: number) => string // text under the knob
}>(), {
  step: 0,
  scale: 'linear',
})

const model = defineModel<number>({ required: true })

// The knob sweeps 270°, from 7:30 to 4:30 on a clock face.
const START = -135
const SWEEP = 270

function toNorm(v: number): number {
  const { min, max } = props
  const t = props.scale === 'log'
    ? Math.log(v / min) / Math.log(max / min)
    : (v - min) / (max - min)
  return Math.min(1, Math.max(0, t))
}

function fromNorm(t: number): number {
  const { min, max, step } = props
  t = Math.min(1, Math.max(0, t))
  let v = props.scale === 'log' ? min * Math.pow(max / min, t) : min + t * (max - min)
  if (step > 0) v = Math.round(v / step) * step
  return Math.min(max, Math.max(min, v))
}

const norm = computed(() => toNorm(model.value))
const angle = computed(() => START + norm.value * SWEEP)
const display = computed(() => props.format ? props.format(model.value) : String(model.value))

// SVG geometry
const C = 32, R = 24
function polar(deg: number, r = R) {
  const a = (deg - 90) * Math.PI / 180
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
}
function arc(from: number, to: number): string {
  if (to - from < 0.01) return ''
  const a = polar(from), b = polar(to)
  const large = to - from > 180 ? 1 : 0
  return `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`
}
const trackPath = arc(START, START + SWEEP)
const valuePath = computed(() => arc(START, angle.value))
const tip = computed(() => polar(angle.value, R - 8))

// Drag up/down to turn; hold Shift for fine control.
let dragStartY = 0
let dragStartNorm = 0
function onPointerDown(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragStartY = e.clientY
  dragStartNorm = norm.value
}
function onPointerMove(e: PointerEvent) {
  if (!(e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) return
  const range = e.shiftKey ? 800 : 200 // pixels for a full sweep
  model.value = fromNorm(dragStartNorm + (dragStartY - e.clientY) / range)
}

function onWheel(e: WheelEvent) {
  const d = e.deltaY < 0 ? 1 : -1
  model.value = fromNorm(norm.value + d * (e.shiftKey ? 0.002 : 0.01))
}

function onKey(e: KeyboardEvent) {
  const fine = e.shiftKey ? 0.002 : 0.01
  const moves: Record<string, number> = {
    ArrowUp: fine, ArrowRight: fine, ArrowDown: -fine, ArrowLeft: -fine,
    PageUp: 0.1, PageDown: -0.1, Home: -1, End: 1,
  }
  if (!(e.key in moves)) return
  e.preventDefault()
  model.value = fromNorm(norm.value + moves[e.key])
}

function reset() {
  if (props.defaultValue !== undefined) model.value = props.defaultValue
}
</script>

<template>
  <div class="flex flex-col items-center gap-1 select-none">
    <div
      role="slider"
      tabindex="0"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="model"
      :aria-valuetext="display"
      class="size-16 cursor-ns-resize touch-none rounded-full
             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:focus-visible:outline-teal-400"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @wheel.prevent="onWheel"
      @keydown="onKey"
      @dblclick="reset"
    >
      <svg viewBox="0 0 64 64" class="size-full">
        <path :d="trackPath" fill="none" stroke-width="4" stroke-linecap="round"
              class="stroke-blue-600" />
        <path v-if="valuePath" :d="valuePath" fill="none" stroke-width="4" stroke-linecap="round"
              class="stroke-sapphire"/>
        <circle :cx="C" :cy="C" r="15" stroke-width="1"
                class="fill-crust-700  stroke-surface0" />
        <line :x1="C" :y1="C" :x2="tip.x" :y2="tip.y" stroke-width="2.5" stroke-linecap="round"
              class="stroke-sapphire-200" />
      </svg>
    </div>
    <div class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ label }}</div>
    <div class="font-mono text-sm tabular-nums">{{ display }}</div>
  </div>
</template>

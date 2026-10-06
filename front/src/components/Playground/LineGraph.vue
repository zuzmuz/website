<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  data: ArrayLike<number>  // Float32Array, number[], ...
  min?: number             // y range; computed from the data when omitted
  max?: number
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

function draw() {
  const el = canvas.value
  const ctx = el?.getContext('2d')
  if (!el || !ctx) return

  const dpr = window.devicePixelRatio || 1
  const w = el.clientWidth, h = el.clientHeight
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const d = props.data
  const n = d.length
  if (n === 0 || w === 0) return

  // y range
  let lo = props.min ?? Infinity, hi = props.max ?? -Infinity
  if (props.min === undefined || props.max === undefined) {
    for (let i = 0; i < n; i++) {
      const v = d[i]
      if (props.min === undefined && v < lo) lo = v
      if (props.max === undefined && v > hi) hi = v
    }
  }
  if (hi === lo) { hi += 1; lo -= 1 }
  const pad = 2
  const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (h - 2 * pad)

  // colours come from the classes on the canvas
  const cs = getComputedStyle(el)
  const line = cs.getPropertyValue('--line').trim() || cs.color
  const axis = cs.getPropertyValue('--axis').trim() || cs.borderTopColor

  // zero line when the range crosses 0
  if (lo < 0 && hi > 0) {
    const y0 = Math.round(y(0)) + 0.5
    ctx.strokeStyle = axis
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0, y0); ctx.lineTo(w, y0); ctx.stroke()
  }

  ctx.strokeStyle = line
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.beginPath()

  if (n <= w * 2) {
    // few points: connect them directly
    for (let i = 0; i < n; i++) {
      const x = n === 1 ? w / 2 : (i / (n - 1)) * w
      i ? ctx.lineTo(x, y(d[i])) : ctx.moveTo(x, y(d[i]))
    }
  } else {
    // many points (e.g. audio): draw the min–max of each pixel column,
    // so peaks are never skipped and drawing stays fast
    for (let px = 0; px < w; px++) {
      const a = Math.floor((px / w) * n)
      const b = Math.max(a + 1, Math.floor(((px + 1) / w) * n))
      let mn = Infinity, mx = -Infinity
      for (let i = a; i < b; i++) { const v = d[i]; if (v < mn) mn = v; if (v > mx) mx = v }
      const x = px + 0.5
      if (px === 0) ctx.moveTo(x, y(mx))
      ctx.lineTo(x, y(mx))
      ctx.lineTo(x, y(mn))
    }
  }
  ctx.stroke()
}

// Redraws when a new array is passed. If you change values inside the same
// array, call redraw() through a template ref.
watch(() => [props.data, props.min, props.max], draw)
defineExpose({ redraw: draw })

let ro: ResizeObserver | null = null
onMounted(() => {
  ro = new ResizeObserver(draw)
  ro.observe(canvas.value!)
  draw()
})
onBeforeUnmount(() => ro?.disconnect())
</script>

<template>
  <canvas
    ref="canvas"
    class="block w-full h-40 [--line:var(--color-sapphire)] [--axis:var(--color-surface1)]"
  />
</template>

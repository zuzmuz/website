<script setup lang="ts">
import { ref } from 'vue'
import Knob from '@/components/Knob.vue'

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

const fmtHz = (v: number) => (v < 100 ? v.toFixed(1) : Math.round(v).toString()) + ' Hz'
const fmtGain = (v: number) => (v <= 0.001 ? '−∞' : (20 * Math.log10(v)).toFixed(1)) + ' dB'
const fmtDeg = (v: number) => Math.round(v) + '°'

async function toggle() {
  // const context = audioContext ?? setup()
  // if (context.state === 'suspended') await context.resume()
  playing.value = !playing.value
  //rampTo(playing.value ? gain.value : 0) -->
}

</script>

<template>
    <main class="max-w grid mt-12">
        <h1 class="text-4xl font-semifold title-font text-accent mx-auto my-4">This is a sine wave</h1>

        <div class="mx-auto text-muted my-4">The simplest musical sound, the circle of periodic signals</div>

    <button
      type="button"
      :aria-pressed="playing"
      class="flex items-center justify-center
             w-30 mx-auto
             rounded-xl
             gap-2.5 py-3.5 font-semibold cursor-pointer
             bg-sapphire text-crust hover:bg-lavender
             shadow-lg shadow-dark-green/20"
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
                class="block w-full h-30 border-y border-blue bg-crust shadow-lg shadow-blue/30"
                />
        </div>


    <div class="grid grid-cols-3 gap-2">
      <Knob v-model="frequency" label="Freq" :min="20" :max="2000" scale="log"
            :default-value="440" :format="fmtHz" />
      <Knob v-model="gain" label="Gain" :min="0" :max="1" :step="0.01"
            :default-value="0.2" :format="fmtGain" />
      <Knob v-model="phase" label="Phase" :min="0" :max="360" :step="1"
            :default-value="0" :format="fmtDeg" />
    </div>
    </main>
    <!-- <SineTone/> -->
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import Knob from '@/components/Knob.vue'
import LineGraph from './LineGraph.vue'
import { unlockAudioContext, loadAudioFromSource } from '@/audio'
import { fft } from 'fourier-transform'
import rfft from 'fourier-transform'

const loading = ref(false)
const error = ref('')

let audioBuffer: AudioBuffer | null = null
let mag = ref(new Float32Array(2048))

async function load() {
  const context = await unlockAudioContext()
  loading.value = true
  error.value = ''
  try {
    audioBuffer ??= await loadAudioFromSource('/audio/snipet.wav')
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
  if (!audioBuffer) return
  
  const channelData = audioBuffer.getChannelData(0)

  // const [re, im] = fft(channelData.slice(0, 2048))
  mag = rfft(channelData.slice(0, 2048))
    
console.log(mag)
  
}
</script>

<template>
  <div class="mx-auto text-muted mt-4">
    Right now, the instrument is just a pure sine wave, in real life, sounds are a bit more
    interesting
  </div>
  <div class="mx-auto text-muted mb-4">
    However, all sounds are actually just bunch of sine waves together, with different frequencies
    and volume over time
  </div>
  <button
    type="button"
    :disabled="loading"
    class="grid size-10 shrink-0 place-items-center rounded-full cursor-pointer bg-sapphire text-crust hover:bg-sapphire-700 disabled:opacity-50 disabled:cursor-wait"
    @click="load"
  >
    x
  </button>

      <LineGraph :data="mag"/>
</template>

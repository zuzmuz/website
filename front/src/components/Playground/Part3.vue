<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Knob from '@/components/Knob.vue'
import { unlockAudioContext } from '@/audio'
</script>

<template>
  <div class="mx-auto text-muted mt-4">
    Right now, the instrument is just a pure sine wave, in real life, sounds are a bit more interesting
  </div>
  <div class="mx-auto text-muted mb-4">
    However, all sounds are actually just bunch of sine waves together, with different frequencies and volume over time
  </div>
</template>

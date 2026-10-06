<script setup lang="ts">
import Part1 from '@/components/Playground/Part1.vue'
import Part2 from '@/components/Playground/Part2.vue'
import Part3 from '@/components/Playground/Part3.vue';
import WavPlayer from '@/components/Playground/WavPlayer.vue';
</script>

<template>
  <main class="max-w grid mt-12">
    <Part1 />
    <h1 class="text-lg text-accent mx-auto my-4">Cool, now on to something else</h1>
    <Part2 />
    <Part3 />
    <WavPlayer src="/audio/snipet.wav"/>
  </main>
</template>

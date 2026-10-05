<script setup lang="ts">
</script>

<template>
      <main class="w-full max-w-md grid gap-5 p-6 rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <div class="font-mono text-4xl font-medium tabular-nums tracking-tight">
        440<span class="ml-1 text-base text-slate-500 dark:text-slate-400">Hz</span>
      </div>
      <div class="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">A4 · sine</div>
    </div>
 
    <canvas id="scope" aria-hidden="true"
      class="block w-full h-30 rounded-md border border-slate-300 dark:border-slate-700 text-teal-700 dark:text-teal-400"></canvas>
 
    <button id="toggle" type="button" aria-pressed="false"
      class="flex items-center justify-center gap-2.5 rounded-md py-3.5 font-semibold cursor-pointer
             bg-teal-700 text-white hover:bg-teal-800
             dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300
             focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:focus-visible:outline-white">
      <svg id="icon" viewBox="0 0 16 16" class="size-4 fill-current"><path d="M3 1.5v13l11-6.5z"/></svg>
      <span id="label">Play</span>
    </button>
  </main>
</template>

<style scoped>

</style>

<script setup lang="ts">
defineProps<{
  options: { id: string; label: string }[]
  label?: string
  placeholder?: string
}>()

const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="inline-flex items-center gap-2 text-sm">
    <span v-if="label" class="text-muted">{{ label }}</span>
    <span class="relative">
      <select
        v-model="model"
        class="appearance-none cursor-pointer rounded-lg border border-surface1 bg-crust py-1.5 pl-3 pr-8 font-semibold text-fg hover:border-surface2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sapphire"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="o in options" :key="o.id" :value="o.id" class="bg-crust text-fg">
          {{ o.label }}
        </option>
      </select>
      <svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        class="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 fill-current text-muted"
      >
        <path d="M3.5 6l4.5 4.5L12.5 6z" />
      </svg>
    </span>
  </label>
</template>

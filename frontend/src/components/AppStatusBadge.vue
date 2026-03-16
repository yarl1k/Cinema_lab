<script setup lang="ts">
defineProps<{
  active: boolean;
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold',
      active
        ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/30'
        : 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
    ]"
    :aria-label="active ? 'Зал активний' : 'Зал вимкнений'"
  >
    <span
      :class="['w-1.5 h-1.5 rounded-full', active ? 'bg-green-400' : 'bg-red-400']"
      aria-hidden="true"
    />
    {{ active ? 'Активний' : 'Вимкнений' }}
  </span>
</template>

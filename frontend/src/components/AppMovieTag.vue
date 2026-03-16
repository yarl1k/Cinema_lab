<script setup lang="ts">
defineProps<{
  label: string;
  accent?: boolean;
}>();
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-4 py-1 rounded-full text-sm border transition-colors',
      accent
        ? 'bg-accent/20 border-accent text-accent font-semibold'
        : 'bg-transparent border-cinema-text/60 text-cinema-text'
    ]"
  >
    {{ label }}
  </span>
</template>

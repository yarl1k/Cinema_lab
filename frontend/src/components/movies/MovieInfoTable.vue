<script setup lang="ts">
export interface InfoRow {
  key: string;
  value: string;
  /** Pass a simple camelCase string to opt into a named slot. */
  slot?: string;
}

defineProps<{
  rows: InfoRow[];
}>();
</script>

<template>
  <dl class="flex flex-col mb-8" aria-label="Інформація про фільм">
    <div
      v-for="row in rows"
      :key="row.key"
      class="flex py-2.5 border-b border-white/10 text-[0.95rem]"
    >
      <dt class="w-44 shrink-0 text-white/50">{{ row.key }}</dt>
      <dd class="flex-1 text-cinema-text font-medium">
        <template v-if="row.slot">
          <slot :name="row.slot" :value="row.value">{{ row.value }}</slot>
        </template>
        <template v-else>{{ row.value }}</template>
      </dd>
    </div>
  </dl>
</template>

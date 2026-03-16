<script setup lang="ts">
defineProps<{
  columns: string[];
  caption?: string;
}>();
</script>

<template>
  <div class="overflow-x-auto rounded-lg ring-1 ring-white/5">
    <table
      class="w-full border-collapse text-sm text-left"
      role="table"
      :aria-label="caption"
    >
      <caption v-if="caption" class="sr-only">{{ caption }}</caption>
      <thead>
        <tr class="border-b border-white/10 bg-white/[0.03]">
          <th
            v-for="col in columns"
            :key="col"
            scope="col"
            class="px-4 py-3 text-xs font-semibold tracking-wider uppercase text-white/40"
          >
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

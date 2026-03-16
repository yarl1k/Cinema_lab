<script setup lang="ts">
import type { Movie } from '@/types/types';

const props = defineProps<{
  movie: Movie;
  isActive: boolean;
}>();

const emit = defineEmits<{
  select: [movie: Movie, event: Event];
}>();
</script>

<template>
  <article
    :class="[
      'relative flex-none w-[220px] rounded-xl overflow-hidden cursor-pointer',
      'border-2 transition-all duration-300',
      isActive
        ? 'border-secondary scale-[1.08] shadow-[0_10px_20px_rgba(211,49,49,0.3)]'
        : 'border-transparent hover:border-secondary'
    ]"
    :aria-pressed="isActive"
    :aria-label="`Вибрати фільм ${movie.title}`"
    role="button"
    tabindex="0"
    @click="emit('select', movie, $event)"
    @keydown.enter="emit('select', movie, $event)"
    @keydown.space.prevent="emit('select', movie, $event)"
  >
    <img
      :src="movie.posterUrl || 'https://placehold.co/220x330/1a1a1a/d33131?text=Постер'"
      :alt="`Постер фільму ${movie.title}`"
      class="w-full h-[330px] object-cover block"
      loading="lazy"
    />

    <div :class="['card-overlay', isActive ? 'active' : '']" aria-hidden="true">
      <router-link
        :to="`/movies/${movie.id}`"
        class="bg-primary hover:bg-secondary text-cinema-text no-underline
               px-5 py-2 rounded-full text-sm font-bold transition-colors duration-200"
        tabindex="-1"
      >
        Детальніше
      </router-link>
    </div>
  </article>
</template>

<style scoped>
.card-overlay {
  position: absolute;
  bottom: -50px;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
  padding: 20px 10px 15px;
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease-in-out;
}

.card-overlay.active {
  bottom: 0;
  opacity: 1;
}
</style>

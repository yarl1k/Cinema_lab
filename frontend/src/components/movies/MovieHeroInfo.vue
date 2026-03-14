<script setup lang="ts">
import AppMovieTag from '@/components/AppMovieTag.vue';
import type { Movie } from '@/types/types';

const props = defineProps<{
  movie: Movie & {
    isUpcoming?: boolean;
    releaseFormatted?: string;
  };
}>();

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};
</script>

<template>
  <div class="px-10 max-w-3xl" aria-labelledby="hero-movie-title">
    <h1
      id="hero-movie-title"
      class="text-5xl font-black uppercase tracking-tight mb-3 leading-tight"
    >
      {{ movie.title }}
    </h1>

    <p class="text-[#ccc] text-lg mb-6 leading-relaxed">
      {{ movie.description ? (movie.description.length > 150 ? movie.description.substring(0, 150) + '...' : movie.description) : 'Опис відсутній...' }}
    </p>

    <div class="flex flex-wrap gap-3 mb-8" role="list" aria-label="Метадані фільму">
      <div role="listitem">
        <AppMovieTag
          v-if="movie.isUpcoming"
          :label="`У кіно з ${movie.releaseFormatted}`"
          :accent="true"
        />
        <AppMovieTag v-else label="Зараз у прокаті" />
      </div>
      <div v-if="movie.endDate" role="listitem">
        <AppMovieTag :label="`До ${formatDate(movie.endDate)}`" />
      </div>
      <div v-if="movie.duration" role="listitem">
        <AppMovieTag :label="`${movie.duration} хв`" />
      </div>
      <div v-if="movie.rating" role="listitem">
        <AppMovieTag :label="`⭐ ${movie.rating}`" />
      </div>
    </div>

    <router-link
      :to="`/movies/${movie.id}`"
      class="inline-flex items-center gap-2 bg-primary hover:bg-secondary text-cinema-text
             px-8 py-3 rounded-full text-lg font-bold transition-colors duration-200
             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="`Дивитись деталі та сеанси для ${movie.title}`"
    >
      Деталі та сеанси
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import MovieCard from '@/components/movies/MovieCard.vue';
import MovieHeroInfo from '@/components/movies/MovieHeroInfo.vue';
import type { Movie } from '@/types/types';

interface MovieHero extends Movie {
  isUpcoming?: boolean;
  releaseFormatted?: string;
}

const movies = ref<MovieHero[]>([]);
const activeMovie = ref<MovieHero | null>(null);
const isLoading = ref(true);
const carousel = ref<HTMLElement | null>(null);

onMounted(async () => {
  try {
    const res = await fetch('/api/movies');
    const json = await res.json();
    if (json.success && json.data.length > 0) {
      movies.value = json.data;
      activeMovie.value = json.data[0];
    }
  } catch (error) {
    console.error('Помилка завантаження API:', error);
  } finally {
    isLoading.value = false;
  }
});

const heroStyle = computed(() => {
  const bg = activeMovie.value?.backgroundUrl || 'https://placehold.co/1920x1080/060404/060404';
  return {
    backgroundImage: `linear-gradient(to top, var(--background) 5%, rgba(6, 4, 4, 0.45) 45%, rgba(6, 4, 4, 0.2) 100%), url('${bg}')`,
    height: 'calc(100vh - 70px)',
  };
});

const selectMovie = (movie: MovieHero, event: Event) => {
  activeMovie.value = movie;
  if (carousel.value) {
    const card = event.currentTarget as HTMLElement;
    const cardRect = card.getBoundingClientRect();
    const wrapperRect = carousel.value.getBoundingClientRect();
    const cardLeftRelativeToWrapper = cardRect.left - wrapperRect.left + carousel.value.scrollLeft;
    const scrollLeftPos = cardLeftRelativeToWrapper - wrapperRect.width / 2 + cardRect.width / 2;
    carousel.value.scrollTo({ left: scrollLeftPos, behavior: 'smooth' });
  }
};

const handleWheel = (e: WheelEvent) => {
  if (!carousel.value) return;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault();
    carousel.value.scrollBy({ left: e.deltaY * 2, behavior: 'auto' });
  }
};
</script>

<template>
  <div
    v-if="isLoading"
    class="flex items-center justify-center h-[calc(100vh-70px)] text-cinema-text"
    role="status"
    aria-live="polite"
  >
    <span class="text-lg opacity-60">Завантаження афіші...</span>
  </div>
  <div
    v-else-if="movies.length === 0"
    class="flex items-end h-[calc(100vh-70px)] bg-background pb-14"
    role="status"
  >
    <div class="px-10">
      <h1 class="text-5xl font-black uppercase mb-3">Немає сеансів</h1>
      <p class="text-[#ccc] text-lg">Наразі афіша порожня.</p>
    </div>
  </div>

  <!-- Hero section — fills exact viewport minus topbar -->
  <section
    v-else-if="activeMovie"
    class="relative w-full bg-cover bg-center flex flex-col justify-end
           transition-[background-image] duration-500"
    :style="heroStyle"
    :aria-label="`Зараз виділено: ${activeMovie.title}`"
  >
    <MovieHeroInfo :movie="activeMovie" class="pb-6" />

    <div
      ref="carousel"
      class="carousel-wrapper scroll-smooth"
      @wheel="handleWheel"
    >
      <nav
        class="flex gap-5 px-10"
        aria-label="Список фільмів в прокаті"
      >
        <MovieCard
          v-for="movie in movies"
          :key="movie.id"
          :movie="movie"
          :is-active="activeMovie.id === movie.id"
          @select="selectMovie"
        />
      </nav>
    </div>
  </section>
</template>

<style scoped>
.carousel-wrapper {
  overflow-x: auto;
  overflow-y: visible;
  padding-top: 20px;
  padding-bottom: 24px;
  scrollbar-width: none;
}
.carousel-wrapper::-webkit-scrollbar {
  display: none;
}
.carousel-wrapper nav {
  overflow: visible;
  display: flex;
  gap: 20px;
  padding: 0 40px;
  width: max-content;
  min-width: 100%;
}
</style>

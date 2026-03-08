<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Movie {
  id: number;
  title: string;
  description?: string;
  isUpcoming?: boolean;
  releaseFormatted?: string;
  endDate?: string;
  duration?: number;
  rating?: number;
  posterUrl?: string;
  backgroundUrl?: string;
}

const movies = ref<Movie[]>([]);
const activeMovie = ref<Movie | null>(null); 
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
    console.error("Помилка завантаження API:", error);
  } finally {
    isLoading.value = false;
  }
});

const heroStyle = computed(() => {
  const bg = activeMovie.value?.backgroundUrl || 'https://placehold.co/1920x1080/060404/060404';
  return {
    backgroundImage: `linear-gradient(to top, var(--background) 5%, rgba(6, 4, 4, 0.45) 45%, rgba(6, 4, 4, 0.2) 100%), url('${bg}')`
  };
});

const selectMovie = (movie: Movie, event: Event) => {
  activeMovie.value = movie; 
  
  if (carousel.value) {
    const card = event.currentTarget as HTMLElement;
    const cardRect = card.getBoundingClientRect();
    const carouselRect = carousel.value.getBoundingClientRect();
    const scrollLeftPos = card.offsetLeft - (carouselRect.width / 2) + (cardRect.width / 2);
    carousel.value.scrollTo({ left: scrollLeftPos, behavior: 'smooth' });
  }
};


const truncateDesc = (desc?: string) => {
  if (!desc) return 'Опис відсутній...';
  return desc.length > 150 ? desc.substring(0, 150) + '...' : desc;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};
</script>

<template>
  <div v-if="movies.length > 0 && activeMovie">
    
    <div class="hero-section" :style="heroStyle">
      
      <div class="selected-movie-info">
        <h1>{{ activeMovie.title }}</h1>
        <p>{{ truncateDesc(activeMovie.description) }}</p>
        
        <div class="tags">
          <span v-if="activeMovie.isUpcoming" class="tag accent-tag">
            У кіно з {{ activeMovie.releaseFormatted }}
          </span>
          <span v-else class="tag">Зараз у прокаті</span>
          
          <span v-if="activeMovie.endDate" class="tag">
            До {{ formatDate(activeMovie.endDate) }}
          </span>
          
          <span v-if="activeMovie.duration" class="tag">
            {{ activeMovie.duration }} хв
          </span>
          
          <span v-if="activeMovie.rating" class="tag">
            ⭐ {{ activeMovie.rating }}
          </span>
        </div>

        <router-link :to="`/movies/${activeMovie.id}`" class="btn-details">
          Деталі та сеанси
        </router-link>
      </div>

      <div class="movies-carousel" ref="carousel">
        <div 
          v-for="movie in movies" 
          :key="movie.id"
          class="movie-card" 
          :class="{ active: activeMovie.id === movie.id }"
          @click="selectMovie(movie, $event)"
        >
          <img :src="movie.posterUrl || 'https://placehold.co/220x330/1a1a1a/d33131?text=Постер'" :alt="movie.title">
          
          <div class="card-overlay">
            <router-link :to="`/movies/${movie.id}`" class="card-btn">Детальніше</router-link>
          </div>
        </div>
      </div>

    </div>
  </div>

  <div v-else-if="!isLoading" class="hero-section" style="background: #060404;">
    <div class="selected-movie-info">
      <h1>Немає сеансів</h1>
      <p>Наразі афіша порожня.</p>
    </div>
  </div>

  <div v-else style="color: white; padding: 50px; text-align: center;">
    Завантаження афіші...
  </div>
</template>


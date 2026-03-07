<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

interface Session {
  id: number;
  startTime: string | Date;
}

interface Movie {
  id: number;
  title: string;
  description?: string;
  ageRestriction?: string;
  originalTitle?: string;
  director?: string;
  cast?: string;
  studio?: string;
  rating?: number;
  language?: string;
  genres?: string;
  duration?: number;
  isUpcoming?: boolean;
  releaseFormatted?: string;
  posterUrl?: string;
  Sessions?: Session[]; 
}

const route = useRoute();
const movie = ref<Movie | null>(null);

onMounted(async () => {
  try {
    const movieId = route.params.id; 
    const res = await fetch(`/api/movies/${movieId}`);
    const json = await res.json();
    
    if (json.success) {
      movie.value = json.data;
    }
  } catch (error) {
    console.error("Помилка завантаження фільму", error);
  }
});


const formatTime = (isoString: string | Date) => {
  return new Date(isoString).toLocaleTimeString('uk-UA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};
</script>

<template>
  <div class="details-container" v-if="movie">
    
    <div class="breadcrumbs">
      <router-link to="/">Головна</router-link> > 
      <router-link to="/">Фільми</router-link> > 
      <span>{{ movie.title }}</span>
    </div>

    <div class="poster-col">
      <img :src="movie.posterUrl || 'https://placehold.co/300x450/1a1a1a/d33131?text=Немає+постера'" :alt="movie.title">
      <a href="#" class="trailer-btn">▶ Дивитись трейлер</a>
    </div>

    <div class="info-col">
      <h1>{{ movie.title }}</h1>

      <div class="info-table">
        <div class="info-row">
          <div class="info-key">Вікові обмеження:</div>
          <div class="info-value">
            <span style="background: var(--primary); padding: 2px 6px; border-radius: 4px; font-weight: bold;">
              {{ movie.ageRestriction || '0+' }}
            </span>
          </div>
        </div>
        
        <div class="info-row">
          <div class="info-key">Оригінальна назва:</div>
          <div class="info-value" style="color: #888;">{{ movie.originalTitle || '-' }}</div>
        </div>
        
        <div class="info-row">
          <div class="info-key">Режисер:</div>
          <div class="info-value">{{ movie.director || 'Невідомо' }}</div>
        </div>
        
        <div class="info-row">
          <div class="info-key">У головних ролях:</div>
          <div class="info-value">{{ movie.cast || 'Невідомо' }}</div>
        </div>
        
        <div class="info-row">
          <div class="info-key">Студія:</div>
          <div class="info-value">{{ movie.studio || 'Невідомо' }}</div>
        </div>

        <div class="info-row">
          <div class="info-key">Рейтинг TMDB:</div>
          <div class="info-value">{{ movie.rating ? `⭐ ${movie.rating}` : 'Немає оцінок' }}</div>
        </div>
        
        <div class="info-row">
          <div class="info-key">Мова показу:</div>
          <div class="info-value">{{ movie.language || 'Українська' }}</div>
        </div>
        
        <div class="info-row">
          <div class="info-key">Жанр:</div>
          <div class="info-value">{{ movie.genres || 'Не вказано' }}</div>
        </div>

        <div class="info-row">
          <div class="info-key">Тривалість:</div>
          <div class="info-value">{{ movie.duration ? `${movie.duration} хв` : 'Уточнюється' }}</div>
        </div>

        <div class="info-row">
          <div class="info-key">Статус прокату:</div>
          <div class="info-value">
            <span v-if="movie.isUpcoming" style="color: var(--accent)">
              У кіно з {{ movie.releaseFormatted }}
            </span>
            <span v-else style="color: var(--primary)">Зараз у прокаті</span>
          </div>
        </div>
      </div>

      <div class="info-description">
        <p>{{ movie.description || 'Опис для цього фільму наразі відсутній.' }}</p>
      </div>
    </div>

    <div class="schedule-col">
      <h3 class="schedule-header">Розклад сеансів</h3>
      
      <div v-if="movie.Sessions && movie.Sessions.length > 0" class="session-hall">
        <div class="hall-name">Сьогодні</div>
        <div class="time-badges">
          <router-link 
            v-for="session in movie.Sessions" 
            :key="session.id"
            :to="`/tickets/buy/${session.id}`" 
            class="time-badge"
          >
            {{ formatTime(session.startTime) }}
          </router-link>
        </div>
      </div>

      <p v-else class="schedule-empty">
        <template v-if="movie.isUpcoming">
          Сеанси з'являться ближче до дати прем'єри ({{ movie.releaseFormatted }}).
        </template>
        <template v-else>
          Наразі немає доступних сеансів для цього фільму.
        </template>
      </p>
    </div>
  </div>
  <div v-else style="color: white; padding: 50px; text-align: center;">
    Завантаження деталей...
  </div>
</template>

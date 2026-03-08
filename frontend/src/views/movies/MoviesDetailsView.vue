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
      <h2 class="schedule-header">Розклад сеансів</h2>
      
      <template v-if="scheduleDays.length > 0">
        
        <div class="schedule-dropdown-wrapper" v-click-outside="closeDropdown">
          <div class="schedule-dropdown-header" @click="toggleDropdown" :class="{ 'open': isDropdownOpen }">
            <div class="header-left">
              {{ selectedDayObj?.weekday }}, {{ selectedDayObj?.dayMonth }}
            </div>
            <div class="header-right">
              {{ selectedDayObj?.relativeLabel || 'Оберіть дату' }}
              <svg class="chevron" :class="{ 'rotated': isDropdownOpen }" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
            </div>
          </div>

          <div class="schedule-dropdown-list" v-if="isDropdownOpen">
            <div 
              v-for="day in scheduleDays" 
              :key="day.isoDate"
              class="dropdown-item"
              :class="{ 'active': day.isoDate === selectedDateIso }"
              @click="selectDate(day.isoDate)"
            >
              <div class="item-relative">{{ day.relativeLabel || day.weekday }}</div>
              <div class="item-date">{{ day.relativeLabel ? `${day.weekday}, ` : '' }}{{ day.dayMonth }}</div>
            </div>
          </div>
        </div>

        <div class="halls-list">
          <template v-if="Object.keys(sessionsByHall).length > 0">
            <div v-for="(sessions, hallName) in sessionsByHall" :key="hallName" class="hall-block">
              <div class="hall-name">{{ hallName }}</div>
              <div class="time-badges">
                <router-link 
                  v-for="session in sessions" 
                  :key="session.id"
                  :to="isPastSession(session.startTime) ? '' : `/tickets/buy/${session.id}`" 
                  class="time-badge"
                  :class="{ 'past-session': isPastSession(session.startTime) }"
                >
                  {{ formatTime(session.startTime) }}
                </router-link>
              </div>
            </div>
          </template>
          
          <div v-else class="empty-schedule-day">
            <span class="hall-name">Кінотеатр</span>
            <p>Немає сеансів у цей день</p>
          </div>
        </div>

      </template>

      <div v-else class="schedule-empty">
        <template v-if="movie?.isUpcoming">
          Сеанси з'являться ближче до дати прем'єри.
        </template>
        <template v-else>
          Наразі немає доступних сеансів для цього фільму.
        </template>
      </div>
    </div>
  </div>
  
  <div v-else style="color: white; padding: 50px; text-align: center;">
    Завантаження деталей...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Movie, Session } from '@/types/types'; 

interface MovieDetails extends Movie {
  isUpcoming?: boolean;
  releaseFormatted?: string;
}

interface DayOption {
  isoDate: string;      
  weekday: string;      
  dayMonth: string;     
  relativeLabel: string;
}

const route = useRoute();
const movie = ref<MovieDetails | null>(null);

const selectedDateIso = ref<string>('');
const isDropdownOpen = ref(false);

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

// --- ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ ДАТ ---

const getLocalIsoDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// Перевіряє, чи сеанс вже почався/минув (Використовується в шаблоні!)
const isPastSession = (timeStr: string | Date) => {
  return new Date(timeStr).getTime() <= new Date().getTime();
};

const createDayOption = (dateStr: string): DayOption => {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  
  const dateObj = new Date(y, m - 1, d);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayIso = getLocalIsoDate(today);
  const tomorrowIso = getLocalIsoDate(tomorrow);

  let relativeLabel = '';
  if (dateStr === todayIso) relativeLabel = 'Сьогодні';
  else if (dateStr === tomorrowIso) relativeLabel = 'Завтра';

  let weekday = dateObj.toLocaleDateString('uk-UA', { weekday: 'short' });
  weekday = weekday.charAt(0).toUpperCase() + weekday.slice(1); 

  const dayMonth = dateObj.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }); 

  return { isoDate: dateStr, weekday, dayMonth, relativeLabel };
};

// --- ФІЛЬТРАЦІЯ ДАТ ---

// 1. Формуємо випадаючий список дат (Фільтруємо ТІЛЬКИ по днях, ігноруючи години)
const scheduleDays = computed<DayOption[]>(() => {
  if (!movie.value || !movie.value.Sessions) return [];
  
  const todayIso = getLocalIsoDate(new Date()); 
  const uniqueDateStrings = new Set<string>();
  
  movie.value.Sessions.forEach((session) => {
    const sessionDateIso = getLocalIsoDate(new Date(session.startTime));
    
    // Додаємо дату тільки якщо вона сьогоднішня або в майбутньому
    if (sessionDateIso >= todayIso) {
      uniqueDateStrings.add(sessionDateIso);
    }
  });

  return Array.from(uniqueDateStrings).sort().map(createDayOption);
});

watch(scheduleDays, (newDays) => {
  if (newDays.length > 0 && !selectedDateIso.value) {
    selectedDateIso.value = newDays[0]?.isoDate ?? '';
  }
});

const selectedDayObj = computed(() => {
  return scheduleDays.value.find(d => d.isoDate === selectedDateIso.value);
});

// 2. Групуємо всі сеанси для обраного дня
const sessionsByHall = computed(() => {
  if (!movie.value || !movie.value.Sessions || !selectedDateIso.value) return {};

  const filteredSessions = movie.value.Sessions.filter(session => {
    const sessionDateIso = getLocalIsoDate(new Date(session.startTime));
    return sessionDateIso === selectedDateIso.value;
  });

  const grouped: Record<string, Session[]> = {};
  filteredSessions.forEach(session => {
    const hallName = session.Halls?.name || `Зал ${session.hallId}`;
    if (!grouped[hallName]) grouped[hallName] = [];
    grouped[hallName]?.push(session);
  });

  for (const hall in grouped) {
    grouped[hall]?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  return grouped;
});

// --- ДІЇ UI ---

const toggleDropdown = () => isDropdownOpen.value = !isDropdownOpen.value;
const closeDropdown = () => isDropdownOpen.value = false;

const selectDate = (isoDate: string) => {
  selectedDateIso.value = isoDate;
  isDropdownOpen.value = false;
};

const formatTime = (isoString: string | Date) => {
  return new Date(isoString).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};

interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: MouseEvent) => void;
}

const vClickOutside = {
  mounted(el: ClickOutsideElement, binding: { value: (event: MouseEvent) => void }) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!(el === target || el.contains(target))) {
        binding.value(event);
      }
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: ClickOutsideElement) {
    if (el.clickOutsideEvent) {
      document.body.removeEventListener('click', el.clickOutsideEvent);
    }
  }
};
</script>
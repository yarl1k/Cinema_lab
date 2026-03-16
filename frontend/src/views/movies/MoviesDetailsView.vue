<template>
  <div
    v-if="!movie"
    class="flex items-center justify-center min-h-[60vh] text-cinema-text"
    role="status"
    aria-live="polite"
  >
    <span class="text-lg opacity-60">Завантаження деталей...</span>
  </div>

  <main
    v-else
    class="max-w-[1400px] mx-auto my-10 px-10 grid gap-10"
    style="grid-template-columns: 400px 1fr 350px; grid-template-rows: auto 1fr;"
  >
    <!-- Breadcrumbs -->
    <nav
      class="col-span-3 text-[0.9rem] text-white/40 flex items-center gap-2 flex-wrap"
      aria-label="Навігація"
    >
      <router-link to="/" class="hover:text-primary transition-colors">Головна</router-link>
      <span aria-hidden="true">›</span>
      <router-link to="/" class="hover:text-primary transition-colors">Фільми</router-link>
      <span aria-hidden="true">›</span>
      <span class="text-cinema-text" aria-current="page">{{ movie.title }}</span>
    </nav>

    <!-- Poster column -->
    <aside aria-label="Постер фільму">
      <img
        :src="movie.posterUrl || 'https://placehold.co/300x450/1a1a1a/d33131?text=Немає+постера'"
        :alt="`Постер фільму ${movie.title}`"
        class="w-full rounded-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] block mb-4"
      />
      <a
        href="#"
        class="flex items-center justify-center gap-2 py-4 bg-[#222] text-cinema-text
               font-bold rounded no-underline transition-colors hover:bg-primary
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Переглянути трейлер фільму"
      >
        ▶ Дивитись трейлер
      </a>
    </aside>

    <!-- Info column -->
    <article aria-label="Інформація про фільм">
      <h1 class="text-[2.5rem] font-bold m-0 mb-5">{{ movie.title }}</h1>

      <MovieInfoTable :rows="infoRows">

        <template #ageBadge>
          <span class="inline-block bg-primary px-2 py-0.5 rounded text-sm font-bold">
            {{ movie.ageRestriction || '0+' }}
          </span>
        </template>

        <template #statusBadge>
          <span v-if="movie.isUpcoming" style="color: var(--accent)">
            У кіно з {{ movie.releaseFormatted }}
          </span>
          <span v-else style="color: var(--primary)">Зараз у прокаті</span>
        </template>

        <template #origTitle>
          <span class="text-white/50">{{ movie.originalTitle || '-' }}</span>
        </template>
      </MovieInfoTable>

      <section aria-label="Опис фільму" class="leading-relaxed text-[#ccc] text-[1.05rem]">
        <p>{{ movie.description || 'Опис для цього фільму наразі відсутній.' }}</p>
      </section>
    </article>

    <!-- Schedule column -->
    <SchedulePanel
      :schedule-days="scheduleDays"
      :sessions-by-hall="sessionsByHall"
      :selected-date-iso="selectedDateIso"
      :selected-day-obj="selectedDayObj"
      :is-dropdown-open="isDropdownOpen"
      :is-upcoming="movie.isUpcoming"
      @toggle-dropdown="toggleDropdown"
      @close-dropdown="closeDropdown"
      @select-date="selectDate"
    />
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Movie, Session } from '@/types/types';
import MovieInfoTable from '@/components/movies/MovieInfoTable.vue';
import SchedulePanel from '@/components/movies/SchedulePanel.vue';
import type { InfoRow } from '@/components/movies/MovieInfoTable.vue';

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
    if (json.success) movie.value = json.data;
  } catch (error) {
    console.error('Помилка завантаження фільму', error);
  }
});

const infoRows = computed<InfoRow[]>(() => {
  if (!movie.value) return [];
  return [
    { key: 'Вікові обмеження:', value: movie.value.ageRestriction || '0+', slot: 'ageBadge' },
    { key: 'Оригінальна назва:', value: movie.value.originalTitle || '-', slot: 'origTitle' },
    { key: 'Режисер:', value: movie.value.director || 'Невідомо' },
    { key: 'У головних ролях:', value: movie.value.cast || 'Невідомо' },
    { key: 'Студія:', value: movie.value.studio || 'Невідомо' },
    { key: 'Рейтинг TMDB:', value: movie.value.rating ? `⭐ ${movie.value.rating}` : 'Немає оцінок' },
    { key: 'Мова показу:', value: movie.value.language || 'Українська' },
    { key: 'Жанр:', value: movie.value.genres || 'Не вказано' },
    { key: 'Тривалість:', value: movie.value.duration ? `${movie.value.duration} хв` : 'Уточнюється' },
    { key: 'Статус прокату:', value: '', slot: 'statusBadge' },
  ];
});

const getLocalIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

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

const scheduleDays = computed<DayOption[]>(() => {
  if (!movie.value?.Sessions) return [];
  const todayIso = getLocalIsoDate(new Date());
  const uniqueDateStrings = new Set<string>();
  movie.value.Sessions.forEach((session) => {
    const sessionDateIso = getLocalIsoDate(new Date(session.startTime));
    if (sessionDateIso >= todayIso) uniqueDateStrings.add(sessionDateIso);
  });
  return Array.from(uniqueDateStrings).sort().map(createDayOption);
});

watch(scheduleDays, (newDays) => {
  if (newDays.length > 0 && !selectedDateIso.value)
    selectedDateIso.value = newDays[0]?.isoDate ?? '';
});

const selectedDayObj = computed(() =>
  scheduleDays.value.find((d) => d.isoDate === selectedDateIso.value),
);

const sessionsByHall = computed(() => {
  if (!movie.value?.Sessions || !selectedDateIso.value) return {};
  const filtered = movie.value.Sessions.filter(
    (s) => getLocalIsoDate(new Date(s.startTime)) === selectedDateIso.value,
  );
  const grouped: Record<string, Session[]> = {};
  filtered.forEach((session) => {
    const hallName = session.Halls?.name || `Зал ${session.hallId}`;
    if (!grouped[hallName]) grouped[hallName] = [];
    grouped[hallName]?.push(session);
  });
  for (const hall in grouped) {
    grouped[hall]?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
  return grouped;
});

const toggleDropdown = () => (isDropdownOpen.value = !isDropdownOpen.value);
const closeDropdown = () => (isDropdownOpen.value = false);
const selectDate = (isoDate: string) => {
  selectedDateIso.value = isoDate;
  isDropdownOpen.value = false;
};
</script>
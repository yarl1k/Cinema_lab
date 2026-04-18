<template>
  <div
    class="max-w-[1200px] mx-auto my-10 px-5 pb-10"
    role="main"
    aria-label="Панель адміністратора"
  >
    <header class="mb-8 flex items-center gap-4 border-b border-white/10 pb-6">
      <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl" aria-hidden="true">⚙️</div>
      <div>
        <h1 class="text-2xl font-bold text-cinema-text m-0 leading-tight">Панель адміністратора</h1>
        <p class="text-white/40 text-sm m-0 mt-0.5">Управління фільмами, залами та журнал подій</p>
      </div>
    </header>

    <div
      class="flex gap-1 mb-8 bg-[#111] p-1 rounded-xl w-fit"
      role="tablist"
      aria-label="Розділи адміністрування"
    >
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        role="tab"
        type="button"
        :aria-selected="activeTab === tab.id"
        :aria-controls="`admin-panel-${tab.id}`"
        :id="`admin-tab-${tab.id}`"
        :class="[
          'px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border-0',
          activeTab === tab.id
            ? 'bg-[#1e1e1e] text-cinema-text shadow-sm ring-1 ring-white/10'
            : 'bg-transparent text-white/40 hover:text-white/70'
        ]"
        @click="activeTab = tab.id"
      >
        <span class="mr-2" aria-hidden="true">{{ tab.icon }}</span>{{ tab.label }}
      </button>
    </div>

    <!-- ── MOVIES TAB ───────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'movies'"
      id="admin-panel-movies"
      role="tabpanel"
      aria-labelledby="admin-tab-movies"
    >
      <div class="flex items-center justify-between mb-5">
        <div>
          <h2 class="text-lg font-bold text-cinema-text m-0">Керування фільмами</h2>
          <p class="text-white/40 text-sm m-0">{{ movies.length }} фільмів у базі</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                 bg-green-600 text-white border-0 cursor-pointer transition-colors
                 hover:bg-green-700
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
          @click="openModal()"
        >
          <span aria-hidden="true">＋</span> Додати фільм
        </button>
      </div>

      <AppAdminTable :columns="['ID', 'Назва', 'Режисер', 'Тривалість', 'Дії']" caption="Список фільмів">
        <tr
          v-for="movie in movies"
          :key="movie.id"
          class="border-b border-white/5 transition-colors hover:bg-white/[0.025] group"
        >
          <td class="px-4 py-3 text-white/40 text-sm tabular-nums">{{ movie.id }}</td>
          <td class="px-4 py-3 font-semibold">{{ movie.title }}</td>
          <td class="px-4 py-3 text-white/60">{{ movie.director || '—' }}</td>
          <td class="px-4 py-3 text-white/60">{{ movie.duration ? `${movie.duration} хв` : '—' }}</td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-bold rounded-lg bg-accent text-black border-0 cursor-pointer
                       transition-opacity hover:opacity-80
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                :aria-label="`Редагувати фільм ${movie.title}`"
                @click="openModal(movie)"
              >
                Редаг.
              </button>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white border-0 cursor-pointer
                       transition-opacity hover:opacity-80
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                :aria-label="`Видалити фільм ${movie.title}`"
                @click="deleteMovie(movie.id)"
              >
                Видалити
              </button>
            </div>
          </td>
        </tr>
      </AppAdminTable>
    </div>

    <!-- ── HALLS TAB ────────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'halls'"
      id="admin-panel-halls"
      role="tabpanel"
      aria-labelledby="admin-tab-halls"
    >
      <h2 class="text-lg font-bold text-cinema-text mb-5">Керування залами</h2>

      <section
        class="bg-[#111] border border-dashed border-white/15 rounded-xl p-5 mb-6"
        aria-label="Форма додавання нового залу"
      >
        <h3 class="text-accent text-base font-semibold mt-0 mb-4">Додати новий зал</h3>
        <div class="grid gap-4" style="grid-template-columns: 1fr 2fr auto; align-items: end;">
          <div class="flex flex-col gap-1">
            <label class="text-[13px] font-medium text-cinema-text/80" for="hall-name">Назва залу</label>
            <input
              id="hall-name"
              v-model="newHall.name"
              type="text"
              placeholder='Зал 1'
              class="admin-input"
              autocomplete="off"
            />
          </div>
          <div class="flex gap-4">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-[13px] font-medium text-cinema-text/80" for="hall-rows">Рядів</label>
              <input id="hall-rows" v-model="newHall.rows" type="number" placeholder="10" class="admin-input" />
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-[13px] font-medium text-cinema-text/80" for="hall-seats">Місць в ряду</label>
              <input id="hall-seats" v-model="newHall.seatsPerRow" type="number" placeholder="15" class="admin-input" />
            </div>
          </div>
          <button
            type="button"
            class="h-[44px] px-6 rounded-lg text-sm font-semibold bg-green-600 text-white border-0
                   cursor-pointer transition-colors hover:bg-green-700
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
            @click="createHall"
          >
            Створити
          </button>
        </div>
      </section>

      <AppAdminTable
        :columns="['ID', 'Назва залу', 'Рядів', 'Місць у ряду', 'Разом', 'Статус', 'Дії']"
        caption="Список залів"
      >
        <tr
          v-for="hall in halls"
          :key="hall.id"
          class="border-b border-white/5 transition-colors hover:bg-white/[0.025]"
        >
          <td class="px-4 py-3 text-white/40 text-sm tabular-nums">{{ hall.id }}</td>
          <td class="px-4 py-3 font-semibold">{{ hall.name }}</td>
          <td class="px-4 py-3 text-white/60">{{ hall.rows }}</td>
          <td class="px-4 py-3 text-white/60">{{ hall.seatsPerRow }}</td>
          <td class="px-4 py-3 text-white/60">{{ hall.rows * hall.seatsPerRow }}</td>
          <td class="px-4 py-3">
            <AppStatusBadge :active="hall.isActive" />
          </td>
          <td class="px-4 py-3">
            <div class="flex gap-2">
              <button
                type="button"
                :class="[
                  'px-3 py-1.5 text-xs font-bold rounded-lg border-0 cursor-pointer transition-opacity hover:opacity-80',
                  'focus-visible:outline-2 focus-visible:outline-offset-2',
                hall.isActive
                  ? 'bg-yellow-500 text-black focus-visible:outline-yellow-500'
                  : 'bg-green-600 text-white focus-visible:outline-green-500'
              ]"
              :aria-label="`${hall.isActive ? 'Вимкнути' : 'Увімкнути'} зал ${hall.name}`"
              @click="toggleHallStatus(hall.id)"
            >
              {{ hall.isActive ? 'Вимкнути' : 'Увімкнути' }}
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-bold rounded-lg bg-accent text-black border-0 cursor-pointer
                     transition-opacity hover:opacity-80
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              :aria-label="`Перегляд залу ${hall.name}`"
              @click="openHallView(hall.id)"
            >
              Переглянути
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white border-0 cursor-pointer
                     transition-opacity hover:opacity-80
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              :aria-label="`Видалити зал ${hall.name}`"
              @click="deleteHall(hall.id)"
            >
              Видалити
            </button>
          </div>
        </td>
      </tr>
    </AppAdminTable>
    <AdminHallViewModal
      :is-open="isHallModalOpen"
      :hall-id="viewingHallId"
      @close="closeHallView"
    />
  </div>

    <!-- ── LOGS TAB ──────────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'logs'"
      id="admin-panel-logs"
      role="tabpanel"
      aria-labelledby="admin-tab-logs"
    >
      <div class="mb-5">
        <h2 class="text-lg font-bold text-cinema-text m-0">Журнал подій (Аудит)</h2>
        <p class="text-white/40 text-sm m-0">{{ logs.length }} записів</p>
      </div>

      <AppAdminTable
        :columns="['Дата та Час', 'Подія', 'Сутність (ID)', 'Користувач']"
        caption="Журнал аудиту системи"
      >
        <tr
          v-for="log in logs"
          :key="log.id"
          class="border-b border-white/5 transition-colors hover:bg-white/[0.025]"
        >
          <td class="px-4 py-3 text-white/60 text-sm tabular-nums">{{ formatTime(log.createdAt) }}</td>
          <td class="px-4 py-3">
            <span class="inline-block bg-[#333] text-accent px-2 py-0.5 rounded text-xs font-mono">
              {{ log.eventType }}
            </span>
          </td>
          <td class="px-4 py-3 text-white/60 text-sm">{{ log.entityType }} ({{ log.entityId || '—' }})</td>
          <td class="px-4 py-3 text-white/60 text-sm">{{ log.User?.email || 'Система' }}</td>
        </tr>
      </AppAdminTable>
    </div>

    <div
      v-show="activeTab === 'stats'"
      id="admin-panel-stats"
      role="tabpanel"
      aria-labelledby="admin-tab-stats"
    >
      <AdminStatsTab v-if="activeTab === 'stats'" />
    </div>

    <!-- ── BUFFET TAB ────────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'buffet'"
      id="admin-panel-buffet"
      role="tabpanel"
      aria-labelledby="admin-tab-buffet"
    >
      <AdminBuffetTab v-if="activeTab === 'buffet'" />
    </div>

    <!-- ── REPORTS TAB ───────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'reports'"
      id="admin-panel-reports"
      role="tabpanel"
      aria-labelledby="admin-tab-reports"
    >
      <AdminReportsTab v-if="activeTab === 'reports'" />
    </div>

    <!-- ── USERS TAB ─────────────────────────────────────────────── -->
    <div
      v-show="activeTab === 'users'"
      id="admin-panel-users"
      role="tabpanel"
      aria-labelledby="admin-tab-users"
    >
      <AdminUsersTab v-if="activeTab === 'users'" />
    </div>

    <AdminMovieModal
      :is-open="isModalOpen"
      :is-editing="isEditing"
      :modal-tab="modalTab"
      :movie-form="movieForm"
      :halls="halls"
      :current-movie-sessions="currentMovieSessions"
      :batch-session="batchSession"
      :available-times="availableTimes"
      :is-time-disabled="isTimeDisabled"
      @close="closeModal"
      @save="saveMovie"
      @update:modal-tab="modalTab = $event"
      @update:movie-form="movieForm = $event"
      @update:batch-session="batchSession = $event"
      @fetch-hall-sessions="fetchHallSessions"
      @handle-date-input="handleDateInput"
      @toggle-time="toggleTime"
      @generate-sessions="generateSessions"
      @remove-session="removeSession"
      @remove-all-sessions="removeAllSessions"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/services/apiQueries';
import type { Movie, EventLog, Hall, Session } from '@/types/types';
import { formatToDDMMYYYY, applyDateMask, parseCustomDate, formatTime } from '@/services/dateFormating';
import { checkTimeOverlap } from '@/services/SessionChecker';
import AppAdminTable from '@/components/AppAdminTable.vue';
import AppStatusBadge from '@/components/AppStatusBadge.vue';
import AdminMovieModal from '@/components/admin/AdminMovieModal.vue';
import AdminStatsTab from '@/components/admin/AdminStatsTab.vue';
import AdminBuffetTab from '@/components/admin/AdminBuffetTab.vue';
import AdminReportsTab from '@/components/admin/AdminReportsTab.vue';
import AdminUsersTab from '@/components/admin/AdminUsersTab.vue';
import AdminHallViewModal from '@/components/admin/AdminHallViewModal.vue';
import { useActiveRole } from '@/composables/useActiveRole';

const { isAdminOrHigher } = useActiveRole();

const tabs = [
  { id: 'movies',  label: 'Фільми',      icon: '' },
  { id: 'halls',   label: 'Зали',        icon: '' },
  { id: 'buffet',  label: 'Буфет',       icon: '' },
  { id: 'users',   label: 'Користувачі', icon: '' },
  { id: 'logs',    label: 'Журнал',      icon: '' },
  { id: 'stats',   label: 'Статистика',  icon: '' },
  { id: 'reports', label: 'Звіти',       icon: '' },
] as const;
type TabId = typeof tabs[number]['id'];

const visibleTabs = computed(() => {
  return tabs.filter(tab => tab.id !== 'users' || isAdminOrHigher.value);
});

const activeTab = ref<TabId>('movies');
const movies = ref<Movie[]>([]);
const logs = ref<EventLog[]>([]);
const halls = ref<Hall[]>([]);
const selectedHallSessions = ref<Session[]>([]);
const isHallModalOpen = ref(false);
const viewingHallId = ref<number | null>(null);

onMounted(async () => { await loadInitialData(); });

const loadInitialData = async () => {
  try {
    [movies.value, logs.value, halls.value] = await Promise.all([
      api.getMovies(), api.getLogs(), api.getHalls()
    ]);
  } catch (e) { alert((e as Error).message); }
};

const newHall = ref<Partial<Hall>>({ name: '', rows: 10, seatsPerRow: 15 });

const createHall = async () => {
  if (!newHall.value.name || !newHall.value.rows || !newHall.value.seatsPerRow) return alert('Заповніть всі поля!');
  try {
    await api.createHall(newHall.value);
    newHall.value = { name: '', rows: 10, seatsPerRow: 15 };
    await loadInitialData();
  } catch (e) { alert((e as Error).message); }
};

const toggleHallStatus = async (id: number) => {
  try { await api.toggleHallStatus(id); await loadInitialData(); } catch (e) { alert((e as Error).message); }
};

const deleteHall = async (id: number) => {
  if (!confirm('Видалити цей зал?')) return;
  try { await api.deleteHall(id); await loadInitialData(); } catch (e) { alert((e as Error).message); }
};

const deleteMovie = async (id: number) => {
  if (!confirm('Видалити цей фільм?')) return;
  try { await api.deleteMovie(id); await loadInitialData(); } catch (e) { alert((e as Error).message); }
};

const openHallView = (id: number) => {
  viewingHallId.value = id;
  isHallModalOpen.value = true;
};

const closeHallView = () => {
  isHallModalOpen.value = false;
  viewingHallId.value = null;
};

const isModalOpen = ref(false);
const isEditing = ref(false);
const editingMovieId = ref<number | null>(null);
const modalTab = ref('details');

const movieForm = ref<Partial<Movie>>({
  title: '', originalTitle: '', director: '', cast: '', studio: '', ageRestriction: '',
  language: 'українська', rating: null, genres: '', duration: null, description: '',
  posterUrl: '', backgroundUrl: '', releaseDate: '', endDate: ''
});

const currentMovieSessions = ref<Session[]>([]);
const batchSession = ref({ hallId: null as number | null, startDate: '', endDate: '', selectedTimes: [] as string[] });
const availableTimes = Array.from({ length: 21 }, (_, i) => `${Math.floor(i / 2) + 10}:${i % 2 === 0 ? '00' : '30'}`);

const openModal = async (movie?: Movie) => {
  modalTab.value = 'details';
  if (movie) {
    isEditing.value = true;
    editingMovieId.value = movie.id;
    const relDate = movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '';
    const endDt   = movie.endDate    ? new Date(movie.endDate).toISOString().split('T')[0]    : '';
    movieForm.value = { ...movie, releaseDate: relDate, endDate: endDt };
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const release = movie.releaseDate ? new Date(movie.releaseDate) : tomorrow;
    const startGenDate = release > tomorrow ? release : tomorrow;
    batchSession.value = {
      hallId: null,
      startDate: formatToDDMMYYYY(startGenDate.toISOString()),
      endDate: formatToDDMMYYYY(movie.endDate),
      selectedTimes: [],
    };
    selectedHallSessions.value = [];
    currentMovieSessions.value = await api.getMovieSessions(movie.id);
  } else {
    isEditing.value = false;
    editingMovieId.value = null;
    movieForm.value = { title: '', originalTitle: '', director: '', cast: '', studio: '',
      ageRestriction: '', language: 'українська', rating: null, genres: '', duration: null,
      description: '', posterUrl: '', backgroundUrl: '', releaseDate: '', endDate: '' };
    currentMovieSessions.value = [];
  }
  isModalOpen.value = true;
};

const closeModal = () => { isModalOpen.value = false; };

const saveMovie = async () => {
  try {
    const toIso = (d: string | undefined | null) => {
      if (!d) return null;
      const date = new Date(d);
      return isNaN(date.getTime()) ? null : date.toISOString();
    };
    const payload: Partial<Movie> = {
      ...movieForm.value,
      duration: movieForm.value.duration ? Number(movieForm.value.duration) : null,
      rating:   movieForm.value.rating   ? Number(movieForm.value.rating)   : null,
      releaseDate: toIso(movieForm.value.releaseDate),
      endDate:     toIso(movieForm.value.endDate),
    };
    await api.saveMovie(payload, isEditing.value, editingMovieId.value);
    closeModal();
    await loadInitialData();
  } catch (e) { alert((e as Error).message); }
};

const fetchHallSessions = async (hallId: number | null) => {
  if (hallId) selectedHallSessions.value = await api.getHallSessions(hallId);
};

const handleDateInput = (e: Event, field: 'startDate' | 'endDate') => {
  const target = e.target as HTMLInputElement;
  const formatted = applyDateMask(target.value);
  batchSession.value[field] = formatted;
  target.value = formatted;
};

const isTimeDisabled = (timeStr: string) => {
  if (!batchSession.value.hallId || !batchSession.value.startDate || !batchSession.value.endDate || !movieForm.value.duration) return false;
  return checkTimeOverlap(timeStr, batchSession.value.selectedTimes, batchSession.value.startDate, batchSession.value.endDate, movieForm.value.duration, selectedHallSessions.value, editingMovieId.value);
};

const toggleTime = (time: string) => {
  if (isTimeDisabled(time)) return;
  const index = batchSession.value.selectedTimes.indexOf(time);
  index > -1 ? batchSession.value.selectedTimes.splice(index, 1) : batchSession.value.selectedTimes.push(time);
};

const generateSessions = async () => {
  const { hallId, startDate, endDate, selectedTimes } = batchSession.value;
  if (!hallId || !movieForm.value.duration || !selectedTimes.length || startDate.length !== 10 || endDate.length !== 10)
    return alert('Заповніть всі поля генератора!');
  const start = parseCustomDate(startDate);
  const end   = parseCustomDate(endDate);
  if (!start || !end || isNaN(start.getTime()) || start > end) return alert('Некоректні дати!');
  const generatedSessions: Partial<Session>[] = [];
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const datePrefix = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    selectedTimes.filter(t => !isTimeDisabled(t)).forEach(t =>
      generatedSessions.push({ movieId: editingMovieId.value!, hallId: Number(hallId), startTime: new Date(`${datePrefix}T${t}:00`).toISOString() })
    );
  }
  try {
    await api.createSessionsBatch(generatedSessions);
    alert(`Згенеровано ${generatedSessions.length} сеансів!`);
    batchSession.value.selectedTimes = [];
    currentMovieSessions.value = await api.getMovieSessions(editingMovieId.value!);
    await fetchHallSessions(hallId);
    logs.value = await api.getLogs();
  } catch (e) { alert((e as Error).message); }
};

const removeSession = async (sessionId: number) => {
  if (!confirm('Видалити сеанс?')) return;
  try {
    await api.deleteSession(sessionId);
    currentMovieSessions.value = await api.getMovieSessions(editingMovieId.value!);
    if (batchSession.value.hallId) await fetchHallSessions(batchSession.value.hallId);
    logs.value = await api.getLogs();
  } catch (e) { alert((e as Error).message); }
};

const removeAllSessions = async () => {
  if (!editingMovieId.value) return;
  if (!confirm('Ви впевнені, що хочете видалити ВСІ сеанси цього фільму?')) return;
  try {
    await api.deleteAllMovieSessions(editingMovieId.value);
    currentMovieSessions.value = [];
    if (batchSession.value.hallId) await fetchHallSessions(batchSession.value.hallId);
    await loadInitialData();
    alert('Всі сеанси успішно видалено!');
  } catch (e) { alert((e as Error).message); }
};
</script>

<style scoped>
.admin-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 14px;
  background: #0d0d0d;
  color: var(--text);
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}
.admin-input:focus {
  outline: none;
  border-color: var(--primary);
}
</style>
<template>
  <div class="admin-container">
    <h1>Панель Адміністратора</h1>

    <div class="admin-tabs">
      <button :class="{ active: activeTab === 'movies' }" @click="activeTab = 'movies'">🎬 Фільми</button>
      <button :class="{ active: activeTab === 'halls' }" @click="activeTab = 'halls'">🏢 Зали</button>
      <button :class="{ active: activeTab === 'logs' }" @click="activeTab = 'logs'">📜 Журнал подій</button>
    </div>

    <div v-if="activeTab === 'movies'" class="tab-content">
      <div class="header-action">
        <h2>Керування фільмами</h2>
        <button class="btn-success" @click="openModal()">+ Додати фільм</button> 
      </div>
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Назва</th>
            <th>Режисер</th>
            <th>Тривалість</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="movie in movies" :key="movie.id">
            <td>{{ movie.id }}</td>
            <td><strong>{{ movie.title }}</strong></td>
            <td>{{ movie.director || '-' }}</td>
            <td>{{ movie.duration ? `${movie.duration} хв` : '-' }}</td>
            <td class="actions">
              <button class="btn-edit" @click="openModal(movie)">Редаг.</button>
              <button class="btn-danger" @click="deleteMovie(movie.id)">Видалити</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'halls'" class="tab-content">
      <div class="header-action"><h2>Керування залами</h2></div>
      <div class="add-session-box" style="margin-bottom: 20px;">
        <h4>Додати новий зал</h4>
        <div class="session-form">
          <div class="input-group">
            <label class="input-label">Назва (напр. "Зал 1" або "IMAX")</label>
            <input v-model="newHall.name" type="text" class="modal-input" placeholder="Зал 1" />
          </div>
          <div class="input-group">
            <label class="input-label">Кількість рядів</label>
            <input v-model="newHall.rows" type="number" class="modal-input" placeholder="10" />
          </div>
          <div class="input-group">
            <label class="input-label">Місць в ряду</label>
            <input v-model="newHall.seatsPerRow" type="number" class="modal-input" placeholder="15" />
          </div>
          <button class="btn-success" @click="createHall" style="height: 44px; margin-top: 24px;">Створити</button>
        </div>
      </div>

      <table class="admin-table">
        <thead>
          <tr>
            <th>ID</th><th>Назва залу</th><th>Рядів</th><th>Місць в ряду</th><th>Загалом</th><th>Статус</th><th>Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="hall in halls" :key="hall.id">
            <td>{{ hall.id }}</td><td><strong>{{ hall.name }}</strong></td><td>{{ hall.rows }}</td>
            <td>{{ hall.seatsPerRow }}</td><td>{{ hall.rows * hall.seatsPerRow }}</td>
            <td>
              <span :class="['status-badge', hall.isActive ? 'active' : 'inactive']">
                {{ hall.isActive ? 'Активний' : 'Вимкнений' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-warning" @click="toggleHallStatus(hall.id)">
                {{ hall.isActive ? 'Вимкнути' : 'Увімкнути' }}
              </button>
              <button class="btn-danger" @click="deleteHall(hall.id)">Видалити</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="activeTab === 'logs'" class="tab-content">
      <h2>Журнал подій (Аудит)</h2>
      <table class="admin-table logs-table">
        <thead>
          <tr><th>Дата та Час</th><th>Подія</th><th>Сутність (ID)</th><th>Користувач (Емейл)</th></tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ formatTime(log.createdAt) }}</td>
            <td><span class="log-badge">{{ log.eventType }}</span></td>
            <td>{{ log.entityType }} ({{ log.entityId || '-' }})</td>
            <td>{{ log.Users?.email || 'Система' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isModalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-wide">
        <button class="modal__close" @click="closeModal">&times;</button>
        
        <div class="modal-left">
          <div class="poster-preview"><img :src="movieForm.posterUrl || 'https://placehold.co/300x450/1a1a1a/d33131?text=Немає+постера'" alt="Постер"></div>
          <div class="input-group">
            <label class="input-label">URL Постера</label>
            <input v-model="movieForm.posterUrl" type="text" class="modal-input" placeholder="https://..." />
          </div>
          <div class="input-group">
            <label class="input-label">URL Фону (Героя)</label>
            <input v-model="movieForm.backgroundUrl" type="text" class="modal-input" placeholder="https://..." />
          </div>
        </div>

        <div class="modal-right">
          <h2>{{ isEditing ? 'Редагування фільму' : 'Додати новий фільм' }}</h2>
          <div class="inner-tabs" v-if="isEditing">
            <button type="button" :class="{ active: modalTab === 'details' }" @click="modalTab = 'details'">Деталі фільму</button>
            <button type="button" :class="{ active: modalTab === 'sessions' }" @click="modalTab = 'sessions'">Розклад сеансів</button>
          </div>

          <div class="scrollable-content" v-if="modalTab === 'details' || !isEditing">
            <form @submit.prevent="saveMovie" id="movieForm">
              <div class="form-grid">
                <div class="input-group">
                  <label class="input-label">Назва фільму *</label>
                  <input v-model="movieForm.title" type="text" class="modal-input" required />
                </div>
                <div class="input-group">
                  <label class="input-label">Оригінальна назва</label>
                  <input v-model="movieForm.originalTitle" type="text" class="modal-input" />
                </div>
                <div class="input-group">
                  <label class="input-label">Режисер</label>
                  <input v-model="movieForm.director" type="text" class="modal-input" />
                </div>
                <div class="input-group">
                  <label class="input-label">У головних ролях</label>
                  <input v-model="movieForm.cast" type="text" class="modal-input" />
                </div>
                <div class="input-group">
                  <label class="input-label">Студія</label>
                  <input v-model="movieForm.studio" type="text" class="modal-input" />
                </div>
                <div class="input-group">
                  <label class="input-label">Жанри</label>
                  <input v-model="movieForm.genres" type="text" class="modal-input" placeholder="Фантастика, Бойовик" />
                </div>
                
                <div class="input-row">
                  <div class="input-group">
                    <label class="input-label">Тривалість (хв) *</label>
                    <input v-model="movieForm.duration" type="number" class="modal-input" required title="Потрібно для розрахунку розкладу" />
                  </div>
                  <div class="input-group">
                    <label class="input-label">Вік</label>
                    <input v-model="movieForm.ageRestriction" type="text" class="modal-input" placeholder="16+" />
                  </div>
                  <div class="input-group">
                    <label class="input-label">Рейтинг</label>
                    <input v-model="movieForm.rating" type="number" step="0.1" class="modal-input" placeholder="7.1" />
                  </div>
                  <div class="input-group">
                    <label class="input-label">Мова</label>
                    <input v-model="movieForm.language" type="text" class="modal-input" placeholder="українська" />
                  </div>
                </div>

                <div class="input-row">
                  <div class="input-group">
                    <label class="input-label">Початок прокату</label>
                    <input v-model="movieForm.releaseDate" type="date" class="modal-input" />
                  </div>
                  <div class="input-group">
                    <label class="input-label">Кінець прокату</label>
                    <input v-model="movieForm.endDate" type="date" class="modal-input" />
                  </div>
                </div>
              </div>

              <div class="input-group" style="margin-top: 10px;">
                <label class="input-label">Опис фільму</label>
                <textarea v-model="movieForm.description" class="modal-input" rows="4" placeholder="Сюжет фільму..."></textarea>
              </div>

              <div class="modal-actions" style="margin-top: 24px;">
                <button type="button" class="btn-secondary" @click="closeModal">Скасувати</button>
                <button type="submit" class="btn-primary" form="movieForm">Зберегти фільм</button>
              </div>
            </form>
          </div>

          <div class="scrollable-content" v-if="modalTab === 'sessions' && isEditing">
            <div class="add-session-box">
              <h4>Генерація розкладу сеансів</h4>
              <div class="form-grid" style="grid-template-columns: 1fr 1fr; margin-bottom: 15px;">
                <div class="input-group" style="grid-column: 1 / -1;">
                  <label class="input-label">Оберіть зал</label>
                  <select v-model="batchSession.hallId" @change="fetchHallSessions(batchSession.hallId)" class="modal-input">
                    <option disabled :value="null">Оберіть зал...</option>
                    <option v-for="hall in halls.filter(h => h.isActive)" :key="hall.id" :value="hall.id">
                      {{ hall.name }} ({{ hall.rows * hall.seatsPerRow }} місць)
                    </option>
                  </select>
                </div>
                
                <div class="input-group">
                  <label class="input-label">З якого числа (ДД.ММ.РРРР)</label>
                  <input 
                    type="text" 
                    :value="batchSession.startDate" 
                    @input="handleDateInput($event, 'startDate')"
                    class="modal-input" 
                    placeholder="01.01.2026" 
                    maxlength="10"
                  />
                </div>
                <div class="input-group">
                  <label class="input-label">По яке число (ДД.ММ.РРРР)</label>
                  <input 
                    type="text" 
                    :value="batchSession.endDate" 
                    @input="handleDateInput($event, 'endDate')"
                    class="modal-input" 
                    placeholder="14.01.2026" 
                    maxlength="10"
                  />
                </div>
              </div>

              <div class="input-group" style="margin-bottom: 20px;">
                <label class="input-label">Оберіть час сеансів на кожен день:</label>
                <div class="time-picker">
                  <button 
                    v-for="time in availableTimes" 
                    :key="time"
                    type="button"
                    :class="[
                      'time-chip', 
                      batchSession.selectedTimes.includes(time) ? 'active' : '',
                      isTimeDisabled(time) ? 'disabled' : ''
                    ]"
                    :disabled="isTimeDisabled(time)"
                    :title="isTimeDisabled(time) ? 'Зал зайнятий іншим фільмом у цей час' : ''"
                    @click="toggleTime(time)"
                  >
                    {{ time }}
                  </button>
                </div>
                <small v-if="!batchSession.hallId" style="color:#dc3545; margin-top:5px;">*Спочатку оберіть зал, щоб перевірити доступність часу</small>
                <small v-else-if="!movieForm.duration" style="color:#dc3545; margin-top:5px;">*Вкажіть тривалість фільму у вкладці деталей для перевірки накладок</small>
              </div>
              
              <button class="btn-success" @click="generateSessions" :disabled="!batchSession.hallId || !movieForm.duration" style="width: 100%;">Згенерувати сеанси</button>
            </div>

            <div class="divider" style="display: flex; align-items: center; justify-content: space-between;">
              <span>Поточні сеанси цього фільму</span>
              
              <button 
                v-if="currentMovieSessions.length > 0" 
                @click="removeAllSessions" 
                class="btn-danger" 
                style="padding: 4px 12px; font-size: 0.8rem; background: #dc3545; border: none; cursor: pointer; border-radius: 4px;"
              >
                🗑 Видалити всі
              </button>
            </div>
            
            <table class="admin-table">
              <thead>
                <tr><th>ID</th><th>Зал</th><th>Дата та Час</th><th>Дії</th></tr>
              </thead>
              <tbody>
                <tr v-for="session in currentMovieSessions" :key="session.id">
                  <td>{{ session.id }}</td>
                  <td>{{ session.Halls?.name || `Зал ${session.hallId}` }}</td>
                  <td>{{ formatTime(session.startTime) }}</td>
                  <td><button class="btn-danger" style="padding: 4px 8px;" @click="removeSession(session.id)">✕</button></td>
                </tr>
                <tr v-if="currentMovieSessions.length === 0">
                  <td colspan="4" style="text-align: center; color: #888;">Сеансів ще немає</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/apiQueries';
import type { Movie, EventLog, Hall, Session } from '@/types/types';
import { formatToDDMMYYYY, applyDateMask, parseCustomDate, formatTime } from '@/services/dateFormating';
import { checkTimeOverlap } from '@/services/SessionChecker';

const activeTab = ref('movies');
const movies = ref<Movie[]>([]);
const logs = ref<EventLog[]>([]);
const halls = ref<Hall[]>([]);
const selectedHallSessions = ref<Session[]>([]);

onMounted(async () => {
  await loadInitialData();
});

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

const isModalOpen = ref(false);
const isEditing = ref(false);
const editingMovieId = ref<number | null>(null);
const modalTab = ref('details');

const movieForm = ref<Partial<Movie>>({
  title: '', originalTitle: '', director: '', cast: '', studio: '', ageRestriction: '', language: 'українська', rating: null, 
  genres: '', duration: null, description: '', posterUrl: '', backgroundUrl: '', releaseDate: '', endDate: ''
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
    const endDt = movie.endDate ? new Date(movie.endDate).toISOString().split('T')[0] : '';

    movieForm.value = { ...movie, releaseDate: relDate, endDate: endDt };
    

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const release = movie.releaseDate ? new Date(movie.releaseDate) : tomorrow;
    

    const startGenDate = release > tomorrow ? release : tomorrow;
    
    batchSession.value = { 
      hallId: null, 
      startDate: formatToDDMMYYYY(startGenDate.toISOString()), 
      endDate: formatToDDMMYYYY(movie.endDate), 
      selectedTimes: [] 
    };
    
    selectedHallSessions.value = [];
    currentMovieSessions.value = await api.getMovieSessions(movie.id);
  } else {
    isEditing.value = false;
    editingMovieId.value = null;
    movieForm.value = { title: '', originalTitle: '', director: '', cast: '', studio: '', ageRestriction: '', language: 'українська', rating: null, genres: '', duration: null, description: '', posterUrl: '', backgroundUrl: '', releaseDate: '', endDate: '' };
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
      rating: movieForm.value.rating ? Number(movieForm.value.rating) : null,
      releaseDate: toIso(movieForm.value.releaseDate),
      endDate: toIso(movieForm.value.endDate),
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
  
  return checkTimeOverlap(
    timeStr, 
    batchSession.value.selectedTimes, 
    batchSession.value.startDate, 
    batchSession.value.endDate, 
    movieForm.value.duration, 
    selectedHallSessions.value, 
    editingMovieId.value
  );
};

const toggleTime = (time: string) => {
  if (isTimeDisabled(time)) return;
  const index = batchSession.value.selectedTimes.indexOf(time);
  index > -1 ? batchSession.value.selectedTimes.splice(index, 1) : batchSession.value.selectedTimes.push(time);
};

const generateSessions = async () => {
  const { hallId, startDate, endDate, selectedTimes } = batchSession.value;
  if (!hallId || !movieForm.value.duration || !selectedTimes.length || startDate.length !== 10 || endDate.length !== 10) return alert('Заповніть всі поля генератора!');

  const start = parseCustomDate(startDate);
  const end = parseCustomDate(endDate);
  if (!start || !end || isNaN(start.getTime()) || start > end) return alert('Некоректні дати!');

  const generatedSessions: Partial<Session>[] = [];
  
  for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    const datePrefix = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    selectedTimes.filter(t => !isTimeDisabled(t)).forEach(t => 
      generatedSessions.push({
        movieId: editingMovieId.value!,
        hallId: Number(hallId),

        startTime: new Date(`${datePrefix}T${t}:00`).toISOString()
       })
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
    if (batchSession.value.hallId) {
      await fetchHallSessions(batchSession.value.hallId);
    }
    
    await loadInitialData(); 
    alert('Всі сеанси успішно видалено!');
  } catch (e) { 
    alert((e as Error).message); 
  }
};
</script>
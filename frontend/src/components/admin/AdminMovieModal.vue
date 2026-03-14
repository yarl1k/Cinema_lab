<script setup lang="ts">
import { computed } from 'vue';
import AppAdminTable from '@/components/AppAdminTable.vue';
import type { Movie, Hall, Session } from '@/types/types';

// ── Props ──────────────────────────────────────────────────────────
const props = defineProps<{
  isOpen: boolean;
  isEditing: boolean;
  modalTab: string;
  movieForm: Partial<Movie>;
  halls: Hall[];
  currentMovieSessions: Session[];
  batchSession: {
    hallId: number | null;
    startDate: string;
    endDate: string;
    selectedTimes: string[];
  };
  availableTimes: string[];
  isTimeDisabled: (time: string) => boolean;
}>();

// ── Emits ──────────────────────────────────────────────────────────
const emit = defineEmits<{
  close: [];
  save: [];
  'update:modalTab': [tab: string];
  'update:movieForm': [form: Partial<Movie>];
  'update:batchSession': [session: typeof props.batchSession];
  fetchHallSessions: [hallId: number | null];
  handleDateInput: [event: Event, field: 'startDate' | 'endDate'];
  toggleTime: [time: string];
  generateSessions: [];
  removeSession: [id: number];
  removeAllSessions: [];
}>();

const formatTime = (isoString: string | Date) =>
  new Date(isoString).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

// ── Helpers for two-way binding on sub-fields ─────────────────────
const updateForm = (key: keyof Movie, value: unknown) => {
  emit('update:movieForm', { ...props.movieForm, [key]: value });
};

const updateBatch = (key: keyof typeof props.batchSession, value: unknown) => {
  emit('update:batchSession', { ...props.batchSession, [key]: value });
};
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop-fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-[rgba(6,4,4,0.85)] backdrop-blur-sm z-[2000]
               flex items-center justify-center p-5"
        role="dialog"
        aria-modal="true"
        :aria-label="isEditing ? 'Редагування фільму' : 'Додати новий фільм'"
        @click.self="emit('close')"
      >
        <div
          class="bg-[#1a1a1a] w-full max-w-[950px] h-[85vh] rounded-2xl relative
                 flex overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)]
                 modal-enter"
        >
          <!-- Close button -->
          <button
            type="button"
            class="absolute top-4 right-5 w-8 h-8 rounded-full bg-[#333] flex items-center justify-center
                   text-cinema-text text-xl z-10 cursor-pointer transition-all duration-200
                   hover:bg-primary hover:scale-110
                   focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label="Закрити діалог"
            @click="emit('close')"
          >
            &times;
          </button>

          <!-- LEFT: Poster Preview -->
          <aside
            class="w-[320px] bg-[#111] px-5 py-7 border-r border-white/10
                   flex flex-col gap-4 overflow-y-auto shrink-0"
            aria-label="Прев'ю постера"
          >
            <div class="rounded-lg overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.5)] mb-2">
              <img
                :src="movieForm.posterUrl || 'https://placehold.co/300x450/1a1a1a/d33131?text=Немає+постера'"
                alt="Прев'ю постера фільму"
                class="w-full h-[380px] object-cover block"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[13px] font-medium text-cinema-text/80" for="modal-poster-url">URL Постера</label>
              <input
                id="modal-poster-url"
                type="url"
                :value="movieForm.posterUrl ?? ''"
                placeholder="https://..."
                class="modal-input"
                autocomplete="off"
                @input="updateForm('posterUrl', ($event.target as HTMLInputElement).value)"
              />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-[13px] font-medium text-cinema-text/80" for="modal-bg-url">URL Фону (Героя)</label>
              <input
                id="modal-bg-url"
                type="url"
                :value="movieForm.backgroundUrl ?? ''"
                placeholder="https://..."
                class="modal-input"
                autocomplete="off"
                @input="updateForm('backgroundUrl', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </aside>

          <!-- RIGHT: Form Content -->
          <div class="flex-1 flex flex-col px-8 py-7 bg-[#1a1a1a] min-w-0">
            <h2 class="mt-0 mb-5 text-2xl font-bold text-cinema-text">
              {{ isEditing ? 'Редагування фільму' : 'Додати новий фільм' }}
            </h2>

            <!-- Inner tabs (only when editing) -->
            <div
              v-if="isEditing"
              class="flex gap-4 mb-5 border-b border-white/10"
              role="tablist"
              aria-label="Розділи форми фільму"
            >
              <button
                role="tab"
                type="button"
                :aria-selected="modalTab === 'details'"
                :aria-controls="'modal-panel-details'"
                :class="[
                  'pb-2.5 px-1 text-base font-semibold border-b-2 transition-all duration-200 cursor-pointer',
                  modalTab === 'details'
                    ? 'border-accent text-cinema-text'
                    : 'border-transparent text-white/50 hover:text-white/80'
                ]"
                @click="emit('update:modalTab', 'details')"
              >
                Деталі фільму
              </button>
              <button
                role="tab"
                type="button"
                :aria-selected="modalTab === 'sessions'"
                :aria-controls="'modal-panel-sessions'"
                :class="[
                  'pb-2.5 px-1 text-base font-semibold border-b-2 transition-all duration-200 cursor-pointer',
                  modalTab === 'sessions'
                    ? 'border-accent text-cinema-text'
                    : 'border-transparent text-white/50 hover:text-white/80'
                ]"
                @click="emit('update:modalTab', 'sessions')"
              >
                Розклад сеансів
              </button>
            </div>

            <!-- ── DETAILS TAB ────────────────────────────────────── -->
            <div
              v-if="modalTab === 'details' || !isEditing"
              id="modal-panel-details"
              role="tabpanel"
              aria-label="Деталі фільму"
              class="flex-1 overflow-y-auto pr-2"
            >
              <form id="movieForm" @submit.prevent="emit('save')">
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-title">Назва фільму *</label>
                    <input id="f-title" type="text" class="modal-input" required
                      :value="movieForm.title ?? ''"
                      @input="updateForm('title', ($event.target as HTMLInputElement).value)" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-orig-title">Оригінальна назва</label>
                    <input id="f-orig-title" type="text" class="modal-input"
                      :value="movieForm.originalTitle ?? ''"
                      @input="updateForm('originalTitle', ($event.target as HTMLInputElement).value)" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-director">Режисер</label>
                    <input id="f-director" type="text" class="modal-input"
                      :value="movieForm.director ?? ''"
                      @input="updateForm('director', ($event.target as HTMLInputElement).value)" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-cast">У головних ролях</label>
                    <input id="f-cast" type="text" class="modal-input"
                      :value="movieForm.cast ?? ''"
                      @input="updateForm('cast', ($event.target as HTMLInputElement).value)" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-studio">Студія</label>
                    <input id="f-studio" type="text" class="modal-input"
                      :value="movieForm.studio ?? ''"
                      @input="updateForm('studio', ($event.target as HTMLInputElement).value)" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-genres">Жанри</label>
                    <input id="f-genres" type="text" class="modal-input" placeholder="Фантастика, Бойовик"
                      :value="movieForm.genres ?? ''"
                      @input="updateForm('genres', ($event.target as HTMLInputElement).value)" />
                  </div>

                  <!-- Row: duration / age / rating / language -->
                  <div class="col-span-2 flex gap-4">
                    <div class="flex flex-col gap-1 flex-1">
                      <label class="modal-label" for="f-duration">Тривалість (хв) *</label>
                      <input id="f-duration" type="number" class="modal-input" required
                        :value="movieForm.duration ?? ''"
                        @input="updateForm('duration', Number(($event.target as HTMLInputElement).value))" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                      <label class="modal-label" for="f-age">Вік</label>
                      <input id="f-age" type="text" class="modal-input" placeholder="16+"
                        :value="movieForm.ageRestriction ?? ''"
                        @input="updateForm('ageRestriction', ($event.target as HTMLInputElement).value)" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                      <label class="modal-label" for="f-rating">Рейтинг</label>
                      <input id="f-rating" type="number" step="0.1" class="modal-input" placeholder="7.1"
                        :value="movieForm.rating ?? ''"
                        @input="updateForm('rating', Number(($event.target as HTMLInputElement).value))" />
                    </div>
                    <div class="flex flex-col gap-1 flex-1">
                      <label class="modal-label" for="f-lang">Мова</label>
                      <input id="f-lang" type="text" class="modal-input" placeholder="українська"
                        :value="movieForm.language ?? ''"
                        @input="updateForm('language', ($event.target as HTMLInputElement).value)" />
                    </div>
                  </div>

                  <!-- Row: release / end dates -->
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-release">Початок прокату</label>
                    <input id="f-release" type="date" class="modal-input"
                      :value="movieForm.releaseDate ?? ''"
                      @input="updateForm('releaseDate', ($event.target as HTMLInputElement).value)" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="f-end">Кінець прокату</label>
                    <input id="f-end" type="date" class="modal-input"
                      :value="movieForm.endDate ?? ''"
                      @input="updateForm('endDate', ($event.target as HTMLInputElement).value)" />
                  </div>
                </div>

                <div class="flex flex-col gap-1 mt-4">
                  <label class="modal-label" for="f-desc">Опис фільму</label>
                  <textarea id="f-desc" class="modal-input resize-y" rows="4" placeholder="Сюжет фільму..."
                    :value="movieForm.description ?? ''"
                    @input="updateForm('description', ($event.target as HTMLTextAreaElement).value)"
                  />
                </div>

                <div class="flex gap-3 justify-end mt-6">
                  <button
                    type="button"
                    class="h-11 px-6 rounded-lg text-[15px] font-semibold transition-all duration-200 cursor-pointer
                           bg-transparent border border-white/25 text-cinema-text
                           hover:border-cinema-text hover:bg-white/5
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    @click="emit('close')"
                  >
                    Скасувати
                  </button>
                  <button
                    type="submit"
                    form="movieForm"
                    class="h-11 px-6 rounded-lg text-[15px] font-semibold transition-all duration-200 cursor-pointer
                           bg-primary border border-primary text-white
                           hover:bg-secondary hover:border-secondary
                           focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    Зберегти фільм
                  </button>
                </div>
              </form>
            </div>

            <!-- ── SESSIONS TAB ───────────────────────────────────── -->
            <div
              v-if="modalTab === 'sessions' && isEditing"
              id="modal-panel-sessions"
              role="tabpanel"
              aria-label="Розклад сеансів"
              class="flex-1 overflow-y-auto pr-2"
            >
              <!-- Generator box -->
              <div class="bg-[#222] p-4 rounded-xl border border-dashed border-white/15 mb-5">
                <h3 class="mt-0 mb-4 text-accent text-base font-semibold">Генерація розкладу сеансів</h3>

                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="col-span-2 flex flex-col gap-1">
                    <label class="modal-label" for="batch-hall">Оберіть зал</label>
                    <select
                      id="batch-hall"
                      class="modal-input"
                      :value="batchSession.hallId ?? ''"
                      @change="(e) => {
                        const v = Number((e.target as HTMLSelectElement).value) || null;
                        updateBatch('hallId', v);
                        emit('fetchHallSessions', v);
                      }"
                    >
                      <option disabled value="">Оберіть зал...</option>
                      <option v-for="hall in halls.filter(h => h.isActive)" :key="hall.id" :value="hall.id">
                        {{ hall.name }} ({{ hall.rows * hall.seatsPerRow }} місць)
                      </option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="batch-start">З якого числа (ДД.ММ.РРРР)</label>
                    <input id="batch-start" type="text" class="modal-input" placeholder="01.01.2026" maxlength="10"
                      :value="batchSession.startDate"
                      @input="emit('handleDateInput', $event, 'startDate')" />
                  </div>
                  <div class="flex flex-col gap-1">
                    <label class="modal-label" for="batch-end">По яке число (ДД.ММ.РРРР)</label>
                    <input id="batch-end" type="text" class="modal-input" placeholder="14.01.2026" maxlength="10"
                      :value="batchSession.endDate"
                      @input="emit('handleDateInput', $event, 'endDate')" />
                  </div>
                </div>

                <fieldset class="mb-5 border-0 p-0">
                  <legend class="modal-label mb-2">Оберіть час сеансів на кожен день:</legend>
                  <div class="flex flex-wrap gap-2" role="group" aria-label="Доступний час сеансів">
                    <button
                      v-for="time in availableTimes"
                      :key="time"
                      type="button"
                      :disabled="isTimeDisabled(time)"
                      :title="isTimeDisabled(time) ? 'Зал зайнятий іншим фільмом у цей час' : ''"
                      :class="[
                        'px-3.5 py-2 rounded-full text-sm transition-all duration-200 select-none border',
                        isTimeDisabled(time)
                          ? 'bg-[#2a2a2a] text-[#555] border-[#333] cursor-not-allowed line-through opacity-60'
                          : batchSession.selectedTimes.includes(time)
                            ? 'bg-primary border-primary text-white font-bold cursor-pointer'
                            : 'bg-[#111] border-white/25 text-cinema-text cursor-pointer hover:border-white/50'
                      ]"
                      :aria-pressed="batchSession.selectedTimes.includes(time)"
                      :aria-label="`Час ${time}${isTimeDisabled(time) ? ' – недоступно' : ''}`"
                      @click="emit('toggleTime', time)"
                    >
                      {{ time }}
                    </button>
                  </div>
                  <p v-if="!batchSession.hallId" class="text-red-400/80 text-xs mt-2" role="alert">
                    * Спочатку оберіть зал, щоб перевірити доступність часу
                  </p>
                  <p v-else-if="!movieForm.duration" class="text-red-400/80 text-xs mt-2" role="alert">
                    * Вкажіть тривалість фільму у вкладці деталей для перевірки накладок
                  </p>
                </fieldset>

                <button
                  type="button"
                  class="w-full h-11 rounded-lg font-semibold text-sm transition-all duration-200
                         bg-green-600 text-white border-0 cursor-pointer
                         hover:bg-green-700 disabled:bg-[#444] disabled:text-[#888] disabled:cursor-not-allowed
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500"
                  :disabled="!batchSession.hallId || !movieForm.duration"
                  @click="emit('generateSessions')"
                >
                  Згенерувати сеанси
                </button>
              </div>

              <!-- Divider -->
              <div class="flex items-center justify-between text-white/40 text-xs uppercase tracking-wider font-semibold my-5">
                <span>Поточні сеанси цього фільму</span>
                <button
                  v-if="currentMovieSessions.length > 0"
                  type="button"
                  class="px-3 py-1 text-xs rounded bg-primary text-white border-0 cursor-pointer transition-colors hover:bg-[#b02020]
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  @click="emit('removeAllSessions')"
                >
                  🗑 Видалити всі
                </button>
              </div>

              <!-- Sessions Table -->
              <AppAdminTable :columns="['ID', 'Зал', 'Дата та Час', 'Дії']" caption="Поточні сеанси фільму">
                <tr v-for="session in currentMovieSessions" :key="session.id"
                    class="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                  <td class="px-4 py-3 text-white/50 text-sm">{{ session.id }}</td>
                  <td class="px-4 py-3 text-sm">{{ session.Halls?.name || `Зал ${session.hallId}` }}</td>
                  <td class="px-4 py-3 text-sm">{{ formatTime(session.startTime) }}</td>
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      class="px-2 py-1 text-xs rounded bg-primary text-white border-0 cursor-pointer transition-colors hover:bg-[#b02020]
                             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      :aria-label="`Видалити сеанс ${session.id}`"
                      @click="emit('removeSession', session.id)"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
                <tr v-if="currentMovieSessions.length === 0">
                  <td colspan="4" class="px-4 py-6 text-center text-white/40 text-sm">Сеансів ще немає</td>
                </tr>
              </AppAdminTable>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Input utility classes used heavily inside the modal */
.modal-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-size: 14px;
  background: #111;
  color: var(--text);
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}
.modal-input:focus {
  outline: none;
  border-color: var(--primary);
}
select.modal-input {
  appearance: auto;
}
.modal-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  opacity: 0.8;
}

/* Modal enter animation */
.modal-enter {
  animation: slideUp 0.3s ease-out;
}

/* Backdrop transition */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
</style>

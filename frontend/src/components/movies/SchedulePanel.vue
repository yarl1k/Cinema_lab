<script setup lang="ts">
import { computed } from 'vue';
import type { Session } from '@/types/types';

interface DayOption {
  isoDate: string;
  weekday: string;
  dayMonth: string;
  relativeLabel: string;
}

interface ClickOutsideElement extends HTMLElement {
  clickOutsideEvent?: (event: MouseEvent) => void;
}

const props = defineProps<{
  scheduleDays: DayOption[];
  sessionsByHall: Record<string, Session[]>;
  selectedDateIso: string;
  selectedDayObj: DayOption | undefined;
  isDropdownOpen: boolean;
  isUpcoming?: boolean;
}>();

const emit = defineEmits<{
  'update:selectedDateIso': [value: string];
  'update:isDropdownOpen': [value: boolean];
  selectDate: [isoDate: string];
  toggleDropdown: [];
  closeDropdown: [];
}>();

const isPastSession = (timeStr: string | Date) =>
  new Date(timeStr).getTime() <= new Date().getTime();

const formatTime = (isoString: string | Date) =>
  new Date(isoString).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

const vClickOutside = {
  mounted(el: ClickOutsideElement, binding: { value: (event: MouseEvent) => void }) {
    el.clickOutsideEvent = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!(el === target || el.contains(target))) binding.value(event);
    };
    document.body.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el: ClickOutsideElement) {
    if (el.clickOutsideEvent)
      document.body.removeEventListener('click', el.clickOutsideEvent);
  },
};
</script>

<template>
  <aside
    class="bg-[#2a2a2a] rounded-xl overflow-hidden sticky top-[90px] min-h-[600px] flex flex-col"
    aria-label="Розклад сеансів"
  >
    <h2 class="text-xl font-bold text-white px-5 pt-5 pb-4 m-0 bg-[#333]">
      Розклад сеансів
    </h2>

    <template v-if="scheduleDays.length > 0">
      <!-- Date Dropdown -->
      <div
        v-click-outside="() => emit('closeDropdown')"
        class="relative select-none"
      >
        <button
          type="button"
          class="flex w-full justify-between items-center px-5 py-3
                 bg-primary text-white text-[1.1rem] font-bold cursor-pointer
                 transition-colors duration-200 hover:bg-[#d40000]
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          :aria-expanded="isDropdownOpen"
          aria-haspopup="listbox"
          aria-controls="schedule-dropdown-list"
          @click="emit('toggleDropdown')"
        >
          <span>{{ selectedDayObj?.weekday }}, {{ selectedDayObj?.dayMonth }}</span>
          <span class="flex items-center gap-2 text-[0.95rem] font-normal">
            {{ selectedDayObj?.relativeLabel || 'Оберіть дату' }}
            <svg
              :class="['transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '']"
              viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
            >
              <path fill="currentColor" d="M7 10l5 5 5-5z" />
            </svg>
          </span>
        </button>

        <ul
          v-if="isDropdownOpen"
          id="schedule-dropdown-list"
          role="listbox"
          :aria-label="`Дати сеансів: обрано ${selectedDayObj?.dayMonth}`"
          class="absolute top-full left-0 right-0 bg-[#444] z-50
                 max-h-[250px] overflow-y-auto shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        >
          <li
            v-for="day in scheduleDays"
            :key="day.isoDate"
            role="option"
            :aria-selected="day.isoDate === selectedDateIso"
            :class="[
              'flex flex-col items-center px-5 py-3 cursor-pointer border-b border-white/10 transition-colors duration-200',
              day.isoDate === selectedDateIso ? 'bg-[#333]' : 'hover:bg-[#555]'
            ]"
            @click="emit('selectDate', day.isoDate)"
          >
            <span class="text-[1.1rem] font-bold text-white">
              {{ day.relativeLabel || day.weekday }}
            </span>
            <span class="text-[0.85rem] text-white/60 mt-0.5">
              {{ day.relativeLabel ? `${day.weekday}, ` : '' }}{{ day.dayMonth }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Sessions by Hall -->
      <div class="p-5 bg-[#2a2a2a] flex-1">
        <template v-if="Object.keys(sessionsByHall).length > 0">
          <section
            v-for="(sessions, hallName) in sessionsByHall"
            :key="hallName"
            class="mb-6"
            :aria-label="`Сеанси в залі ${hallName}`"
          >
            <h3 class="text-base font-bold text-white mb-3">{{ hallName }}</h3>
            <div class="flex flex-wrap gap-2.5" role="list" :aria-label="`Час сеансів в ${hallName}`">
              <router-link
                v-for="session in sessions"
                :key="session.id"
                role="listitem"
                :to="isPastSession(session.startTime) ? '' : `/booking/${session.id}`"
                :class="[
                  'inline-block border border-white/30 text-white px-4 py-2 rounded',
                  'text-base font-bold no-underline transition-all duration-200',
                  isPastSession(session.startTime)
                    ? 'opacity-40 line-through cursor-not-allowed pointer-events-none'
                    : 'hover:bg-white/10 hover:border-white/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                ]"
                :aria-disabled="isPastSession(session.startTime)"
                :aria-label="`Сеанс о ${formatTime(session.startTime)}${isPastSession(session.startTime) ? ' (вже минув)' : ''}`"
              >
                {{ formatTime(session.startTime) }}
              </router-link>
            </div>
          </section>
        </template>

        <div v-else class="text-white/50 text-[0.95rem]">
          <p class="font-bold text-white mb-1">Кінотеатр</p>
          <p>Немає сеансів у цей день</p>
        </div>
      </div>
    </template>

    <div
      v-else
      class="p-5 text-white/50 text-center flex-1 flex items-center justify-center"
      role="status"
    >
      <p>
        <template v-if="isUpcoming">
          Сеанси з'являться ближче до дати прем'єри.
        </template>
        <template v-else>
          Наразі немає доступних сеансів для цього фільму.
        </template>
      </p>
    </div>
  </aside>
</template>

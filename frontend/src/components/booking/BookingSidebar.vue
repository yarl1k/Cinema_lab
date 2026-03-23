<template>
  <aside class="bg-[#1e1e1e] border border-white/10 rounded-xl p-5 flex flex-col gap-4 sticky top-[90px]">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h3 class="text-cinema-text font-bold text-base m-0">Квитки</h3>
      <span class="text-white/40 text-sm">{{ selectedSeats.length }} квит., {{ total }} грн</span>
    </div>

    <!-- Ticket list -->
    <div v-if="selectedSeats.length > 0" class="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
      <div
        v-for="seat in selectedSeats"
        :key="seat.seatId"
        class="flex items-center justify-between bg-[#111] rounded-lg px-3 py-2.5"
      >
        <div class="flex flex-col">
          <span class="text-cinema-text text-sm font-medium">
            {{ seat.row }} ряд, {{ seat.seatNumber }} місце
            <span class="text-accent text-xs ml-1" v-if="seat.price > 220">LUX</span>
          </span>
          <span class="text-white/40 text-xs">GOOD</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-cinema-text font-bold text-sm">{{ seat.price }} грн</span>
          <button
            v-if="step === 1"
            type="button"
            class="w-6 h-6 flex items-center justify-center rounded bg-white/5 text-white/40
                   hover:text-primary hover:bg-primary/10 border-0 cursor-pointer transition-colors text-xs"
            :aria-label="`Видалити місце ряд ${seat.row}, місце ${seat.seatNumber}`"
            @click="$emit('removeSeat', seat)"
          >✕</button>
        </div>
      </div>
    </div>
    <div v-else class="text-white/30 text-sm text-center py-6">Оберіть місця на карті</div>

    <!-- Total -->
    <div class="border-t border-white/10 pt-4 mt-auto">
      <div class="flex justify-between items-center mb-3">
        <span class="text-cinema-text font-semibold">Всього до сплати:</span>
        <span class="text-cinema-text font-bold text-lg">{{ total }} грн</span>
      </div>
      <button
        type="button"
        :disabled="selectedSeats.length === 0 || isProcessing || (step === 2 && !isFormValid)"
        class="w-full py-3.5 rounded-lg font-bold text-base border-0 cursor-pointer transition-all
               bg-primary text-cinema-text hover:bg-secondary
               disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary"
        @click="$emit('continue')"
      >
        <span v-if="isProcessing" class="inline-flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Обробка...
        </span>
        <span v-else>{{ step === 1 ? 'Продовжити' : 'Оплатити' }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SelectedSeat } from './BookingSeatMap.vue';

const props = defineProps<{
  selectedSeats: SelectedSeat[];
  step: number;
  isProcessing: boolean;
  isFormValid: boolean;
}>();

defineEmits<{
  removeSeat: [seat: SelectedSeat];
  continue: [];
}>();

const total = computed(() =>
  props.selectedSeats.reduce((sum, s) => sum + s.price, 0)
);
</script>

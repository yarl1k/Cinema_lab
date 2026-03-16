<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-6 mb-2 justify-center text-sm">
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 border-2 border-white/30 rounded" />
        <span class="text-white/60">GOOD — {{ PRICE_GOOD }} грн</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 border-2 border-accent rounded" />
        <span class="text-white/60">SUPER LUX — {{ PRICE_VIP }} грн</span>
      </div>
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] text-white/20">✕</div>
        <span class="text-white/60">Зайнято</span>
      </div>
    </div>

    <!-- Screen glow -->
    <div class="relative h-10 flex items-end justify-center mb-4">
      <div class="screen-arc" />
      <span class="absolute bottom-0 text-xs tracking-[0.25em] text-white/50 uppercase font-semibold">Екран</span>
    </div>

    <!-- Seat grid -->
    <div class="flex flex-col items-center gap-1.5">
      <div
        v-for="rowNum in totalRows"
        :key="rowNum"
        class="flex items-center gap-1"
      >
        <!-- Row label -->
        <span class="w-6 text-right text-[11px] text-white/30 mr-1 tabular-nums">{{ rowNum }}</span>

        <button
          v-for="seat in getRowSeats(rowNum)"
          :key="seat.seatId"
          type="button"
          :disabled="seat.status !== 'FREE'"
          :class="seatClass(seat, rowNum)"
          :aria-label="`Ряд ${rowNum}, Місце ${seat.seatNumber}${seat.status !== 'FREE' ? ' (зайнято)' : ''}`"
          :title="seat.status !== 'FREE' ? 'Зайнято' : `Ряд ${rowNum}, Місце ${seat.seatNumber} — ${getSeatPrice(rowNum)} грн`"
          @click="toggleSeat(seat)"
        >
          <span v-if="seat.status !== 'FREE' && !isSelected(seat)" class="text-[10px] leading-none">✕</span>
          <span v-else-if="isSelected(seat)" class="text-[10px] leading-none font-bold">✓</span>
        </button>

        <span class="w-6 text-left text-[11px] text-white/30 ml-1 tabular-nums">{{ rowNum }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface SeatData {
  seatId: number;
  row: number;
  seatNumber: number;
  status: string;
  ticketId: number | null;
}

export interface SelectedSeat extends SeatData {
  price: number;
  lockTicketId?: number;
}

const PRICE_GOOD = 220;
const PRICE_VIP = 340;

const props = defineProps<{
  seats: SeatData[];
  totalRows: number;
  seatsPerRow: number;
  selectedSeats: SelectedSeat[];
  vipRowStart: number; 
}>();

const emit = defineEmits<{
  toggle: [seat: SeatData];
}>();

const getRowSeats = (row: number) => {
  return props.seats
    .filter(s => s.row === row)
    .sort((a, b) => a.seatNumber - b.seatNumber);
};

const isVipRow = (row: number) => row >= props.vipRowStart;

const getSeatPrice = (row: number) => isVipRow(row) ? PRICE_VIP : PRICE_GOOD;

const isSelected = (seat: SeatData) =>
  props.selectedSeats.some(s => s.seatId === seat.seatId);

const toggleSeat = (seat: SeatData) => {
  if (seat.status !== 'FREE') return;
  emit('toggle', seat);
};

const seatClass = (seat: SeatData, row: number) => {
  const base = 'w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer text-xs border-2';
  const vip = isVipRow(row);

  if (seat.status !== 'FREE' && !isSelected(seat)) {
    return `${base} bg-white/5 border-white/10 cursor-not-allowed opacity-40`;
  }

  if (isSelected(seat)) {
    return vip
      ? `${base} bg-accent/20 border-accent text-accent shadow-[0_0_8px_rgba(230,165,25,0.4)]`
      : `${base} bg-primary/20 border-primary text-primary shadow-[0_0_8px_rgba(211,49,49,0.4)]`;
  }

  return vip
    ? `${base} border-accent/40 hover:bg-accent/10 hover:border-accent text-transparent`
    : `${base} border-white/20 hover:bg-primary/10 hover:border-primary text-transparent`;
};
</script>

<style scoped>
.screen-arc {
  width: 80%;
  height: 6px;
  border-radius: 0 0 50% 50%;
  background: linear-gradient(to right, transparent, rgba(211, 49, 49, 0.8), transparent);
  box-shadow: 0 4px 20px rgba(211, 49, 49, 0.15), 0 2px 8px rgba(211, 49, 49, 0.05);
}
</style>

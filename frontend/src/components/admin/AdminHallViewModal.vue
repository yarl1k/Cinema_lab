<script setup lang="ts">
import { ref, watch } from 'vue';
import { api } from '@/services/apiQueries';

const props = defineProps<{
    isOpen: boolean;
    hallId: number | null;
}>();

const emit = defineEmits<{
    (e: 'close'): void;
}>();

const seats = ref<any[]>([]);
const hall = ref<any>(null);

const fetchSeats = async () => {
    if (!props.hallId) return;
    try {
        const res = await api.getHallSeats(props.hallId);
        hall.value = res.hall;
        seats.value = res.seats;
    } catch(e: any) {
        alert(e.message);
    }
}

watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        fetchSeats();
    }
});

const toggleSeat = async (seat: any) => {
    const isAvail = !seat.isAvailable;
    let desc = '';
    if (!isAvail) {
        desc = prompt('Причина недоступності місця (наприклад: "Зламане крісло"):') || '';
        if (desc === null) return; // User cancelled
    }
    
    try {
        await api.toggleSeatAvailability(props.hallId!, seat.id, isAvail, desc);
        fetchSeats();
    } catch (e: any) {
        alert(e.message);
    }
};

const getRowSeats = (row: number) => {
    return seats.value.filter(s => s.row === row).sort((a,b) => a.seatNumber - b.seatNumber);
};

</script>

<template>
<div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div class="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl relative">
        <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#1a1a1a]/95 backdrop-blur border-b border-white/5">
            <h2 class="text-xl font-bold m-0 text-cinema-text">Перегляд залу: {{ hall?.name }}</h2>
            <button class="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-0 transition-colors cursor-pointer" @click="emit('close')">✕</button>
        </div>
        
        <div class="p-6">
            <div v-if="!hall" class="text-white/40 text-center py-6">Завантаження...</div>
            <div v-else class="flex flex-col gap-3">
                <div class="flex items-center gap-6 mb-6 justify-center text-sm">
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 bg-green-500/10 border border-green-500/30 rounded" />
                    <span class="text-white/60">Доступне</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-5 h-5 bg-red-500/20 border border-red-500/50 rounded flex items-center justify-center text-[10px] text-red-500">✕</div>
                    <span class="text-white/60">Недоступне</span>
                  </div>
                </div>

                <div class="flex flex-col items-center gap-2">
                  <div v-for="rowNum in hall.rows" :key="rowNum" class="flex items-center gap-1">
                    <span class="w-6 text-right text-[11px] text-white/30 mr-1 tabular-nums">{{ rowNum }}</span>
                    <button
                      v-for="seat in getRowSeats(rowNum)"
                      :key="seat.id"
                      type="button"
                      class="w-7 h-7 rounded flex items-center justify-center transition-all duration-150 cursor-pointer text-xs border"
                      :class="seat.isAvailable ? 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20 text-transparent' : 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30 text-red-500'"
                      :title="seat.isAvailable ? `Ряд ${rowNum}, Місце ${seat.seatNumber}` : `Ряд ${rowNum}, Місце ${seat.seatNumber} — Недоступне (${seat.unavailableReason || 'Немає причини'})`"
                      @click="toggleSeat(seat)"
                    >
                      <span v-if="!seat.isAvailable" class="text-[10px] leading-none">✕</span>
                    </button>
                    <span class="w-6 text-left text-[11px] text-white/30 ml-1 tabular-nums">{{ rowNum }}</span>
                  </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

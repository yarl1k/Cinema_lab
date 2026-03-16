<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/services/apiQueries';
import type { Movie } from '@/types/types';
import BookingSeatMap from '@/components/booking/BookingSeatMap.vue';
import BookingSidebar from '@/components/booking/BookingSidebar.vue';
import BookingCheckout from '@/components/booking/BookingCheckout.vue';
import BookingSuccess from '@/components/booking/BookingSuccess.vue';
import type { SeatData, SelectedSeat } from '@/components/booking/BookingSeatMap.vue';


const PRICE_GOOD = 220;
const PRICE_VIP = 340;


const route = useRoute();
const sessionId = Number(route.params.sessionId);

const step = ref(1);
const isLoading = ref(true);
const isProcessing = ref(false);


const movie = ref<Movie | null>(null);
const hallName = ref('');
const hallRows = ref(0);
const hallSeatsPerRow = ref(0);
const startTime = ref('');


const allSeats = ref<SeatData[]>([]);
const selectedSeats = ref<SelectedSeat[]>([]);
const vipRowStart = ref(999);


const checkoutForm = ref({
  name: '', phone: '', email: '',
  termsAcceptedFirst: false, termsAcceptedSecond: false, paymentMethod: 'card',
});


const orderNumber = ref('');
const purchasedTickets = ref<Array<{ row: number; seatNumber: number; price: number }>>([]);


const steps = [
  { id: 1, label: 'Місця' },
  { id: 2, label: 'Оплата' },
  { id: 3, label: 'Замовлення' },
];


onMounted(async () => {
  try {
    const data = await api.getSessionSeats(sessionId);
    movie.value = data.session.movie;
    hallName.value = data.session.hall.name;
    hallRows.value = data.session.hall.rows;
    hallSeatsPerRow.value = data.session.hall.seatsPerRow;
    startTime.value = data.session.startTime;
    allSeats.value = data.seats;

    // Last 2 rows are VIP
    vipRowStart.value = Math.max(1, hallRows.value - 1);
  } catch (err) {
    console.error('Failed to load session:', err);
  } finally {
    isLoading.value = false;
  }
});

onBeforeUnmount(async () => {
  for (const seat of selectedSeats.value) {
    if (seat.lockTicketId) {
      try { await api.cancelLock(seat.lockTicketId); } catch {}
    }
  }
});

const handleToggleSeat = async (seat: SeatData) => {
  const existing = selectedSeats.value.find(s => s.seatId === seat.seatId);
  if (existing) {
    if (existing.lockTicketId) {
      try { await api.cancelLock(existing.lockTicketId); } catch {}
    }
    selectedSeats.value = selectedSeats.value.filter(s => s.seatId !== seat.seatId);
    const localSeat = allSeats.value.find(s => s.seatId === seat.seatId);
    if (localSeat) localSeat.status = 'FREE';
  } else {
    const price = seat.row >= vipRowStart.value ? PRICE_VIP : PRICE_GOOD;
    try {
      const lockResult = await api.lockSeat(sessionId, seat.seatId);
      selectedSeats.value.push({
        ...seat,
        price,
        lockTicketId: lockResult.id,
      });
      // Mark locked locally
      const localSeat = allSeats.value.find(s => s.seatId === seat.seatId);
      if (localSeat) localSeat.status = 'LOCKED';
    } catch (err) {
      console.error('Failed to lock seat:', err);
      alert('Не вдалося забронювати місце. Можливо, воно вже зайняте.');
    }
  }
};

const handleRemoveSeat = (seat: SelectedSeat) => {
  handleToggleSeat(seat as SeatData);
};

const handleContinue = async () => {
  if (step.value === 1) {
    step.value = 2;
  } else if (step.value === 2) {
    if (!checkoutForm.value.termsAcceptedFirst || !checkoutForm.value.termsAcceptedSecond) {
      alert('Будь ласка, прийміть умови');
      return;
    }
    isProcessing.value = true;
    try {
      const ticketIds = selectedSeats.value.map(s => s.lockTicketId!).filter(Boolean);
      const result = await api.purchaseTickets(
        ticketIds,
        checkoutForm.value.name,
        checkoutForm.value.phone,
        checkoutForm.value.email,
      );
      orderNumber.value = result.orderNumber;
      purchasedTickets.value = selectedSeats.value.map(s => ({
        row: s.row, seatNumber: s.seatNumber, price: s.price,
      }));
      step.value = 3;
    } catch (err) {
      console.error('Purchase failed:', err);
      alert('Помилка покупки. Спробуйте ще раз.');
    } finally {
      isProcessing.value = false;
    }
  }
};

const handleFormUpdate = (form: typeof checkoutForm.value) => {
  checkoutForm.value = form;
};

const formattedDate = () => {
  if (!startTime.value) return '';
  return new Date(startTime.value).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });
};

const formattedTime = () => {
  if (!startTime.value) return '';
  return new Date(startTime.value).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="min-h-screen bg-background">
    <div v-if="isLoading" class="flex items-center justify-center min-h-[60vh]">
      <span class="text-white/40 text-lg">Завантаження сеансу...</span>
    </div>

    <div v-else class="max-w-[1200px] mx-auto px-6 py-6">
      <!-- ── Progress Bar ──────────────────────────────────────── -->
      <nav class="flex items-center gap-1 mb-8" aria-label="Кроки замовлення">
        <template v-for="(s, idx) in steps" :key="s.id">
          <button
            type="button"
            :class="[
              'px-4 py-2 rounded-full text-sm font-semibold border-0 transition-all cursor-pointer',
              step >= s.id
                ? 'bg-primary text-cinema-text'
                : 'bg-white/5 text-white/40'
            ]"
            :disabled="step < s.id"
            @click="step > s.id && s.id < 3 ? step = s.id : null"
          >
            {{ s.label }}
          </button>
          <div v-if="idx < steps.length - 1" class="w-8 h-[2px] bg-white/10" />
        </template>
      </nav>

      <div v-if="step < 3" class="flex gap-5 items-start mb-8">
        <img
          :src="movie?.posterUrl || 'https://placehold.co/80x120/1a1a1a/d33131?text=P'"
          :alt="movie?.title"
          class="w-[80px] h-[120px] object-cover rounded-lg shrink-0"
        />
        <div class="flex flex-col gap-2">
          <h1 class="text-xl font-bold text-cinema-text m-0">{{ movie?.title }}</h1>
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-if="movie?.ageRestriction"
              class="px-2 py-0.5 rounded text-xs font-bold border border-white/20 text-white/60"
            >{{ movie.ageRestriction }}</span>
            <span class="px-2 py-0.5 rounded text-xs font-medium border border-white/20 text-white/60">2D</span>
          </div>
          <div class="flex items-center gap-4 text-sm text-white/50">
            <span>📍 {{ hallName }}</span>
            <span>📅 {{ formattedDate() }}</span>
            <span>🕐 {{ formattedTime() }}</span>
          </div>
        </div>
      </div>

      <!-- Steps 1 & 2: main + sidebar -->
      <div v-if="step < 3" class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <!-- Left: seat map or checkout -->
        <div class="bg-[#1e1e1e] border border-white/10 rounded-xl p-6">
          <BookingSeatMap
            v-if="step === 1"
            :seats="allSeats"
            :total-rows="hallRows"
            :seats-per-row="hallSeatsPerRow"
            :selected-seats="selectedSeats"
            :vip-row-start="vipRowStart"
            @toggle="handleToggleSeat"
          />
          <BookingCheckout
            v-else-if="step === 2"
            @update:form="handleFormUpdate"
          />
        </div>

        <BookingSidebar
          :selected-seats="selectedSeats"
          :step="step"
          :is-processing="isProcessing"
          @remove-seat="handleRemoveSeat"
          @continue="handleContinue"
        />
      </div>

      <!-- Step 3: Success -->
      <BookingSuccess
        v-if="step === 3"
        :order-number="orderNumber"
        :movie="movie"
        :hall-name="hallName"
        :start-time="startTime"
        :tickets="purchasedTickets"
      />
    </div>
  </div>
</template>

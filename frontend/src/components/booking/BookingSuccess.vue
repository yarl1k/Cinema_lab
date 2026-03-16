<template>
  <div class="flex flex-col items-center gap-8 py-10">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-cinema-text mb-2">Ви успішно придбали квитки на фільм!</h1>
      <p class="text-white/50 text-base">Дякуємо за ваше замовлення. Деталі незабаром будуть надіслані Вам на пошту</p>
    </div>

    <div class="w-full max-w-[700px] bg-[#1e1e1e] border border-white/10 rounded-2xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-4 border-b border-white/10">
        <h2 class="text-cinema-text font-bold text-lg m-0">Деталі замовлення</h2>
        <div class="flex items-center gap-2">
          <span class="text-white/50 text-sm">Номер:</span>
          <span class="bg-accent/15 text-accent font-bold px-3 py-1 rounded-lg text-sm">{{ orderNumber }}</span>
        </div>
      </div>

      <!-- Movie + Details grid -->
      <div class="flex gap-6 p-6">
        <img
          :src="movie?.posterUrl || 'https://placehold.co/150x220/1a1a1a/d33131?text=Poster'"
          :alt="movie?.title"
          class="w-[140px] h-[200px] object-cover rounded-lg shrink-0"
        />

        <!-- Details -->
        <div class="flex flex-col gap-3 flex-1">
          <p class="text-white/50 text-xs m-0">Ви йдете на фільм</p>
          <h3 class="text-cinema-text font-bold text-xl m-0">{{ movie?.title }}</h3>

          <div class="grid grid-cols-2 gap-x-8 gap-y-3 mt-2">
            <div>
              <p class="text-white/40 text-xs m-0 mb-0.5">Дата</p>
              <p class="text-cinema-text text-sm font-medium m-0">{{ formattedDate }}</p>
            </div>
            <div>
              <p class="text-white/40 text-xs m-0 mb-0.5">Час</p>
              <p class="text-cinema-text text-sm font-medium m-0">{{ formattedTime }}</p>
            </div>
            <div>
              <p class="text-white/40 text-xs m-0 mb-0.5">Зал</p>
              <p class="text-cinema-text text-sm font-medium m-0">{{ hallName }}</p>
            </div>
            <div>
              <p class="text-white/40 text-xs m-0 mb-0.5">Ряд, місце</p>
              <p class="text-cinema-text text-sm font-medium m-0">{{ seatsLabel }}</p>
            </div>
            <div>
              <p class="text-white/40 text-xs m-0 mb-0.5">Кількість квитків</p>
              <p class="text-cinema-text text-sm font-medium m-0">{{ tickets.length }}</p>
            </div>
            <div>
              <p class="text-white/40 text-xs m-0 mb-0.5">Сума</p>
              <p class="text-cinema-text text-sm font-bold m-0">{{ totalPrice }} грн</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF Download -->
    <div class="w-full max-w-[700px] bg-[#1e1e1e] border border-white/10 rounded-2xl p-6">
      <h3 class="text-cinema-text font-bold text-base m-0 mb-2">Квитки у форматі PDF</h3>
      <p class="text-white/40 text-sm m-0 mb-4">
        Завантажте та роздрукуйте квитки або збережіть їх на своєму пристрої для швидкого доступу.
        Копії електронних квитків Ви також отримаєте на свій e-mail.
      </p>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm
               bg-primary text-cinema-text border-0 cursor-pointer transition-colors
               hover:bg-secondary
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Завантажити PDF-квитки
      </button>
    </div>

    <!-- Help section -->
    <div class="w-full max-w-[700px] bg-[#1e1e1e] border border-white/10 rounded-2xl p-6">
      <h3 class="text-cinema-text font-bold text-base m-0 mb-2">Потрібна допомога?</h3>
      <p class="text-white/40 text-sm m-0 mb-4">
        Якщо у вас виникли запитання, будь ласка, відвідайте наш розділ "Допомога".
        Щоб повернути квитки, скористайтесь відповідним посиланням.
      </p>
      <div class="flex gap-3">
        <button
          type="button"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold border-2
                 border-primary text-primary bg-transparent cursor-pointer
                 transition-colors hover:bg-primary/10"
        >
          Допомога
        </button>
        <button
          type="button"
          class="px-5 py-2.5 rounded-lg text-sm font-semibold border-2
                 border-primary text-primary bg-transparent cursor-pointer
                 transition-colors hover:bg-primary/10"
        >
          Повернути квитки
        </button>
      </div>
    </div>

    <router-link
      to="/"
      class="text-white/40 hover:text-cinema-text text-sm no-underline transition-colors"
    >
      ← Повернутись на головну
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Movie } from '@/types/types';

const props = defineProps<{
  orderNumber: string;
  movie: Movie | null;
  hallName: string;
  startTime: string;
  tickets: Array<{ row: number; seatNumber: number; price: number }>;
}>();

const formattedDate = computed(() => {
  if (!props.startTime) return '';
  const d = new Date(props.startTime);
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
});

const formattedTime = computed(() => {
  if (!props.startTime) return '';
  const d = new Date(props.startTime);
  return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
});

const seatsLabel = computed(() =>
  props.tickets.map(t => `Ряд ${t.row}, Місце ${t.seatNumber}`).join('; ')
);

const totalPrice = computed(() =>
  props.tickets.reduce((s, t) => s + t.price, 0)
);
</script>

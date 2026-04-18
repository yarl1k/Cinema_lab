<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authClient } from '@/lib/auth-client';
import { api } from '@/services/apiQueries';
import { downloadTicketPDF } from '@/utils/pdf';
import { useActiveRole } from '@/composables/useActiveRole';
import type { Ticket } from '@/types/types';

const router = useRouter();
const session = authClient.useSession();
const { actualRole } = useActiveRole();

const getStaticRoleLabel = (role?: string | null) => {
  if (role === 'superadmin') return 'Суперадмін';
  if (role === 'admin') return 'Адміністратор';
  if (role === 'manager') return 'Менеджер';
  return 'Користувач';
};

const tickets = ref<Ticket[]>([]);
const isLoadingTickets = ref(true);

const groupedOrders = computed(() => {
  const map = new Map<string, any>();
  for (const t of tickets.value) {
    const orderNumberPart = t.ticketNumber ? t.ticketNumber.split('-')[0] : 'Незавідомо';
    const orderNumber: string = orderNumberPart || 'Незавідомо';
    if (!map.has(orderNumber)) {
      map.set(orderNumber, {
        orderNumber,
        createdAt: (t as any).createdAt || t.Sessions?.startTime || new Date().toISOString(),
        movieTitle: t.Sessions?.Movies?.title || 'Без назви',
        posterUrl: t.Sessions?.Movies?.posterUrl || 'https://placehold.co/60x90/1a1a1a/d33131?text=P',
        startTime: t.Sessions?.startTime,
        hallName: t.Sessions?.Halls?.name || 'Зал',
        totalPrice: 0,
        tickets: []
      });
    }
    const o = map.get(orderNumber)!;
    o.tickets.push(t);
    o.totalPrice += Number(t.price);
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

const openOrders = ref(new Set<string>());
const toggleOrder = (orderNumber: string) => {
  const next = new Set(openOrders.value);
  if (next.has(orderNumber)) next.delete(orderNumber);
  else next.add(orderNumber);
  openOrders.value = next;
};

// Change password
const currentPassword = ref('');
const newPassword = ref('');
const pwError = ref('');
const pwSuccess = ref('');
const pwLoading = ref(false);

onMounted(async () => {
  try {
    tickets.value = await api.getMyTickets();
  } catch {
    // No tickets or not authorized
  } finally {
    isLoadingTickets.value = false;
  }
});

const handleChangePassword = async () => {
  pwError.value = '';
  pwSuccess.value = '';

  if (newPassword.value.length < 8) {
    pwError.value = 'Мінімум 8 символів';
    return;
  }

  pwLoading.value = true;
  const { error } = await authClient.changePassword({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
    revokeOtherSessions: true,
  });
  pwLoading.value = false;

  if (error) {
    pwError.value = error.message || 'Помилка зміни паролю';
    return;
  }

  pwSuccess.value = 'Пароль успішно змінено';
  currentPassword.value = '';
  newPassword.value = '';
};

const handleSignOut = async () => {
  await authClient.signOut();
  router.push('/');
};

const formatDate = (d: string | null | undefined) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (d: string | null | undefined) => {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
};

const handleDownloadOrderPdf = async (order: any) => {
  if (!session.value?.data?.user) return;
  const mappedTickets = order.tickets.map((t: any) => ({
    row: t.Seats?.row,
    seatNumber: t.Seats?.seatNumber,
    ticketNumber: t.ticketNumber
  }));
  await downloadTicketPDF(
      session.value.data.user.name,
      order.movieTitle,
      order.startTime,
      order.hallName,
      mappedTickets,
      order.orderNumber
  );
};
</script>

<template>
  <div class="max-w-[800px] mx-auto px-5 py-8">
    <div v-if="session.isPending" class="text-white/40 text-center py-20">Завантаження...</div>

    <template v-else-if="session.data">
      <!-- Profile header -->
      <div class="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
        <div class="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
          {{ session.data.user.name?.charAt(0)?.toUpperCase() || '?' }}
        </div>
        <div class="flex-1">
          <h1 class="text-xl font-bold text-cinema-text m-0">{{ session.data.user.name }}</h1>
          <p class="text-white/40 text-sm m-0">{{ session.data.user.email }}</p>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-semibold border"
          :class="['superadmin', 'admin', 'manager'].includes(session.data.user.role || '')
            ? 'border-primary/40 text-primary bg-primary/10'
            : 'border-white/20 text-white/50 bg-white/5'">
          {{ getStaticRoleLabel(session.data.user.role) }}
        </span>
      </div>

      <!-- Tickets -->
      <section class="mb-8">
        <h2 class="text-lg font-bold text-cinema-text mb-4">🎟️ Мої квитки</h2>

        <div v-if="isLoadingTickets" class="text-white/40 text-sm">Завантаження...</div>

        <div v-else-if="tickets.length === 0" class="bg-[#111] border border-white/8 rounded-xl p-6 text-center">
          <p class="text-white/40 text-sm m-0">У вас поки немає квитків</p>
          <router-link to="/" class="text-primary hover:underline text-sm mt-2 inline-block">
            Переглянути афішу
          </router-link>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div v-for="order in groupedOrders" :key="order.orderNumber" class="bg-[#111] border border-white/8 rounded-xl overflow-hidden">
            <!-- Order Header (Accordion Toggle) -->
            <button 
              type="button" 
              class="w-full flex items-center gap-4 p-4 text-left border-0 bg-transparent hover:bg-white/5 transition-colors cursor-pointer"
              @click="toggleOrder(order.orderNumber)"
            >
              <img :src="order.posterUrl" :alt="order.movieTitle" class="w-[50px] h-[75px] object-cover rounded-lg shrink-0" />
              
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="bg-white/10 text-white/70 px-2 py-0.5 rounded text-[10px] font-mono leading-none tracking-wider">{{ order.orderNumber }}</span>
                  <span class="text-white/40 text-xs">{{ formatDate(order.createdAt) }} о {{ formatTime(order.createdAt) }}</span>
                </div>
                <p class="font-bold text-cinema-text m-0 truncate text-base">{{ order.movieTitle }}</p>
                <p class="text-white/40 text-xs m-0 mt-1">
                  {{ formatDate(order.startTime) }}, {{ formatTime(order.startTime) }} · {{ order.hallName }}
                </p>
              </div>

              <div class="text-right flex flex-col items-end gap-2 shrink-0">
                <span class="text-cinema-text font-bold">{{ order.totalPrice }} ₴</span>
                <svg 
                  class="w-5 h-5 text-white/40 transition-transform duration-200" 
                  :class="openOrders.has(order.orderNumber) ? 'rotate-180' : ''" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <!-- Order Content (Expanded) -->
            <div v-if="openOrders.has(order.orderNumber)" class="p-4 border-t border-white/5 bg-[#161616]">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-bold text-white/80 m-0">Квитки ({{ order.tickets.length }})</h4>
                <button 
                  type="button" 
                  @click="handleDownloadOrderPdf(order)" 
                  class="px-4 py-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold rounded cursor-pointer border-0 flex items-center gap-2"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Завантажити PDF
                </button>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="ticket in order.tickets" :key="ticket.id" class="bg-[#1e1e1e] border border-white/10 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p class="text-white/80 text-sm m-0 font-medium">Ряд {{ ticket.Seats?.row }}, Місце {{ ticket.Seats?.seatNumber }}</p>
                    <p class="text-white/40 text-xs m-0 mt-1 font-mono">{{ ticket.ticketNumber }}</p>
                  </div>
                  <span class="text-white/60 text-sm">{{ ticket.price }} ₴</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Change password -->
      <section class="mb-8">
        <h2 class="text-lg font-bold text-cinema-text mb-4">🔒 Змінити пароль</h2>
        <div class="bg-[#111] border border-white/8 rounded-xl p-5">
          <div v-if="pwError" class="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-2 mb-3">
            {{ pwError }}
          </div>
          <div v-if="pwSuccess" class="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-2 mb-3">
            {{ pwSuccess }}
          </div>
          <form @submit.prevent="handleChangePassword" class="flex flex-col gap-3">
            <input v-model="currentPassword" type="password" placeholder="Поточний пароль"
              class="profile-input" autocomplete="current-password" />
            <input v-model="newPassword" type="password" placeholder="Новий пароль (мін. 8 символів)"
              class="profile-input" autocomplete="new-password" />
            <button type="submit" :disabled="pwLoading" class="profile-btn">
              {{ pwLoading ? 'Збереження...' : 'Змінити пароль' }}
            </button>
          </form>
        </div>
      </section>

      <!-- Sign out -->
      <button type="button" @click="handleSignOut"
        class="w-full py-3 rounded-xl text-sm font-semibold bg-transparent border border-white/15 text-white/60
               cursor-pointer transition-all hover:border-primary/50 hover:text-primary">
        Вийти з акаунту
      </button>
    </template>
  </div>
</template>

<style scoped>
.profile-input {
  width: 100%; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px; font-size: 14px; background: #1e1e1e; color: var(--text);
  box-sizing: border-box; transition: border-color 0.2s; font-family: inherit;
}
.profile-input:focus { outline: none; border-color: var(--secondary); }
.profile-input::placeholder { color: rgba(255,255,255,0.25); }
.profile-btn {
  padding: 10px; border: 0; border-radius: 8px; font-size: 13px; font-weight: 600;
  background: var(--primary); color: var(--text); cursor: pointer; transition: opacity 0.2s;
  font-family: inherit;
}
.profile-btn:hover { opacity: 0.9; }
.profile-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

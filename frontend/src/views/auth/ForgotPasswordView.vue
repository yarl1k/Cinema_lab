<script setup lang="ts">
import { ref } from 'vue';
import { authClient } from '@/lib/auth-client';

const email = ref('');
const isLoading = ref(false);
const success = ref(false);
const error = ref('');

const handleSubmit = async () => {
  if (!email.value.trim()) return;
  isLoading.value = true;
  error.value = '';

  const { error: authError } = await authClient.requestPasswordReset({
    email: email.value.trim(),
    redirectTo: '/reset-password',
  });

  isLoading.value = false;
  if (authError) {
    error.value = authError.message || 'Помилка. Спробуйте ще раз.';
    return;
  }
  success.value = true;
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="auth-card">
      <div v-if="success" class="text-center py-4">
        <div class="text-4xl mb-4">📧</div>
        <h2 class="text-xl font-bold text-cinema-text mb-2">Лист надіслано</h2>
        <p class="text-white/50 text-sm mb-4">
          Перевірте <strong class="text-cinema-text">{{ email }}</strong> — ми надіслали посилання для скидання паролю.
        </p>
        <router-link to="/login" class="text-primary hover:underline text-sm font-medium">
          Повернутися до входу
        </router-link>
      </div>

      <template v-else>
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-cinema-text m-0">Забули пароль?</h1>
          <p class="text-white/40 text-sm mt-1">Введіть email для скидання паролю</p>
        </div>

        <div v-if="error" class="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-3 mb-4">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="forgot-email">Email</label>
            <input id="forgot-email" v-model="email" type="email" placeholder="email@example.com"
              class="auth-input" autocomplete="email" />
          </div>

          <button type="submit" :disabled="isLoading || !email.trim()" class="auth-btn">
            {{ isLoading ? 'Надсилання...' : 'Надіслати посилання' }}
          </button>
        </form>

        <p class="text-center text-white/40 text-sm mt-5 mb-0">
          <router-link to="/login" class="text-primary hover:underline font-medium">Повернутися до входу</router-link>
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%; max-width: 420px; background: #111;
  border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px;
}
.auth-input {
  width: 100%; padding: 12px 14px; border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px; font-size: 14px; background: #1e1e1e; color: var(--text);
  box-sizing: border-box; transition: border-color 0.2s; font-family: inherit;
}
.auth-input:focus { outline: none; border-color: var(--secondary); }
.auth-input::placeholder { color: rgba(255,255,255,0.25); }
.auth-btn {
  width: 100%; padding: 12px; border: 0; border-radius: 10px; font-size: 14px;
  font-weight: 600; background: var(--primary); color: var(--text); cursor: pointer;
  transition: opacity 0.2s; font-family: inherit;
}
.auth-btn:hover { opacity: 0.9; }
.auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

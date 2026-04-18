<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authClient } from '@/lib/auth-client';

const router = useRouter();
const route = useRoute();

const token = (route.query.token as string) || '';
const urlError = route.query.error as string;

const newPassword = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const error = ref(urlError === 'INVALID_TOKEN' ? 'Посилання недійсне або прострочене' : '');
const success = ref(false);
const touched = ref({ password: false, confirm: false });

const errors = computed(() => ({
  password: (() => {
    const p = newPassword.value;
    if (p.length < 8) return 'Мінімум 8 символів';
    if (!/[A-Z]/.test(p)) return 'Потрібна велика літера';
    if (!/[a-z]/.test(p)) return 'Потрібна мала літера';
    if (!/\d/.test(p)) return 'Потрібна цифра';
    return '';
  })(),
  confirm: confirmPassword.value !== newPassword.value ? 'Паролі не співпадають' : '',
}));

const isValid = computed(() => !errors.value.password && !errors.value.confirm && !!token);

const handleSubmit = async () => {
  touched.value = { password: true, confirm: true };
  if (!isValid.value) return;

  isLoading.value = true;
  error.value = '';

  const { error: authError } = await authClient.resetPassword({
    newPassword: newPassword.value,
    token,
  });

  isLoading.value = false;

  if (authError) {
    error.value = authError.message || 'Помилка скидання паролю';
    return;
  }

  success.value = true;
  setTimeout(() => router.push('/login'), 3000);
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="auth-card">
      <div v-if="success" class="text-center py-4">
        <div class="text-4xl mb-4">✅</div>
        <h2 class="text-xl font-bold text-cinema-text mb-2">Пароль змінено</h2>
        <p class="text-white/50 text-sm">Переадресація на сторінку входу...</p>
      </div>

      <div v-else-if="!token" class="text-center py-4">
        <div class="text-4xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-cinema-text mb-2">Недійсне посилання</h2>
        <p class="text-white/50 text-sm mb-4">Токен для скидання паролю відсутній.</p>
        <router-link to="/forgot-password" class="text-primary hover:underline text-sm font-medium">
          Запросити нове посилання
        </router-link>
      </div>

      <template v-else>
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-cinema-text m-0">Новий пароль</h1>
          <p class="text-white/40 text-sm mt-1">Встановіть новий пароль для акаунту</p>
        </div>

        <div v-if="error" class="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-3 mb-4">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="reset-password">Новий пароль</label>
            <input id="reset-password" v-model="newPassword" type="password" placeholder="••••••••"
              :class="['auth-input', touched.password && errors.password ? 'auth-input--error' : '']"
              autocomplete="new-password" @blur="touched.password = true" />
            <span v-if="touched.password && errors.password" class="text-primary text-xs">{{ errors.password }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="reset-confirm">Підтвердіть пароль</label>
            <input id="reset-confirm" v-model="confirmPassword" type="password" placeholder="••••••••"
              :class="['auth-input', touched.confirm && errors.confirm ? 'auth-input--error' : '']"
              autocomplete="new-password" @blur="touched.confirm = true" />
            <span v-if="touched.confirm && errors.confirm" class="text-primary text-xs">{{ errors.confirm }}</span>
          </div>

          <button type="submit" :disabled="isLoading" class="auth-btn">
            {{ isLoading ? 'Збереження...' : 'Зберегти пароль' }}
          </button>
        </form>
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
.auth-input--error { border-color: var(--primary) !important; }
.auth-btn {
  width: 100%; padding: 12px; border: 0; border-radius: 10px; font-size: 14px;
  font-weight: 600; background: var(--primary); color: var(--text); cursor: pointer;
  transition: opacity 0.2s; font-family: inherit;
}
.auth-btn:hover { opacity: 0.9; }
.auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

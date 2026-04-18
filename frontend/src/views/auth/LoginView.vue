<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authClient } from '@/lib/auth-client';

const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const touched = ref({ email: false, password: false });

const errors = computed(() => ({
  email: !emailRegex.test(email.value) ? 'Введіть коректний email' : '',
  password: password.value.length < 8 ? 'Мінімум 8 символів' : '',
}));

const isValid = computed(() => !errors.value.email && !errors.value.password);

const handleSubmit = async () => {
  touched.value = { email: true, password: true };
  if (!isValid.value) return;

  isLoading.value = true;
  error.value = '';

  const { error: authError } = await authClient.signIn.email({
    email: email.value.trim(),
    password: password.value,
  });

  isLoading.value = false;

  if (authError) {
    if (authError.status === 403) {
      error.value = 'Підтвердіть вашу email-адресу для входу';
    } else {
      error.value = authError.message || 'Невірний email або пароль';
    }
    return;
  }

  router.push('/');
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="auth-card">
      <div class="text-center mb-6">
        <h1 class="text-2xl font-bold text-cinema-text m-0">Вхід</h1>
        <p class="text-white/40 text-sm mt-1">Увійдіть до свого акаунту</p>
      </div>

      <div v-if="error" class="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-3 mb-4">
        {{ error }}
      </div>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="login-email">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            placeholder="email@example.com"
            :class="['auth-input', touched.email && errors.email ? 'auth-input--error' : '']"
            autocomplete="email"
            @blur="touched.email = true"
          />
          <span v-if="touched.email && errors.email" class="text-primary text-xs">{{ errors.email }}</span>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="login-password">Пароль</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            :class="['auth-input', touched.password && errors.password ? 'auth-input--error' : '']"
            autocomplete="current-password"
            @blur="touched.password = true"
          />
          <span v-if="touched.password && errors.password" class="text-primary text-xs">{{ errors.password }}</span>
        </div>

        <div class="flex justify-end">
          <router-link to="/forgot-password" class="text-primary text-xs hover:underline">
            Забули пароль?
          </router-link>
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="auth-btn"
        >
          {{ isLoading ? 'Вхід...' : 'Увійти' }}
        </button>
      </form>

      <p class="text-center text-white/40 text-sm mt-5 mb-0">
        Немає акаунту?
        <router-link to="/register" class="text-primary hover:underline font-medium">Зареєструватися</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 420px;
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 32px;
}
.auth-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  font-size: 14px;
  background: #1e1e1e;
  color: var(--text);
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}
.auth-input:focus { outline: none; border-color: var(--secondary); }
.auth-input::placeholder { color: rgba(255, 255, 255, 0.25); }
.auth-input--error { border-color: var(--primary) !important; }
.auth-btn {
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  background: var(--primary);
  color: var(--text);
  cursor: pointer;
  transition: opacity 0.2s;
  font-family: inherit;
}
.auth-btn:hover { opacity: 0.9; }
.auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

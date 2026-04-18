<script setup lang="ts">
import { ref, computed } from 'vue';
import { authClient } from '@/lib/auth-client';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const isLoading = ref(false);
const success = ref(false);

const touched = ref({ name: false, email: false, password: false, confirm: false });

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[a-zA-Zа-яА-ЯіІїЇєЄґҐ''\- ]{2,50}$/;

const errors = computed(() => ({
  name: !nameRegex.test(name.value.trim()) ? "Ім'я: 2-50 символів, тільки літери" : '',
  email: !emailRegex.test(email.value) ? 'Введіть коректний email' : '',
  password: getPasswordErrors(),
  confirm: confirmPassword.value !== password.value ? 'Паролі не співпадають' : '',
}));

function getPasswordErrors(): string {
  const p = password.value;
  if (p.length < 8) return 'Мінімум 8 символів';
  if (!/[A-Z]/.test(p)) return 'Потрібна велика літера';
  if (!/[a-z]/.test(p)) return 'Потрібна мала літера';
  if (!/\d/.test(p)) return 'Потрібна цифра';
  return '';
}

const passwordStrength = computed(() => {
  const p = password.value;
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (p.length >= 12) s++;
  return s;
});

const strengthLabel = computed(() => {
  const labels = ['', 'Слабкий', 'Слабкий', 'Середній', 'Сильний', 'Надійний'];
  return labels[passwordStrength.value] || '';
});

const strengthColor = computed(() => {
  const colors = ['', '#d33131', '#d33131', '#e6a519', '#4ade80', '#22c55e'];
  return colors[passwordStrength.value] || '';
});

const isValid = computed(() =>
  !errors.value.name && !errors.value.email && !errors.value.password && !errors.value.confirm
);

const handleSubmit = async () => {
  touched.value = { name: true, email: true, password: true, confirm: true };
  if (!isValid.value) return;

  isLoading.value = true;
  error.value = '';

  const { error: authError } = await authClient.signUp.email({
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value,
  });

  isLoading.value = false;

  if (authError) {
    error.value = authError.message || 'Помилка реєстрації';
    return;
  }

  success.value = true;
};
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-4">
    <div class="auth-card">
      <!-- Success state -->
      <div v-if="success" class="text-center py-4">
        <div class="text-4xl mb-4">✉️</div>
        <h2 class="text-xl font-bold text-cinema-text mb-2">Перевірте пошту</h2>
        <p class="text-white/50 text-sm mb-4">
          Ми надіслали посилання для підтвердження на <strong class="text-cinema-text">{{ email }}</strong>
        </p>
        <router-link to="/login" class="text-primary hover:underline text-sm font-medium">
          Перейти до входу
        </router-link>
      </div>

      <!-- Registration form -->
      <template v-else>
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-cinema-text m-0">Реєстрація</h1>
          <p class="text-white/40 text-sm mt-1">Створіть новий акаунт</p>
        </div>

        <div v-if="error" class="bg-primary/10 border border-primary/30 text-primary text-sm rounded-lg px-4 py-3 mb-4">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="reg-name">Ім'я <span class="text-primary">*</span></label>
            <input id="reg-name" v-model="name" type="text" placeholder="Ваше ім'я"
              :class="['auth-input', touched.name && errors.name ? 'auth-input--error' : '']"
              autocomplete="name" @blur="touched.name = true" />
            <span v-if="touched.name && errors.name" class="text-primary text-xs">{{ errors.name }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="reg-email">Email <span class="text-primary">*</span></label>
            <input id="reg-email" v-model="email" type="email" placeholder="email@example.com"
              :class="['auth-input', touched.email && errors.email ? 'auth-input--error' : '']"
              autocomplete="email" @blur="touched.email = true" />
            <span v-if="touched.email && errors.email" class="text-primary text-xs">{{ errors.email }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="reg-password">Пароль <span class="text-primary">*</span></label>
            <input id="reg-password" v-model="password" type="password" placeholder="••••••••"
              :class="['auth-input', touched.password && errors.password ? 'auth-input--error' : '']"
              autocomplete="new-password" @blur="touched.password = true" />
            <span v-if="touched.password && errors.password" class="text-primary text-xs">{{ errors.password }}</span>
            <!-- Strength bar -->
            <div v-if="password" class="flex items-center gap-2 mt-1">
              <div class="flex-1 h-1.5 bg-white/10 rounded overflow-hidden">
                <div class="h-full rounded transition-all duration-300"
                  :style="{ width: `${passwordStrength * 20}%`, background: strengthColor }" />
              </div>
              <span class="text-xs" :style="{ color: strengthColor }">{{ strengthLabel }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-white/50 text-xs" for="reg-confirm">Підтвердіть пароль <span class="text-primary">*</span></label>
            <input id="reg-confirm" v-model="confirmPassword" type="password" placeholder="••••••••"
              :class="['auth-input', touched.confirm && errors.confirm ? 'auth-input--error' : '']"
              autocomplete="new-password" @blur="touched.confirm = true" />
            <span v-if="touched.confirm && errors.confirm" class="text-primary text-xs">{{ errors.confirm }}</span>
          </div>

          <button type="submit" :disabled="isLoading" class="auth-btn">
            {{ isLoading ? 'Реєстрація...' : 'Зареєструватися' }}
          </button>
        </form>

        <p class="text-center text-white/40 text-sm mt-5 mb-0">
          Вже маєте акаунт?
          <router-link to="/login" class="text-primary hover:underline font-medium">Увійти</router-link>
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
.auth-input--error { border-color: var(--primary) !important; }
.auth-btn {
  width: 100%; padding: 12px; border: 0; border-radius: 10px; font-size: 14px;
  font-weight: 600; background: var(--primary); color: var(--text); cursor: pointer;
  transition: opacity 0.2s; font-family: inherit;
}
.auth-btn:hover { opacity: 0.9; }
.auth-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

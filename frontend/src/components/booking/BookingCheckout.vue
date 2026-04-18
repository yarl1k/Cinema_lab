<template>
  <div class="flex flex-col gap-8">
    <!-- Payment Methods -->
    <section>
      <h3 class="text-cinema-text font-semibold text-base mb-4">Оберіть спосіб оплати</h3>
      <div class="flex gap-3">
        <label
          v-for="method in paymentMethods"
          :key="method.id"
          :class="[
            'flex flex-col items-center gap-2 px-6 py-4 rounded-xl cursor-pointer border-2 transition-all',
            selectedMethod === method.id
              ? 'border-primary bg-primary/5'
              : 'border-white/10 bg-[#1e1e1e] hover:border-white/20'
          ]"
        >
          <input
            type="radio"
            name="payment"
            :value="method.id"
            v-model="selectedMethod"
            class="sr-only"
          />
          <span class="text-2xl" aria-hidden="true">{{ method.icon }}</span>
          <span class="text-cinema-text text-xs font-medium whitespace-nowrap">{{ method.label }}</span>
        </label>
      </div>
    </section>

    <!-- User Info -->
    <section>
      <h3 class="text-cinema-text font-semibold text-base mb-4">
        {{ isAuthenticated ? 'Дані для квитків' : 'Створити акаунт та отримати квитки' }}
      </h3>
      <div class="flex flex-col gap-4">
        <!-- Name -->
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-name">Ім'я <span class="text-primary">*</span></label>
          <input
            id="booking-name"
            v-model="form.name"
            type="text"
            placeholder="Ваше ім'я"
            :class="['checkout-input', touched.name && errors.name ? 'checkout-input--error' : '']"
            autocomplete="name"
            :disabled="isAuthenticated"
            @blur="touched.name = true"
          />
          <span v-if="touched.name && errors.name" class="text-primary text-xs mt-0.5">{{ errors.name }}</span>
        </div>
        <!-- Phone -->
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-phone">Номер мобільного <span class="text-primary">*</span></label>
          <input
            id="booking-phone"
            v-model="form.phone"
            type="tel"
            placeholder="+380XXXXXXXXX"
            :class="['checkout-input', touched.phone && errors.phone ? 'checkout-input--error' : '']"
            autocomplete="tel"
            @blur="touched.phone = true"
          />
          <span v-if="touched.phone && errors.phone" class="text-primary text-xs mt-0.5">{{ errors.phone }}</span>
        </div>
        <!-- Email -->
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-email">Email <span class="text-primary">*</span></label>
          <input
            id="booking-email"
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            :class="['checkout-input', touched.email && errors.email ? 'checkout-input--error' : '']"
            autocomplete="email"
            :disabled="isAuthenticated"
            @blur="touched.email = true"
          />
          <span v-if="touched.email && errors.email" class="text-primary text-xs mt-0.5">{{ errors.email }}</span>
        </div>
        <!-- Password (only for guests) -->
        <div v-if="!isAuthenticated" class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-password">
            Пароль для акаунту <span class="text-primary">*</span>
          </label>
          <input
            id="booking-password"
            v-model="form.password"
            type="password"
            placeholder="Мін. 8 символів, велика літера, цифра"
            :class="['checkout-input', touched.password && errors.password ? 'checkout-input--error' : '']"
            autocomplete="new-password"
            @blur="touched.password = true"
          />
          <span v-if="touched.password && errors.password" class="text-primary text-xs mt-0.5">{{ errors.password }}</span>
          <p class="text-white/30 text-xs m-0 mt-1">
            Акаунт буде створено автоматично. Ваші квитки з'являться у профілі.
          </p>
        </div>
      </div>
    </section>

    <!-- Terms -->
<section class="flex flex-col gap-3">
      <label class="flex flex-row gap-3 items-start cursor-pointer text-sm text-white/60">
        <input
          type="checkbox"
          v-model="termsAcceptedFirst"
          class="mt-0.5 accent-primary w-4 h-4"
        />
        <span>
          Я погоджуюсь з
          <a href="#" class="text-primary hover:underline">правилами кінотеатру</a>
          та підтверджую, що ознайомлений з
          <a href="#" class="text-primary hover:underline">віковими обмеженнями</a>
          на цей фільм.
        </span>
      </label>

      <label class="flex flex-row gap-3 items-start cursor-pointer text-sm text-white/60">
        <input
          type="checkbox"
          v-model="termsAcceptedSecond"
          class="mt-0.5 accent-primary w-4 h-4"
        />
        <span> 
          Ознайомлений, що на період воєнного стану при поверненні квитків мені будуть надіслані промокоди на наступний похід в кіно 
        </span>
      </label>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { authClient } from '@/lib/auth-client';

const props = defineProps<{
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
}>();

const emit = defineEmits<{
  'update:form': [form: { name: string; phone: string; email: string; password: string; termsAcceptedFirst: boolean; termsAcceptedSecond: boolean; paymentMethod: string }];
  'update:isFormValid': [valid: boolean];
}>();

const session = authClient.useSession();
const isAuthenticated = computed(() => !!session.value?.data);

const paymentMethods = [
  { id: 'card', icon: '', label: 'Платіжна картка' },
  { id: 'apple', icon: '', label: 'Apple Pay' },
  { id: 'google', icon: '', label: 'Google Pay' },
];

const selectedMethod = ref('card');
const termsAcceptedFirst = ref(false);
const termsAcceptedSecond = ref(false);
const form = ref({
  name: props.initialName || '',
  phone: props.initialPhone || '',
  email: props.initialEmail || '',
  password: '',
});

// Pre-fill from session if authenticated
onMounted(() => {
  if (session.value?.data) {
    form.value.name = session.value.data.user.name || form.value.name;
    form.value.email = session.value.data.user.email || form.value.email;
  }
});

const touched = reactive({ name: false, phone: false, email: false, password: false });

const phoneRegex = /^\+380\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordError = (): string => {
  if (isAuthenticated.value) return ''; // no password needed for logged-in users
  const p = form.value.password;
  if (p.length < 8) return 'Мінімум 8 символів';
  if (!/[A-Z]/.test(p)) return 'Потрібна велика літера';
  if (!/[a-z]/.test(p)) return 'Потрібна мала літера';
  if (!/\d/.test(p)) return 'Потрібна цифра';
  return '';
};

const errors = computed(() => ({
  name: form.value.name.trim().length < 2 ? "Введіть ім'я (мінімум 2 символи)" : '',
  phone: !phoneRegex.test(form.value.phone) ? 'Формат: +380XXXXXXXXX' : '',
  email: !emailRegex.test(form.value.email) ? 'Введіть коректний email' : '',
  password: getPasswordError(),
}));

const isFormValid = computed(() =>
  !errors.value.name &&
  !errors.value.phone &&
  !errors.value.email &&
  !errors.value.password &&
  termsAcceptedFirst.value &&
  termsAcceptedSecond.value
);

watch([form, termsAcceptedFirst, termsAcceptedSecond, selectedMethod], () => {
  emit('update:form', {
    ...form.value,
    termsAcceptedFirst: termsAcceptedFirst.value,
    paymentMethod: selectedMethod.value,
    termsAcceptedSecond: termsAcceptedSecond.value,
  });
  emit('update:isFormValid', isFormValid.value);
}, { deep: true, immediate: true });
</script>

<style scoped>
.checkout-input {
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
.checkout-input:focus {
  outline: none;
  border-color: var(--secondary);
}
.checkout-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
.checkout-input--error {
  border-color: var(--primary) !important;
}
.checkout-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

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
      <h3 class="text-cinema-text font-semibold text-base mb-4">Куди надіслати квитки</h3>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-name">Ім'я</label>
          <input
            id="booking-name"
            v-model="form.name"
            type="text"
            placeholder="Ваше ім'я"
            class="checkout-input"
            autocomplete="name"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-phone">Номер мобільного</label>
          <input
            id="booking-phone"
            v-model="form.phone"
            type="tel"
            placeholder="+380 (__) ___-__-__"
            class="checkout-input"
            autocomplete="tel"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-white/50 text-xs" for="booking-email">Email</label>
          <input
            id="booking-email"
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            class="checkout-input"
            autocomplete="email"
          />
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
import { ref, watch } from 'vue';

const props = defineProps<{
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
}>();

const emit = defineEmits<{
  'update:form': [form: { name: string; phone: string; email: string; termsAcceptedFirst: boolean; termsAcceptedSecond: boolean; paymentMethod: string }];
}>();

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
});

watch([form, termsAcceptedFirst, termsAcceptedSecond, selectedMethod], () => {
  emit('update:form', {
    ...form.value,
    termsAcceptedFirst: termsAcceptedFirst.value,
    paymentMethod: selectedMethod.value,
    termsAcceptedSecond: termsAcceptedSecond.value,
  });
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
</style>

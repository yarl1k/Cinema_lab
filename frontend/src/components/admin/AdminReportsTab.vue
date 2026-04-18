<template>
  <div>
    <div class="mb-5">
      <h2 class="text-lg font-bold text-cinema-text m-0">Генерація звітів</h2>
      <p class="text-white/40 text-sm m-0">Автоматичне формування документів на основі даних системи</p>
    </div>

    <!-- Managerial Report Card -->
    <section class="report-card">
      <div class="flex items-start gap-4">
        <div class="report-icon" aria-hidden="true">📊</div>
        <div class="flex-1">
          <h3 class="text-base font-bold text-cinema-text m-0 mb-1">Управлінський звіт</h3>
          <p class="text-white/50 text-sm m-0 mb-4 leading-relaxed">
            Зведений документ із ключовими показниками діяльності кінотеатру:
            виручка від квитків, заповнюваність залів, стан складу буфету.
            Формат: <strong class="text-white/70">.docx</strong> (Microsoft Word).
          </p>

          <div class="flex flex-wrap gap-3 mb-5">
            <div class="stat-chip">
              <span class="text-white/40 text-xs">Включає</span>
              <span class="text-sm font-medium">Продаж квитків</span>
            </div>
            <div class="stat-chip">
              <span class="text-white/40 text-xs">Включає</span>
              <span class="text-sm font-medium">Заповнюваність</span>
            </div>
            <div class="stat-chip">
              <span class="text-white/40 text-xs">Включає</span>
              <span class="text-sm font-medium">Склад буфету</span>
            </div>
          </div>

          <button
            type="button"
            :disabled="isGenerating"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold
                   border-0 cursor-pointer transition-all
                   disabled:opacity-40 disabled:cursor-not-allowed"
            :class="isGenerating
              ? 'bg-blue-800 text-blue-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10'"
            @click="downloadReport"
          >
            <span v-if="isGenerating" class="animate-spin inline-block" aria-hidden="true">⏳</span>
            <span v-else aria-hidden="true">📄</span>
            {{ isGenerating ? 'Генерація...' : 'Згенерувати звіт (.docx)' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/services/apiQueries';

const isGenerating = ref(false);

const downloadReport = async () => {
  isGenerating.value = true;
  try {
    api.downloadManagerialReport();
  } catch (e) {
    alert((e as Error).message);
  } finally {
    // Small delay so the user sees the loading state
    setTimeout(() => { isGenerating.value = false; }, 1500);
  }
};
</script>

<style scoped>
.report-card {
  background: #111;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 24px;
  transition: border-color 0.2s;
}

.report-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
}

.report-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.12);
  font-size: 22px;
  flex-shrink: 0;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>

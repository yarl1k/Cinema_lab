<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <div>
        <h2 class="text-lg font-bold text-cinema-text m-0">Буфет — Складський облік</h2>
        <p class="text-white/40 text-sm m-0">{{ items.length }} найменувань товарів</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
               bg-emerald-600 text-white border-0 cursor-pointer transition-colors
               hover:bg-emerald-700
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
        @click="exportExcel"
      >
        <span aria-hidden="true">📥</span> Завантажити Excel
      </button>
    </div>

    <!-- Import Section -->
    <section
      class="bg-[#111] border border-dashed border-white/15 rounded-xl p-5 mb-6"
      aria-label="Імпорт інвентаризації з Excel"
    >
      <h3 class="text-accent text-base font-semibold mt-0 mb-3">Імпорт накладної (.xlsx)</h3>
      <p class="text-white/40 text-sm m-0 mb-4">
        Стовпці: <code class="text-white/60">Назва</code>, <code class="text-white/60">Категорія</code>,
        <code class="text-white/60">Кількість</code>, <code class="text-white/60">Ціна закупівлі</code>,
        <code class="text-white/60">Ціна продажу</code>
      </p>

      <div class="flex items-end gap-4">
        <div class="flex-1">
          <label
            for="buffet-file-input"
            class="upload-area"
            :class="{ 'upload-area--active': selectedFile }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              id="buffet-file-input"
              type="file"
              accept=".xlsx,.xls"
              class="sr-only"
              @change="handleFileSelect"
            />
            <span v-if="selectedFile" class="text-emerald-400 text-sm font-medium">
              📄 {{ selectedFile.name }}
            </span>
            <span v-else class="text-white/40 text-sm">
              Перетягніть файл сюди або <span class="text-accent underline cursor-pointer">оберіть</span>
            </span>
          </label>
        </div>

        <button
          type="button"
          :disabled="!selectedFile || isImporting"
          class="h-[44px] px-6 rounded-lg text-sm font-semibold border-0
                 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :class="isImporting
            ? 'bg-yellow-600 text-white'
            : 'bg-green-600 text-white hover:bg-green-700'"
          @click="importExcel"
        >
          {{ isImporting ? 'Імпорт...' : 'Імпортувати' }}
        </button>

        <button
          v-if="selectedFile"
          type="button"
          class="h-[44px] px-4 rounded-lg text-sm font-semibold bg-transparent border border-white/20
                 text-white/60 cursor-pointer transition-colors hover:border-white/40 hover:text-white"
          @click="clearFile"
        >
          Скинути
        </button>
      </div>

      <!-- Import Results -->
      <Transition name="fade">
        <div v-if="importResult" class="mt-4 p-4 rounded-lg border" :class="importResultClass">
          <p class="text-sm font-semibold m-0 mb-2">{{ importResult.message }}</p>
          <div class="flex gap-6 text-sm">
            <span>✅ Створено: <strong>{{ importResult.data.created }}</strong></span>
            <span>🔄 Оновлено: <strong>{{ importResult.data.updated }}</strong></span>
            <span v-if="importResult.data.skipped">⏭ Пропущено: <strong>{{ importResult.data.skipped }}</strong></span>
          </div>
          <ul v-if="importResult.data.errors?.length" class="mt-2 pl-5 text-xs text-red-300/80">
            <li v-for="(err, idx) in importResult.data.errors" :key="idx">{{ err }}</li>
          </ul>
        </div>
      </Transition>
    </section>

    <!-- Inventory Table -->
    <AppAdminTable
      :columns="['ID', 'Назва', 'Категорія', 'На складі', 'Закупівля', 'Продаж']"
      caption="Інвентаризація буфету"
    >
      <tr v-if="items.length === 0">
        <td colspan="6" class="px-4 py-8 text-center text-white/30 text-sm">
          Товарів поки немає. Імпортуйте накладну Excel.
        </td>
      </tr>
      <tr
        v-for="item in items"
        :key="item.id"
        class="border-b border-white/5 transition-colors hover:bg-white/[0.025]"
      >
        <td class="px-4 py-3 text-white/40 text-sm tabular-nums">{{ item.id }}</td>
        <td class="px-4 py-3 font-semibold">{{ item.name }}</td>
        <td class="px-4 py-3 text-white/60">
          <span class="inline-block bg-[#222] px-2 py-0.5 rounded text-xs">{{ item.category }}</span>
        </td>
        <td class="px-4 py-3 tabular-nums" :class="item.stockQuantity === 0 ? 'text-red-400' : 'text-white/70'">
          {{ item.stockQuantity }} шт.
        </td>
        <td class="px-4 py-3 text-white/60 tabular-nums">{{ Number(item.purchasePrice).toFixed(2) }} ₴</td>
        <td class="px-4 py-3 text-white/60 tabular-nums">{{ Number(item.sellingPrice).toFixed(2) }} ₴</td>
      </tr>
    </AppAdminTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/apiQueries';
import type { BuffetItem } from '@/types/types';
import AppAdminTable from '@/components/AppAdminTable.vue';

const items = ref<BuffetItem[]>([]);
const selectedFile = ref<File | null>(null);
const isImporting = ref(false);
const isDragging = ref(false);
const importResult = ref<{ message: string; data: { created: number; updated: number; skipped: number; errors: string[] } } | null>(null);

const importResultClass = ref('border-emerald-500/30 bg-emerald-500/5');

const loadItems = async () => {
  try {
    items.value = await api.getBuffetItems();
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadItems);

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files?.[0]) {
    selectedFile.value = input.files[0];
    importResult.value = null;
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const file = e.dataTransfer?.files[0];
  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
    selectedFile.value = file;
    importResult.value = null;
  }
};

const clearFile = () => {
  selectedFile.value = null;
  importResult.value = null;
  const input = document.getElementById('buffet-file-input') as HTMLInputElement;
  if (input) input.value = '';
};

const importExcel = async () => {
  if (!selectedFile.value) return;
  isImporting.value = true;
  importResult.value = null;

  try {
    const result = await api.importBuffetExcel(selectedFile.value);
    importResult.value = result;
    importResultClass.value = result.data.skipped > 0
      ? 'border-yellow-500/30 bg-yellow-500/5'
      : 'border-emerald-500/30 bg-emerald-500/5';
    await loadItems();
  } catch (e) {
    importResult.value = {
      message: (e as Error).message,
      data: { created: 0, updated: 0, skipped: 0, errors: [] },
    };
    importResultClass.value = 'border-red-500/30 bg-red-500/5';
  } finally {
    isImporting.value = false;
  }
};

const exportExcel = () => {
  api.exportBuffetExcel();
};
</script>

<style scoped>
.upload-area {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 10px 16px;
  border: 1.5px dashed rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  background: #0d0d0d;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.upload-area:hover,
.upload-area--active {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.02);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

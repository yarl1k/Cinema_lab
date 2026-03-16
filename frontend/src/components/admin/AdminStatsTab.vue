<template>
  <div>
    <div class="mb-5 flex justify-between items-end">
      <div>
        <h2 class="text-lg font-bold text-cinema-text m-0">Статистика</h2>
        <p class="text-white/40 text-sm m-0">Аналітика бази фільмів</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <section class="bg-[#111] border border-white/10 rounded-xl p-5" aria-label="Статистика фільмів за роками">
        <h3 class="text-cinema-text text-base font-semibold mt-0 mb-6">Кількість фільмів за роками</h3>
        <div class="h-[300px] flex items-center justify-center">
          <Bar v-if="!isLoading && yearChartData" :data="yearChartData" :options="chartOptions" />
          <div v-else-if="isLoading" class="text-white/40 text-sm">Завантаження...</div>
          <div v-else class="text-white/40 text-sm">Немає даних</div>
        </div>
      </section>

      <section class="bg-[#111] border border-white/10 rounded-xl p-5" aria-label="Статистика фільмів за жанрами">
        <h3 class="text-cinema-text text-base font-semibold mt-0 mb-6">Популярні жанри</h3>
        <div class="h-[300px] flex items-center justify-center">
          <Doughnut v-if="!isLoading && genreChartData" :data="genreChartData" :options="pieOptions" />
          <div v-else-if="isLoading" class="text-white/40 text-sm">Завантаження...</div>
          <div v-else class="text-white/40 text-sm">Немає даних</div>
        </div>
      </section>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/services/apiQueries';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const isLoading = ref(true);

const yearChartData = ref<any>(null);
const genreChartData = ref<any>(null);

const primaryColor = '#d33131'; 
const accentColor = '#e6a519'; 
const secondaryColor = '#c24400'; 
const backgroundHover = 'rgba(211, 49, 49, 0.7)';

const loadStats = async () => {
  try {
    const [yearData, genreData] = await Promise.all([
      api.getMoviesByYear(),
      api.getMoviesByGenre()
    ]);
    
    if (yearData && yearData.length > 0) {
      yearChartData.value = {
        labels: yearData.map((d: any) => d.year),
        datasets: [{
          label: 'Кількість',
          backgroundColor: primaryColor,
          hoverBackgroundColor: backgroundHover,
          borderRadius: 4,
          data: yearData.map((d: any) => d.count)
        }]
      };
    }

    if (genreData && genreData.length > 0) {
      const topGenres = genreData.slice(0, 6);
      
      genreChartData.value = {
        labels: topGenres.map((d: any) => d.genre),
        datasets: [{
          backgroundColor: [
            primaryColor,
            accentColor,
            secondaryColor,
            '#8f2222', 
            '#a87812', 
            '#4a1818'  
          ],
          borderColor: '#111',
          borderWidth: 2,
          data: topGenres.map((d: any) => d.count)
        }]
      };
    }
  } catch (err) {
    console.error('Failed to load chart data:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStats();
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { 
      backgroundColor: 'rgba(0,0,0,0.8)',
      titleColor: '#f1eeef',
      bodyColor: '#ccc',
      padding: 10,
      cornerRadius: 6,
      displayColors: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.4)', stepSize: 1 }
    },
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.6)' }
    }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.7)',
        font: { size: 13 },
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      bodyColor: '#f1eeef',
      padding: 10,
      cornerRadius: 6
    }
  },
  cutout: '65%'
};
</script>

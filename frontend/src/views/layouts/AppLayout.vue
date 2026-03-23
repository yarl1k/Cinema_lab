<template>
  <div class="min-h-screen flex flex-col">

    <Transition name="overlay-fade">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1998]"
        aria-hidden="true"
        @click="closeSidebar"
      />
    </Transition>

    <Transition name="sidebar-slide">
      <aside
        v-if="isSidebarOpen"
        id="sidebar-nav"
        class="fixed top-0 left-0 h-full w-[280px] z-[1999]
               bg-[#0d0d0d] border-r border-white/10
               flex flex-col shadow-[4px_0_30px_rgba(0,0,0,0.6)]"
        role="navigation"
        aria-label="Бічна навігація"
      >
        <!-- Sidebar header -->
        <div class="flex items-center justify-between px-5 h-[70px] border-b border-white/10 shrink-0">
          <router-link
            to="/"
            class="no-underline font-black text-[18px] px-3 py-1 rounded
                   bg-primary text-cinema-text uppercase tracking-widest
                   transition-colors hover:bg-secondary"
            @click="closeSidebar"
          >
            CinemaLab
          </router-link>
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-lg
                   text-cinema-text/60 hover:text-cinema-text hover:bg-white/8
                   border-0 bg-transparent cursor-pointer transition-colors text-xl"
            aria-label="Закрити меню"
            @click="closeSidebar"
          >
            ✕
          </button>
        </div>

        <!-- Nav links -->
        <nav class="flex-1 px-3 py-4 overflow-y-auto">
          <ul class="list-none m-0 p-0 flex flex-col gap-1">
            <li>
              <router-link
                to="/"
                class="sidebar-link"
                active-class="sidebar-link--active"
                @click="closeSidebar"
              >
                <span class="text-xl" aria-hidden="true"></span>
                Афіша
              </router-link>
            </li>
            <li>
              <router-link
                to="/admin"
                class="sidebar-link"
                active-class="sidebar-link--active"
                @click="closeSidebar"
              >
                <span class="text-xl" aria-hidden="true"></span>
                Адмін панель
              </router-link>
            </li>
          </ul>

          <div class="border-t border-white/8 my-4" />

          <p class="text-[11px] uppercase tracking-widest text-white/25 px-3 mb-2">Система</p>
          <ul class="list-none m-0 p-0 flex flex-col gap-1">
            <li>
              <button
                type="button"
                class="sidebar-link w-full text-left"
                @click="closeSidebar"
              >
                <span class="text-xl" aria-hidden="true"></span>
                Увійти
              </button>
            </li>
          </ul>
        </nav>

        <div class="px-5 py-4 border-t border-white/8 shrink-0">
          <p class="text-[11px] text-white/25 m-0 text-center">
            © 2026 Cinema Information System
          </p>
        </div>
      </aside>
    </Transition>

    <header
      class="sticky top-0 z-[1000] flex items-center justify-between
             px-6 h-[70px] bg-background/95 border-b border-white/8
             backdrop-blur-md shrink-0"
      role="banner"
    >
      <div class="flex items-center gap-4">
        <!-- Burger button -->
        <button
          type="button"
          class="w-9 h-9 flex items-center justify-center rounded-lg
                 text-cinema-text/70 bg-transparent border-0 text-xl cursor-pointer
                 hover:text-cinema-text hover:bg-white/5 transition-colors
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          :aria-label="isSidebarOpen ? 'Закрити меню навігації' : 'Відкрити меню навігації'"
          :aria-expanded="isSidebarOpen"
          aria-controls="sidebar-nav"
          @click="toggleSidebar"
        >
          <span
            class="transition-transform duration-300 select-none"
            :style="isSidebarOpen ? 'transform: rotate(90deg)' : ''"
          >☰</span>
        </button>

        <router-link
          to="/"
          class="no-underline font-black text-[20px] px-4 py-1.5 rounded
                 bg-primary text-cinema-text uppercase tracking-widest
                 transition-colors hover:bg-secondary
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="CinemaLab — головна сторінка"
        >
          CinemaLab
        </router-link>
      </div>

      <!-- Right: Login button -->
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium
                 bg-transparent border border-white/20 text-cinema-text
                 transition-all cursor-pointer
                 hover:border-cinema-text/60 hover:bg-white/5
                 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="Увійти до акаунту"
        >
          Увійти
        </button>
      </div>
    </header>

    <main id="main-content" class="flex-1" tabindex="-1">
      <router-view />
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const isSidebarOpen = ref(false);

const toggleSidebar = () => { isSidebarOpen.value = !isSidebarOpen.value; };
const closeSidebar  = () => { isSidebarOpen.value = false; };
</script>

<style scoped>

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(241, 238, 239, 0.65);
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1eeef;
}

.sidebar-link--active {
  background: rgba(211, 49, 49, 0.12);
  color: #f1eeef;
  font-weight: 600;
}


.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}


.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}
</style>

<template>
  <div>
    <header class="topbar">
      <div class="topbar-left">
        <button class="menu-btn">☰</button>
        <router-link to="/" class="logo">CinemaLab</router-link>
      </div>
      <div class="topbar-right">
        <button class="login-btn">Увійти</button>
      </div>
    </header>

    <main>
      <router-view /> 
    </main>

    <footer class="footer">
      <p>&copy; 2026 Cinema Information System Project. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Логіка автентифікації або глобального стану буде тут
</script>


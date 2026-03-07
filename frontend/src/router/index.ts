import { createRouter, createWebHistory } from 'vue-router'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import("../views/movies/MoviesView.vue")
    },
    {
      path: '/movies/:id', // Динамічний параметр id
      name: 'movie-details',
      component: () => import("../views/movies/MoviesDetailsView.vue")
    }
  ]
})

export default router
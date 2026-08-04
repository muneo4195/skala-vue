import { createRouter, createWebHistory } from 'vue-router'

// 라우터 안에 routes가 있음. 각각은 routes이다. 그 안에 path, name, component, redirect 등등이 있다.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 뒤로가기/앞으로가기일 때는 원래 스크롤 위치로, 새 페이지 이동일 때는 맨 위로
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/WeatherHomeView.vue'),
    },
    {
      path: '/cities',
      name: 'all-cities',
      component: () => import('../views/WeatherAllCitiesView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/WeatherAboutView.vue'),
    },
    {
      path: '/weather/:cityId',
      name: 'weather-detail',
      component: () => import('../views/WeatherDetailView.vue'),
    },
    {
      // Catch-all Route: 정의되지 않은 경로 접근 시 404 처리
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

export default router

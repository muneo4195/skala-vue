<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWeatherStore } from '../stores/weatherStore'
import { useFavoriteStore } from '../stores/favoriteStore'
import { getWeatherTheme } from '../utils/weatherTheme'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']

const weatherStore = useWeatherStore()
const favoriteStore = useFavoriteStore()

// 즐겨찾기 도시의 날씨가 바뀌면 시계 색도 함께 바뀌도록 배경과 같은 테마를 사용
const heroCity = computed(() => weatherStore.getCityById(favoriteStore.favoriteCityId))
const accentColor = computed(() => getWeatherTheme(heroCity.value?.status).accent)

const pad = (num, digits = 2) => String(num).padStart(digits, '0')

const now = ref(new Date())
let timerId = null

onMounted(() => {
  timerId = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timerId)
})

const timeText = computed(() => {
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

const dateText = computed(() => {
  const d = now.value
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${WEEK[d.getDay()]}`
})
</script>

<template>
  <div class="clock-card" :style="{ color: accentColor }">
    <p class="clock-card__time" :style="{ WebkitTextStroke: `3px ${accentColor}` }">{{ timeText }}</p>
    <p class="clock-card__date">{{ dateText }}</p>
  </div>
</template>

<style scoped>
.clock-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 24px;
  padding: clamp(16px, 4vw, 28px);
  background: transparent;
  font-family: 'Share Tech Mono', monospace;
  text-align: center;
  transition: color 0.6s ease;
}

.clock-card__time {
  margin: 0;
  padding: 10px 0;
  font-size: clamp(2rem, 8vw, 3.4rem);
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}

.clock-card__date {
  margin: 0;
  font-size: clamp(1rem, 3vw, 2rem);
  letter-spacing: 0.05em;
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}
</style>
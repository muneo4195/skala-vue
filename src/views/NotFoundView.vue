<script setup>
import { useRouter } from 'vue-router'
import { getWeatherTheme } from '../utils/weatherTheme'
import { ICONS } from '../utils/icons'

const router = useRouter()
const sunIcon = getWeatherTheme('맑음').icon

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="not-found">
    <div class="not-found__icons">
      <span v-html="sunIcon"></span><span v-html="ICONS.question"></span>
    </div>
    <h2>페이지를 찾을 수 없습니다.</h2>
    <p>요청하신 주소가 존재하지 않거나, 아직 개발되지 않았습니다.</p>
    <button @click="goHome">날씨 메인으로 이동</button>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 48px 16px;
}

.not-found__icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 2.5rem;
  margin-bottom: 16px;
  color: #ffb37b;
}

.not-found__icons :deep(svg) {
  width: 1em;
  height: 1em;
}

h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

p {
  margin: 0 0 20px;
  color: #666;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #2b3a55;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

button:hover {
  background: #1f2b41;
}
</style>

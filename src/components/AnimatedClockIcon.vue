<script setup>
import { ref, onMounted } from 'vue'

// CSS 애니메이션은 항상 0도에서 시작하므로, 마운트 시점의 실제 시:분:초만큼
// "이미 재생된 것처럼" 음수 animation-delay를 줘서 현재 시각 위치에서 바로
// 이어서 돌게 함. 그 다음부터는 setInterval 없이 CSS가 알아서 부드럽게 회전
const minuteDelay = ref('0s')
const hourDelay = ref('0s')

onMounted(() => {
  const now = new Date()
  const secondsIntoHour = now.getMinutes() * 60 + now.getSeconds()
  const secondsIntoHalfDay = (now.getHours() % 12) * 3600 + secondsIntoHour
  minuteDelay.value = `-${secondsIntoHour}s`
  hourDelay.value = `-${secondsIntoHalfDay}s`
})
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="animated-clock">
    <circle cx="8" cy="8" r="7.3" fill="none" stroke="currentColor" stroke-width="1" />
    <line
      class="animated-clock__hand animated-clock__hand--hour"
      x1="8"
      y1="8"
      x2="8"
      y2="4.7"
      :style="{ animationDelay: hourDelay }"
    />
    <line
      class="animated-clock__hand animated-clock__hand--minute"
      x1="8"
      y1="8"
      x2="8"
      y2="3.2"
      :style="{ animationDelay: minuteDelay }"
    />
    <circle cx="8" cy="8" r="0.7" fill="currentColor" />
  </svg>
</template>

<style scoped>
.animated-clock {
  width: 1em;
  height: 1em;
  display: block;
}

.animated-clock__hand {
  stroke: currentColor;
  stroke-width: 1.1;
  stroke-linecap: round;
  transform-origin: 8px 8px;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.animated-clock__hand--hour {
  animation-name: animated-clock-spin;
  animation-duration: 43200s;
}

.animated-clock__hand--minute {
  animation-name: animated-clock-spin;
  animation-duration: 3600s;
}

@keyframes animated-clock-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

<script setup>
import { computed } from 'vue'
import BokehBackdrop from './BokehBackdrop.vue'
import { createSnowflakes, createRaindrops } from '../utils/weatherFx'

const props = defineProps({
  effect: {
    type: String,
    default: 'default',
  },
  snowCount: {
    type: Number,
    default: 40,
  },
})

const snowflakes = computed(() => (props.effect === 'snow' ? createSnowflakes(props.snowCount) : []))
const raindrops = computed(() =>
  props.effect === 'rain' || props.effect === 'thunder' ? createRaindrops(28) : [],
)
</script>

<template>
  <div class="weather-fx" :class="`weather-fx--${effect}`" aria-hidden="true">
    <BokehBackdrop v-if="effect === 'sunny'" />
    <template v-else-if="effect === 'cloudy'">
      <span class="fx-cloud fx-cloud--a"></span>
      <span class="fx-cloud fx-cloud--b"></span>
      <span class="fx-cloud fx-cloud--c"></span>
    </template>
    <template v-else-if="effect === 'cloudy-heavy'">
      <span class="fx-cloud fx-cloud--a"></span>
      <span class="fx-cloud fx-cloud--b"></span>
      <span class="fx-cloud fx-cloud--c"></span>
      <span class="fx-cloud fx-cloud--d"></span>
      <span class="fx-cloud fx-cloud--e"></span>
      <span class="fx-cloud fx-cloud--f"></span>
    </template>
    <template v-else-if="effect === 'rain' || effect === 'thunder'">
      <span v-for="drop in raindrops" :key="drop.id" class="fx-rain" :style="drop.style"></span>
    </template>
    <template v-else-if="effect === 'snow'">
      <span v-for="flake in snowflakes" :key="flake.id" class="fx-snow" :style="flake.style"></span>
    </template>
  </div>
</template>

<style scoped>
.weather-fx {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

/* 맑음: 따뜻한 빛이 도는 배경 위에 보케(빛망울) 캔버스가 떠다님 */
.weather-fx--sunny {
  background: radial-gradient(
    ellipse at 50% -10%,
    rgba(255, 200, 120, 0.5) 0%,
    rgba(255, 170, 90, 0.2) 45%,
    rgba(255, 170, 90, 0) 75%
  );
}

/* 비 / 뇌우: 일정한 반복 패턴이 아니라, 길이·위치·속도가 제각각인 끊긴
   빗줄기(짧은 선분)들이 불규칙하게 떨어지도록 함.
   top을 %로 애니메이션해야 이 요소가 속한 컨테이너 높이 기준으로 움직여서
   실제로 위에서 아래 끝까지 떨어짐 (transform: translateY(%)는 요소 자신의
   크기 기준이라 아주 살짝만 움직이는 버그가 있었음) */
.fx-rain {
  position: absolute;
  left: 0;
  width: 2px;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0));
  transform: rotate(14deg);
  animation-name: fx-rain-drop-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fx-rain-drop-fall {
  from {
    top: -15%;
  }
  to {
    top: 115%;
  }
}

/* 뇌우: 불규칙한 번개 플래시 추가 */
.weather-fx--thunder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0;
  animation: fx-lightning 6s infinite;
}

@keyframes fx-lightning {
  0%,
  92%,
  96%,
  100% {
    opacity: 0;
  }
  93% {
    opacity: 0.5;
  }
  94% {
    opacity: 0.08;
  }
  95% {
    opacity: 0.35;
  }
}

/* 흐림 / 구름: 천천히 떠다니는 구름 덩어리 */
.fx-cloud {
  position: absolute;
  top: 15%;
  background: rgba(255, 255, 255, 0.45);
  border-radius: 50%;
  filter: blur(16px);
}

.fx-cloud--a {
  left: -30%;
  width: 45%;
  height: 70px;
  animation: fx-cloud-drift 22s linear infinite;
}

.fx-cloud--b {
  left: -45%;
  top: 42%;
  width: 32%;
  height: 50px;
  opacity: 0.7;
  animation: fx-cloud-drift 28s linear infinite;
  animation-delay: -10s;
}

.fx-cloud--c {
  left: -35%;
  top: 68%;
  width: 26%;
  height: 40px;
  opacity: 0.55;
  animation: fx-cloud-drift 18s linear infinite;
  animation-delay: -5s;
}

/* 구름 많음: 구름 조금(a/b/c)보다 더 빽빽하고 더 크게, 반대 방향으로도 섞어서
   하늘이 훨씬 더 뒤덮인 느낌을 줌 */
.fx-cloud--d {
  left: -40%;
  top: 4%;
  width: 38%;
  height: 60px;
  opacity: 0.5;
  animation: fx-cloud-drift 25s linear infinite;
  animation-delay: -16s;
}

.fx-cloud--e {
  left: 110%;
  top: 30%;
  width: 34%;
  height: 55px;
  opacity: 0.6;
  animation: fx-cloud-drift-reverse 20s linear infinite;
  animation-delay: -3s;
}

.fx-cloud--f {
  left: 120%;
  top: 82%;
  width: 30%;
  height: 45px;
  opacity: 0.45;
  animation: fx-cloud-drift-reverse 26s linear infinite;
  animation-delay: -12s;
}

@keyframes fx-cloud-drift-reverse {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-260%);
  }
}

@keyframes fx-cloud-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(260%);
  }
}

/* 흐림(전면 먹구름): 또렷한 구름 덩어리 대신, 하늘 전체를 무겁게 짓누르는
   회색 층이 밝기만 아주 천천히 오르내리며 맥동함. 옆으로 흐르는 안개나
   둥실 떠다니는 구름과는 다른 움직임이라 두 효과와 헷갈리지 않음 */
.weather-fx--overcast::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(90, 100, 110, 0.4) 0%,
    rgba(90, 100, 110, 0.16) 55%,
    transparent 100%
  );
  animation: fx-overcast-breathe 5s ease-in-out infinite;
}

@keyframes fx-overcast-breathe {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* 안개: 옆으로 흐르는 뿌연 층 */
.weather-fx--fog::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(
    100deg,
    rgba(255, 255, 255, 0.3) 0 60px,
    transparent 60px 140px
  );
  background-size: 200% 100%;
  animation: fx-fog-drift 9s linear infinite;
}

@keyframes fx-fog-drift {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -280px 0;
  }
}

/* 눈: 흩날리며 내리는 눈송이 */
.fx-snow {
  position: absolute;
  top: -5%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 50%;
  animation-name: fx-snow-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

@keyframes fx-snow-fall {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(220%);
  }
}
</style>

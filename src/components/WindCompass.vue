<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { getCompassLabel } from '../utils/wind'

const props = defineProps({
  // 기상 관례상 deg는 "바람이 불어오는 방향"
  degree: {
    type: Number,
    default: 0,
  },
  speed: {
    type: Number,
    default: 0,
  },
})

const compassLabel = computed(() => getCompassLabel(props.degree))

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// 강풍 기준으로 대충 잡은 상한(m/s). 옆 게이지들처럼 링이 값에 따라 실제로
// 채워지도록, 풍속을 이 값 대비 비율로 환산해 진행률로 씀
const MAX_SPEED = 15
const speedRatio = computed(() => Math.min(Math.max(props.speed / MAX_SPEED, 0), 1))
const targetOffset = computed(() => CIRCUMFERENCE * (1 - speedRatio.value))

const drawnOffset = ref(CIRCUMFERENCE)
onMounted(async () => {
  await nextTick()
  requestAnimationFrame(() => {
    drawnOffset.value = targetOffset.value
  })
})
watch(targetOffset, (value) => {
  drawnOffset.value = value
})

const tooltipContent = computed(() => `링은 풍속을 최대 ${MAX_SPEED}m/s 기준으로 환산해 채워져요.`)
</script>

<template>
  <!-- 옆의 습도/체감 게이지(RadialGauge)와 같은 링 + 가운데 텍스트 틀을 공유해서
       세 위젯이 하나의 세트처럼 보이도록 함. 링은 풍속 비율만큼 채워지고
       방향은 화살표 대신 가운데 텍스트로만 표현. 기준은 호버 툴팁으로 설명 -->
  <el-tooltip :content="tooltipContent" placement="top">
    <div class="wind-compass">
      <svg viewBox="0 0 100 100" class="wind-compass__svg">
        <circle class="wind-compass__track" cx="50" cy="50" r="42" />
        <circle
          class="wind-compass__progress"
          cx="50"
          cy="50"
          r="42"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="drawnOffset"
        />
      </svg>
      <div class="wind-compass__center">
        <span class="wind-compass__label">{{ compassLabel }}풍</span>
        <span class="wind-compass__value"
          >{{ speed.toFixed(1) }}<span class="wind-compass__unit">m/s</span></span
        >
      </div>
    </div>
  </el-tooltip>
</template>

<style scoped>
.wind-compass {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  color: #fff;
}

.wind-compass:hover {
  animation: ring-wiggle 0.4s ease-in-out;
}

@keyframes ring-wiggle {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-4deg);
  }
  75% {
    transform: rotate(4deg);
  }
}

.wind-compass__svg {
  width: 100%;
  height: 100%;
}

.wind-compass__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 8;
}

.wind-compass__progress {
  fill: none;
  stroke: #fff;
  stroke-width: 8;
  stroke-linecap: round;
  transform-origin: 50px 50px;
  transform: rotate(-90deg);
  transition: stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.wind-compass__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-align: center;
}

.wind-compass__value {
  font-family: var(--font-display);
  font-size: 1.38rem;
  font-weight: 800;
  line-height: 1;
}

.wind-compass__unit {
  font-size: 0.82rem;
  font-weight: 600;
  margin-left: 1px;
  opacity: 0.85;
}

.wind-compass__label {
  font-size: 0.79rem;
  opacity: 0.85;
  white-space: nowrap;
}
</style>

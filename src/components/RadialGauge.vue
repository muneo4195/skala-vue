<script setup>
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import { useCountUp } from '../composables/useCountUp'

const props = defineProps({
  value: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    default: 100,
  },
  unit: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  // 상세카드 배경이 날씨마다 달라져도(맑음/비/눈...) 항상 또렷이 보이도록 기본값은 흰색 계열
  color: {
    type: String,
    default: 'rgba(255, 255, 255, 0.95)',
  },
  decimals: {
    type: Number,
    default: 0,
  },
})

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const ratio = computed(() => Math.min(Math.max(props.value / props.max, 0), 1))
const targetOffset = computed(() => CIRCUMFERENCE * (1 - ratio.value))

// 처음엔 arc를 완전히 비워뒀다가(offset = 둘레 전체) 마운트 직후 목표 offset으로
// 전환해서, 카드에 들어오는 순간 게이지가 채워지는 연출을 줌
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

const animatedValue = useCountUp(() => props.value, 900)
const displayValue = computed(() => animatedValue.value.toFixed(props.decimals))
</script>

<template>
  <div class="radial-gauge">
    <svg viewBox="0 0 100 100" class="radial-gauge__svg">
      <circle class="radial-gauge__track" cx="50" cy="50" :r="RADIUS" />
      <circle
        class="radial-gauge__progress"
        cx="50"
        cy="50"
        :r="RADIUS"
        :stroke="color"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="drawnOffset"
      />
    </svg>
    <div class="radial-gauge__center">
      <span class="radial-gauge__label">{{ label }}</span>
      <span class="radial-gauge__value">{{ displayValue }}<span class="radial-gauge__unit">{{ unit }}</span></span>
    </div>
  </div>
</template>

<style scoped>
.radial-gauge {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

.radial-gauge:hover {
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

.radial-gauge__svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.radial-gauge__track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.22);
  stroke-width: 8;
}

.radial-gauge__progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.radial-gauge__center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #fff;
  text-align: center;
}

.radial-gauge__value {
  font-family: var(--font-display);
  font-size: 1.38rem;
  font-weight: 800;
  line-height: 1;
}

.radial-gauge__unit {
  font-size: 0.82rem;
  font-weight: 600;
  margin-left: 1px;
  opacity: 0.85;
}

.radial-gauge__label {
  font-size: 0.79rem;
  opacity: 0.85;
  white-space: nowrap;
}
</style>

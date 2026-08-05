<script setup>
import { computed } from 'vue'

const props = defineProps({
  // [{ id, name, delta, displayTemp }] - delta: 전국 평균 대비 편차(표시 단위 기준)
  items: {
    type: Array,
    required: true,
  },
  unit: {
    type: String,
    default: '°C',
  },
})

// 여러 도시가 같은 스케일을 공유해야 막대 길이가 서로 비교 가능해서,
// 그룹 안에서 가장 큰 편차를 기준으로 삼음(1 미만이면 막대가 안 보일 정도로 작아지므로 최소 1로 고정)
const maxAbsDelta = computed(() => Math.max(...props.items.map((item) => Math.abs(item.delta)), 1))

function barWidthPercent(delta) {
  return (Math.abs(delta) / maxAbsDelta.value) * 50
}
</script>

<template>
  <div class="compare-chart">
    <div v-for="item in items" :key="item.id" class="compare-chart__row">
      <span class="compare-chart__name">{{ item.name }}</span>
      <div class="compare-chart__track">
        <div class="compare-chart__zero"></div>
        <div
          v-if="item.delta !== 0"
          class="compare-chart__bar"
          :class="item.delta > 0 ? 'up' : 'down'"
          :style="{ width: `${barWidthPercent(item.delta)}%` }"
        ></div>
      </div>
      <span
        class="compare-chart__value"
        :class="item.delta > 0 ? 'up' : item.delta < 0 ? 'down' : 'neutral'"
      >
        {{ item.displayTemp }}{{ unit }}
        <small v-if="item.delta !== 0">{{ item.delta > 0 ? '▲' : '▼' }} {{ Math.abs(item.delta) }}{{ unit }}</small>
        <small v-else>평균</small>
      </span>
    </div>
  </div>
</template>

<style scoped>
.compare-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}

.compare-chart__row {
  display: grid;
  grid-template-columns: 72px 1fr 96px;
  align-items: center;
  gap: 8px;
}

.compare-chart__name {
  font-size: 0.85rem;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compare-chart__track {
  position: relative;
  height: 18px;
  background: #f1f3f6;
  border-radius: 4px;
  overflow: hidden;
  transition: background 0.15s ease;
}

.compare-chart__row:hover .compare-chart__track {
  background: #e9edf3;
}

.compare-chart__zero {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #d8dee7;
}

.compare-chart__bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  animation: compare-bar-grow 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.compare-chart__row:hover .compare-chart__bar {
  filter: brightness(1.1);
}

.compare-chart__bar.up {
  left: 50%;
  border-radius: 0 4px 4px 0;
  background: #e5533d;
  transform-origin: left;
}

.compare-chart__bar.down {
  right: 50%;
  border-radius: 4px 0 0 4px;
  background: #3d84e5;
  transform-origin: right;
}

@keyframes compare-bar-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.compare-chart__value {
  font-size: 0.8rem;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
  color: #333;
}

.compare-chart__value small {
  font-weight: 600;
  font-size: 0.7rem;
  margin-left: 2px;
}

.compare-chart__value.up small {
  color: #e5533d;
}

.compare-chart__value.down small {
  color: #3d84e5;
}

.compare-chart__value.neutral small {
  color: #999;
}
</style>

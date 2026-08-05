<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWeatherStore } from '../stores/weatherStore'
import { useConfigStore } from '../stores/configStore'
import { useFavoriteStore } from '../stores/favoriteStore'
import { useCurrentTime } from '../composables/useCurrentTime'
import { getWeatherTheme } from '../utils/weatherTheme'
import { getMoodLine, getMoodIcon } from '../utils/weatherMood'
import { ICONS } from '../utils/icons'
import WeatherFxLayer from './WeatherFxLayer.vue'

const router = useRouter()
const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()
const { formattedTime, timeOfDay } = useCurrentTime()

// 즐겨찾기로 표시한 도시를 대표 도시로 보여줌
const heroCity = computed(() => weatherStore.getCityById(favoriteStore.favoriteCityId))
const theme = computed(() => getWeatherTheme(heroCity.value?.status))
const moodLine = computed(() => getMoodLine(timeOfDay.value, heroCity.value?.status))
const moodIcon = computed(() => getMoodIcon(timeOfDay.value, heroCity.value?.status))

// 클릭하면 바로 상세보기로 이동
const onClick = () => {
  if (!heroCity.value) return
  router.push(`/weather/${heroCity.value.id}`)
}

const displayTemp = computed(() => {
  const rawTemp = heroCity.value?.temp
  if (rawTemp === undefined) return null
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})
</script>

<template>
  <el-tooltip
    v-if="heroCity"
    content="클릭하면 상세 날씨 정보를 볼 수 있어요"
    placement="top"
    :show-arrow="true"
  >
    <section
      class="hero"
      role="button"
      tabindex="0"
      :style="{ borderBottomColor: theme.accent }"
      @click="onClick"
      @keydown.enter="onClick"
    >
      <WeatherFxLayer :effect="theme.effect" :snow-count="16" />

      <div class="hero__panel">
        <p class="hero__place"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg> 즐겨찾기 - {{ heroCity.name }}</p>
        <div class="hero__main">
          <span class="hero__icon" v-html="theme.icon"></span>
          <span class="hero__temp">{{ displayTemp }}{{ configStore.unitSymbol }}</span>
        </div>
        <p class="hero__mood">
          {{ heroCity.status }} / {{ moodLine }}
          <span v-if="moodIcon" class="hero__mood-icon" v-html="moodIcon"></span>
        </p>
        <p class="hero__time"><span v-html="ICONS.clock"></span> {{ formattedTime }} 기준</p>
      </div>
    </section>
  </el-tooltip>
  <section v-else class="hero hero--loading">날씨 정보를 불러오는 중입니다...</section>
</template>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  width: 100%;
  margin: 0;
  display: flex;
  align-items: stretch;
  padding: clamp(16px, 4vw, 28px);
  cursor: pointer;
  /* 배경과 거의 구분이 안 되니, 여기 카드가 있다는 것만 살짝 알려주는 밑줄.
     색상은 즐겨찾기 도시 날씨 테마에 맞춰 :style로 바뀜 */
  border-bottom: 3px solid;
  box-shadow: 0 6px 18px rgba(20, 20, 30, 0.05);
  transform-origin: center;
  transition:
    border-color 0.6s ease,
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
}

/* 전체보기 카드(WeatherCard)와 같은 방식으로 호버/클릭 시 들뜨는 느낌을 줘서
   즐겨찾기 카드도 똑같이 역동적으로 반응하게 함 */
.hero:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(20, 20, 30, 0.1);
}

.hero:active {
  transform: scale(1.03);
}

.hero--loading {
  align-items: center;
  justify-content: center;
  background: #f1f1f1;
  color: #999;
  font-size: 0.9rem;
  min-height: 120px;
}

.hero__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  color: #2b3a55;
}

.hero__place {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 4px;
  font-size: 1.3rem;
  opacity: 0.9;
}

.hero__place svg {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

.hero__main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero__icon {
  font-size: 2.6rem;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.2));
}

/* theme.icon은 v-html로 주입되므로, scoped 셀렉터가 안 먹혀서 :deep() 사용 */
.hero__icon :deep(svg) {
  width: 1em;
  height: 1em;
  display: block;
  animation: hero-icon-float 3.4s ease-in-out infinite;
}

@keyframes hero-icon-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.hero__temp {
  font-family: var(--font-display);
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
}

.hero__mood {
  margin: 8px 0 0;
  font-size: 1rem;
}

.hero__mood-icon {
  display: inline-flex;
  vertical-align: -0.15em;
}

.hero__mood-icon :deep(svg) {
  width: 1em;
  height: 1em;
}

.hero__time {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 6px 0 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.hero__time :deep(svg) {
  width: 1em;
  height: 1em;
}
</style>

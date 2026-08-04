<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfigStore } from '../stores/configStore'
import { useWeatherStore } from '../stores/weatherStore'
import { useCurrentTime } from '../composables/useCurrentTime'
import { getWeatherTheme } from '../utils/weatherTheme'
import { getMoodLine, getMoodIcon } from '../utils/weatherMood'
import { ICONS } from '../utils/icons'
import WeatherFxLayer from '../components/WeatherFxLayer.vue'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const weatherStore = useWeatherStore()
const { formattedTime, timeOfDay } = useCurrentTime()

// 실시간 데이터에는 없는 전체 행정구역명만 별도로 매핑 (표시용, 날씨 데이터 아님)
const FULL_NAME_MAP = {
  city_01: '대한민국 서울특별시',
  city_02: '대한민국 부산광역시',
  city_03: '대한민국 대구광역시',
}

const cityDetail = ref(null)

onMounted(async () => {
  // 홈 화면을 거치지 않고 상세 URL로 바로 들어온 경우를 대비해 데이터 로드 보장
  await weatherStore.loadCities()
  const city = weatherStore.getCityById(route.params.cityId)
  cityDetail.value = city
    ? { ...city, fullName: FULL_NAME_MAP[city.id] ?? city.name }
    : null
})

const theme = computed(() => getWeatherTheme(cityDetail.value?.status))
const moodLine = computed(() => getMoodLine(timeOfDay.value, cityDetail.value?.status))
const moodIcon = computed(() => getMoodIcon(timeOfDay.value, cityDetail.value?.status))

// 원본 데이터는 항상 섭씨 숫자로 유지, 화면 표시만 단위에 맞게 변환
const displayTemp = computed(() => {
  const rawTemp = cityDetail.value?.temp
  if (rawTemp === undefined) return null
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32)
  }
  return rawTemp
})

const displayFeelsLike = computed(() => {
  const rawFeelsLike = cityDetail.value?.feelsLike
  if (rawFeelsLike === undefined) return null
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawFeelsLike * 9) / 5 + 32)
  }
  return rawFeelsLike
})

// 전국 평균 대비 이 도시가 얼마나 높은지/낮은지 (홈 화면 카드와 같은 계산)
const overallAvgTemp = computed(() => {
  const cities = weatherStore.cities
  if (cities.length === 0) return null
  return cities.reduce((sum, city) => sum + city.temp, 0) / cities.length
})

const tempDelta = computed(() => {
  if (overallAvgTemp.value === null || !cityDetail.value) return null
  const deltaCelsius = cityDetail.value.temp - overallAvgTemp.value
  const displayDelta = configStore.unit === 'fahrenheit' ? (deltaCelsius * 9) / 5 : deltaCelsius
  return Math.round(displayDelta * 10) / 10
})

// watch는 반응형 값만 감시할 수 있어서, 클릭할 때마다 값이 바뀌는 트리거를 하나 둠
const backClickCount = ref(0)

const goBack = () => {
  backClickCount.value++
  // 항상 홈으로 보내지 않고, 원래 있던 페이지(전체보기든 홈이든)로 그대로 돌아감
  router.back()
}

watch(backClickCount, () => {
  console.log(
    '[뒤로가기 클릭]',
    cityDetail.value
      ? `${cityDetail.value.name} 상세보기에서 메인 대시보드로 돌아갑니다.`
      : '메인 대시보드로 돌아갑니다.',
  )
})
</script>

<template>
  <div class="weather-detail">
    <div v-if="cityDetail" class="detail-card" :style="{ background: theme.gradient }">
      <div class="detail-card__fx" aria-hidden="true">
        <WeatherFxLayer :effect="theme.effect" :snow-count="24" />
      </div>
      <button class="back-icon" aria-label="닫기" @click="goBack" v-html="ICONS.close"></button>

      <div class="detail-card__header">
        <p class="detail-card__region"><span v-html="ICONS.pin"></span> {{ cityDetail.fullName }}</p>
        <p class="detail-card__status-label">{{ cityDetail.status }}</p>
        <p class="detail-card__time"><span v-html="ICONS.clock"></span> {{ formattedTime }} 기준</p>
      </div>

      <div class="detail-card__icon" v-html="theme.icon"></div>
      <div class="detail-card__temp-row">
        <span class="detail-card__temp">{{ displayTemp }}{{ configStore.unitSymbol }}</span>
        <span
          v-if="tempDelta !== null"
          class="detail-card__delta"
          :class="tempDelta > 0 ? 'up' : tempDelta < 0 ? 'down' : 'neutral'"
        >
          {{ tempDelta > 0 ? '▲' : tempDelta < 0 ? '▼' : '' }}
          {{ tempDelta === 0 ? '평균' : `${Math.abs(tempDelta)}${configStore.unitSymbol}` }}
        </span>
      </div>
      <p class="detail-card__feels">체감 {{ displayFeelsLike }}{{ configStore.unitSymbol }}</p>
      <p class="detail-card__mood">
        {{ moodLine }}
        <span v-if="moodIcon" class="detail-card__mood-icon" v-html="moodIcon"></span>
      </p>

      <div class="detail-card__stats">
        <div class="stat">
          <span class="stat__label">Wind</span>
          <span class="stat__value">{{ cityDetail.windSpeed }}m/s</span>
        </div>
        <div class="stat">
          <span class="stat__label">Humidity</span>
          <span class="stat__value">{{ cityDetail.humidity }}%</span>
        </div>
      </div>
    </div>

    <template v-else>
      <p class="no-result">해당 도시({{ route.params.cityId }})의 상세 정보를 찾을 수 없습니다.</p>
      <button class="back-button" @click="goBack">닫기</button>
    </template>
  </div>
</template>

<style scoped>
.weather-detail {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.detail-card {
  position: relative;
  border-radius: 24px;
  padding: 24px;
  color: #fff;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

/* 날씨 효과(빛망울/구름/빗줄기/눈) 레이어. z-index를 음수로 둬서 카드 배경 위,
   글자/아이콘 같은 일반 콘텐츠보다는 아래에 깔리게 함 */
.detail-card__fx {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.back-icon {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.back-icon:hover {
  background: #fff;
}

.back-icon :deep(svg) {
  width: 1em;
  height: 1em;
}

.detail-card__header {
  margin-top: 40px;
  text-align: center;
}

.detail-card__region {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.detail-card__region :deep(svg) {
  width: 1em;
  height: 1em;
}

.detail-card__status-label {
  margin: 4px 0 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.detail-card__time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 6px 0 0;
  font-size: 0.75rem;
  opacity: 0.85;
}

.detail-card__time :deep(svg) {
  width: 1em;
  height: 1em;
}

.detail-card__icon {
  font-size: 4rem;
  text-align: center;
  margin: 8px 0;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.2));
}

/* theme.icon은 v-html로 주입되므로, scoped 셀렉터가 안 먹혀서 :deep() 사용 */
.detail-card__icon :deep(svg) {
  width: 1em;
  height: 1em;
  animation: detail-icon-float 3.4s ease-in-out infinite;
}

@keyframes detail-icon-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

.detail-card__temp-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  margin-bottom: 2px;
}

.detail-card__temp {
  font-family: var(--font-display);
  font-size: 2.5rem;
  font-weight: 800;
}

.detail-card__delta {
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.detail-card__delta.up {
  color: #e5533d;
}

.detail-card__delta.down {
  color: #3d84e5;
}

.detail-card__delta.neutral {
  color: #fff;
  opacity: 0.85;
}

.detail-card__feels {
  margin: 0;
  text-align: center;
  font-size: 1.15rem;
  font-weight: 600;
  opacity: 0.9;
}

.detail-card__mood {
  margin: 6px 0 16px;
  text-align: center;
  font-size: 0.85rem;
  opacity: 0.9;
}

.detail-card__mood-icon {
  display: inline-flex;
  vertical-align: -0.15em;
}

.detail-card__mood-icon :deep(svg) {
  width: 1em;
  height: 1em;
}

.detail-card__stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  padding: 12px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
}

.stat__label {
  opacity: 0.85;
}

.stat__value {
  font-weight: 700;
  font-size: 1rem;
}

.no-result {
  color: #888;
  text-align: center;
}

.back-button {
  margin-top: 16px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #2b3a55;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.back-button:hover {
  background: #1f2b41;
}
</style>

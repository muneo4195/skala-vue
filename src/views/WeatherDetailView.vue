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
import RadialGauge from '../components/RadialGauge.vue'
import WindCompass from '../components/WindCompass.vue'

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
// cityDetail이 null인 게 "아직 로딩 중"인지 "진짜 없는 도시"인지 구분이 안 돼서,
// loadCities()가 끝나기 전까지는 "찾을 수 없음" 대신 로딩 상태를 따로 보여줌
const isLoadingDetail = ref(true)

onMounted(async () => {
  // 홈/전체보기를 거쳐 들어왔으면 이미 캐시돼 있어 API 호출 없이 바로 반환되고,
  // 상세 URL로 바로 들어온 경우엔 이 도시 하나만 조회함(loadCities로 50개 전체를
  // 기다리지 않아서 훨씬 빠름)
  const city = await weatherStore.ensureCityLoaded(route.params.cityId)
  cityDetail.value = city
    ? { ...city, fullName: FULL_NAME_MAP[city.id] ?? city.name }
    : null
  isLoadingDetail.value = false
  if (city) {
    weatherStore.fetchCityForecast(city.id)
  }
})

const forecastState = computed(() => weatherStore.forecastByCity[route.params.cityId])
const forecastPoints = computed(() => forecastState.value?.points ?? [])

const toDisplayTemp = (rawCelsius) =>
  configStore.unit === 'fahrenheit' ? Math.round((rawCelsius * 9) / 5 + 32) : Math.round(rawCelsius)

const dailyForecast = computed(() => {
  const days = []
  for (let i = 0; i < forecastPoints.value.length; i += 8) {
    const dayPoints = forecastPoints.value.slice(i, i + 8)
    if (dayPoints.length === 0) continue

    const temps = dayPoints.map((p) => p.temp)
    // 아이콘과 강수확률이 서로 다른 시각의 값이면(예: 정오는 맑지만 저녁에
    // 비 올 확률만 따로 최댓값을 잡는 경우) "구름 아이콘인데 100%" 같은
    // 모순이 생겨서, 강수확률이 가장 높은 시각 하나를 골라 아이콘·확률 둘 다
    // 그 시점 값으로 통일함
    const peakPopPoint = dayPoints.reduce((peak, p) => (p.pop > peak.pop ? p : peak))
    const [month, day] = dayPoints[0].date.split('-')

    days.push({
      date: `${Number(month)}/${Number(day)}`,
      weekday: dayPoints[0].weekday,
      icon: getWeatherTheme(peakPopPoint.status).icon,
      pop: Math.round(peakPopPoint.pop * 100),
      minTemp: toDisplayTemp(Math.min(...temps)),
      maxTemp: toDisplayTemp(Math.max(...temps)),
    })
  }
  return days
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
  // 항상 홈으로 보내지 않고 원래 있던 페이지(전체보기든 홈이든)로 그대로 돌아감
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

      <div class="detail-card__main">
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
      </div>

      <div class="detail-card__side">
        <div class="detail-card__gauges">
          <WindCompass :degree="cityDetail.windDeg ?? 0" :speed="cityDetail.windSpeed" />
          <RadialGauge :value="cityDetail.humidity" :max="100" unit="%" label="습도" />
          <RadialGauge
            :value="displayFeelsLike"
            :max="45"
            :unit="configStore.unitSymbol"
            label="체감"
          />
        </div>

        <!-- 예전엔 이 자리에 24시간 기온 추이 그래프가 있었는데, 그래프 대신
             앞으로 5일간의 날씨를 여기 넣음 -->
        <div v-if="dailyForecast.length" class="detail-card__daily">
          <span class="detail-card__daily-heading">앞으로 5일간의 날씨</span>

          <!-- 데이터 행과 같은 grid-template-columns를 써서 각 라벨이 그 아래
               값과 정확히 줄이 맞도록 함 -->
          <div class="detail-card__daily-row detail-card__daily-labels">
            <span>날짜</span>
            <span>강수</span>
            <span class="align-right">최저</span>
            <span></span>
            <span class="align-right">최고</span>
          </div>

          <div
            v-for="day in dailyForecast"
            :key="day.date"
            class="detail-card__daily-row detail-card__daily-item"
          >
            <span class="detail-card__daily-date">{{ day.date }} {{ day.weekday }}</span>
            <span class="detail-card__daily-precip">
              <el-tooltip content="하루 중 강수확률이 가장 높은 시간대의 날씨예요" placement="top">
                <span class="detail-card__daily-icon" v-html="day.icon"></span>
              </el-tooltip>
              <span class="detail-card__daily-pop">{{ day.pop }}%</span>
            </span>
            <span class="detail-card__daily-min align-right">{{ day.minTemp }}°</span>
            <span class="detail-card__daily-bar"></span>
            <span class="detail-card__daily-max align-right">{{ day.maxTemp }}°</span>
          </div>
        </div>
      </div>
    </div>

    <template v-else-if="isLoadingDetail">
      <div class="loading-state">
        <span class="loading-spinner" aria-hidden="true"></span>
        <p class="no-result">날씨 정보를 불러오는 중입니다...</p>
      </div>
    </template>
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
  max-width: 750px;
  margin: 0 auto;
}

/* 넓은 화면에서는 좌측 정보 + 우측 큰 차트가 가로로 나란히, 가운데 정렬로 배치되고
   좁은 화면(휴대폰)에서는 아래 미디어쿼리로 다시 세로로 쌓임 */
.detail-card {
  position: relative;
  border-radius: 24px;
  padding: 40px;
  color: #fff;
  min-height: 280px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 32px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

@media (max-width: 640px) {
  .detail-card {
    flex-direction: column;
    padding: 24px;
  }
}

.detail-card__main {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 1 260px;
  max-width: 300px;
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
  font-size: 1.02rem;
  opacity: 0.9;
}

.detail-card__region :deep(svg) {
  width: 1em;
  height: 1em;
}

.detail-card__status-label {
  margin: 4px 0 0;
  font-size: 1.44rem;
  font-weight: 700;
}

.detail-card__time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 6px 0 0;
  font-size: 0.9rem;
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

/* 배경 색이 날씨마다 달라져서 글자색만으로는 잘 안 보일 때가 있어,
   옅은 흰색 알약 배경을 깔아서 항상 또렷하게 읽히도록 함 */
.detail-card__delta {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.85);
  font-size: 1.12rem;
  font-weight: 700;
  white-space: nowrap;
}

.detail-card__delta.up {
  color: #e5533d;
}

.detail-card__delta.down {
  color: #3d84e5;
}

.detail-card__delta.neutral {
  color: #555;
}

.detail-card__feels {
  margin: 0;
  text-align: center;
  font-size: 1.38rem;
  font-weight: 600;
  opacity: 0.9;
}

.detail-card__mood {
  margin: 6px 0 16px;
  text-align: center;
  font-size: 1.02rem;
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

/* 왼쪽(위치·기온) 옆에 붙는 오른쪽 컬럼. 게이지와 5일 예보를 세로로 쌓음 */
.detail-card__side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  flex: 1.4 1 360px;
  max-width: 460px;
}

.detail-card__gauges {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 8px;
  width: 100%;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  padding: 10px 6px;
}

/* 과거 데이터는 무료 API로 못 가져와서, 대신 앞으로의 5일 예보를 하루씩 묶어
   보여줌. 왼쪽 게이지 카드와 같은 톤의 배경 박스로 감싸서 카드 하나로 보이도록 함 */
.detail-card__daily {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 18px;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 18px;
}

.detail-card__daily-heading {
  text-align: center;
  font-size: 1.14rem;
  font-weight: 700;
  opacity: 0.9;
}

/* 라벨 행과 데이터 행이 같은 grid-template-columns를 공유해서 줄이 맞음 */
.detail-card__daily-row {
  display: grid;
  grid-template-columns: 1.3fr 1fr auto 18px auto;
  align-items: center;
  gap: 6px;
}

.detail-card__daily-row .align-right {
  text-align: right;
}

.detail-card__daily-labels {
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 0.72rem;
  font-weight: 700;
  opacity: 0.75;
}

.detail-card__daily-date {
  font-size: 0.85rem;
  opacity: 0.9;
  white-space: nowrap;
}

.detail-card__daily-precip {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-card__daily-icon {
  flex-shrink: 0;
  font-size: 1.1rem;
}

.detail-card__daily-icon :deep(svg) {
  width: 1em;
  height: 1em;
  display: block;
}

.detail-card__daily-pop {
  font-size: 0.82rem;
  opacity: 0.85;
  white-space: nowrap;
}

.detail-card__daily-min,
.detail-card__daily-max {
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
}

.detail-card__daily-min {
  color: #3d84e5;
}

.detail-card__daily-max {
  color: #e5533d;
}

.detail-card__daily-bar {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.55);
}

.no-result {
  color: #888;
  text-align: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba(61, 132, 229, 0.2);
  border-top-color: #3d84e5;
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
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

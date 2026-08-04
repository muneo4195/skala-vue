<script setup>
import { ref, computed, watch, watchEffect, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import SearchBar from '../components/exercise/SearchBar.vue'
import WeatherCard from '../components/exercise/WeatherCard.vue'
import { useWeatherStore, REGION_ORDER } from '../stores/weatherStore'
import { useConfigStore } from '../stores/configStore'
import { useCurrentTime } from '../composables/useCurrentTime'
import { getWeatherTheme } from '../utils/weatherTheme'
import { ICONS } from '../utils/icons'

const router = useRouter()
const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const { formattedTime } = useCurrentTime()

// 강수 상태 라벨 묶음 (getWeatherLabel이 붙이는 값 기준)
const WET_STATUSES = ['비', '눈', '뇌우', '이슬비']

// 감성/라이프스타일 필터. 미세먼지·강수확률 API가 없어서 기존 필드(기온/습도/풍속/날씨상태)로 근사함.
// 아이콘은 가능하면 weatherTheme.js에 이미 있는 검증된 svg를 재사용함
const MOOD_FILTER_GROUPS = [
  {
    label: '라이프스타일 & 야외활동',
    icon: ICONS.umbrellaBeach,
    filters: [
      {
        id: 'outdoor',
        label: '야외활동 추천',
        icon: getWeatherTheme('맑음').icon,
        test: (c) => !WET_STATUSES.includes(c.status) && c.status !== '안개' && c.temp >= 15 && c.temp <= 26 && c.windSpeed < 6,
      },
      {
        id: 'indoor',
        label: '실내 데이트 / 실내활동',
        icon: ICONS.cupHot,
        test: (c) => WET_STATUSES.includes(c.status) || c.temp < 5 || c.temp > 30,
      },
      {
        id: 'camping',
        label: '캠핑 / 차박',
        icon: ICONS.tent,
        test: (c) => c.windSpeed < 4 && c.temp >= 12 && c.temp <= 24 && !WET_STATUSES.includes(c.status) && c.status !== '안개',
      },
      {
        id: 'running',
        label: '야외 운동 / 러닝',
        icon: ICONS.running,
        test: (c) => c.humidity >= 30 && c.humidity <= 60 && c.temp >= 10 && c.temp <= 22 && !WET_STATUSES.includes(c.status),
      },
    ],
  },
  {
    label: '날씨 상태 & 분위기',
    icon: getWeatherTheme('흐림').icon,
    filters: [
      { id: 'sunny', label: '맑음 / 화창한 곳', icon: getWeatherTheme('맑음').icon, test: (c) => c.status === '맑음' },
      { id: 'rainSnow', label: '비/눈 오는 곳', icon: getWeatherTheme('비').icon, test: (c) => WET_STATUSES.includes(c.status) },
      {
        id: 'sunset',
        label: '노을/일몰 예쁜 곳',
        icon: getWeatherTheme('구름').icon,
        test: (c) => c.status === '구름 조금' || c.status === '구름 많음',
      },
      { id: 'overcast', label: '흐림 / 우중충한 곳', icon: getWeatherTheme('흐림').icon, test: (c) => c.status === '흐림' },
      { id: 'fog', label: '안개 / 차분한 분위기', icon: getWeatherTheme('안개').icon, test: (c) => c.status === '안개' },
    ],
  },
  {
    label: '기온 & 계절감',
    icon: ICONS.leaf,
    filters: [
      { id: 'pleasant', label: '쾌적한 곳 (20~24°C)', icon: ICONS.leaf, test: (c) => c.temp >= 20 && c.temp <= 24 },
      { id: 'cool', label: '시원한 / 선선한 곳', icon: getWeatherTheme('눈').icon, test: (c) => c.temp < 15 },
      { id: 'hot', label: '더운 곳 / 피서 필요', icon: ICONS.fire, test: (c) => c.temp >= 28 },
    ],
  },
]

// 같은 줄(카테고리) 안에서 여러 개를 고르면 OR(맑음 또는 비 오는 곳 중 하나),
// 서로 다른 줄에 걸쳐 고르면 AND(예: 쾌적한 곳 그리고 야외활동 추천)로 좁혀짐
const selectedMoodFilters = ref([])
const activeMoodFilterGroups = computed(() =>
  MOOD_FILTER_GROUPS.map((group) => group.filters.filter((f) => selectedMoodFilters.value.includes(f.id))).filter(
    (activeFilters) => activeFilters.length > 0,
  ),
)
const toggleMoodFilter = (id) => {
  const idx = selectedMoodFilters.value.indexOf(id)
  if (idx === -1) {
    selectedMoodFilters.value.push(id)
  } else {
    selectedMoodFilters.value.splice(idx, 1)
  }
}

// 검색창은 기본적으로 접어두고, 아이콘을 눌렀을 때만 펼침 (상단 영역 비중을 줄이기 위함)
const showSearch = ref(false)

// 지역 필터 + 감성/라이프스타일 필터를 하나의 패널로 합쳐서 평소엔 접어둠
const showFilterPanel = ref(false)
const activeFilterCount = computed(() => selectedRegions.value.length + selectedMoodFilters.value.length)

// 토글 한 번으로 모든 카드를 뒤집어서 상세보기에만 있던 정보(체감/바람/습도)를 보여줌
const allFlipped = ref(false)

// 원본 데이터는 항상 섭씨 숫자로 유지, 화면 표시만 단위에 맞게 변환
const toDisplayTemp = (rawCelsius) =>
  configStore.unit === 'fahrenheit' ? (rawCelsius * 9) / 5 + 32 : rawCelsius

const searchQuery = ref('')
const selectedCityInfo = ref(null)

// 지역 필터: 여러 지역을 동시에 선택 가능 (빈 배열 = '전체'와 동일하게 전부 표시)
const REGION_FILTERS = ['전체', ...REGION_ORDER]
const selectedRegions = ref([])

onMounted(weatherStore.loadCities)

const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim()
  let list = keyword ? weatherStore.cities.filter((city) => city.name.includes(keyword)) : weatherStore.cities
  // 그룹 안에서는 OR(하나만 만족해도 통과), 그룹끼리는 AND(모든 그룹을 통과해야 함)
  activeMoodFilterGroups.value.forEach((groupFilters) => {
    list = list.filter((city) => groupFilters.some((filter) => filter.test(city)))
  })
  return list
})

// 전국 평균/최고/최저 기온 (검색·지역 필터와 무관하게 항상 전체 도시 기준)
const overallStats = computed(() => {
  const cities = weatherStore.cities
  if (cities.length === 0) return null

  const avgCelsius = cities.reduce((sum, city) => sum + city.temp, 0) / cities.length
  const maxCity = cities.reduce((max, city) => (city.temp > max.temp ? city : max), cities[0])
  const minCity = cities.reduce((min, city) => (city.temp < min.temp ? city : min), cities[0])

  return { avgCelsius, maxCity, minCity }
})

const displayAvgTemp = computed(() =>
  overallStats.value ? toDisplayTemp(overallStats.value.avgCelsius).toFixed(1) : null,
)
const displayMaxTemp = computed(() =>
  overallStats.value ? Math.round(toDisplayTemp(overallStats.value.maxCity.temp)) : null,
)
const displayMinTemp = computed(() =>
  overallStats.value ? Math.round(toDisplayTemp(overallStats.value.minCity.temp)) : null,
)

// 지역별 평균 기온 (전체 도시 기준, 검색/필터 무관 — 지역 특성 비교용 고정 baseline)
const regionAverages = computed(() => {
  const sums = {}
  weatherStore.cities.forEach((city) => {
    if (!sums[city.region]) sums[city.region] = { total: 0, count: 0 }
    sums[city.region].total += city.temp
    sums[city.region].count += 1
  })
  const averages = {}
  Object.keys(sums).forEach((region) => {
    averages[region] = sums[region].total / sums[region].count
  })
  return averages
})

// 지역(수도권/강원권/충청권/경상권/전라권/제주권)별로 묶어서 섹션 단위로 표시
const groupedWeatherList = computed(() => {
  const groups = {}
  filteredWeatherList.value.forEach((city) => {
    if (!groups[city.region]) groups[city.region] = []
    groups[city.region].push(city)
  })
  const regions =
    selectedRegions.value.length === 0
      ? REGION_ORDER
      : REGION_ORDER.filter((region) => selectedRegions.value.includes(region))

  return regions
    .filter((region) => groups[region]?.length)
    .map((region) => {
      let delta = 0
      if (overallStats.value) {
        const deltaCelsius = regionAverages.value[region] - overallStats.value.avgCelsius
        const displayDelta = configStore.unit === 'fahrenheit' ? (deltaCelsius * 9) / 5 : deltaCelsius
        delta = Math.round(displayDelta * 10) / 10
      }
      return { region, cities: groups[region], delta }
    })
})

// 지역 칩을 직접 클릭하면 검색어를 초기화함 (아래 searchQuery watch가 다시 되돌리지 않도록 플래그로 막음)
let skipSearchSync = false

// '전체'는 항상 단독으로 선택되고(모든 필터 해제), 나머지 지역들은 여러 개 동시에 토글 가능함
const toggleRegion = (region) => {
  if (region === '전체') {
    selectedRegions.value = []
  } else {
    const idx = selectedRegions.value.indexOf(region)
    if (idx === -1) {
      selectedRegions.value.push(region)
    } else {
      selectedRegions.value.splice(idx, 1)
    }
  }
  if (searchQuery.value) {
    skipSearchSync = true
    searchQuery.value = ''
  }
}

const statusMessage = computed(() =>
  selectedCityInfo.value
    ? `${selectedCityInfo.value.name}이 선택되었습니다.`
    : '카드를 클릭하거나 검색해 보세요.',
)

watch(selectedCityInfo, (newCity) => {
  console.log('[상태바 문구 변경]', newCity ? `${newCity.name}이 선택되었습니다.` : '(선택 해제됨)')
})

watchEffect(() => {
  console.log('[검색어 변경]', searchQuery.value)
})

// 검색 결과가 특정 지역 하나에만 있으면 지역 필터도 그 지역으로 자동 전환하고,
// 필터가 접혀있어도 바뀐 걸 바로 알 수 있게 펼쳐줌
watch(searchQuery, (value) => {
  if (skipSearchSync) {
    skipSearchSync = false
    return
  }
  const keyword = value.trim()
  if (!keyword) {
    selectedRegions.value = []
    return
  }
  const matchedRegions = new Set(
    weatherStore.cities.filter((city) => city.name.includes(keyword)).map((city) => city.region),
  )
  if (matchedRegions.size === 1) {
    selectedRegions.value = [...matchedRegions]
    showFilterPanel.value = true
  } else {
    selectedRegions.value = []
  }
})

const handleUpdateQuery = (value) => {
  searchQuery.value = value
}

const handleSelectCard = (city) => {
  selectedCityInfo.value = city
}

// 상세보기 클릭 시 alert 대신 Programmatic Navigation으로 상세 페이지 이동
const handleClickDetail = (city) => {
  console.log('[상세보기 클릭]', `${city.name}의 세부정보를 클릭하였습니다.`)
  router.push(`/weather/${city.id}`)
}
</script>

<template>
  <div class="all-cities">
    <BaseDashboardCard
      title='<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 12.5a1.5 1.5 0 1 1-2-1.415V6.5a.5.5 0 0 1 1 0v4.585a1.5 1.5 0 0 1 1 1.415"/><path d="M5.5 2.5a2.5 2.5 0 0 1 5 0v7.55a3.5 3.5 0 1 1-5 0zM8 1a1.5 1.5 0 0 0-1.5 1.5v7.987l-.167.15a2.5 2.5 0 1 0 3.333 0l-.166-.15V2.5A1.5 1.5 0 0 0 8 1"/>
      </svg> 지역별 날씨 현황'>
      <div v-if="overallStats" class="summary-bar">
        <span class="summary-item">
          <span class="summary-label">평균</span>
          <span class="summary-value">{{ displayAvgTemp }}{{ configStore.unitSymbol }}</span>
        </span>
        <span class="summary-sep">·</span>
        <span class="summary-item">
          <span class="summary-label">최고</span>
          <span class="summary-value">{{ displayMaxTemp }}{{ configStore.unitSymbol }}</span>
          <span class="summary-city">{{ overallStats.maxCity.name }}</span>
        </span>
        <span class="summary-sep">·</span>
        <span class="summary-item">
          <span class="summary-label">최저</span>
          <span class="summary-value">{{ displayMinTemp }}{{ configStore.unitSymbol }}</span>
          <span class="summary-city">{{ overallStats.minCity.name }}</span>
        </span>
        <span class="summary-time"><span v-html="ICONS.clock"></span> {{ formattedTime }}</span>
      </div>

      <div class="toolbar">
        <button
          type="button"
          class="mood-toggle"
          :class="{ active: showFilterPanel || activeFilterCount }"
          @click="showFilterPanel = !showFilterPanel"
        >
          필터{{ activeFilterCount ? ` (${activeFilterCount})` : '' }} {{ showFilterPanel ? '▲' : '▼' }}
        </button>
        <button
          type="button"
          class="flip-switch"
          role="switch"
          :aria-checked="allFlipped"
          @click="allFlipped = !allFlipped"
        >
          <span class="flip-switch__thumb" :class="{ 'is-right': allFlipped }"></span>
          <span class="flip-switch__option" :class="{ active: !allFlipped }">기본</span>
          <span class="flip-switch__option" :class="{ active: allFlipped }">상세</span>
        </button>
        <button
          type="button"
          class="search-toggle"
          :class="{ active: showSearch }"
          aria-label="도시 검색"
          @click="showSearch = !showSearch"
          v-html="ICONS.search"
        ></button>
      </div>

      <Transition name="search-fade">
        <div v-if="showSearch" class="search-panel">
          <SearchBar :search-query="searchQuery" @update-query="handleUpdateQuery" />
        </div>
      </Transition>

      <Transition name="search-fade">
        <div v-if="showFilterPanel" class="mood-filter">
          <p class="mood-filter__hint">같은 줄에서 여러 개 선택 = 그중 하나만 맞아도 OK · 다른 줄과 함께 선택 = 둘 다 만족해야 함</p>
          <div class="mood-filter__group">
            <p class="mood-filter__group-label">지역</p>
            <div class="mood-filter__chips">
              <button
                v-for="region in REGION_FILTERS"
                :key="region"
                type="button"
                class="mood-filter__chip"
                :class="{ active: region === '전체' ? selectedRegions.length === 0 : selectedRegions.includes(region) }"
                @click="toggleRegion(region)"
              >
                {{ region }}
              </button>
            </div>
          </div>
          <div v-for="group in MOOD_FILTER_GROUPS" :key="group.label" class="mood-filter__group">
            <p class="mood-filter__group-label"><span v-html="group.icon"></span> {{ group.label }}</p>
            <div class="mood-filter__chips">
              <button
                v-for="filter in group.filters"
                :key="filter.id"
                type="button"
                class="mood-filter__chip"
                :class="{ active: selectedMoodFilters.includes(filter.id) }"
                @click="toggleMoodFilter(filter.id)"
              >
                <span class="mood-filter__chip-icon" v-html="filter.icon"></span> {{ filter.label }}
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <p v-if="weatherStore.isLoading">날씨 정보를 불러오는 중입니다...</p>
      <p v-else-if="weatherStore.errorMessage" class="error">{{ weatherStore.errorMessage }}</p>

      <template v-else>
        <div v-if="groupedWeatherList.length > 0" class="region-groups">
          <section v-for="group in groupedWeatherList" :key="group.region" class="region-group">
            <h3 class="region-group__title">
              {{ group.region }}
              <span v-if="group.delta > 0" class="region-delta up">▲ {{ group.delta }}{{ configStore.unitSymbol }}</span>
              <span v-else-if="group.delta < 0" class="region-delta down">▼ {{ Math.abs(group.delta) }}{{ configStore.unitSymbol }}</span>
              <span v-else class="region-delta neutral">평균과 동일</span>
            </h3>
            <div class="card-list">
              <WeatherCard
                v-for="city in group.cities"
                :key="city.id"
                :city="city"
                :is-selected="selectedCityInfo?.id === city.id"
                :overall-avg="overallStats?.avgCelsius ?? null"
                :is-flipped="allFlipped"
                @select-card="handleSelectCard"
                @click-detail="handleClickDetail"
              />
            </div>
          </section>
        </div>
        <p v-else class="no-result">조건에 맞는 도시가 없습니다.</p>
      </template>

      <div class="status-bar">{{ statusMessage }}</div>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.all-cities {
  width: 80%;
  max-width: 1000px;
  margin: 0 auto;
}

.all-cities :deep(.dashboard-card__title) {
  font-size: 1.3rem;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.flip-switch {
  position: relative;
  display: inline-flex;
  width: 92px;
  height: 34px;
  padding: 3px;
  border: none;
  border-radius: 999px;
  background: #e3e6ea;
  cursor: pointer;
}

.flip-switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 3px);
  height: calc(100% - 6px);
  border-radius: 999px;
  background: #3d84e5;
  transition: transform 0.2s ease;
}

.flip-switch__thumb.is-right {
  transform: translateX(100%);
}

.flip-switch__option {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  transition: color 0.2s ease;
}

.flip-switch__option.active {
  color: #fff;
}

.mood-toggle {
  padding: 0 14px;
  height: 34px;
  border: none;
  border-radius: 999px;
  background: #f4f5f7;
  color: #555;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.mood-toggle:hover,
.mood-toggle.active {
  background: #3d84e5;
  color: #fff;
}

.mood-filter {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 8px 0 16px;
  padding: 12px;
  border-radius: 12px;
  background: #f8f9fb;
}

.mood-filter__hint {
  margin: 0;
  font-size: 0.72rem;
  color: #98a2b3;
}

.mood-filter__group-label {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0 0 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #555;
}

.mood-filter__group-label :deep(svg) {
  width: 1em;
  height: 1em;
}

.mood-filter__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mood-filter__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border: none;
  border-radius: 999px;
  background: #fff;
  color: #555;
  font-size: 0.82rem;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.mood-filter__chip-icon :deep(svg) {
  width: 1em;
  height: 1em;
  display: block;
}

.mood-filter__chip:hover {
  background: #e9ebee;
}

.mood-filter__chip.active {
  background: #3d84e5;
  color: #fff;
}

.search-toggle {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #f4f5f7;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.search-toggle:hover,
.search-toggle.active {
  background: #e6effc;
}

.search-toggle :deep(svg) {
  width: 1em;
  height: 1em;
}

.search-panel {
  margin: 8px 0 4px;
}

.search-fade-enter-active,
.search-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.search-fade-enter-from,
.search-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.summary-bar {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  row-gap: 4px;
  column-gap: 10px;
  margin: -4px 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #edf1f6;
  font-size: 0.95rem;
}

.summary-item {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}

.summary-label {
  color: #000;
}

.summary-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #000;
}

.summary-city {
  color: #000;
  font-size: 0.85rem;
}

.summary-sep {
  color: #d8dee7;
}

.summary-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: #98a2b3;
}

.summary-time :deep(svg) {
  width: 1em;
  height: 1em;
}

.region-delta {
  margin-left: 8px;
  font-size: 0.75rem;
  font-weight: 600;
}

.region-delta.up {
  color: #e5533d;
}

.region-delta.down {
  color: #3d84e5;
}

.region-delta.neutral {
  color: #999;
}

.status-bar {
  margin-top: 16px;
  padding: 10px 14px;
  background: #eafaf1;
  color: #2f7d4f;
  border-radius: 6px;
  font-size: 0.95rem;
  text-align: center;
}

.region-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.region-group__title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #000;
  padding-bottom: 6px;
  border-bottom: 1px solid #e6effc;
}

.card-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 720px) {
  .card-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 420px) {
  .card-list {
    grid-template-columns: 1fr;
  }
}

.no-result {
  color: #888;
}

.error {
  color: #e5533d;
}
</style>

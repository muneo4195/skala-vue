<script setup>
import { ref, computed, onMounted } from 'vue'
import WeatherHero from '../components/WeatherHero.vue'
import ClockCard from '../components/ClockCard.vue'
import JournalFab from '../components/JournalFab.vue'
import DiaryInlineForm from '../components/DiaryInlineForm.vue'
import TodoInlineForm from '../components/TodoInlineForm.vue'
import { useWeatherStore } from '../stores/weatherStore'
import { useConfigStore } from '../stores/configStore'
import { useJournalStore } from '../stores/journalStore'

const weatherStore = useWeatherStore()
const configStore = useConfigStore()
const journalStore = useJournalStore()

onMounted(weatherStore.loadCities)

// FAB에서 고른 종류('diary'|'todo')에 따라 즐겨찾기 카드 아래에 해당 작성 폼을 띄움
const activeForm = ref(null)

const handleDiarySave = ({ title, content }) => {
  journalStore.addDiaryEntry(title, content)
  activeForm.value = null
}

const handleTodoSave = (texts) => {
  journalStore.addTodoEntries(texts)
  activeForm.value = null
}

// 원본 데이터는 항상 섭씨 숫자로 유지, 화면 표시만 단위에 맞게 변환
const toDisplayTemp = (rawCelsius) =>
  configStore.unit === 'fahrenheit' ? (rawCelsius * 9) / 5 + 32 : rawCelsius

// 전국 평균/최고/최저 기온만 가볍게 요약 (전체 목록은 하단바의 "전체보기"에서)
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
</script>

<template>
  <div class="weather-home">
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
      </div>

      <div class="hero-row">
        <WeatherHero class="hero-row__item" />
        <ClockCard class="hero-row__item" />
      </div>

    <!-- 폼이 열려있는 동안엔 +버튼이 같은 자리에서 닫기(✕) 버튼으로 바뀜 -->
    <div class="journal-zone">
      <Transition name="pop-from-fab">
        <DiaryInlineForm v-if="activeForm === 'diary'" @save="handleDiarySave" @cancel="activeForm = null" />
        <TodoInlineForm v-else-if="activeForm === 'todo'" @save="handleTodoSave" @cancel="activeForm = null" />
      </Transition>
    </div>

    <JournalFab :active="!!activeForm" @choose="activeForm = $event" @close="activeForm = null" />
  </div>
</template>

<style scoped>
.weather-home {
  position: relative;
  width: 80%;
  max-width: 1000px;
  margin: 0 auto;
}

.journal-zone {
  position: relative;
}

.hero-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-bottom: 16px;
}

.hero-row__item {
  flex: 1 1 0;
  min-width: 0;
}

@media (max-width: 560px) {
  .hero-row {
    flex-direction: column;
  }
}

.pop-from-fab-enter-active,
.pop-from-fab-leave-active {
  transform-origin: bottom right;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.pop-from-fab-enter-from,
.pop-from-fab-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(6px);
}

.summary-bar {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  row-gap: 4px;
  column-gap: 10px;
  margin: 0 0 12px;
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
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  color: #000;
}

.summary-city {
  color: #000;
  font-size: 0.85rem;
}

.summary-sep {
  color: #c9cfd8;
}
</style>

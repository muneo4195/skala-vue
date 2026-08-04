<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UnitToggler from './components/exercise/UnitToggler.vue'
import BottomNavBar from './components/BottomNavBar.vue'
import WeatherFxLayer from './components/WeatherFxLayer.vue'
import WeatherHomeView from './views/WeatherHomeView.vue'
import WeatherAllCitiesView from './views/WeatherAllCitiesView.vue'
import WeatherAboutView from './views/WeatherAboutView.vue'
import WeatherDetailView from './views/WeatherDetailView.vue'
import { useWeatherStore } from './stores/weatherStore'
import { useFavoriteStore } from './stores/favoriteStore'
import { getWeatherTheme } from './utils/weatherTheme'
import { ICONS } from './utils/icons'

const route = useRoute()
const router = useRouter()
const weatherStore = useWeatherStore()
const favoriteStore = useFavoriteStore()

// 서비스 소개는 별도 탭 대신, 제목 옆 아이콘을 눌렀을 때만 뜨는 팝업으로 이동
const showInfo = ref(false)

// 상세보기는 별도 페이지 전환 대신, 방금 있던 화면을 뒤에 살짝 남겨둔 채 팝업으로 띄움
const isDetailModal = computed(() => route.name === 'weather-detail')
const closeModal = () => router.back()

// 상세보기 뒤에 보여줄 화면(홈/전체보기/소개)을 기억해둠 — RouterView를 직접 껐다 켜면
// 배경 화면이 통째로 사라져 버려서, 대신 이 이름으로 실제 컴포넌트를 계속 그대로 유지함
const backgroundRouteName = ref(route.name)
router.beforeEach((to) => {
  if (to.name !== 'weather-detail') {
    backgroundRouteName.value = to.name
  }
})

// 소개(내 기록) 페이지에서는 날씨 단위가 의미 없어서 제목만 바꾸고 토글은 숨김
const isRecordsPage = computed(() => backgroundRouteName.value === 'about')
const headerTitle = computed(() => (isRecordsPage.value ? '내 기록' : '현재 날씨'))

// 즐겨찾기 도시의 날씨색을 모든 페이지 배경에 옅게 깔아줌 (시간대 배경은 더 이상 안 씀)
const heroTheme = computed(() =>
  getWeatherTheme(weatherStore.getCityById(favoriteStore.favoriteCityId)?.status),
)

// 배경(반투명 오버레이) 전체에 날씨 효과를 깔기 위해 여기서도 같은 테마를 계산
const backdropCity = computed(() =>
  isDetailModal.value ? weatherStore.getCityById(route.params.cityId) : null,
)
const backdropTheme = computed(() => getWeatherTheme(backdropCity.value?.status))
</script>

<template>
  <div class="app-shell">
    <div class="ambient-glow" :style="{ background: heroTheme.gradient }" aria-hidden="true"></div>
    <div class="background-fx" aria-hidden="true">
      <WeatherFxLayer :effect="heroTheme.effect" :snow-count="30" />
    </div>
    <div class="noise-overlay" aria-hidden="true"></div>

    <header class="app-header">
      <div class="app-title">
        <h1><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 640 640">
            <path d="M160 96C160 78.3 174.3 64 192 64L448 64C465.7 64 480 78.3 480 96C480 113.7 465.7 128 448 128L418.5 128L428.8 262.1C465.9 283.3 494.6 318.5 507 361.8L510.8 375.2C513.6 384.9 511.6 395.2 505.6 403.3C499.6 411.4 490 416 480 416L160 416C150 416 140.5 411.3 134.5 403.3C128.5 395.3 126.5 384.9 129.3 375.2L133 361.8C145.4 318.5 174 283.3 211.2 262.1L221.5 128L192 128C174.3 128 160 113.7 160 96zM288 464L352 464L352 576C352 593.7 337.7 608 320 608C302.3 608 288 593.7 288 576L288 464z"/>
            </svg> {{ headerTitle }}</h1>
        <button type="button" class="info-button" aria-label="서비스 소개" @click="showInfo = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 640 640">
            <path d="M320 64C306.7 64 296 74.7 296 88L296 97.7C214.6 109.3 152 179.4 152 264L152 278.5C152 316.2 142 353.2 123 385.8L101.1 423.2C97.8 429 96 435.5 96 442.2C96 463.1 112.9 480 133.8 480L506.2 480C527.1 480 544 463.1 544 442.2C544 435.5 542.2 428.9 538.9 423.2L517 385.7C498 353.1 488 316.1 488 278.4L488 263.9C488 179.3 425.4 109.2 344 97.6L344 87.9C344 74.6 333.3 63.9 320 63.9zM488.4 432L151.5 432L164.4 409.9C187.7 370 200 324.6 200 278.5L200 264C200 197.7 253.7 144 320 144C386.3 144 440 197.7 440 264L440 278.5C440 324.7 452.3 370 475.5 409.9L488.4 432zM252.1 528C262 556 288.7 576 320 576C351.3 576 378 556 387.9 528L252.1 528z"/>
          </svg>
        </button>
      </div>
      <UnitToggler v-if="!isRecordsPage" />
    </header>

    <Transition name="modal-fade">
      <div v-if="showInfo" class="info-backdrop" @click.self="showInfo = false">
        <div class="info-modal">
          <button type="button" class="info-modal__close" aria-label="닫기" @click="showInfo = false" v-html="ICONS.close"></button>
          <h2 class="info-modal__title">서비스 소개</h2>
          <p class="info-modal__intro">
            본 앱은 Vue 3 및 Vue Router 4 기반 제작된 실습용 가상 관측 대시보드 시스템입니다.
          </p>
          <ul class="info-modal__list">
            <li><code>components/exercise/</code> 폴더 내부의 독립 부품 컴포넌트</li>
            <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
            <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
          </ul>
        </div>
      </div>
    </Transition>

    <!-- 상세보기로 이동해도 이전 화면(홈/전체보기/소개)이 사라지지 않도록 KeepAlive로 계속 유지 -->
    <div class="page-content" :class="{ dimmed: isDetailModal }">
      <KeepAlive>
        <WeatherHomeView v-if="backgroundRouteName === 'home'" key="home" />
        <WeatherAllCitiesView v-else-if="backgroundRouteName === 'all-cities'" key="all-cities" />
        <WeatherAboutView v-else-if="backgroundRouteName === 'about'" key="about" />
      </KeepAlive>
    </div>

    <Transition name="modal-fade">
      <div v-if="isDetailModal" class="modal-backdrop" @click.self="closeModal">
        <WeatherFxLayer :effect="backdropTheme.effect" :snow-count="40" />
        <WeatherDetailView />
      </div>
    </Transition>

    <BottomNavBar />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  margin: 0 auto;
  padding: clamp(16px, 4vw, 32px);
  padding-bottom: calc(clamp(16px, 4vw, 32px) + 76px);
}

/* 즐겨찾기 도시의 날씨색을 화면 전체 배경에 진하게 깔고, 가장자리는 부드럽게 사라지도록 함 */
.ambient-glow {
  position: fixed;
  inset: -25%;
  z-index: -1;
  filter: blur(110px);
  opacity: 0.85;
  pointer-events: none;
  transition: background 0.6s ease;
  -webkit-mask-image: radial-gradient(ellipse at center, black 35%, transparent 85%);
  mask-image: radial-gradient(ellipse at center, black 35%, transparent 85%);
}

/* 즐겨찾기 도시 날씨에 맞는 효과(빛망울/구름/빗줄기/눈)를 배경 전체에 깔아줌 */
.background-fx {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

/* 필름 그레인 질감을 아주 옅게 얹어서 디지털한 느낌을 눌러줌 */
.noise-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  mix-blend-mode: multiply;
  z-index: 60;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

h1 {
  font-size: clamp(1.25rem, 3rem + 1vw, 1.75rem);
  margin: 0;
  font-family: var(--font-heading);
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 80%;
  max-width: 1000px;
  margin: 0 auto 16px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-button {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  color: #666;
  font-size: 0.8rem;
  font-style: italic;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}

.info-button:hover {
  background: rgba(0, 0, 0, 0.15);
}

.info-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.35);
}

.info-modal {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 20px;
  padding: 24px 20px 20px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}

.info-modal__close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.info-modal__close :deep(svg) {
  width: 1em;
  height: 1em;
}

.info-modal__title {
  margin: 0 0 12px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #2b3a55;
}

.info-modal__intro {
  margin: 0 0 14px;
  color: #333;
  line-height: 1.6;
  font-size: 0.9rem;
}

.info-modal__list {
  margin: 0;
  padding-left: 20px;
  color: #555;
  line-height: 1.8;
  font-size: 0.85rem;
}

.info-modal__list code {
  background: #f2f2f2;
  padding: 2px 6px;
  border-radius: 4px;
  color: #c0392b;
  font-size: 0.9em;
}

.page-content {
  transition:
    filter 0.25s ease,
    opacity 0.25s ease;
}

.page-content.dimmed {
  filter: blur(2px);
  opacity: 0.75;
  pointer-events: none;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active :deep(.weather-detail),
.modal-fade-leave-active :deep(.weather-detail) {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from :deep(.weather-detail),
.modal-fade-leave-to :deep(.weather-detail) {
  transform: scale(0.95);
}

</style>

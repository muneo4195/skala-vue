<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UnitToggler from './components/exercise/UnitToggler.vue'
import WeatherPlaylist from './components/WeatherPlaylist.vue'
import BottomNavBar from './components/BottomNavBar.vue'
import WeatherFxLayer from './components/WeatherFxLayer.vue'
import JournalFab from './components/JournalFab.vue'
import DiaryInlineForm from './components/DiaryInlineForm.vue'
import TodoInlineForm from './components/TodoInlineForm.vue'
import WeatherHomeView from './views/WeatherHomeView.vue'
import WeatherAllCitiesView from './views/WeatherAllCitiesView.vue'
import WeatherAboutView from './views/WeatherAboutView.vue'
import WeatherDetailView from './views/WeatherDetailView.vue'
import { useWeatherStore } from './stores/weatherStore'
import { useFavoriteStore } from './stores/favoriteStore'
import { useJournalStore } from './stores/journalStore'
import { getWeatherTheme } from './utils/weatherTheme'
import { ICONS } from './utils/icons'

const route = useRoute()
const router = useRouter()
const weatherStore = useWeatherStore()
const favoriteStore = useFavoriteStore()
const journalStore = useJournalStore()

// 서비스 소개 대신, 제목 옆 종 아이콘을 눌렀을 때만 뜨는 "알림" 팝업으로 이동.
// 화면 곳곳에 숨어있는(버튼 설명만으론 다 안 보이는) 동작 방식을 짧게 안내함
const showInfo = ref(false)

const NOTICES = [
  '즐겨찾기(⭐)를 누르면 대표 도시가 바뀌고 관련된 노래와 배경화면도 함께 바뀝니다.',
  '전체보기의 카드를 클릭하면 바로 그 도시의 상세 날씨로 이동합니다.',
  '필터는 같은 줄에서 여러 개 고르면 그중 하나만 맞아도 되고 다른 줄과 함께 고르면 두 조건을 모두 만족해야 합니다.',
  '+ 버튼으로 쓰던 일기·할일은 X로 닫아도 내용이 그대로 남고 초기화 버튼을 눌러야 지워집니다.',
  '기온 슬라이더를 켜면 원하는 범위의 도시만 볼 수 있습니다.',
]

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

// 일기/할일 작성 FAB은 홈/소개 페이지에서만 보이고 전체보기에서는 숨김.
// 이제 페이지(WeatherHomeView)가 아니라 여기 App 레벨에 둬서, .page-content가
// (알림/상세보기 팝업 때문에) filter로 흐려져도 그 영향을 받지 않음 —
// filter가 걸린 조상 안에 있으면 position:fixed 기준이 뷰포트가 아니라 그
// 조상으로 바뀌어서 FAB이 튀어보이는 문제가 있었음
const showJournalFab = computed(() => backgroundRouteName.value !== 'all-cities')

// FAB에서 고른 종류('diary'|'todo')에 따라 팝업으로 해당 작성 폼을 띄움
const activeForm = ref(null)

// 작성 중인 내용을 자식 컴포넌트가 아니라 여기(부모)에 둬서, X로 팝업을 닫았다
// 다시 열어도 내용이 그대로 남아있게 함(팝업이 닫히면 자식은 사라지므로 자식
// 안에 두면 내용이 날아감). "취소" 버튼은 이 draft를 직접 비워서 초기화함
const diaryDraft = ref({ title: '', content: '', rating: 0 })

// 할 일을 쓸 때 기본으로 열어두는 빈 칸 개수
const DEFAULT_TODO_ROWS = 5
const todoDraftItems = ref(Array(DEFAULT_TODO_ROWS).fill(''))

const resetDiaryDraft = () => {
  diaryDraft.value.title = ''
  diaryDraft.value.content = ''
  diaryDraft.value.rating = 0
}

const resetTodoDraft = () => {
  todoDraftItems.value = Array(DEFAULT_TODO_ROWS).fill('')
}

const handleDiarySave = ({ title, content, rating }) => {
  journalStore.addDiaryEntry(title, content, rating)
  resetDiaryDraft()
  activeForm.value = null
}

const handleTodoSave = (texts) => {
  journalStore.addTodoEntries(texts)
  resetTodoDraft()
  activeForm.value = null
}

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

    <header class="app-header" :class="{ dimmed: isDetailModal || showInfo }">
      <div class="app-title">
        <h1><svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 640 640">
            <path d="M160 96C160 78.3 174.3 64 192 64L448 64C465.7 64 480 78.3 480 96C480 113.7 465.7 128 448 128L418.5 128L428.8 262.1C465.9 283.3 494.6 318.5 507 361.8L510.8 375.2C513.6 384.9 511.6 395.2 505.6 403.3C499.6 411.4 490 416 480 416L160 416C150 416 140.5 411.3 134.5 403.3C128.5 395.3 126.5 384.9 129.3 375.2L133 361.8C145.4 318.5 174 283.3 211.2 262.1L221.5 128L192 128C174.3 128 160 113.7 160 96zM288 464L352 464L352 576C352 593.7 337.7 608 320 608C302.3 608 288 593.7 288 576L288 464z"/>
            </svg> {{ headerTitle }}</h1>
        <button type="button" class="info-button" aria-label="알림" @click="showInfo = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 640 640">
            <path d="M320 64C306.7 64 296 74.7 296 88L296 97.7C214.6 109.3 152 179.4 152 264L152 278.5C152 316.2 142 353.2 123 385.8L101.1 423.2C97.8 429 96 435.5 96 442.2C96 463.1 112.9 480 133.8 480L506.2 480C527.1 480 544 463.1 544 442.2C544 435.5 542.2 428.9 538.9 423.2L517 385.7C498 353.1 488 316.1 488 278.4L488 263.9C488 179.3 425.4 109.2 344 97.6L344 87.9C344 74.6 333.3 63.9 320 63.9zM488.4 432L151.5 432L164.4 409.9C187.7 370 200 324.6 200 278.5L200 264C200 197.7 253.7 144 320 144C386.3 144 440 197.7 440 264L440 278.5C440 324.7 452.3 370 475.5 409.9L488.4 432zM252.1 528C262 556 288.7 576 320 576C351.3 576 378 556 387.9 528L252.1 528z"/>
          </svg>
        </button>
      </div>
      <!-- WeatherPlaylist는 페이지가 바뀌어도 계속 재생돼야 해서 v-if 밖에 항상 둠.
           (예전엔 이 div 전체가 소개 페이지에서 사라지면서 재생 중이던 노래도 같이 끊겼음) -->
      <div class="app-header__right">
        <WeatherPlaylist />
        <UnitToggler v-if="!isRecordsPage" />
      </div>
    </header>

    <Transition name="modal-fade">
      <div v-if="showInfo" class="info-backdrop" @click.self="showInfo = false">
        <div class="info-modal">
          <button type="button" class="info-modal__close" aria-label="닫기" @click="showInfo = false" v-html="ICONS.close"></button>
          <h2 class="info-modal__title">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 640 640">
              <path d="M320 64C306.7 64 296 74.7 296 88L296 97.7C214.6 109.3 152 179.4 152 264L152 278.5C152 316.2 142 353.2 123 385.8L101.1 423.2C97.8 429 96 435.5 96 442.2C96 463.1 112.9 480 133.8 480L506.2 480C527.1 480 544 463.1 544 442.2C544 435.5 542.2 428.9 538.9 423.2L517 385.7C498 353.1 488 316.1 488 278.4L488 263.9C488 179.3 425.4 109.2 344 97.6L344 87.9C344 74.6 333.3 63.9 320 63.9zM488.4 432L151.5 432L164.4 409.9C187.7 370 200 324.6 200 278.5L200 264C200 197.7 253.7 144 320 144C386.3 144 440 197.7 440 264L440 278.5C440 324.7 452.3 370 475.5 409.9L488.4 432zM252.1 528C262 556 288.7 576 320 576C351.3 576 378 556 387.9 528L252.1 528z"/>
            </svg>
            알림
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 640 640">
              <path d="M320 64C306.7 64 296 74.7 296 88L296 97.7C214.6 109.3 152 179.4 152 264L152 278.5C152 316.2 142 353.2 123 385.8L101.1 423.2C97.8 429 96 435.5 96 442.2C96 463.1 112.9 480 133.8 480L506.2 480C527.1 480 544 463.1 544 442.2C544 435.5 542.2 428.9 538.9 423.2L517 385.7C498 353.1 488 316.1 488 278.4L488 263.9C488 179.3 425.4 109.2 344 97.6L344 87.9C344 74.6 333.3 63.9 320 63.9zM488.4 432L151.5 432L164.4 409.9C187.7 370 200 324.6 200 278.5L200 264C200 197.7 253.7 144 320 144C386.3 144 440 197.7 440 264L440 278.5C440 324.7 452.3 370 475.5 409.9L488.4 432zM252.1 528C262 556 288.7 576 320 576C351.3 576 378 556 387.9 528L252.1 528z"/>
            </svg>
          </h2>
          <!-- 실제로 체크하는 목록이 아니라, 앱 동작 방식을 짧게 안내하는 용도라
               클릭은 안 되고 보기만 함 -->
          <ul class="info-modal__notices">
            <li v-for="notice in NOTICES" :key="notice" class="info-modal__notice">
              <span class="info-modal__notice-check" aria-hidden="true">✓</span>
              {{ notice }}
            </li>
          </ul>
        </div>
      </div>
    </Transition>

    <!-- 상세보기로 이동해도 이전 화면(홈/전체보기/소개)이 사라지지 않도록 KeepAlive로 계속 유지 -->
    <div class="page-content" :class="{ dimmed: isDetailModal || showInfo }">
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

    <!-- .page-content 안이 아니라 여기 최상위(app-shell)에 바로 둬서, 알림/상세보기
         팝업의 dimmed(filter: blur) 효과가 걸릴 조상이 없도록 함 -->
    <template v-if="showJournalFab">
      <!-- +버튼은 폼이 열려있는 동안 같은 자리에서 닫기(✕) 버튼으로 바뀌고
           팝업보다 z-index가 높아서 배경이 흐려져도 항상 또렷하게 눌림.
           카드는 +버튼과 같은 오른쪽 기준선(.journal-track)을 써서 그 바로
           위에서 나타나고 transform-origin도 오른쪽 아래라 +버튼에서
           튀어나오는 느낌으로 열림 -->
      <Transition name="journal-fade">
        <div v-if="activeForm" class="journal-backdrop" @click.self="activeForm = null">
          <div class="journal-track">
            <DiaryInlineForm v-if="activeForm === 'diary'" v-model:draft="diaryDraft" @save="handleDiarySave" />
            <TodoInlineForm v-else-if="activeForm === 'todo'" v-model:items="todoDraftItems" @save="handleTodoSave" />
          </div>
        </div>
      </Transition>

      <JournalFab :active="!!activeForm" @choose="activeForm = $event" @close="activeForm = null" />
    </template>

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

/* 즐겨찾기 도시의 날씨색을 화면 전체 배경에 진하게 깔고 가장자리는 부드럽게 사라지도록 함 */
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
  font-size: clamp(2rem, 3rem + 1vw, 3rem);
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
  transition:
    filter 0.25s ease,
    opacity 0.25s ease;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 날씨 플레이리스트 버튼을 온도 단위 토글 바로 옆에 나란히 둠 */
.app-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.info-button {
  border: none;
  background: transparent;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.info-button:hover {
  color: #333;
  transform: scale(1.12);
}

.info-backdrop {
  position: fixed;
  inset: 0;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  /* 상세보기 팝업(.modal-backdrop)과 똑같은 방식: 뒤 화면 자체를 블러(.dimmed)로
     흐려서 "안 보이게" 만들고 배경은 진한 색을 칠하는 대신 옅은 톤만 얹음 */
  background: rgba(15, 23, 42, 0.16);
}

.info-modal {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: #fff;
  border-radius: 20px;
  padding: 32px 28px 28px;
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

/* "지역별 날씨 현황"과 같은 크기·굵기로 맞춤 */
.info-modal__title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 1.3rem;
  font-weight: normal;
  color: #2b3a55;
}

.info-modal__notices {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* "알림" 제목(1.3rem)의 0.8배 크기 */
.info-modal__notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #444;
  line-height: 1.5;
  font-size: 1.04rem;
}

.info-modal__notice-check {
  flex-shrink: 0;
  width: 21px;
  height: 21px;
  margin-top: 1px;
  border-radius: 6px;
  background: #3d84e5;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-content {
  transition:
    filter 0.25s ease,
    opacity 0.25s ease;
}

.dimmed {
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

/* 배경을 완전히 덮는 대신 블러 처리(backdrop-filter)로 "불투명"하게 만들어서
   뒤 내용이 안 읽히게 함. FAB(닫기 X 버튼)는 이 레이어 밖의 별도 요소라
   블러/투명도의 영향을 안 받고 항상 또렷하게 보이고 눌림 */
.journal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  /* FAB(높이 52px)와 fab-layer의 하단 여백(76px+16px) 위로 살짝 띄워서 카드가
     +버튼 바로 위에 놓이도록 함 */
  padding: 0 clamp(16px, 4vw, 32px) calc(76px + 16px + 52px + 14px);
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

/* fab-track과 동일한 폭/정렬 기준을 써서, 카드의 오른쪽 끝이 +버튼의
   오른쪽 끝과 정확히 같은 세로선에 놓이도록 함 */
.journal-track {
  width: 80%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-end;
}

.journal-fade-enter-active,
.journal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.journal-fade-enter-from,
.journal-fade-leave-to {
  opacity: 0;
}

/* +버튼에서 튀어나오는 느낌을 주기 위해 오른쪽 아래를 기준점으로 확대되며 나타남 */
.journal-fade-enter-active :deep(.inline-form),
.journal-fade-leave-active :deep(.inline-form) {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
  transform-origin: bottom right;
}

.journal-fade-enter-from :deep(.inline-form),
.journal-fade-leave-to :deep(.inline-form) {
  opacity: 0;
  transform: scale(0.75) translateY(16px);
}

</style>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWeatherStore } from '../stores/weatherStore'
import { useFavoriteStore } from '../stores/favoriteStore'

const weatherStore = useWeatherStore()
const favoriteStore = useFavoriteStore()

const heroCity = computed(() => weatherStore.getCityById(favoriteStore.favoriteCityId))

// 검색어 기반 임베드(listType=search)는 유튜브가 사실상 막아놔서 "동영상을
// 사용할 수 없음"으로 뜨는 경우가 많아, 실제 존재가 확인된 영상 ID로 바꿈.
// 직접 안 받은 상태(뇌우/안개/흐림/구름 많음)는 분위기가 비슷한 걸 재사용
const VIDEO_ID_BY_STATUS = [
  { match: '눈', id: 'btUz4tiQMJs' },
  { match: '뇌우', id: 'Yc03GLbJ51U' },
  { match: '비', id: 'Yc03GLbJ51U' },
  { match: '안개', id: 'X13DNrfmvTI' },
  { match: '흐림', id: 'X13DNrfmvTI' },
  { match: '많음', id: 'X13DNrfmvTI' },
  { match: '구름', id: 'X13DNrfmvTI' },
  { match: '맑음', id: '9aeCgBBnmYI' },
]
const DEFAULT_VIDEO_ID = '9aeCgBBnmYI'

function getVideoId(status) {
  const text = status ?? ''
  return VIDEO_ID_BY_STATUS.find((s) => text.includes(s.match))?.id ?? DEFAULT_VIDEO_ID
}

// 버튼 클릭(사용자 제스처) 안에서 열리므로 autoplay가 브라우저에 막히지 않고 바로 재생됨
const embedSrc = computed(
  () => `https://www.youtube.com/embed/${getVideoId(heroCity.value?.status)}?autoplay=1`,
)

// 화면에 재생창을 띄우지 않고 버튼으로 소리만 껐다 켰다 하는 방식.
// iframe을 display:none으로 감추면 재생이 멈추는 브라우저가 있어서,
// 화면 밖으로 밀어내는 방식(위치만 숨김)으로 계속 재생되게 함
const playing = ref(false)

// 즐겨찾기(대표 도시)를 새로 지정할 때마다 그 도시 날씨에 맞는 노래가 자동 재생됨.
// 즐겨찾기 지정 자체가 별표 클릭(사용자 동작)이라 자동재생이 브라우저에 막히지 않음
watch(
  () => favoriteStore.favoriteCityId,
  () => {
    playing.value = true
  },
)
</script>

<template>
  <el-tooltip v-if="heroCity" content="즐겨찾기된 지역의 날씨에 맞는 노래 추천해드립니다" placement="bottom">
    <button
      type="button"
      class="weather-playlist__toggle"
      :class="{ active: playing }"
      :aria-label="`${heroCity.status}에 어울리는 노래 ${playing ? '정지' : '재생'}`"
      @click="playing = !playing"
    >
      {{ playing ? '■' : '▶' }}
    </button>
  </el-tooltip>
  <iframe
    v-if="heroCity && playing"
    class="weather-playlist__hidden-frame"
    :src="embedSrc"
    title="날씨 어울리는 노래"
    frameborder="0"
    allow="autoplay; encrypted-media"
  ></iframe>
</template>

<style scoped>
.weather-playlist__toggle {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  background: #f4f5f7;
  color: #444;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.weather-playlist__toggle:hover {
  background: #e6effc;
  color: #3d6fa8;
}

.weather-playlist__toggle.active {
  background: #3d84e5;
  color: #fff;
}

/* 화면에는 안 보이지만 재생은 계속되도록 화면 밖에 배치 */
.weather-playlist__hidden-frame {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  border: none;
}
</style>

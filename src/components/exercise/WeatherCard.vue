<script setup>
import { ref, computed } from 'vue'
import { useConfigStore } from '../../stores/configStore'
import { useFavoriteStore } from '../../stores/favoriteStore'
import { useCurrentTime } from '../../composables/useCurrentTime'
import { getWeatherTheme } from '../../utils/weatherTheme'
import { getMoodLine, getMoodIcon } from '../../utils/weatherMood'
import { ICONS } from '../../utils/icons'
import WeatherFxLayer from '../WeatherFxLayer.vue'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  // 전국 평균 기온(섭씨) — 카드에 평균 대비 편차를 표시하기 위해 부모가 전달
  overallAvg: {
    type: Number,
    default: null,
  },
  // 토글 하나로 모든 카드를 한꺼번에 뒤집기 위한 공용 상태
  isFlipped: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()
const { timeOfDay } = useCurrentTime()

const theme = computed(() => getWeatherTheme(props.city.status))
const moodLine = computed(() => getMoodLine(timeOfDay.value, props.city.status))
const moodIcon = computed(() => getMoodIcon(timeOfDay.value, props.city.status))

// 카드마다 항상 날씨 효과(캔버스 포함)를 돌리면 그리드 전체에서 버벅일 수 있어서,
// 마우스가 올라가 있거나 선택된 카드에서만 재생함
const isHovered = ref(false)
const showFx = computed(() => isHovered.value || props.isSelected)

// ⭐ 이 도시를 홈 화면 히어로에 보여줄 대표 도시로 설정
const isFavorite = computed(() => favoriteStore.favoriteCityId === props.city.id)
const toggleFavorite = () => {
  favoriteStore.setFavorite(props.city.id)
}

// 원본 데이터는 항상 섭씨 숫자로 유지, 화면 표시만 단위에 맞게 변환
const toDisplayTemp = (rawCelsius) =>
  configStore.unit === 'fahrenheit' ? Math.round((rawCelsius * 9) / 5 + 32) : rawCelsius

const displayTemp = computed(() => toDisplayTemp(props.city.temp))
const displayFeelsLike = computed(() => toDisplayTemp(props.city.feelsLike))

// 전국 평균 대비 이 도시가 얼마나 높은지/낮은지
const tempDelta = computed(() => {
  if (props.overallAvg === null) return null
  const deltaCelsius = props.city.temp - props.overallAvg
  const displayDelta = configStore.unit === 'fahrenheit' ? (deltaCelsius * 9) / 5 : deltaCelsius
  return Math.round(displayDelta * 10) / 10
})

// 별도 "상세보기" 버튼 없이, 카드를 선택하는 것 자체가 곧 상세보기로 이동함
const onSelect = () => {
  emit('select-card', props.city)
  emit('click-detail', props.city)
}
</script>

<template>
  <!-- 카드 자체가 상세보기로 가는 클릭 영역이라, 호버 시 el-tooltip으로
       무슨 동작인지 안내함 -->
  <el-tooltip :content="`${city.name} 상세 날씨 보러 가기`" placement="top">
    <div
      class="weather-card"
      :class="{ selected: isSelected }"
      :style="{ '--card-bg': theme.soft }"
      @click="onSelect"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="weather-card__flip" :class="{ flipped: isFlipped }">
        <div
          class="weather-card__face weather-card__face--front"
          :style="{ background: theme.soft }"
        >
          <div v-if="showFx" class="weather-card__fx" aria-hidden="true">
            <WeatherFxLayer :effect="theme.effect" :snow-count="10" />
          </div>
          <div class="weather-card__top">
            <button
              type="button"
              class="favorite-toggle"
              :aria-label="isFavorite ? '대표 도시로 설정됨' : '대표 도시로 설정'"
              @click.stop="toggleFavorite"
            >
              <Transition name="star-pop" mode="out-in">
                <span
                  :key="isFavorite"
                  v-html="isFavorite ? ICONS.starFill : ICONS.starOutline"
                ></span>
              </Transition>
            </button>
            <h3 class="weather-card__name">{{ city.name }}</h3>
            <span v-if="city.temp >= 25" class="tag hot">더움</span>
            <span v-else class="tag cool">선선함</span>
          </div>

          <div class="weather-card__icon" v-html="theme.icon"></div>
          <p class="weather-card__temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>
          <p
            v-if="tempDelta !== null"
            class="weather-card__delta"
            :class="tempDelta > 0 ? 'up' : tempDelta < 0 ? 'down' : 'neutral'"
          >
            {{ tempDelta > 0 ? '▲' : tempDelta < 0 ? '▼' : '' }} 평균보다
            {{ tempDelta === 0 ? '동일' : `${Math.abs(tempDelta)}${configStore.unitSymbol}` }}
          </p>
          <p class="weather-card__status">{{ city.status }}</p>
        </div>

        <div
          class="weather-card__face weather-card__face--back"
          :style="{ background: theme.soft }"
        >
          <h3 class="weather-card__name">{{ city.name }}</h3>
          <p class="weather-card__back-mood">
            {{ moodLine }}
            <span v-if="moodIcon" class="weather-card__back-mood-icon" v-html="moodIcon"></span>
          </p>
          <div class="weather-card__back-stats">
            <div class="back-stat">
              <span class="back-stat__label">체감</span>
              <span class="back-stat__value"
                >{{ displayFeelsLike }}{{ configStore.unitSymbol }}</span
              >
            </div>
            <div class="back-stat">
              <span class="back-stat__label">바람</span>
              <span class="back-stat__value">{{ city.windSpeed }}m/s</span>
            </div>
            <div class="back-stat">
              <span class="back-stat__label">습도</span>
              <span class="back-stat__value">{{ city.humidity }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-tooltip>
</template>

<style scoped>
.weather-card {
  position: relative;
  border-radius: 16px;
  cursor: pointer;
  transform-origin: center;
  box-shadow: 0 6px 18px rgba(20, 20, 30, 0.05);
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
}

.weather-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(20, 20, 30, 0.1);
  z-index: 1;
}

.weather-card:active {
  transform: scale(1.03);
}

/* 선택된 카드만 포스트잇처럼 접힌 모서리를 보여주고 살짝 들썩이며 종이 느낌을 강화 */
.weather-card.selected {
  position: relative;
  overflow: hidden;
  transform: translateY(-4px) rotate(-0.35deg);
  z-index: 2;
  box-shadow: 0 18px 40px rgba(40, 34, 10, 0.16);
}

/* 우측 하단을 포스트잇 밑부분처럼 접은 효과: 45도 회전된 정사각형 가상 요소를
   모서리에 걸쳐 놓고 카드의 overflow: hidden으로 절반을 잘라내 삼각형처럼 보이게 함.
   색상은 카드 배경색(theme.soft)과 동일하게 맞추고 box-shadow로 입체감을 줌 */
.weather-card.selected::after {
  content: '';
  position: absolute;
  right: -15px;
  bottom: -15px;
  width: 30px;
  height: 30px;
  background: var(--card-bg);
  transform: rotate(45deg);
  box-shadow: -3px 3px 6px rgba(0, 0, 0, 0.3);
  z-index: 3;
  pointer-events: none;
}

.weather-card__flip {
  position: relative;
  min-height: 260px;
  transition:
    transform 0.6s,
    clip-path 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  transform-style: preserve-3d;
}

.weather-card__flip.flipped {
  transform: rotateY(180deg);
}

.weather-card__face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 5px;
  padding: 14px 12px;
  border-radius: 16px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

/* 마우스를 올리거나 선택했을 때만 뜨는 날씨 효과. z-index를 음수로 둬서
   카드 배경 위, 글자·아이콘 같은 일반 콘텐츠보다는 아래에 깔리게 함 */
.weather-card__fx {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.weather-card__face--back {
  transform: rotateY(180deg);
  justify-content: center;
}

.weather-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
  gap: 8px;
}

.weather-card__name {
  margin: 0;
  font-size: 1.1rem;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.favorite-toggle {
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 1.2rem;
  line-height: 1;
  color: #f5b942;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.favorite-toggle :deep(svg) {
  width: 1em;
  height: 1em;
  display: block;
}

.star-pop-enter-active {
  animation: star-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes star-bounce {
  0% {
    transform: scale(0.3);
  }
  60% {
    transform: scale(1.35);
  }
  100% {
    transform: scale(1);
  }
}

.favorite-toggle:hover {
  transform: scale(1.2);
}

.weather-card__icon {
  font-size: 3.6rem;
  line-height: 1;
  margin: 6px 0 2px;
}

/* theme.icon은 v-html로 주입되므로, scoped 셀렉터가 안 먹혀서 :deep() 사용 */
.weather-card__icon :deep(svg) {
  width: 1em;
  height: 1em;
  animation: icon-float 3.4s ease-in-out infinite;
}

@keyframes icon-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.weather-card__temp {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 800;
  color: #222;
}

.weather-card__delta {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.weather-card__delta.up {
  color: #e5533d;
}

.weather-card__delta.down {
  color: #3d84e5;
}

.weather-card__delta.neutral {
  color: #999;
}

.weather-card__status {
  margin: 0;
  color: #444;
  font-size: 0.95rem;
  font-weight: 700;
}

.weather-card__back-mood {
  margin: 4px 0 8px;
  font-size: 0.92rem;
  color: #555;
}

.weather-card__back-mood-icon {
  display: inline-flex;
  vertical-align: -0.15em;
}

.weather-card__back-mood-icon :deep(svg) {
  width: 1em;
  height: 1em;
}

.weather-card__back-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.back-stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  font-size: 0.92rem;
}

.back-stat__label {
  color: #777;
}

.back-stat__value {
  font-weight: 700;
  color: #2b3a55;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.tag.hot {
  background: #ffe1d6;
  color: #c15a3b;
}

.tag.cool {
  background: #dbe9fb;
  color: #3d6fa8;
}
</style>

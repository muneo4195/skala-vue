<script setup>
import { computed, nextTick, ref } from 'vue'
import { ICONS } from '../utils/icons'
import { useWeatherStore } from '../stores/weatherStore'
import { useFavoriteStore } from '../stores/favoriteStore'

// 부모(WeatherHomeView)가 들고 있는 배열을 v-model로 물려받아 직접 수정함.
// 팝업을 X로 닫아도 이 컴포넌트만 사라질 뿐 draft는 부모에 남아있으므로,
// 다시 열면 쓰던 내용이 그대로 보임
const items = defineModel('items', { type: Array, required: true })

const emit = defineEmits(['save'])

const weatherStore = useWeatherStore()
const favoriteStore = useFavoriteStore()

// 오늘 즐겨찾기 도시 날씨에 맞는 할 일 힌트. text는 물음표로 보여주는 문구,
// action은 실제로 눌렀을 때 목록에 추가되는(물음표 없는) 항목 텍스트
const TODO_TIPS = [
  { match: (c) => c.status.includes('비') || c.status.includes('이슬비'), text: '우산 챙기기 어때요?', action: '우산 챙기기' },
  { match: (c) => c.status.includes('눈'), text: '따뜻하게 껴입고 나가기 어때요?', action: '따뜻하게 껴입기' },
  { match: (c) => c.status.includes('뇌우'), text: '외출은 잠시 미루는 게 어때요?', action: '외출 미루기' },
  { match: (c) => c.status.includes('안개'), text: '운전 조심, 여유 있게 출발하기 어때요?', action: '여유 있게 출발하기' },
  { match: (c) => c.temp >= 28, text: '시원한 음료 챙기기 어때요?', action: '시원한 음료 챙기기' },
  { match: (c) => c.temp <= 5, text: '따뜻한 겉옷 챙기기 어때요?', action: '따뜻한 겉옷 챙기기' },
  { match: (c) => c.status === '맑음', text: '빨래하기 딱 좋은 날이에요!', action: '빨래하기' },
]

const todoTip = computed(() => {
  const city = weatherStore.getCityById(favoriteStore.favoriteCityId)
  if (!city) return null
  return TODO_TIPS.find((tip) => tip.match(city)) ?? null
})

// 자주 쓰는 할 일을 버튼으로 바로 추가할 수 있게 해둔 프리셋
const PRESET_TODOS = ['출근 하기', '퇴근 하기', '과제 제출', '설거지하기', '빨래 널기', '장보기', '헬스장 가기', '방 청소하기']

// 이제 팝업 카드 안에서만 스크롤되므로(홈 화면 자체는 안 밀림), 항목 줄
// 목록을 담은 요소를 직접 참조해서 새 줄이 추가되면 그 안에서만 스크롤함
const rowsContainer = ref(null)

// 비어있는 첫 칸에 채우고 빈 칸이 없으면 새 줄을 추가
const addPreset = (text) => {
  const emptyIndex = items.value.findIndex((value) => !value.trim())
  if (emptyIndex !== -1) {
    items.value[emptyIndex] = text
  } else {
    items.value.push(text)
  }
}

const addRow = () => {
  items.value.push('')
  nextTick(() => {
    rowsContainer.value?.scrollTo({ top: rowsContainer.value.scrollHeight, behavior: 'smooth' })
  })
}

const removeRow = (index) => {
  items.value.splice(index, 1)
}

// "취소"는 팝업을 닫는 게 아니라 쓰던 내용만 전부 지우는 초기화 버튼(팝업을
// 닫는 건 이제 +버튼이 바뀐 X뿐)
// 기본으로 열어두는 빈 칸 개수로 되돌림
const resetDraft = () => {
  items.value.splice(0, items.value.length, ...Array(5).fill(''))
}

const save = () => {
  const nonEmpty = items.value.map((value) => value.trim()).filter(Boolean)
  if (nonEmpty.length === 0) return
  emit('save', nonEmpty)
}
</script>

<template>
  <div class="inline-form">
    <p class="inline-form__label">[할 일]</p>

    <button
      v-if="todoTip"
      type="button"
      class="todo-preset-chip todo-preset-chip--weather"
      @click="addPreset(todoTip.action)"
    >
      💡 {{ todoTip.text }}
    </button>

    <div class="todo-presets">
      <button
        v-for="preset in PRESET_TODOS"
        :key="preset"
        type="button"
        class="todo-preset-chip"
        @click="addPreset(preset)"
      >
        + {{ preset }}
      </button>
    </div>

    <div ref="rowsContainer" class="todo-rows">
      <div v-for="(item, index) in items" :key="index" class="todo-row">
        <input v-model="items[index]" class="todo-row__input" placeholder="할 일을 입력하세요" />
        <button
          v-if="items.length > 1"
          type="button"
          class="todo-row__remove"
          aria-label="이 항목 지우기"
          @click="removeRow(index)"
          v-html="ICONS.close"
        ></button>
      </div>
    </div>

    <button type="button" class="todo-add" @click="addRow">+ 항목 추가</button>

    <div class="inline-form__actions">
      <button type="button" class="inline-form__cancel" @click="resetDraft">초기화</button>
      <button type="button" class="inline-form__save" @click="save">저장</button>
    </div>
  </div>
</template>

<style scoped>
.inline-form {
  position: relative;
  width: 100%;
  max-width: 720px;
  max-height: 80vh;
  overflow-y: auto;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 50px rgba(20, 20, 30, 0.25);
}

.inline-form__label {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #3d84e5;
}

.todo-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 10px;
}

.todo-preset-chip {
  padding: 6px 12px;
  border: none;
  border-radius: 999px;
  background: #eef1f5;
  color: #444;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}

.todo-preset-chip:hover {
  background: #e6effc;
  color: #3d6fa8;
}

.todo-preset-chip--weather {
  display: inline-block;
  margin-bottom: 10px;
  background: #fff7e0;
  color: #8a6d1e;
}

.todo-preset-chip--weather:hover {
  background: #ffedb8;
}

/* max-height가 아니라 고정 height를 써서, 항목을 추가/삭제해도 이 영역
   자체는 커지거나 줄어들지 않고 항상 같은 크기를 유지함(넘치는 부분만 안에서
   스크롤). scrollbar-gutter로 스크롤바 자리를 미리 비워둬서, 스크롤이 생기는
   순간 입력칸들이 갑자기 옆으로 줄어드는 것도 막음 */
.todo-rows {
  height: 360px;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding-right: 2px;
}

.todo-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.todo-row__input {
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: #fff;
  font-size: 0.9rem;
}

.todo-row__input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(61, 132, 229, 0.18);
}

.todo-row__remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: #f4f5f7;
  color: #999;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-row__remove :deep(svg) {
  width: 1em;
  height: 1em;
}

.todo-row__remove:hover {
  background: #ffe1d6;
  color: #c15a3b;
}

.todo-add {
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: #f4f5f7;
  color: #3d84e5;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.todo-add:hover {
  background: #e6effc;
}

.inline-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.inline-form__cancel,
.inline-form__save {
  padding: 8px 18px;
  border: none;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.inline-form__cancel {
  background: #f4f5f7;
  color: #666;
}

.inline-form__cancel:hover {
  background: #e9ebee;
}

.inline-form__save {
  background: #3d84e5;
  color: #fff;
}

.inline-form__save:hover {
  background: #2f6bc4;
}
</style>

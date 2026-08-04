<script setup>
import { ref, computed, nextTick } from 'vue'
import { ICONS } from '../utils/icons'
import { useWeatherStore } from '../stores/weatherStore'
import { useFavoriteStore } from '../stores/favoriteStore'

const emit = defineEmits(['save', 'cancel'])

const weatherStore = useWeatherStore()
const favoriteStore = useFavoriteStore()

// 오늘 즐겨찾기 도시 날씨에 맞는 할 일 힌트를 상단에 살짝 띄워줌
const TODO_TIPS = [
  { match: (c) => c.status.includes('비') || c.status.includes('이슬비'), text: '우산 챙기기 어때요?' },
  { match: (c) => c.status.includes('눈'), text: '따뜻하게 껴입고 나가기 어때요?' },
  { match: (c) => c.status.includes('뇌우'), text: '외출은 잠시 미루는 게 어때요?' },
  { match: (c) => c.status.includes('안개'), text: '운전 조심, 여유 있게 출발하기 어때요?' },
  { match: (c) => c.temp >= 28, text: '시원한 음료 챙기기 어때요?' },
  { match: (c) => c.temp <= 5, text: '따뜻한 겉옷 챙기기 어때요?' },
  { match: (c) => c.status === '맑음', text: '빨래하기 딱 좋은 날이에요!' },
]

const todoTip = computed(() => {
  const city = weatherStore.getCityById(favoriteStore.favoriteCityId)
  if (!city) return null
  return TODO_TIPS.find((tip) => tip.match(city))?.text ?? null
})

const items = ref(['', ''])

// 항목을 추가할 때마다 화면을 한 줄 높이만큼 확실하게 아래로 밀어줌
// (scrollIntoView는 브라우저가 "이미 보인다"고 판단하면 스크롤을 안 시키는 경우가 있어서 사용 안 함)
const addRow = () => {
  items.value.push('')
  nextTick(() => {
    window.scrollBy({ top: 60, behavior: 'smooth' })
  })
}

const removeRow = (index) => {
  items.value.splice(index, 1)
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
    <p v-if="todoTip" class="todo-tip">💡 {{ todoTip }}</p>
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

    <button type="button" class="todo-add" @click="addRow">+ 항목 추가</button>

    <div class="inline-form__actions">
      <button type="button" class="inline-form__cancel" @click="emit('cancel')">취소</button>
      <button type="button" class="inline-form__save" @click="save">저장</button>
    </div>
  </div>
</template>

<style scoped>
.inline-form {
  position: relative;
  width: 100%;
  margin: 0 0 20px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(20, 20, 30, 0.06);
}

/* 아래쪽 X 버튼을 향해 곧장 내려가는 말풍선 꼬리. 색상은 말풍선 배경색과 동일하고,
   X 버튼(FAB)과 같은 가로 중심(우측에서 26px)에 맞춰 항상 그 방향을 가리킴 */
.inline-form::after {
  content: '';
  position: absolute;
  right: 26px;
  bottom: -14px;
  width: 0;
  height: 0;
  border-left: 14px solid transparent;
  border-right: 14px solid transparent;
  border-top: 16px solid rgba(255, 255, 255, 0.85);
  filter: drop-shadow(0 4px 3px rgba(20, 20, 30, 0.05));
}

.inline-form__label {
  margin: 0 0 8px;
  font-size: 1.5rem;
  font-weight: 700;
  color: #3d84e5;
}

.todo-tip {
  margin: 0 0 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fff7e0;
  color: #8a6d1e;
  font-size: 0.82rem;
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

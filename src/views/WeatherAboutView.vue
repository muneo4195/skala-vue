<script setup>
import { ref, reactive, computed } from 'vue'
import { ElRate } from 'element-plus'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import AnimatedClockIcon from '../components/AnimatedClockIcon.vue'
import { useJournalStore } from '../stores/journalStore'
import { useCurrentTime } from '../composables/useCurrentTime'
import { getWeatherTheme } from '../utils/weatherTheme'
import { ICONS } from '../utils/icons'

const journalStore = useJournalStore()
const { formattedTime } = useCurrentTime()

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const formatDay = (timestamp) =>
  new Date(timestamp).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

const entryTheme = (entry) => getWeatherTheme(entry.weather?.status)

// 일기와 할일을 따로 두지 않고 같은 날짜끼리 한 묶음으로 모아서 보여줌
const groupedByDate = computed(() => {
  const byDate = {}
  journalStore.entries.forEach((entry) => {
    const dateKey = new Date(entry.createdAt).toDateString()
    if (!byDate[dateKey]) {
      byDate[dateKey] = { dateKey, diaries: [], todos: [], sortKey: entry.createdAt }
    }
    const group = byDate[dateKey]
    if (entry.type === 'diary') {
      group.diaries.push(entry)
    } else {
      group.todos.push(entry)
    }
    group.sortKey = Math.max(group.sortKey, entry.createdAt)
  })

  return Object.values(byDate)
    .map((group) => ({
      ...group,
      diaries: [...group.diaries].sort((a, b) => b.createdAt - a.createdAt),
      todos: [...group.todos].sort((a, b) => a.createdAt - b.createdAt),
    }))
    .sort((a, b) => b.sortKey - a.sortKey)
})

// 한 번에 하나씩만 수정 모드로 전환
const editingId = ref(null)
const editDraft = reactive({ title: '', content: '', text: '', rating: 0 })

const startEdit = (entry) => {
  editingId.value = entry.id
  editDraft.title = entry.title ?? ''
  editDraft.content = entry.content ?? ''
  editDraft.text = entry.text ?? ''
  editDraft.rating = entry.rating ?? 0
}

const cancelEdit = () => {
  editingId.value = null
}

const saveEdit = (entry) => {
  if (entry.type === 'diary') {
    const title = editDraft.title.trim()
    const content = editDraft.content.trim()
    if (!title) return
    journalStore.updateEntry(entry.id, { title, content, rating: editDraft.rating })
  } else {
    const text = editDraft.text.trim()
    if (!text) return
    journalStore.updateEntry(entry.id, { text })
  }
  editingId.value = null
}
</script>

<template>
  <div class="about-page">
    <BaseDashboardCard :title="`${ICONS.book} 내 기록`">
      <template #title-extra>
        <p class="about-time"><AnimatedClockIcon /> {{ formattedTime }}</p>
      </template>

      <p v-if="groupedByDate.length === 0" class="empty">
        홈 화면 오른쪽 아래 + 버튼으로 일기나 할일을 남겨보세요.
      </p>

      <div v-else class="record-list">
        <div v-for="group in groupedByDate" :key="group.dateKey" class="date-group">
          <h3 class="date-group__heading">{{ formatDay(group.sortKey) }}</h3>

          <!-- 일기: 같은 날짜에 여러 개를 써도 카드 하나 안에 구분선으로 묶어서 표시 -->
          <div v-if="group.diaries.length" class="entry entry--diary-group">
            <template v-for="(entry, index) in group.diaries" :key="entry.id">
              <hr v-if="index > 0" class="entry-divider" />
              <div class="diary-row">
                <div
                  class="entry__icon"
                  :style="{ background: entryTheme(entry).soft }"
                  v-html="entryTheme(entry).icon"
                ></div>
                <div class="entry__body">
                  <div class="entry__meta">
                    <span class="entry__type diary">일기</span>
                    <span class="entry__date">{{ formatTime(entry.createdAt) }}</span>
                    <span v-if="entry.weather" class="entry__weather">
                      {{ entry.weather.cityName }} {{ entry.weather.temp }}° · {{ entry.weather.status }}
                    </span>
                  </div>

                  <template v-if="editingId === entry.id">
                    <input v-model="editDraft.title" class="edit-title" placeholder="제목 (필수)" required />
                    <textarea v-model="editDraft.content" class="edit-content" rows="3"></textarea>
                    <el-rate v-model="editDraft.rating" allow-half class="edit-rating" />
                    <div class="edit-actions">
                      <button type="button" class="edit-cancel" @click="cancelEdit">취소</button>
                      <button type="button" class="edit-save" @click="saveEdit(entry)">저장</button>
                    </div>
                  </template>
                  <template v-else>
                    <p v-if="entry.title" class="entry__title">{{ entry.title }}</p>
                    <hr v-if="entry.title" class="entry-divider entry-divider--tight" />
                    <p class="entry__text">{{ entry.content }}</p>
                    <el-rate
                      v-if="entry.rating"
                      :model-value="entry.rating"
                      disabled
                      allow-half
                      class="entry__rating"
                    />
                  </template>
                </div>
                <div class="entry__actions">
                  <button
                    v-if="editingId !== entry.id"
                    type="button"
                    class="entry__edit"
                    aria-label="수정"
                    @click="startEdit(entry)"
                    v-html="ICONS.pencil"
                  ></button>
                  <button
                    type="button"
                    class="entry__remove"
                    aria-label="삭제"
                    @click="journalStore.removeEntry(entry.id)"
                    v-html="ICONS.close"
                  ></button>
                </div>
              </div>
            </template>
          </div>

          <!-- 할일: 같은 날짜끼리 한 카드 -->
          <div v-if="group.todos.length" class="entry entry--todo-group">
            <div class="entry__meta entry__meta--group">
              <span class="entry__type todo">할 일</span>
              <span class="entry__date">{{ formatTime(group.todos[0].createdAt) }}</span>
              <span v-if="group.todos[0].weather" class="entry__weather">
                {{ group.todos[0].weather.cityName }} {{ group.todos[0].weather.temp }}° · {{ group.todos[0].weather.status }}
              </span>
              <el-tooltip content="이 날짜의 할일을 전부 삭제해요" placement="top">
                <button
                  type="button"
                  class="todo-group-clear"
                  aria-label="할일 전체 삭제"
                  @click="journalStore.removeEntries(group.todos.map((todo) => todo.id))"
                  v-html="ICONS.close"
                ></button>
              </el-tooltip>
            </div>
            <ul class="todo-group-list">
              <li v-for="todo in group.todos" :key="todo.id" class="todo-row">
                <template v-if="editingId === todo.id">
                  <input v-model="editDraft.text" class="edit-todo-text" />
                  <div class="todo-row__actions">
                    <button type="button" class="edit-cancel" @click="cancelEdit">취소</button>
                    <button type="button" class="edit-save" @click="saveEdit(todo)">저장</button>
                  </div>
                </template>
                <template v-else>
                  <label class="entry__todo">
                    <input
                      type="checkbox"
                      class="entry__checkbox"
                      :checked="todo.done"
                      @change="journalStore.toggleTodo(todo.id)"
                    />
                    <span class="entry__text" :class="{ done: todo.done }">{{ todo.text }}</span>
                  </label>
                  <div class="todo-row__actions">
                    <button type="button" class="entry__edit" aria-label="수정" @click="startEdit(todo)" v-html="ICONS.pencil"></button>
                    <button type="button" class="entry__remove" aria-label="삭제" @click="journalStore.removeEntry(todo.id)" v-html="ICONS.close"></button>
                  </div>
                </template>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </BaseDashboardCard>
  </div>
</template>

<style scoped>
.about-page {
  width: 80%;
  max-width: 1000px;
  margin: 0 auto;
}

/* 전체보기의 "지역별 날씨 현황" 제목과 같은 크기·굵기로 맞춤 */
.about-page :deep(.dashboard-card__title) {
  font-size: 1.3rem;
  font-weight: normal;
}

/* 전체보기 큰 카드와 동일하게, 제목부터 기록 목록까지 카드 안 모든 내용이
   상하좌우 50px 여백을 갖도록 함 */
.about-page :deep(.dashboard-card) {
  padding: 35px 50px;
}

/* 전체보기 요약 줄에 있는 시계와 동일한 스타일. 제목(내 기록)과 같은 줄에서
   반대편(오른쪽)에 붙도록 title-extra 슬롯에 들어감 */
.about-time {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 4px;
  margin: 0;
  color: #e5533d;
  font-size: 0.95rem;
}

.about-time :deep(svg) {
  width: 1em;
  height: 1em;
}

.empty {
  margin: 0;
  color: #999;
  font-size: 0.9rem;
  text-align: center;
  padding: 12px 0;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.date-group__heading {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: #555;
  padding-bottom: 4px;
  border-bottom: 1px solid #ecedf0;
}

.entry {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  background: #f7f8fa;
  box-shadow: 0 6px 18px rgba(20, 20, 30, 0.05);
  transition:
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.4s ease;
}

/* 전체보기 카드(WeatherCard)와 똑같은 호버 방식(들뜨는 느낌)으로 통일 */
.entry:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(20, 20, 30, 0.1);
}

.entry--todo-group {
  flex-direction: column;
  align-items: stretch;
}

/* 같은 날짜에 일기를 여러 번 쓰면 카드 하나 안에 세로로 쌓임(각 일기는 .diary-row) */
.entry--diary-group {
  flex-direction: column;
  align-items: stretch;
}

.diary-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

/* 일기 여러 개를 구분하는 선과, 제목/내용을 구분하는 선이 같은 색을 씀 */
.entry-divider {
  border: none;
  border-top: 1px solid #000000;
  margin: 10px 0;
}

.entry-divider--tight {
  margin: 4px 0 6px;
}

.entry__icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #444;
}

/* v-html로 주입된 아이콘은 scoped 셀렉터가 안 먹혀서 :deep() 사용 */
.entry__icon :deep(svg) {
  width: 0.9em;
  height: 0.9em;
}

.entry__body {
  flex: 1;
  min-width: 0;
}

.entry__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 0.72rem;
}

.entry__meta--group {
  margin-bottom: 8px;
}

/* 위쪽 날짜 제목(date-group__heading)과 같은 글씨 크기로 맞춤 */
.entry__type {
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
}

.entry__type.diary {
  background: #e6effc;
  color: #3d6fa8;
}

.entry__type.todo {
  background: #ffe1d6;
  color: #c15a3b;
}

.entry__date {
  color: #999;
  font-size: 0.79rem;
}

.entry__weather {
  color: #999;
  font-size: 0.79rem;
}

/* 내용(entry__text, 0.9rem)보다 눈에 띄게 크게 만들어 제목이 구별되도록 함 */
.entry__title {
  margin: 0 0 2px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #222;
}

.entry__text {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.entry__rating {
  margin-top: 6px;
}

.edit-rating {
  display: block;
  margin-bottom: 8px;
}

.entry__text.done {
  color: #aaa;
  text-decoration: line-through;
}

.entry__todo {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.entry__checkbox {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  accent-color: #3d84e5;
  cursor: pointer;
}

.entry__actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.entry:hover .entry__actions {
  opacity: 1;
  pointer-events: auto;
}

.entry__edit,
.entry__remove {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: #eceff2;
  color: #888;
  font-size: 0.75rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.entry__edit :deep(svg),
.entry__remove :deep(svg) {
  width: 1em;
  height: 1em;
}

.entry__edit:hover {
  background: #e6effc;
  color: #3d6fa8;
}

.entry__remove:hover {
  background: #ffe1d6;
  color: #c15a3b;
}

/* 할일을 하나씩 지우지 않고 이 날짜 것 전부를 한 번에 지우는 버튼.
   개별 행 버튼과 달리 항상 보임(그룹 단위 동작이라 hover로 숨길 필요 없음) */
.todo-group-clear {
  flex-shrink: 0;
  margin-left: auto;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #eceff2;
  color: #888;
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.todo-group-clear :deep(svg) {
  width: 1em;
  height: 1em;
}

.todo-group-clear:hover {
  background: #ffe1d6;
  color: #c15a3b;
}

/* 흰색 할일 박스(.todo-row)와 전체 카드(.entry) 가장자리 사이에 여백을
   두기 위한 좌우 패딩(체크박스 자체가 옆으로 밀리는 건 아니고, 박스 바깥쪽
   여백임) */
.todo-group-list {
  list-style: none;
  margin: 0;
  padding: 0 50px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
}

.todo-row__actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
}

.todo-row:hover .todo-row__actions {
  opacity: 1;
  pointer-events: auto;
}

.edit-title,
.edit-content,
.edit-todo-text {
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: #fff;
  font-family: inherit;
  font-size: 0.88rem;
  margin-bottom: 6px;
}

.edit-title:focus,
.edit-content:focus,
.edit-todo-text:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(61, 132, 229, 0.18);
}

.edit-content {
  resize: none;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.edit-cancel,
.edit-save {
  padding: 5px 12px;
  border: none;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.edit-cancel {
  background: #eceff2;
  color: #666;
}

.edit-save {
  background: #3d84e5;
  color: #fff;
}
</style>

<script setup>
import { ref, reactive, computed } from 'vue'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import { useJournalStore } from '../stores/journalStore'
import { getWeatherTheme } from '../utils/weatherTheme'
import { ICONS } from '../utils/icons'

const journalStore = useJournalStore()

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatDay = (timestamp) =>
  new Date(timestamp).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

const entryTheme = (entry) => getWeatherTheme(entry.weather?.status)

// 일기는 낱개 카드로, 할일은 같은 날짜끼리 묶어서 카드 하나로 표시
const groupedRecords = computed(() => {
  const diaryItems = journalStore.entries
    .filter((entry) => entry.type === 'diary')
    .map((entry) => ({ kind: 'diary', entry, sortKey: entry.createdAt }))

  const todosByDate = {}
  journalStore.entries
    .filter((entry) => entry.type === 'todo')
    .forEach((entry) => {
      const dateKey = new Date(entry.createdAt).toDateString()
      if (!todosByDate[dateKey]) todosByDate[dateKey] = []
      todosByDate[dateKey].push(entry)
    })

  const todoGroups = Object.values(todosByDate).map((todos) => {
    const sorted = [...todos].sort((a, b) => a.createdAt - b.createdAt)
    return {
      kind: 'todo-group',
      todos: sorted,
      sortKey: Math.max(...todos.map((item) => item.createdAt)),
    }
  })

  return [...diaryItems, ...todoGroups].sort((a, b) => b.sortKey - a.sortKey)
})

// 한 번에 하나씩만 수정 모드로 전환
const editingId = ref(null)
const editDraft = reactive({ title: '', content: '', text: '' })

const startEdit = (entry) => {
  editingId.value = entry.id
  editDraft.title = entry.title ?? ''
  editDraft.content = entry.content ?? ''
  editDraft.text = entry.text ?? ''
}

const cancelEdit = () => {
  editingId.value = null
}

const saveEdit = (entry) => {
  if (entry.type === 'diary') {
    const title = editDraft.title.trim()
    const content = editDraft.content.trim()
    if (!title && !content) return
    journalStore.updateEntry(entry.id, { title, content })
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
      <p v-if="groupedRecords.length === 0" class="empty">
        홈 화면 오른쪽 아래 + 버튼으로 일기나 할일을 남겨보세요.
      </p>

      <div v-else class="record-list">
        <!-- 일기: 낱개 카드 -->
        <div v-for="record in groupedRecords" :key="record.kind === 'diary' ? record.entry.id : record.todos[0].id">
          <div v-if="record.kind === 'diary'" class="entry">
            <div
              class="entry__icon"
              :style="{ background: entryTheme(record.entry).soft }"
              v-html="entryTheme(record.entry).icon"
            ></div>
            <div class="entry__body">
              <div class="entry__meta">
                <span class="entry__type diary">일기</span>
                <span class="entry__date">{{ formatDate(record.entry.createdAt) }}</span>
                <span v-if="record.entry.weather" class="entry__weather">
                  {{ record.entry.weather.cityName }} {{ record.entry.weather.temp }}° · {{ record.entry.weather.status }}
                </span>
              </div>

              <template v-if="editingId === record.entry.id">
                <input v-model="editDraft.title" class="edit-title" placeholder="제목" />
                <textarea v-model="editDraft.content" class="edit-content" rows="3"></textarea>
                <div class="edit-actions">
                  <button type="button" class="edit-cancel" @click="cancelEdit">취소</button>
                  <button type="button" class="edit-save" @click="saveEdit(record.entry)">저장</button>
                </div>
              </template>
              <template v-else>
                <p v-if="record.entry.title" class="entry__title">{{ record.entry.title }}</p>
                <p class="entry__text">{{ record.entry.content }}</p>
              </template>
            </div>
            <div class="entry__actions">
              <button
                v-if="editingId !== record.entry.id"
                type="button"
                class="entry__edit"
                aria-label="수정"
                @click="startEdit(record.entry)"
                v-html="ICONS.pencil"
              ></button>
              <button
                type="button"
                class="entry__remove"
                aria-label="삭제"
                @click="journalStore.removeEntry(record.entry.id)"
                v-html="ICONS.close"
              ></button>
            </div>
          </div>

          <!-- 할일: 같은 날짜끼리 한 카드 -->
          <div v-else class="entry entry--todo-group">
            <div class="entry__meta entry__meta--group">
              <span class="entry__type todo">할일</span>
              <span class="entry__date">{{ formatDay(record.todos[0].createdAt) }}</span>
              <span v-if="record.todos[0].weather" class="entry__weather">
                {{ record.todos[0].weather.cityName }} {{ record.todos[0].weather.temp }}° · {{ record.todos[0].weather.status }}
              </span>
            </div>
            <ul class="todo-group-list">
              <li v-for="todo in record.todos" :key="todo.id" class="todo-row">
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
  gap: 10px;
}

.entry {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: #f7f8fa;
}

.entry--todo-group {
  flex-direction: column;
  align-items: stretch;
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

.entry__type {
  padding: 1px 8px;
  border-radius: 999px;
  font-weight: 600;
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
}

.entry__weather {
  color: #999;
}

.entry__title {
  margin: 0 0 2px;
  font-size: 0.92rem;
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

.todo-group-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
}

.todo-row__actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
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

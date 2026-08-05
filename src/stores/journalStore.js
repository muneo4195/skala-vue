import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useWeatherStore } from './weatherStore'
import { useFavoriteStore } from './favoriteStore'

const STORAGE_KEY = 'weather-journal-entries'

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function snapshotWeather() {
  const weatherStore = useWeatherStore()
  const favoriteStore = useFavoriteStore()
  const city = weatherStore.getCityById(favoriteStore.favoriteCityId)
  return city ? { cityName: city.name, status: city.status, temp: city.temp } : null
}

function makeId() {
  return `entry_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// 일기/할일 기록을 작성 시각 + 그 시점 대표 도시 날씨와 함께 localStorage에 저장
export const useJournalStore = defineStore('journal', () => {
  const entries = ref(loadEntries())

  watch(
    entries,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  // 리뷰: 제목 필수 검증은 폼(DiaryInlineForm) 쪽에서 이미 막고 있어서, 여기
  // 가드는 그보다 느슨한 최후 안전장치(제목/내용 둘 다 비어있을 때만 막음)임을 확인함
  function addDiaryEntry(title, content, rating = 0) {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    if (!trimmedTitle && !trimmedContent) return

    entries.value.unshift({
      id: makeId(),
      type: 'diary',
      title: trimmedTitle,
      content: trimmedContent,
      rating,
      createdAt: Date.now(),
      weather: snapshotWeather(),
    })
  }

  // 여러 할일을 한 번에 추가. 나중에 또 호출하면 기존 목록 위에 이어서 추가됨
  // 리뷰: createdAt에 index를 더해 항목마다 1ms씩 어긋나게 한 이유를 확인함 —
  // 같은 순간에 여러 개를 추가해도 시간이 완전히 같으면 정렬/그룹핑 순서가
  // 흔들릴 수 있어서, 입력한 순서를 그대로 보존하려고 넣은 트릭
  function addTodoEntries(texts) {
    const weather = snapshotWeather()
    const now = Date.now()
    const newEntries = texts
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text, index) => ({
        id: makeId(),
        type: 'todo',
        text,
        createdAt: now + index,
        weather,
        done: false,
      }))
    entries.value.unshift(...newEntries)
  }

  function toggleTodo(id) {
    const entry = entries.value.find((item) => item.id === id)
    if (entry) entry.done = !entry.done
  }

  function removeEntry(id) {
    entries.value = entries.value.filter((item) => item.id !== id)
  }

  // 할일 한 묶음(같은 날짜)을 한 번에 전부 지울 때 사용
  function removeEntries(ids) {
    const idSet = new Set(ids)
    entries.value = entries.value.filter((item) => !idSet.has(item.id))
  }

  // 일기(title/content) 또는 할일(text) 내용을 수정
  function updateEntry(id, patch) {
    const entry = entries.value.find((item) => item.id === id)
    if (entry) Object.assign(entry, patch)
  }

  return { entries, addDiaryEntry, addTodoEntries, toggleTodo, removeEntry, removeEntries, updateEntry }
})

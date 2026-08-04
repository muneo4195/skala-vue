import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useCurrentTime() {
  const now = ref(new Date())
  let timerId = null

  onMounted(() => {
    timerId = setInterval(() => {
      now.value = new Date()
    }, 1000 * 30)
  })

  onUnmounted(() => {
    clearInterval(timerId)
  })

  const formattedTime = computed(() =>
    now.value.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  )

  // 시간대에 따라 배경 테마/멘트를 다르게 보여주기 위한 구간 분류
  const timeOfDay = computed(() => {
    const hour = now.value.getHours()
    if (hour >= 5 && hour < 7) return 'dawn'
    if (hour >= 7 && hour < 11) return 'morning'
    if (hour >= 11 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 19) return 'sunset'
    return 'night'
  })

  return { now, formattedTime, timeOfDay }
}

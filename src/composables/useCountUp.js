import { ref, watch, onUnmounted } from 'vue'

// 게이지/숫자 표시에서 값이 바뀔 때마다 이전 값→새 값으로 부드럽게 굴러가도록 하는 카운트업
export function useCountUp(source, duration = 800) {
  const display = ref(0)
  let raf = null
  let fromValue = 0
  let toValue = 0
  let startTime = 0

  function tick(now) {
    if (!startTime) startTime = now
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)
    display.value = fromValue + (toValue - fromValue) * eased
    if (t < 1) {
      raf = requestAnimationFrame(tick)
    }
  }

  watch(
    source,
    (newValue) => {
      const target = Number(newValue)
      if (!Number.isFinite(target)) return
      if (raf) cancelAnimationFrame(raf)
      fromValue = display.value
      toValue = target
      startTime = 0
      raf = requestAnimationFrame(tick)
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (raf) cancelAnimationFrame(raf)
  })

  return display
}

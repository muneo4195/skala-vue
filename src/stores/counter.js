import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// use+파일명+Store 규칙에 따라 작성한다.
export const useCounterStore = defineStore('counter', () => {
  // count는 전역에서 공유할 원본 숫자 데이터의 저장소이다. 기본값은 0이고 pinia 관점에서 state(상태 데이터)이다.
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})

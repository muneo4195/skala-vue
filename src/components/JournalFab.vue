<script setup>
import { ref } from 'vue'
import { ICONS } from '../utils/icons'

const props = defineProps({
  // 폼이 열려있는 동안엔 같은 자리에서 닫기(✕) 버튼 역할로 바뀜
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['choose', 'close'])

const menuOpen = ref(false)

const toggleMenu = () => {
  if (props.active) {
    emit('close')
    return
  }
  menuOpen.value = !menuOpen.value
}

const choose = (type) => {
  menuOpen.value = false
  emit('choose', type)
}
</script>

<template>
  <div class="fab-layer">
    <!-- 헤더(현재 날씨/날씨 단위)와 같은 폭·정렬을 써서, 버튼이 딱 그 오른쪽 끝에 맞춰지도록 함 -->
    <div class="fab-track">
      <Transition name="fab-menu-fade">
        <div v-if="menuOpen && !active" class="fab-menu">
          <button type="button" class="fab-menu__item" @click="choose('diary')">일기 쓰기</button>
          <button type="button" class="fab-menu__item" @click="choose('todo')">할일 쓰기</button>
        </div>
      </Transition>

      <button
        type="button"
        class="journal-fab"
        :class="{ open: menuOpen && !active }"
        :aria-label="active ? '닫기' : '일기·할일 작성'"
        @click="toggleMenu"
      >
        <span v-if="active" v-html="ICONS.close"></span>
        <span v-else>+</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.fab-layer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(76px + 16px);
  z-index: 41;
  /* app-shell과 동일한 좌우 padding을 줘야 fab-track의 80% 폭 기준이 form 쪽과
     정확히 같아져서, 뷰포트가 좁을 때도(80%가 max-width 1000px에 안 닿을 때도)
     말풍선 꼬리와 X 버튼이 항상 같은 세로선에 놓임 */
  padding: 0 clamp(16px, 4vw, 32px);
  box-sizing: border-box;
  pointer-events: none;
}

.fab-track {
  position: relative;
  width: 80%;
  max-width: 1000px;
  margin: 0 auto;
}

.journal-fab {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background: #3d84e5;
  color: #fff;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(61, 132, 229, 0.4);
  transition: transform 0.2s ease;
}

.journal-fab :deep(svg) {
  width: 0.7em;
  height: 0.7em;
}

.journal-fab:hover {
  transform: scale(1.08);
}

.journal-fab.open {
  transform: rotate(45deg);
}

.fab-menu {
  position: absolute;
  right: 0;
  bottom: 64px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: auto;
}

.fab-menu__item {
  padding: 10px 18px;
  border: none;
  border-radius: 999px;
  background: #fff;
  color: #333;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: background 0.15s ease;
}

.fab-menu__item:hover {
  background: #eef3fc;
  color: #3d84e5;
}

.fab-menu-fade-enter-active,
.fab-menu-fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fab-menu-fade-enter-from,
.fab-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

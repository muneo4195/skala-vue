<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="dashboard-card">
    <!-- title-extra: 제목 반대편(오른쪽)에 붙일 내용(예: 시계) -->
    <div v-if="title" class="dashboard-card__header">
      <h2 class="dashboard-card__title" v-html="title"></h2>
      <slot name="title-extra" />
    </div>
    <div class="dashboard-card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.dashboard-card {
  box-sizing: border-box;
  width: 100%;
  border-radius: 16px;
  padding: clamp(14px, 3vw, 20px);
  margin-bottom: 16px;
  /* 반투명 + 블러로 뒤쪽 배경(즐겨찾기 날씨색 앰비언트 글로우)이 홈 화면만큼 은은하게 비치도록 함 */
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px rgba(20, 20, 30, 0.06);
}

.dashboard-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
}

.dashboard-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #444;
}

/* title은 v-html로 주입되므로 scoped 셀렉터가 안 먹혀서 :deep() 사용 */
.dashboard-card__title :deep(svg) {
  width: 1em;
  height: 1em;
  flex-shrink: 0;
}

.dashboard-card__body {
  box-sizing: border-box;
}
</style>
